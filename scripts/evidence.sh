#!/bin/sh
set -eu
GREEN='\033[32m'
RESET='\033[0m'

NAMESPACE="${NAMESPACE:-tenant-a}"
DEPLOYMENT="${DEPLOYMENT:-demo-api}"
BAD_PATH="${BAD_PATH:-examples/bad}"

section() {
  printf '\n== %s ==\n' "$1"
}

show() {
  printf "${GREEN}$ %s${RESET}\n" "$*"
}

section "deployment"
show "kubectl get deployment $DEPLOYMENT -n $NAMESPACE"
if kubectl get deployment "$DEPLOYMENT" -n "$NAMESPACE" >/dev/null 2>&1; then
  show "kubectl get deployment $DEPLOYMENT -n $NAMESPACE -o jsonpath={image,revision,ready}"
  IMAGE="$(kubectl get deployment "$DEPLOYMENT" -n "$NAMESPACE" -o jsonpath='{.spec.template.spec.containers[0].image}')"
  REVISION="$(kubectl get deployment "$DEPLOYMENT" -n "$NAMESPACE" -o jsonpath='{.metadata.annotations.deployment\.kubernetes\.io/revision}')"
  READY="$(kubectl get deployment "$DEPLOYMENT" -n "$NAMESPACE" -o jsonpath='{.status.readyReplicas}/{.spec.replicas}')"
  printf 'namespace: %s\n' "$NAMESPACE"
  printf 'deployment: %s\n' "$DEPLOYMENT"
  printf 'image: %s\n' "$IMAGE"
  printf 'revision: %s\n' "$REVISION"
  printf 'ready: %s\n' "$READY"
else
  printf 'missing: deployment/%s in namespace/%s\n' "$DEPLOYMENT" "$NAMESPACE"
fi

section "policy block"
TMP_FILE="$(mktemp)"
show "kubectl apply -k $BAD_PATH --dry-run=server"
if kubectl apply -k "$BAD_PATH" --dry-run=server >"$TMP_FILE" 2>&1; then
  printf 'unexpected: bad manifest passed admission\n'
else
  printf 'bad manifest rejected by admission\n'
  awk '/^[[:space:]]*[a-z0-9-]+:$/ {gsub(":", "", $1); printf "policy: %s\n", $1}' "$TMP_FILE" | sort -u
fi
rm -f "$TMP_FILE"

section "rollout history"
show "kubectl rollout history deployment/$DEPLOYMENT -n $NAMESPACE"
kubectl rollout history "deployment/$DEPLOYMENT" -n "$NAMESPACE" 2>/dev/null || printf 'missing rollout history\n'

section "rollout status"
show "kubectl rollout status deployment/$DEPLOYMENT -n $NAMESPACE --timeout=10s"
kubectl rollout status "deployment/$DEPLOYMENT" -n "$NAMESPACE" --timeout=10s 2>/dev/null || printf 'rollout status unavailable\n'

section "app health"
show "kubectl delete pod $DEPLOYMENT-check -n $NAMESPACE --ignore-not-found"
kubectl delete pod "$DEPLOYMENT-check" -n "$NAMESPACE" --ignore-not-found >/dev/null 2>&1 || true
show "kubectl apply -f scripts/check-app-pod.yaml"
show "kubectl wait --for=jsonpath={.status.phase}=Succeeded pod/$DEPLOYMENT-check -n $NAMESPACE --timeout=60s"
if kubectl apply -f scripts/check-app-pod.yaml >/dev/null 2>&1 \
  && kubectl wait --for=jsonpath='{.status.phase}'=Succeeded "pod/$DEPLOYMENT-check" -n "$NAMESPACE" --timeout=60s >/dev/null 2>&1; then
  show "kubectl logs pod/$DEPLOYMENT-check -n $NAMESPACE"
  kubectl logs "pod/$DEPLOYMENT-check" -n "$NAMESPACE" 2>/dev/null || printf 'app health logs unavailable\n'
else
  printf 'app health check failed\n'
fi
show "kubectl delete pod $DEPLOYMENT-check -n $NAMESPACE --ignore-not-found"
kubectl delete pod "$DEPLOYMENT-check" -n "$NAMESPACE" --ignore-not-found >/dev/null 2>&1 || true

section "recent rollout events"
EVENT_FILE="$(mktemp)"
show "kubectl get events -n $NAMESPACE --sort-by=.lastTimestamp"
kubectl get events -n "$NAMESPACE" --sort-by=.lastTimestamp >"$EVENT_FILE" 2>/dev/null || true
if [ -s "$EVENT_FILE" ]; then
  awk 'NR == 1 || /demo-api|demo-api-bad|ReplicaSet|BackOff|Unhealthy|Killing|Started|Created/' "$EVENT_FILE" | tail -12
else
  printf 'none found in namespace/%s\n' "$NAMESPACE"
fi
rm -f "$EVENT_FILE"

section "audit"
printf 'what changed: tenant overlay deploys shared demo-api into %s with tenant labels and env\n' "$NAMESPACE"
printf 'why it matters: namespace, quota, limits, RBAC, and Kyverno keep self-service bounded\n'
printf 'rollback example: make break shows rejected bad change; make rollback restores deployment/%s\n' "$DEPLOYMENT"
