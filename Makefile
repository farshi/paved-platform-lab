SHELL := /bin/sh
SHOW = @printf '\033[32m$$ %s\033[0m\n'

CLUSTER_NAME ?= guardrails-lab
K3D_ARGS ?= --agents 1 --servers 1 --wait
NAMESPACE_A ?= tenant-a
NAMESPACE_B ?= tenant-b
IMAGE_REPO ?= ghcr.io/rfar/platform-guardrails-lab/demo-api
IMAGE_TAG ?= 0.1.0
ARGOCD_REPO_URL ?= https://github.com/farshi/paved-platform-lab.git
ARGOCD_TARGET_REVISION ?= main

.PHONY: help setup install install-tools install-addons bootstrap reset build scaffold install-kyverno install-observability install-argocd argocd-apps argocd argocd-drift argocd-sync argocd-up argocd-password validate validate-policies validate-api-platform deploy break rollback resilience check-app evidence observability tools-up

help:
	@echo "Setup targets:"
	@echo "  make setup          Build fresh runnable lab after reset"
	@echo "  make install        Alias for make install-tools"
	@echo "  make install-tools  Install/check local command-line tools"
	@echo "  make install-addons Install Kyverno, observability, Argo CD, and Argo apps"
	@echo "  make bootstrap      Create local k3d cluster"
	@echo "  make reset          Delete local k3d cluster"
	@echo "  make build          Build and import the demo API image"
	@echo "  make deploy         Deploy good version"
	@echo ""
	@echo "Demo driver targets:"
	@echo "  make tools-up       Open portal and port-forward Grafana, Prometheus, Argo CD, and demo API"
	@echo "  make evidence       Print compact demo evidence"
	@echo "  make observability  Inspect observability stack and metrics"
	@echo "  make argocd         Inspect Argo CD applications"
	@echo "  make argocd-drift   Create live drift for Argo CD sync demo"
	@echo "  make argocd-sync    Ask Argo CD to restore the tenant app from Git"
	@echo "  make validate       Validate tenant manifests and bad manifest rejection"
	@echo "  make validate-policies Validate focused policy pass/fail examples"
	@echo "  make validate-api-platform Validate policy-shaped API platform example"
	@echo "  make check-app      Check demo API health from inside the cluster"
	@echo "  make break          Apply bad change"
	@echo "  make rollback       Roll back the workload"
	@echo "  make resilience     Delete one demo API pod and watch Kubernetes self-heal"
	@echo ""
	@echo "Special targets:"
	@echo "  make scaffold       Show service template path"
	@echo "  make install-kyverno Install Kyverno and baseline policies"
	@echo "  make install-observability Install Prometheus, Grafana, and OTel collector"
	@echo "  make install-argocd Install Argo CD into the local cluster"
	@echo "  make argocd-apps    Register GitOps applications with Argo CD"
	@echo "  make argocd-up      Port-forward Argo CD UI on https://localhost:18080"
	@echo "  make argocd-password Print Argo CD admin password"

setup: install-tools bootstrap build install-kyverno install-observability deploy install-argocd argocd-apps

install: install-tools

install-tools:
	$(SHOW) 'sh installer/all.installer.sh'
	@sh installer/all.installer.sh

install-addons: install-kyverno install-observability install-argocd argocd-apps

bootstrap:
	$(SHOW) 'if cluster missing: k3d cluster create $(CLUSTER_NAME) $(K3D_ARGS)'
	@if k3d cluster list --no-headers | awk '{print $$1}' | grep -qx "$(CLUSTER_NAME)"; then \
		echo "cluster $(CLUSTER_NAME): exists"; \
	else \
		k3d cluster create $(CLUSTER_NAME) $(K3D_ARGS); \
	fi
	$(SHOW) 'kubectl create namespace $(NAMESPACE_A) --dry-run=client -o yaml | kubectl apply -f -'
	@kubectl create namespace $(NAMESPACE_A) --dry-run=client -o yaml | kubectl apply -f -
	$(SHOW) 'kubectl create namespace $(NAMESPACE_B) --dry-run=client -o yaml | kubectl apply -f -'
	@kubectl create namespace $(NAMESPACE_B) --dry-run=client -o yaml | kubectl apply -f -
	$(SHOW) 'kubectl apply -f observability/namespace.yaml'
	@kubectl apply -f observability/namespace.yaml

reset:
	$(SHOW) 'if cluster exists: k3d cluster delete $(CLUSTER_NAME)'
	@if k3d cluster list --no-headers | awk '{print $$1}' | grep -qx "$(CLUSTER_NAME)"; then \
		k3d cluster delete $(CLUSTER_NAME); \
	else \
		echo "cluster $(CLUSTER_NAME): already absent"; \
	fi

build:
	$(SHOW) 'docker build -t $(IMAGE_REPO):$(IMAGE_TAG) services/demo-api'
	@docker build -t $(IMAGE_REPO):$(IMAGE_TAG) services/demo-api
	$(SHOW) 'k3d image import $(IMAGE_REPO):$(IMAGE_TAG) -c $(CLUSTER_NAME)'
	@k3d image import $(IMAGE_REPO):$(IMAGE_TAG) -c $(CLUSTER_NAME)

scaffold:
	@echo "Use templates/service as the source for new team services."
	@echo "See README.md and labs/01-setup for the scaffold flow."

