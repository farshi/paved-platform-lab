# Demo Hard Questions

Use these questions to turn the lab into a technical demo conversation. Each answer has a short spoken version and a lab example to show.

## Platform And Architecture

### 1. Why did you build this with k3d instead of GKE?

Short answer:

I wanted the same Kubernetes primitives without cloud setup time or cost. k3d lets me prove the platform path locally: cluster, namespaces, RBAC, policies, deployment, health checks, evidence, and rollback.

Lab example:

```sh
make bootstrap
kubectl get nodes
```

Point to:

- `docs/architecture.md`
- `Makefile`

Follow-up answer:

In GKE, the control plane is managed by Google and workers are Compute Engine VMs. In k3d, both are Docker containers. The Kubernetes workload model stays the same.

### 2. What is the difference between k3d `server-0`, `agent-0`, and `serverlb`?

Short answer:

`server-0` is the local k3s server/control-plane container. `agent-0` is the worker container. `serverlb` is a k3d-created load balancer/proxy container in front of the server nodes.

Lab example:

```sh
k3d node list
kubectl get nodes
```

Point to:

- `docs/architecture.md`
- `docs/tools.md`

Follow-up answer:

`serverlb` is not a Kubernetes pod. It is k3d infrastructure.

### 3. How would this map to GKE?

Short answer:

The app primitives map directly: Deployment, Service, Namespace, RBAC, Ingress, policy, and rollout. The infrastructure ownership changes: Google manages the control plane, node pools run on Compute Engine, and external traffic uses Google Cloud Load Balancing or Gateway.

Lab example:

```sh
kubectl get deploy,svc,ingress -n tenant-a
```

Point to:

- `docs/architecture.md`

## Kubernetes Basics With Depth

### 4. What happens when you call `demo-api.tenant-a.svc.cluster.local`?

Short answer:

The pod asks Kubernetes DNS for the Service name. CoreDNS resolves it to the Service cluster IP. The Service routes traffic to ready pods behind the selector. The app receives `/healthz` and returns `{"status":"ok"}`.

Lab example:

```sh
make check-app
```

Expected proof:

```text
{"status":"ok"}
http_status=200
```

Point to:

- `scripts/check-app-pod.yaml`
- `services/demo-api/manifests/base/service.yaml`

### 5. What is the difference between Deployment, Pod, and Service?

Short answer:

A Pod runs containers. A Deployment manages desired pod replicas and rollouts. A Service gives pods a stable network name and load balances to ready pods.

Lab example:

```sh
kubectl get deploy,pods,svc -n tenant-a
kubectl describe service demo-api -n tenant-a
```

Point to:

- `services/demo-api/manifests/base/deployment.yaml`
- `services/demo-api/manifests/base/service.yaml`

### 6. What proves the app is really healthy, not just deployed?

Short answer:

`kubectl rollout status` proves Kubernetes rollout state. The in-cluster curl pod proves service DNS, Service routing, and the app `/healthz` response.

Lab example:

```sh
kubectl rollout status deployment/demo-api -n tenant-a
make check-app
make evidence
```

Point to:

- `scripts/evidence.sh`

## Manifests And Kustomize

### 7. What is Kustomize doing here?

Short answer:

Kustomize assembles the shared base service manifest with tenant-specific config. It avoids copying the full Deployment and Service YAML for every tenant.

Lab example:

```sh
kubectl apply -k examples/tenant-a --dry-run=server
kubectl apply -k examples/tenant-b --dry-run=server
```

Point to:

- `examples/README.md`
- `examples/tenant-a/kustomization.yaml`
- `examples/tenant-b/kustomization.yaml`

### 8. Why use `--dry-run=server`?

Short answer:

It asks the real Kubernetes API server and admission controllers whether the manifest would be accepted, without creating or changing resources.

Lab example:

```sh
kubectl apply -k examples/tenant-a --dry-run=server
kubectl apply -k examples/bad --dry-run=server
```

Point to:

- `Makefile` target `validate`

Follow-up answer:

Client dry-run is weaker because it can miss admission checks like Kyverno or PodSecurity.

## Guardrails And Security

### 9. What guardrails are enforced in this lab?

Short answer:

The lab enforces namespace boundaries, RBAC, resource quotas, default resource limits, non-root containers, no privilege escalation, required requests/limits, and approved image registry.

