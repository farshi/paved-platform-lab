SHELL := /bin/sh
SHOW = @printf '\033[32m$$ %s\033[0m\n'

CLUSTER_NAME ?= guardrails-lab
K3D_ARGS ?= --agents 1 --servers 1 --wait
NAMESPACE_A ?= tenant-a
NAMESPACE_B ?= tenant-b
IMAGE_REPO ?= ghcr.io/rfar/platform-guardrails-lab/demo-api
IMAGE_TAG ?= 0.1.0
JAVA_IMAGE_REPO ?= ghcr.io/rfar/platform-guardrails-lab/java-telemetry-api
JAVA_IMAGE_TAG ?= 0.1.0
APP ?= demo-api
ifeq ($(origin TENANT), undefined)
ifeq ($(APP),java-telemetry-api)
TENANT := tenant-b
else
TENANT := tenant-a
endif
endif
APP_NAMESPACE := $(TENANT)
ARGOCD_REPO_URL ?= https://github.com/farshi/paved-platform-lab.git
ARGOCD_TARGET_REVISION ?= main

ifeq ($(APP),demo-api)
APP_IMAGE_REPO := $(IMAGE_REPO)
APP_IMAGE_TAG := $(IMAGE_TAG)
APP_CONTEXT := services/demo-api
APP_DEPLOY_KUSTOMIZE := examples/$(TENANT)
APP_DEPLOYMENT := demo-api
APP_TRAFFIC_PATHS ?= /
else ifeq ($(APP),java-telemetry-api)
APP_IMAGE_REPO := $(JAVA_IMAGE_REPO)
APP_IMAGE_TAG := $(JAVA_IMAGE_TAG)
APP_CONTEXT := services/java-telemetry-api
APP_DEPLOY_KUSTOMIZE := examples/java-telemetry/$(TENANT)/good
APP_BREAK_KUSTOMIZE := examples/java-telemetry/$(TENANT)/bad
APP_DEPLOYMENT := java-telemetry-api
APP_TRAFFIC_PATHS ?= /success,/orders
else
$(error Unsupported APP "$(APP)". Use APP=demo-api or APP=java-telemetry-api)
endif

.PHONY: help setup demo-ready demo-clean install install-tools install-addons bootstrap stop tear-down reset build scaffold install-kyverno install-observability install-argocd argocd-apps argocd argocd-drift argocd-sync argocd-up argocd-password validate validate-policies validate-api-platform validate-self-service-platform developer-flow-demo deploy break rollback rollback-watch traffic traffic-slow resilience check-app evidence observability tools-up

help:
	@echo "Setup targets:"
	@echo "  make setup          Build fresh runnable lab after reset"
	@echo "  make demo-ready     Prepare both demo apps, add-ons, GitOps, and validation"
	@echo "  make demo-clean     Reset demo apps to good state and create clean baseline traffic"
	@echo "  make install        Alias for make install-tools"
	@echo "  make install-tools  Install/check local command-line tools"
	@echo "  make install-addons Install Kyverno, observability, Argo CD, and Argo apps"
	@echo "  make bootstrap      Create local k3d cluster"
	@echo "  make stop           Stop portal, port-forwards, and local k3d cluster"
	@echo "  make tear-down      Stop and delete local lab resources; keep Docker images"
	@echo "  make reset          Delete local k3d cluster"
	@echo "  make build          Build and import selected app image"
	@echo "  make deploy         Deploy selected app good version"
	@echo ""
	@echo "Demo driver targets:"
	@echo "  APP=demo-api|java-telemetry-api selects the app for build/deploy/break/rollback/traffic"
	@echo "  TENANT=tenant-a|tenant-b selects the namespace; defaults are demo-api=tenant-a, java-telemetry-api=tenant-b"
	@echo "  make tools-up       Open portal and port-forward Grafana, Prometheus, Argo CD, and demo API"
	@echo "                      If curl http://localhost:18000 fails, run this first"
	@echo "  make evidence       Print compact demo evidence"
	@echo "  make observability  Inspect observability stack and metrics"
	@echo "  make argocd         Inspect Argo CD applications"
	@echo "  make argocd-drift   Create live drift for Argo CD sync demo"
	@echo "  make argocd-sync    Ask Argo CD to restore the tenant app from Git"
	@echo "  make validate       Validate tenant manifests and bad manifest rejection"
	@echo "  make validate-policies Validate focused policy pass/fail examples"
	@echo "  make validate-api-platform Validate policy-shaped API platform example"
	@echo "  make validate-self-service-platform Validate identity claims, headers, and platform policy shape"
	@echo "  make developer-flow-demo      Show local identity request flow against the customer API"
	@echo "  make check-app      Check demo API health from inside the cluster"
	@echo "  make break          Apply selected app bad change"
	@echo "  make rollback       Roll back selected app workload"
	@echo "  make rollback-watch Diagnose selected app and auto rollback when SLO burn is obvious"
	@echo "  make traffic        Generate selected app SLO traffic"
	@echo "  make traffic-slow   Generate selected app slow-path traffic"
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

