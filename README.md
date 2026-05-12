# Paved Platform Lab

Local Kubernetes playground for learning how to build a small platform-as-a-service path with guardrails, GitOps, observability, API gateway patterns, and a unified local dashboard.

## What This Shows

- k3d cluster bootstrap
- one sample API service
- one service template for new teams
- Kyverno guardrails before deploy
- namespace, RBAC, and resource limits for safe self-service
- `kubectl rollout undo` for fast recovery
- OpenTelemetry, Grafana, and simple SLO examples as a second layer
- local tool portal with Grafana, Prometheus, traffic actions, copyable PromQL snippets, and rendered Markdown runbooks

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
- `node`
- `make`
- `git`

Optional:

- `kyverno` CLI
- `jq`
- `yq`

Simple descriptions: `docs/tools.md`

Daily kubectl practice guide: `docs/kubectl-daily-commands.md`

Guided runbooks: `docs/runbooks/README.md`

Learning tracks: `docs/learning/README.md`

Platform operator questions and answers: `docs/questions/platform-operator.md`

## Repo Map

- `templates/service` - service scaffold for new teams
- `policies/kyverno` - guardrails and policy examples
- `docs` - architecture, runbooks, questions, and decisions
- `docs/learning` - mentoring tracks for Kubernetes, CI/CD, and platform self-service
- `services/demo-api` - the sample API service
- `examples/tenant-a` - working tenant example
- `examples/tenant-b` - second tenant example
- `labs/01-setup` - cluster bootstrap
- `labs/02-policy` - policy enforcement
- `labs/03-rollback` - break and recover
- `observability` - OpenTelemetry, Grafana, and SLO examples
- `scripts` - repeatable evidence checks and the local tool portal
- `backlog.md` - implementation checklist

## Demo Order

1. Bootstrap the k3d cluster.
2. Build and import the demo API image.
3. Install Kyverno policies.
4. Deploy the good manifest.
5. Try a bad manifest and watch policy reject it.
6. Break runtime and run rollback.
7. Install observability and show logs, metrics, traces, and SLO examples.
8. Install Argo CD and register the GitOps applications.
9. Open the local tool portal for Grafana, Prometheus, Argo CD, and the demo API.

## Make Targets

- `make install`
- `make install-tools`
- `make install-addons`
- `make bootstrap`
- `make build`
- `make install-kyverno`
- `make deploy`
- `make validate`
- `make validate-policies`
- `make break`
- `make rollback`
- `make check-app`
- `make evidence`
- `make install-observability`
- `make observability`
- `make tools-up`
- `make install-argocd`
- `make argocd-apps`
- `make argocd`
- `make argocd-up`

`make install` is an alias for `make install-tools`. It checks local command-line tools, including the Argo CD CLI. It does not install anything into Kubernetes.

After `make bootstrap`, use `make install-addons` to install the in-cluster platform add-ons: Kyverno, observability, Argo CD, and Argo CD app registration. You can still run the individual add-on targets when teaching each layer step by step.

`make tools-up` is the single long-running local UI command. It opens the portal and port-forwards Grafana, Prometheus, Argo CD, and the demo API.

## Next Step

Run the lab in this order:

- `labs/01-setup` - create local cluster, namespaces, and image
- `labs/02-policy` - install Kyverno and prove pass/fail admission behavior
- `labs/03-rollback` - deploy, check health, block bad change, roll back, and collect evidence
- `observability/README.md` - install observability, verify signals, and open local tools
- `docs/argocd-gitops.md` - install Argo CD, register GitOps apps, and inspect sync health
