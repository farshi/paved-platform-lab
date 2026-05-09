# Lab 03 - Rollback

Goal: deploy the good service, prove app health, show a blocked bad change, and verify rollback evidence.

## Run Good Deploy

```sh
make deploy
kubectl rollout status deployment/demo-api -n tenant-a
make check-app
```

Expected:

- rollout status says `deployment "demo-api" successfully rolled out`
- app health returns `{"status":"ok"}`
- app health returns `http_status=200`

## Inspect Runtime

```sh
kubectl get deploy,svc,ingress -n tenant-a
kubectl get pods -n tenant-a
kubectl logs deployment/demo-api -n tenant-a --tail=20
```

Expected:

- `deployment.apps/demo-api` is ready, usually `2/2`
- `service/demo-api` exists on port `80/TCP`
- `ingress/demo-api` exists for `demo.localhost`
- pods are `Running`

## Break Safely

```sh
make break
```

Expected: command fails because Kyverno rejects `examples/bad`.

This is a safe failure. The bad workload should not run.

## Roll Back

```sh
make rollback
kubectl rollout status deployment/demo-api -n tenant-a
make check-app
```

Expected:

- rollback command completes
- rollout returns to healthy state
- app health still returns `{"status":"ok"}` and `http_status=200`

## Evidence

```sh
make evidence
```

Expected evidence sections:

- `deployment`: image, revision, ready count
- `policy block`: blocked Kyverno policies
- `rollout history`: Deployment revisions
- `rollout status`: successful rollout
- `app health`: in-cluster health response
- `audit`: short explanation of what changed and why

## What This Proves

- rollout success is visible
- app health is tested through Kubernetes DNS and Service routing
- unsafe changes are blocked by policy
- recovery path is simple enough to explain in an demo