demo-ready:
	$(SHOW) 'make install-tools'
	@$(MAKE) install-tools
	$(SHOW) 'make bootstrap'
	@$(MAKE) bootstrap
	$(SHOW) 'make build APP=demo-api TENANT=tenant-a'
	@$(MAKE) build APP=demo-api TENANT=tenant-a
	$(SHOW) 'make build APP=java-telemetry-api TENANT=tenant-b'
	@$(MAKE) build APP=java-telemetry-api TENANT=tenant-b
	$(SHOW) 'make install-addons'
	@$(MAKE) install-addons
	$(SHOW) 'make deploy APP=demo-api TENANT=tenant-a'
	@$(MAKE) deploy APP=demo-api TENANT=tenant-a
	$(SHOW) 'make deploy APP=java-telemetry-api TENANT=tenant-b'
	@$(MAKE) deploy APP=java-telemetry-api TENANT=tenant-b
	$(SHOW) 'make validate'
	@$(MAKE) validate

demo-clean:
	$(SHOW) 'make deploy APP=demo-api TENANT=tenant-a'
	@$(MAKE) deploy APP=demo-api TENANT=tenant-a
	$(SHOW) 'make deploy APP=java-telemetry-api TENANT=tenant-b'
	@$(MAKE) deploy APP=java-telemetry-api TENANT=tenant-b
	$(SHOW) 'make traffic APP=demo-api TENANT=tenant-a APP_TRAFFIC_COUNT=40 APP_TRAFFIC_PATHS=/'
	@$(MAKE) traffic APP=demo-api TENANT=tenant-a APP_TRAFFIC_COUNT=40 APP_TRAFFIC_PATHS=/
	$(SHOW) 'make traffic APP=java-telemetry-api TENANT=tenant-b APP_TRAFFIC_COUNT=40 APP_TRAFFIC_PATHS=/success,/orders'
	@$(MAKE) traffic APP=java-telemetry-api TENANT=tenant-b APP_TRAFFIC_COUNT=40 APP_TRAFFIC_PATHS=/success,/orders
	@echo "Clean baseline generated. In Grafana use Last 2 minutes, Demo window=30s."

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

stop:
	$(SHOW) 'stop portal and kubectl port-forward processes'
	@pkill -f "node scripts/observability/tool-portal.js" 2>/dev/null || true
	@pkill -f "kubectl .*port-forward .*kube-prometheus-stack-grafana" 2>/dev/null || true
	@pkill -f "kubectl .*port-forward .*kube-prometheus-stack-prometheus" 2>/dev/null || true
	@pkill -f "kubectl .*port-forward .*argocd-server" 2>/dev/null || true
	@pkill -f "kubectl .*port-forward .*svc/demo-api" 2>/dev/null || true
	$(SHOW) 'if cluster exists: k3d cluster stop $(CLUSTER_NAME)'
	@if k3d cluster list --no-headers | awk '{print $$1}' | grep -qx "$(CLUSTER_NAME)"; then \
		k3d cluster stop $(CLUSTER_NAME) || true; \
	else \
		echo "cluster $(CLUSTER_NAME): not listed by k3d"; \
	fi
	$(SHOW) 'stop remaining k3d Docker containers for $(CLUSTER_NAME)'
	@containers=$$(docker ps -q --filter "name=^/k3d-$(CLUSTER_NAME)-" 2>/dev/null || true); \
	if [ -n "$$containers" ]; then \
		docker stop $$containers; \
	else \
		echo "k3d Docker containers for $(CLUSTER_NAME): already stopped"; \
	fi

