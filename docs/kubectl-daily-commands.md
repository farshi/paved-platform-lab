# Daily kubectl Commands

This guide lists the `kubectl` commands platform and application teams use most often, plus where each one fits in this lab.

## Read Cluster Context

| Command | Scenario | Lab use |
| --- | --- | --- |
| `kubectl config current-context` | Confirm which cluster commands will hit. | Check that the active context is the local k3d cluster. |
| `kubectl cluster-info` | Confirm the API server is reachable. | Prove the local Kubernetes control plane is responding. |
| `kubectl get nodes` | See worker/control-plane nodes. | Show `k3d` server and agent nodes. |
| `kubectl get namespaces` | See environment or tenant boundaries. | Confirm `tenant-a`, `tenant-b`, `kyverno`, and `observability` exist. |

## Inspect Workloads

| Command | Scenario | Lab use |
| --- | --- | --- |
| `kubectl get pods -n tenant-a` | Check if app pods are running. | Confirm `demo-api` pods are `Running` and ready. |
| `kubectl get deploy -n tenant-a` | Check Deployment desired/current state. | Confirm `demo-api` has ready replicas. |
| `kubectl get svc -n tenant-a` | Check stable service endpoints. | Confirm `demo-api` Service exists. |
| `kubectl get ingress -n tenant-a` | Check external HTTP routing objects. | Confirm ingress exists for the demo API. |
| `kubectl get events -n tenant-a --sort-by=.lastTimestamp` | Find recent scheduling, pull, probe, or policy events. | Explain what happened during deploy, health check, or rollback. |
| `kubectl describe pod <pod> -n tenant-a` | Debug why one pod is pending, crashing, or blocked. | Inspect probe failures, image pull issues, and policy-related messages. |
| `kubectl logs deployment/demo-api -n tenant-a` | Read app logs without knowing pod name. | Debug Flask/Gunicorn app startup and request handling. |
| `kubectl exec -n tenant-a <pod> -- <command>` | Run a command inside an existing container. | Inspect runtime env or files when debugging. Use carefully. |

## Apply And Validate Manifests

| Command | Scenario | Lab use |
| --- | --- | --- |
| `kubectl apply -k examples/tenant-a` | Apply a Kustomize overlay. | Deploy the good tenant workload. |
| `kubectl apply -k examples/tenant-a --dry-run=server` | Ask the API server and admission controllers if a manifest would be accepted. | Prove tenant manifests pass real cluster validation without changing state. |
| `kubectl apply -k examples/bad --dry-run=server` | Test policy rejection. | Prove Kyverno blocks unsafe workload config. |
| `kubectl diff -k examples/tenant-a` | Preview changes before applying. | See what a tenant overlay would change in the cluster. |
| `kubectl delete -k examples/tenant-a` | Remove resources created by an overlay. | Cleanup test resources. Destructive; use intentionally. |

## Rollout Operations

| Command | Scenario | Lab use |
| --- | --- | --- |
| `kubectl rollout status deployment/demo-api -n tenant-a` | Wait until a Deployment is successfully rolled out. | Prove Kubernetes accepted and started the app version. |
| `kubectl rollout history deployment/demo-api -n tenant-a` | See rollout revisions. | Show before/after rollback revisions in evidence. |
| `kubectl rollout restart deployment/demo-api -n tenant-a` | Restart pods without changing image. | Force pods to pick up a rebuilt local image tag. |
| `kubectl rollout undo deployment/demo-api -n tenant-a` | Roll back to the previous ReplicaSet. | Recover after a bad version or demo failure. |
| `kubectl set image deployment/demo-api demo-api=<image> -n tenant-a` | Change image without editing YAML. | Useful for emergency/debug demos; normal path should stay manifest-driven. |
| `kubectl scale deployment/demo-api --replicas=1 -n tenant-a` | Change replica count quickly. | Demonstrate desired state and scheduling behavior. |

## Connectivity Checks

| Command | Scenario | Lab use |
| --- | --- | --- |
| `kubectl port-forward -n tenant-a svc/demo-api 8080:80` | Call a Service from the laptop. | Manual browser or curl check from local machine. |
| `kubectl apply -f scripts/check-app-pod.yaml` | Call a Service from inside the cluster. | Prove `demo-api.tenant-a.svc.cluster.local` works through Kubernetes DNS and Service routing. |
| `kubectl wait --for=jsonpath='{.status.phase}'=Succeeded pod/demo-api-check -n tenant-a --timeout=60s` | Wait for a one-shot check pod to finish. | Make health checks deterministic in scripts. |
| `kubectl logs pod/demo-api-check -n tenant-a` | Read output from the check pod. | Confirm `{"status":"ok"}` and `http_status=200`. |

## Policy And Access Checks

| Command | Scenario | Lab use |
| --- | --- | --- |
| `kubectl auth can-i <verb> <resource> -n <namespace>` | Check whether current identity has permission. | Explain RBAC and tenant-scoped access. |
| `kubectl get clusterpolicy` | List Kyverno policies. | Show active guardrails. |
| `kubectl describe clusterpolicy <name>` | Explain one policy in detail. | Inspect why a bad manifest is blocked. |
| `kubectl explain deployment.spec.template.spec.containers` | Learn a Kubernetes field from the API schema. | Understand manifest fields without guessing. |

## Resource And YAML Inspection

| Command | Scenario | Lab use |
| --- | --- | --- |
| `kubectl get deployment demo-api -n tenant-a -o yaml` | Inspect live resource state. | Compare rendered YAML with cluster state. |
| `kubectl get deployment demo-api -n tenant-a -o jsonpath='{.spec.template.spec.containers[0].image}'` | Extract one field for scripts. | Print current image in `make evidence`. |
| `kubectl top pods -n tenant-a` | Check live CPU/memory usage. | Useful after metrics server exists; may not work in a minimal local cluster. |

## Suggested Practice Order

Run these after `make bootstrap`, `make build`, `make install-kyverno`, and `make deploy`:

```sh
kubectl config current-context
kubectl cluster-info
kubectl get nodes
kubectl get namespaces
kubectl get pods -n tenant-a
kubectl get deploy,svc,ingress -n tenant-a
kubectl rollout status deployment/demo-api -n tenant-a
kubectl logs deployment/demo-api -n tenant-a --tail=20
kubectl apply -k examples/bad --dry-run=server
kubectl get clusterpolicy
kubectl auth can-i create deployments -n tenant-a
make check-app
make evidence
```

Avoid running destructive commands like `kubectl delete`, `kubectl scale`, `kubectl set image`, or `kubectl rollout undo` unless the goal is to demonstrate cleanup, scaling, image change, or rollback.
