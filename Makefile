SHELL := /bin/sh

CLUSTER_NAME ?= guardrails-lab
K3D_ARGS ?= --agents 1 --servers 1 --wait
NAMESPACE_A ?= tenant-a
NAMESPACE_B ?= tenant-b
IMAGE_REPO ?= ghcr.io/rfar/platform-guardrails-lab/demo-api
IMAGE_TAG ?= 0.1.0
ARGOCD_REPO_URL ?= https://github.com/farshi/paved-platform-lab.git
ARGOCD_TARGET_REVISION ?= main

.PHONY: help install bootstrap reset build scaffold install-kyverno install-observability install-argocd argocd-apps argocd argocd-up argocd-password validate validate-policies deploy break rollback check-app evidence observability tools-up

help:
	@echo "Targets:"
	@echo "  make install        Install/check local lab tools"
	@echo "  make bootstrap      Create local k3d cluster"
	@echo "  make reset          Delete local k3d cluster"
	@echo "  make build          Build and import the demo API image"
	@echo "  make scaffold       Show service template path"
	@echo "  make install-kyverno Install Kyverno and baseline policies"
	@echo "  make install-observability Install Prometheus, Grafana, and OTel collector"
	@echo "  make install-argocd Install Argo CD into the local cluster"
	@echo "  make argocd-apps   Register GitOps applications with Argo CD"
	@echo "  make argocd        Inspect Argo CD applications"
	@echo "  make argocd-up     Port-forward Argo CD UI on https://localhost:18080"
	@echo "  make validate       Validate manifests and policies"
	@echo "  make validate-policies Validate focused policy pass/fail examples"
	@echo "  make deploy         Deploy good version"
	@echo "  make break          Apply bad change"
	@echo "  make rollback       Roll back the workload"
	@echo "  make check-app      Check demo API health from inside the cluster"
	@echo "  make evidence       Print compact demo evidence"
	@echo "  make observability  Install or inspect observability stack"
	@echo "  make tools-up       Open local portal and port-forward Grafana, Prometheus, and demo API"

install:
	sh installer/all.installer.sh

bootstrap:
	k3d cluster create $(CLUSTER_NAME) $(K3D_ARGS)
	kubectl create namespace $(NAMESPACE_A) --dry-run=client -o yaml | kubectl apply -f -
	kubectl create namespace $(NAMESPACE_B) --dry-run=client -o yaml | kubectl apply -f -
	kubectl apply -f observability/namespace.yaml

reset:
	k3d cluster delete $(CLUSTER_NAME)

build:
	docker build -t $(IMAGE_REPO):$(IMAGE_TAG) services/demo-api
	k3d image import $(IMAGE_REPO):$(IMAGE_TAG) -c $(CLUSTER_NAME)

scaffold:
	@echo "Use templates/service as the source for new team services."
	@echo "See README.md and labs/01-setup for the scaffold flow."

install-kyverno:
	helm repo add kyverno https://kyverno.github.io/kyverno/
	helm repo update
	helm upgrade --install kyverno kyverno/kyverno -n kyverno --create-namespace --wait
	kubectl apply -k policies/kyverno

install-observability:
	helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
	helm repo update
	helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack -n observability --create-namespace -f observability/kube-prometheus-stack-values.yaml --wait
	kubectl apply -k observability

install-argocd:
	kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
	kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
	kubectl wait --for=condition=Available deployment -n argocd --all --timeout=180s

argocd-apps:
	@ARGOCD_REPO_URL="$(ARGOCD_REPO_URL)" ARGOCD_TARGET_REVISION="$(ARGOCD_TARGET_REVISION)" node scripts/argocd/render-apps.js | kubectl apply -f -

argocd:
	@node scripts/argocd/check.js

argocd-up:
	kubectl -n argocd port-forward svc/argocd-server 18080:443

argocd-password:
	@node scripts/argocd/password.js

validate:
	kubectl apply -k examples/tenant-a --dry-run=server
	kubectl apply -k examples/tenant-b --dry-run=server
	@if kubectl apply -k examples/bad --dry-run=server >/dev/null 2>&1; then echo "bad manifest unexpectedly passed"; exit 1; else echo "bad manifest rejected as expected"; fi

validate-policies:
	@sh scripts/validate-policy-examples.sh

deploy:
	kubectl apply -k examples/tenant-a

break:
	kubectl apply -k examples/bad

rollback:
	kubectl rollout undo deployment/demo-api -n tenant-a

check-app:
	kubectl delete pod demo-api-check -n tenant-a --ignore-not-found
	kubectl apply -f scripts/check-app-pod.yaml
	kubectl wait --for=jsonpath='{.status.phase}'=Succeeded pod/demo-api-check -n tenant-a --timeout=60s
	kubectl logs pod/demo-api-check -n tenant-a
	kubectl delete pod demo-api-check -n tenant-a --ignore-not-found

evidence:
	@sh scripts/evidence.sh

observability:
	@node scripts/observability/check.js

tools-up:
	@node scripts/observability/tool-portal.js