install-kyverno:
	$(SHOW) 'helm repo add kyverno https://kyverno.github.io/kyverno/'
	@helm repo add kyverno https://kyverno.github.io/kyverno/
	$(SHOW) 'helm repo update'
	@helm repo update
	$(SHOW) 'helm upgrade --install kyverno kyverno/kyverno -n kyverno --create-namespace --wait'
	@helm upgrade --install kyverno kyverno/kyverno -n kyverno --create-namespace --wait
	$(SHOW) 'kubectl apply -k policies/kyverno'
	@kubectl apply -k policies/kyverno

install-observability:
	$(SHOW) 'helm repo add prometheus-community https://prometheus-community.github.io/helm-charts'
	@helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
	$(SHOW) 'helm repo update'
	@helm repo update
	$(SHOW) 'helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack -n observability --create-namespace -f observability/kube-prometheus-stack-values.yaml --wait'
	@helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack -n observability --create-namespace -f observability/kube-prometheus-stack-values.yaml --wait
	$(SHOW) 'kubectl apply -k observability'
	@kubectl apply -k observability

install-argocd:
	$(SHOW) 'kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -'
	@kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
	$(SHOW) 'kubectl apply --server-side -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml'
	@kubectl apply --server-side -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
	$(SHOW) 'kubectl wait --for=condition=Available deployment -n argocd --all --timeout=180s'
	@kubectl wait --for=condition=Available deployment -n argocd --all --timeout=180s
	$(SHOW) 'kubectl wait --for=condition=Ready pod -n argocd -l app.kubernetes.io/part-of=argocd --timeout=180s'
	@kubectl wait --for=condition=Ready pod -n argocd -l app.kubernetes.io/part-of=argocd --timeout=180s

argocd-apps:
	$(SHOW) 'ARGOCD_REPO_URL=$(ARGOCD_REPO_URL) ARGOCD_TARGET_REVISION=$(ARGOCD_TARGET_REVISION) node scripts/argocd/render-apps.js | kubectl apply -f -'
	@ARGOCD_REPO_URL="$(ARGOCD_REPO_URL)" ARGOCD_TARGET_REVISION="$(ARGOCD_TARGET_REVISION)" node scripts/argocd/render-apps.js | kubectl apply -f -

argocd:
	$(SHOW) 'node scripts/argocd/check.js'
	@node scripts/argocd/check.js

argocd-drift:
	$(SHOW) 'node scripts/argocd/drift.js'
	@node scripts/argocd/drift.js

argocd-sync:
	$(SHOW) 'node scripts/argocd/sync.js'
	@node scripts/argocd/sync.js

argocd-up:
	$(SHOW) 'kubectl wait --for=condition=Available deployment/argocd-server -n argocd --timeout=180s'
	@kubectl wait --for=condition=Available deployment/argocd-server -n argocd --timeout=180s
	$(SHOW) 'kubectl -n argocd port-forward svc/argocd-server 18080:443'
	@kubectl -n argocd port-forward svc/argocd-server 18080:443

argocd-password:
	$(SHOW) 'node scripts/argocd/password.js'
	@node scripts/argocd/password.js

validate:
	$(SHOW) 'kubectl apply -k examples/tenant-a --dry-run=server'
	@kubectl apply -k examples/tenant-a --dry-run=server
	$(SHOW) 'kubectl apply -k examples/tenant-b --dry-run=server'
	@kubectl apply -k examples/tenant-b --dry-run=server
	$(SHOW) 'kubectl apply -k examples/bad --dry-run=server'
	@if kubectl apply -k examples/bad --dry-run=server >/dev/null 2>&1; then echo "bad manifest unexpectedly passed"; exit 1; else echo "bad manifest rejected as expected"; fi

validate-policies:
	$(SHOW) 'sh scripts/validate-policy-examples.sh'
	@sh scripts/validate-policy-examples.sh

validate-api-platform:
	$(SHOW) 'node scripts/validate-api-platform-examples.js'
	@node scripts/validate-api-platform-examples.js

deploy:
	$(SHOW) 'kubectl apply -k examples/tenant-a'
	@kubectl apply -k examples/tenant-a

break:
	$(SHOW) 'kubectl apply -k examples/bad'
	@kubectl apply -k examples/bad

rollback:
	$(SHOW) 'kubectl rollout undo deployment/demo-api -n tenant-a'
	@kubectl rollout undo deployment/demo-api -n tenant-a

resilience:
	$(SHOW) 'node scripts/resilience-demo.js'
	@node scripts/resilience-demo.js

check-app:
	$(SHOW) 'kubectl delete pod demo-api-check -n tenant-a --ignore-not-found'
	@kubectl delete pod demo-api-check -n tenant-a --ignore-not-found
	$(SHOW) 'kubectl apply -f scripts/check-app-pod.yaml'
	@kubectl apply -f scripts/check-app-pod.yaml
	$(SHOW) "kubectl wait --for=jsonpath='{.status.phase}'=Succeeded pod/demo-api-check -n tenant-a --timeout=60s"
	@kubectl wait --for=jsonpath='{.status.phase}'=Succeeded pod/demo-api-check -n tenant-a --timeout=60s
	$(SHOW) 'kubectl logs pod/demo-api-check -n tenant-a'
	@kubectl logs pod/demo-api-check -n tenant-a
	$(SHOW) 'kubectl delete pod demo-api-check -n tenant-a --ignore-not-found'
	@kubectl delete pod demo-api-check -n tenant-a --ignore-not-found

evidence:
	$(SHOW) 'sh scripts/evidence.sh'
	@sh scripts/evidence.sh

observability:
	$(SHOW) 'node scripts/observability/check.js'
	@node scripts/observability/check.js

tools-up:
	$(SHOW) 'node scripts/observability/tool-portal.js'
	@node scripts/observability/tool-portal.js
