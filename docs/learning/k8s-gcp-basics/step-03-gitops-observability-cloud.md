# GitOps, Observability, And Cloud Mapping

## Concept

GitOps keeps live cluster state aligned with Git. Observability shows whether the running service is healthy for users.

## Simple Meaning

- Argo CD Application: points Argo CD at manifests in Git.
- Sync: make live state match Git.
- Drift: live state no longer matches Git.
- Prometheus: stores metrics.
- Grafana: displays metrics as dashboards.

## Why Teams Care

A deployment is not complete when YAML applies. Teams need to know what is running, whether Git still matches the cluster, and whether users are healthy.

## Runnable Example

```sh
make argocd
make argocd-drift
make argocd-sync
make observability
make tools-up
```

## What Can Go Wrong

Manual `kubectl` changes can bypass Git. A service can be running while errors or latency hurt users.

## Platform Guardrail Or Best Practice

Use GitOps for desired state and telemetry for runtime truth. Do not treat `kubectl apply succeeded` as the whole health check.

## Checkpoint

Why can Argo CD show `Synced` while Grafana still shows a user-impact problem?

## Lab Link

- Argo CD app config: [../../../argocd/apps.json](../../../argocd/apps.json)
- Dashboard runbook: [../../runbooks/dashboard-demo.md](../../runbooks/dashboard-demo.md)
- Observability manifests: [../../../observability](../../../observability)