tear-down:
	$(SHOW) 'make stop'
	@$(MAKE) stop
	$(SHOW) 'make reset'
	@$(MAKE) reset
	@echo "docker images: kept"

reset:
	$(SHOW) 'if cluster exists: k3d cluster delete $(CLUSTER_NAME)'
	@if k3d cluster list --no-headers | awk '{print $$1}' | grep -qx "$(CLUSTER_NAME)"; then \
		k3d cluster delete $(CLUSTER_NAME) || true; \
	else \
		echo "cluster $(CLUSTER_NAME): not listed by k3d"; \
	fi
	$(SHOW) 'remove remaining k3d Docker containers for $(CLUSTER_NAME); keep images'
	@containers=$$(docker ps -aq --filter "name=^/k3d-$(CLUSTER_NAME)-" 2>/dev/null || true); \
	if [ -n "$$containers" ]; then \
		docker rm -f $$containers; \
	else \
		echo "k3d Docker containers for $(CLUSTER_NAME): already absent"; \
	fi

build:
	$(SHOW) 'APP=$(APP) docker build -t $(APP_IMAGE_REPO):$(APP_IMAGE_TAG) $(APP_CONTEXT)'
	@docker build -t $(APP_IMAGE_REPO):$(APP_IMAGE_TAG) $(APP_CONTEXT)
	$(SHOW) 'k3d image import $(APP_IMAGE_REPO):$(APP_IMAGE_TAG) -c $(CLUSTER_NAME)'
	@k3d image import $(APP_IMAGE_REPO):$(APP_IMAGE_TAG) -c $(CLUSTER_NAME)

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
	$(SHOW) 'kubectl apply --server-side --force-conflicts -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml'
	@kubectl apply --server-side --force-conflicts -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
	$(SHOW) 'kubectl wait --for=create deployment/argocd-server -n argocd --timeout=180s'
	@kubectl wait --for=create deployment/argocd-server -n argocd --timeout=180s
	$(SHOW) 'kubectl wait --for=create deployment/argocd-repo-server -n argocd --timeout=180s'
	@kubectl wait --for=create deployment/argocd-repo-server -n argocd --timeout=180s
	$(SHOW) 'kubectl wait --for=create statefulset/argocd-application-controller -n argocd --timeout=180s'
	@kubectl wait --for=create statefulset/argocd-application-controller -n argocd --timeout=180s
	$(SHOW) 'kubectl rollout status deployment/argocd-server -n argocd --timeout=180s'
	@kubectl rollout status deployment/argocd-server -n argocd --timeout=180s
	$(SHOW) 'kubectl rollout status deployment/argocd-repo-server -n argocd --timeout=180s'
	@kubectl rollout status deployment/argocd-repo-server -n argocd --timeout=180s
	$(SHOW) 'kubectl rollout status statefulset/argocd-application-controller -n argocd --timeout=180s'
	@kubectl rollout status statefulset/argocd-application-controller -n argocd --timeout=180s

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
	$(SHOW) 'kubectl apply -k examples/java-telemetry/tenant-a/good --dry-run=server'
	@kubectl apply -k examples/java-telemetry/tenant-a/good --dry-run=server
	$(SHOW) 'kubectl apply -k examples/java-telemetry/tenant-b/good --dry-run=server'
	@kubectl apply -k examples/java-telemetry/tenant-b/good --dry-run=server
	$(SHOW) 'kubectl apply -k examples/bad --dry-run=server'
	@if kubectl apply -k examples/bad --dry-run=server >/dev/null 2>&1; then echo "bad manifest unexpectedly passed"; exit 1; else echo "bad manifest rejected as expected"; fi