Lab example:

```sh
kubectl get clusterpolicy
make validate
```

Point to:

- `policies/kyverno`
- `examples/tenant-a/resourcequota.yaml`
- `examples/tenant-a/limitrange.yaml`
- `examples/tenant-a/rbac.yaml`

### 9a. Why Kyverno instead of OPA/Rego?

Short answer:

Kyverno uses Kubernetes-style YAML policies, so it fits teams already reviewing manifests. It can audit and enforce policies in multi-tenant clusters, and it supports security controls like image verification and pod security best practices. This lab uses Kyverno to block unsafe workloads before they run.

Lab example:

```sh
kubectl get clusterpolicy
make evidence
```

Point to:

- `policies/kyverno/README.md`
- `policies/kyverno/clusterpolicy-approved-registry.yaml`
- `policies/kyverno/clusterpolicy-require-resources.yaml`
- `policies/kyverno/clusterpolicy-nonroot.yaml`

### 10. What happens when a team ships an unsafe manifest?

Short answer:

Admission rejects it before it runs. In this lab, Kyverno blocks the bad manifest for unapproved image registry, missing CPU/memory requests and limits, and non-root/security violations.

Lab example:

```sh
make break
make evidence
```

Expected proof:

```text
policy: approved-image-registry
policy: require-container-resources
policy: require-nonroot-containers
```

Point to:

- `examples/bad/deployment.yaml`
- `scripts/evidence.sh`

### 11. Is this enough for production security?

Short answer:

No. It is a compact teaching baseline. Production would add image signing, vulnerability scanning, network policies, secrets management, workload identity, audit logging, progressive delivery, and stronger exception workflows.

Lab example:

```sh
kubectl describe clusterpolicy approved-image-registry
```

Point to:

- `docs/decisions.md`
- `backlog.md`

## Operations And Failure Handling

### 12. How do you debug a CrashLoopBackOff?

Short answer:

Start with pod status, then describe the pod, check events, and read logs. Separate scheduling/image/probe problems from app runtime problems.

Lab example:

```sh
kubectl get pods -n tenant-a
kubectl describe pod <pod-name> -n tenant-a
kubectl logs deployment/demo-api -n tenant-a --tail=50
kubectl get events -n tenant-a --sort-by=.lastTimestamp
```

Repo example:

The lab found a real app crash caused by missing `setuptools`, which OpenTelemetry needed for `pkg_resources`.

Point to:

- `services/demo-api/requirements.txt`

### 13. How do you roll back safely?

Short answer:

Use Deployment rollout history to see revisions, then undo the Deployment and verify rollout status plus app health.

Lab example:

```sh
kubectl rollout history deployment/demo-api -n tenant-a
make rollback
kubectl rollout status deployment/demo-api -n tenant-a
make check-app
```

Point to:

- `Makefile`
- `docs/runbook.md`

### 14. What is the difference between rollout success and user impact?

Short answer:

Rollout success means Kubernetes sees the desired pods as updated and ready. User impact needs app checks and telemetry: health endpoint, latency, error rate, traces, and SLOs.

Lab example:

```sh
kubectl rollout status deployment/demo-api -n tenant-a
make check-app
make evidence
```

Point to:

- `observability/`
- `docs/self-service-demo.md`

## Platform Thinking

### 15. What makes this self-service instead of just scripts?

Short answer:

The team can deploy, validate, inspect, and recover without asking a central engineer, while the platform still enforces boundaries and policy.

Lab example:

```sh
make validate
make deploy
make check-app
make evidence
```

Point to:

- `docs/self-service-demo.md`
- `work-queue.md`

### 16. What would you improve next?

Short answer:

I would tighten lab docs, add clearer policy examples, add a small evidence bundle, improve observability, and add a tiny runtime demo that creates latency/error burn and triggers rollback.

Lab example:

```sh
sed -n '1,180p' work-queue.md
```

Point to:

- `work-queue.md`
- `backlog.md`

## Strong Closing Summary

Use this if asked to summarize the project:

This lab shows a practical platform engineering path. A team gets a reusable Kubernetes service template, tenant isolation, RBAC, resource guardrails, policy enforcement, rollout checks, app health proof, and rollback evidence. The local k3d setup keeps it easy to run, while the same Kubernetes concepts map cleanly to GKE or another managed cluster.
