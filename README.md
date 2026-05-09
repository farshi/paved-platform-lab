# Platform Guardrails Lab

Local-only Kubernetes playground for safe self-service, policy enforcement, and fast rollback.

## What This Shows

- k3d cluster bootstrap
- one sample API service
- one service template for new teams
- Kyverno guardrails before deploy
- namespace, RBAC, and resource limits for safe self-service
- `kubectl rollout undo` for fast recovery
- OpenTelemetry, Grafana, and simple SLO examples as a second layer

## Why It Exists

The point is not to build a huge platform. The point is to show one teachable path:

1. create cluster
2. scaffold service
3. apply policy
4. deploy good version
5. block bad manifest
6. break runtime
7. roll back
8. show evidence

## Installed Tools

Required:

- Docker or Colima
- `kubectl`
- `k3d`
- `helm`
- `make`
- `git`

Optional:

- `kyverno` CLI
- `jq`
- `yq`

Simple descriptions: `docs/tools.md`

Daily kubectl practice guide: `docs/kubectl-daily-commands.md`

Hard demo questions and answers: `docs/demo-hard-questions.md`

## Repo Map

- `templates/service` - service scaffold for new teams
- `policies/kyverno` - guardrails and policy examples
- `docs` - architecture, runbook, and decisions
- `services/demo-api` - the sample API service
- `examples/tenant-a` - working tenant example
- `examples/tenant-b` - second tenant example
- `labs/01-setup` - cluster bootstrap
- `labs/02-policy` - policy enforcement
- `labs/03-rollback` - break and recover
- `observability` - OpenTelemetry, Grafana, and SLO examples
- `backlog.md` - implementation checklist

## Demo Order

1. Bootstrap the k3d cluster.
2. Build and import the demo API image.
3. Install Kyverno policies.
4. Deploy the good manifest.
5. Try a bad manifest and watch policy reject it.
6. Break runtime and run rollback.
7. Install observability and show logs, metrics, traces, and SLO examples.

## Make Targets

- `make install`
- `make bootstrap`
- `make build`
- `make install-kyverno`
- `make deploy`
- `make validate`
- `make break`
- `make rollback`
- `make check-app`
- `make evidence`
- `make install-observability`

## Next Step

Run the lab in this order:

- `labs/01-setup`
- `labs/02-policy`
- `labs/03-rollback`