validate-policies:
	$(SHOW) 'sh scripts/validate-policy-examples.sh'
	@sh scripts/validate-policy-examples.sh

validate-api-platform:
	$(SHOW) 'node scripts/validate-api-platform-examples.js'
	@node scripts/validate-api-platform-examples.js

validate-self-service-platform: validate-api-platform

developer-flow-demo:
	$(SHOW) 'node scripts/developer-flow-demo.js'
	@node scripts/developer-flow-demo.js

deploy:
	$(SHOW) 'APP=$(APP) kubectl apply -k $(APP_DEPLOY_KUSTOMIZE)'
	@kubectl apply -k $(APP_DEPLOY_KUSTOMIZE)
	$(SHOW) 'APP=$(APP) kubectl rollout status deployment/$(APP_DEPLOYMENT) -n $(APP_NAMESPACE) --timeout=120s'
	@kubectl rollout status deployment/$(APP_DEPLOYMENT) -n $(APP_NAMESPACE) --timeout=120s

break:
ifeq ($(APP),demo-api)
	$(SHOW) 'APP=$(APP) TENANT=$(TENANT) kubectl set env deployment/$(APP_DEPLOYMENT) -n $(APP_NAMESPACE) ERROR_RATE_PERCENT=85 DEFAULT_SLOW_SECONDS=1.2'
	@kubectl set env deployment/$(APP_DEPLOYMENT) -n $(APP_NAMESPACE) ERROR_RATE_PERCENT=85 DEFAULT_SLOW_SECONDS=1.2
else
	$(SHOW) 'APP=$(APP) kubectl apply -k $(APP_BREAK_KUSTOMIZE)'
	@kubectl apply -k $(APP_BREAK_KUSTOMIZE)
endif
	$(SHOW) 'APP=$(APP) kubectl rollout status deployment/$(APP_DEPLOYMENT) -n $(APP_NAMESPACE) --timeout=120s'
	@kubectl rollout status deployment/$(APP_DEPLOYMENT) -n $(APP_NAMESPACE) --timeout=120s

rollback:
	$(SHOW) 'APP=$(APP) kubectl rollout undo deployment/$(APP_DEPLOYMENT) -n $(APP_NAMESPACE)'
	@kubectl rollout undo deployment/$(APP_DEPLOYMENT) -n $(APP_NAMESPACE)
	$(SHOW) 'APP=$(APP) kubectl rollout status deployment/$(APP_DEPLOYMENT) -n $(APP_NAMESPACE) --timeout=120s'
	@kubectl rollout status deployment/$(APP_DEPLOYMENT) -n $(APP_NAMESPACE) --timeout=120s

rollback-watch:
	$(SHOW) 'APP=$(APP) node scripts/rollback-watcher.js'
	@APP="$(APP)" APP_NAMESPACE="$(APP_NAMESPACE)" APP_SERVICE="$(APP_DEPLOYMENT)" APP_DEPLOYMENT="$(APP_DEPLOYMENT)" node scripts/rollback-watcher.js

traffic:
	$(SHOW) 'APP=$(APP) node scripts/app-traffic.js'
	@APP="$(APP)" APP_NAMESPACE="$(APP_NAMESPACE)" APP_SERVICE="$(APP_DEPLOYMENT)" APP_TRAFFIC_PATHS="$(APP_TRAFFIC_PATHS)" node scripts/app-traffic.js

traffic-slow:
	$(SHOW) 'APP=$(APP) APP_TRAFFIC_PATHS=/slow node scripts/app-traffic.js'
	@APP="$(APP)" APP_NAMESPACE="$(APP_NAMESPACE)" APP_SERVICE="$(APP_DEPLOYMENT)" APP_TRAFFIC_PATHS="/slow" node scripts/app-traffic.js

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
