# Argo CD GitOps Loop

This folder defines the Argo CD application set for the lab.

Source of truth:

- `argocd/apps.json`: app names, paths, destination namespaces, and descriptions
- `scripts/argocd/render-apps.js`: renders Argo CD `Application` manifests from that source

The lab keeps one common delivery model:

```text
Git change
  -> Argo CD detects desired state
  -> Argo CD syncs Kubernetes manifests
  -> Kyverno enforces guardrails
  -> Prometheus/Grafana prove runtime behavior
```

## Why Argo CD Needs a Git URL

Argo CD runs inside Kubernetes. It cannot read your local unpushed working tree. It needs a reachable Git repository URL.

Set:

```sh
ARGOCD_REPO_URL=https://github.com/<owner>/<repo>.git
```

Then register apps:

```sh
ARGOCD_REPO_URL=https://github.com/<owner>/<repo>.git make argocd-apps
```

`ARGOCD_TARGET_REVISION` defaults to `main`.

## Smooth Demo Path

Use the normal lab once first:

```sh
make bootstrap
make build
make install-kyverno
make install-observability
make deploy
```

Then add GitOps:

```sh
make install-argocd
ARGOCD_REPO_URL=https://github.com/<owner>/<repo>.git make argocd-apps
make argocd
make argocd-password
make argocd-up
```

Open:

```text
https://localhost:18080
```

Login:

- username: `admin`
- password: output from `make argocd-password`

This does not replace the original `kubectl apply` path. It shows how the same manifests can be reconciled through GitOps.
