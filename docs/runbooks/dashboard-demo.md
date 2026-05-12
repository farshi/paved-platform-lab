# Dashboard Demo Runbook

Use this when you want one guided session: terminal commands on the left, portal dashboards on the right.

The commands are split into two groups:

- setup commands prepare the lab before the demo
- demo commands are the things you run while presenting

## Demo Story

```text
setup local platform
  -> open portal
  -> prove baseline health
  -> create traffic
  -> read Grafana and Prometheus
  -> create Argo CD drift
  -> sync back to Git desired state
  -> show policy guardrail
```

## Setup Commands

Run setup before presenting. These commands create the platform and should not be the main demo.

Fresh start:

```sh
make reset
make setup
```

Same setup, expanded:

```sh
make install
make bootstrap
make build
make install-addons
make deploy
make argocd
```

During `make` runs, green `$ ...` lines show the actual `kubectl`, `helm`, `node`, `docker`, or `k3d` command being executed.

Expected:

- cluster exists
- Kyverno is installed
- Prometheus and Grafana are installed
- Argo CD is installed
- `platform-guardrails-tenant-a` exists
- `demo-api` is running in `tenant-a`

If Argo CD apps are missing:

```sh
make argocd-apps
```

## Portal Command

Keep this command running in a second terminal:

```sh
make tools-up
```

Open:

```text
http://localhost:18000
```

The `User Guide` card is first. Use it as the driver, then switch to Grafana, Prometheus, Argo CD, and Traffic Lab as each step asks.

## Demo Commands

Run these while presenting, in this order.

### 1. Baseline Evidence

In terminal:

```sh
make evidence
make argocd
make observability
```

In portal:

1. Open `User Guide`.
2. Open `Grafana`.
3. Open `Argo CD`.
4. Show app health, sync status, and runtime metrics.

Purpose:

```text
prove the platform is healthy before creating incidents
```

### 2. Traffic And Metrics

In portal:

1. Open `Traffic Lab`.
2. Click `Run normal traffic`.
3. Open `Grafana`.
4. Watch `Request Rate`.
5. Open `Prometheus`.
6. Copy the `Request rate` PromQL sample.
7. Paste it into Prometheus and run it.

Then create an incident:

1. Open `Traffic Lab`.
2. Click `Create 500 errors`.
3. Open `Grafana`.
4. Watch `Error Rate`.
5. Open `Prometheus`.
6. Copy `5xx error rate` or `Error percentage`.
7. Run the query.

Expected:

- request rate moves after scrape
- error rate moves after `/fail` traffic
- Prometheus query matches the dashboard behavior

If panels do not move immediately, wait one or two Prometheus scrape intervals and refresh the panel.

### 3. GitOps Drift And Recovery

In terminal:

```sh
make argocd-drift
make argocd
kubectl get deployment demo-api -n tenant-a
```

Expected:

- deployment shows `1/1`
- Argo CD tenant app becomes `OutOfSync`

In portal:

1. Open `Argo CD`.
2. Open `platform-guardrails-tenant-a`.
3. Show `OutOfSync`.
4. Explain that live cluster state no longer matches Git.

Recover from Git:

```sh
make argocd-sync
kubectl get deployment demo-api -n tenant-a
make argocd
```

Expected:

- deployment returns to `2/2`
- `platform-guardrails-tenant-a` returns to `Synced` and `Healthy`

Talk track:

```text
Manual kubectl change caused drift.
Argo CD compared live state to Git.
Sync restored approved desired state.
```

### 4. Policy Guardrail

In terminal:

```sh
make validate-policies
make break
```

Expected:

- valid examples pass
- bad example is rejected
- unsafe image/resources/security context are blocked

Talk track:

```text
GitOps handles delivery.
Policy decides what is allowed.
Telemetry shows what is running.
```

## User Guide Controls

In the portal, click `User Guide`.

Use:

- `Start`: first guide page
- `Next`: next guide page
- `Back`: previous guide page
- `Done`: mark page complete in browser local storage

Keep terminal visible beside the browser.

## Clean Stop

Stop portal and port-forwards:

```text
Ctrl-C in Terminal 2
```

Optional full reset:

```sh
make reset
```
