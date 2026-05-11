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
kubectl apply --server-side -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

The lab uses server-side apply because the Argo CD CRDs are large enough to hit the client-side `last-applied-configuration` annotation limit.

The lab target also waits for Argo CD deployments and pods to become ready.

## Register Lab Apps

Argo CD runs inside the cluster. It cannot read an unpushed local working tree. It needs a Git URL.

This lab defaults to the public repository:

```text
https://github.com/farshi/paved-platform-lab.git
```

Run:

```sh
make argocd-apps
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

## Common Errors

### k3d cluster already exists

If the local cluster already exists, `make bootstrap` reuses it and reapplies the baseline namespaces.

To start from zero:

```sh
make reset
make bootstrap
```

### CRD annotation too long

If you see:

```text
metadata.annotations: Too long
```

rerun:

```sh
make install-argocd
```

The Makefile uses `kubectl apply --server-side` so Argo CD's large CRDs do not need the client-side last-applied annotation.

### Password secret not found

If `make argocd-password` cannot find `argocd-initial-admin-secret`, Argo CD is not installed or is still starting.

Check:

```sh
kubectl get pods -n argocd
```

Then retry:

```sh
make argocd-password
```

### Port-forward pod is pending

If `make argocd-up` says the pod is `Pending`, wait for the server deployment:

```sh
kubectl wait --for=condition=Available deployment/argocd-server -n argocd --timeout=180s
make argocd-up
```

## Test The Argo CD Flow

Use this as the smoke test after changing the GitOps files.

1. Check the generated `Application` manifests without touching the cluster:

```sh
node scripts/argocd/render-apps.js
```

Expected:

- four `Application` manifests
- `repoURL: "https://github.com/farshi/paved-platform-lab.git"`
- paths from `argocd/apps.json`

2. Start the cluster and install local platform add-ons:

```sh
make bootstrap
make install-addons
```

This installs Kyverno, observability, Argo CD, and registers the Argo CD apps.

3. Check Argo CD objects:

```sh
kubectl get pods -n argocd
kubectl get applications -n argocd
make argocd
```

Expected:

- Argo CD pods are `Running`
- four `Application` resources exist
- each app has a sync and health status

4. Open the UI:

```sh
make argocd-password
make argocd-up
```

Open `https://localhost:18080`, then login as `admin`.

5. Show drift and recovery:

```sh
kubectl scale deployment demo-api -n tenant-a --replicas=1
make argocd
```

Expected: Argo CD shows drift/out-of-sync for the tenant app. Sync from the UI or CLI, then check:

```sh
kubectl get deployment demo-api -n tenant-a
```

Expected: desired state is restored from Git.

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
make argocd-apps
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
