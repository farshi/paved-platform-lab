# Argo CD GitOps

Argo CD adds the GitOps control loop to the lab.

The existing lab uses direct commands:

```text
make deploy
  -> kubectl apply -k examples/tenant-a
```

The GitOps lane uses the same manifests:

```text
Git repo
  -> Argo CD Application
  -> Argo CD sync
  -> Kubernetes resources
```

This does not change the Kubernetes YAML. It changes who applies it.

## Why This Helps the Platform Story

For a platform practices role, Argo CD helps explain:

- controlled delivery from Git
- reviewable desired state
- visible drift
- sync status and app health
- rollback through Git or Argo CD history
- separation between team changes and cluster admin access

API gateway mapping:

```text
service interface or platform config change
  -> Git review
  -> Argo CD syncs approved config/manifests
  -> policy checks enforce platform rules
  -> telemetry shows traffic, latency, errors, quota, and auth behavior
```

## Install

Run:

```sh
make install-argocd
```

This follows the standard Argo CD local install shape:

```sh
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

The lab target also waits for Argo CD deployments to become available.

## Register Lab Apps

Argo CD runs inside the cluster. It cannot read an unpushed local working tree. It needs a Git URL.

Run:

```sh
ARGOCD_REPO_URL=https://github.com/<owner>/<repo>.git make argocd-apps
```

Optional:

```sh
ARGOCD_TARGET_REVISION=main
```

Applications are generated from `argocd/apps.json`.

Renderer script: `scripts/argocd/render-apps.js`.

## Open UI

Run:

```sh
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

The browser may warn because this is a local self-signed TLS endpoint.

## Smooth Demo

1. Start with the existing direct path:

```sh
make bootstrap
make build
make install-kyverno
make install-observability
make deploy
make observability
```

2. Explain that direct `kubectl apply` is good for learning, but platform teams usually want GitOps for shared environments.

3. Install Argo CD:

```sh
make install-argocd
```

4. Register apps:

```sh
ARGOCD_REPO_URL=https://github.com/<owner>/<repo>.git make argocd-apps
```

5. Inspect:

```sh
make argocd
```

6. Open the UI and show:

- app list
- sync status
- health status
- manifest path
- drift when live state differs from Git

## What Not to Do

Do not make two competing delivery paths for the final demo.

Use this framing:

```text
kubectl path = teaching path
Argo CD path = platform operating model
same manifests, same guardrails, same telemetry
```

Final demo can start with `kubectl` for basics, then show Argo CD as the real operating model.
