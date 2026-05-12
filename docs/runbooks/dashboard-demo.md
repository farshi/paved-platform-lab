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
  -> read SLI/SLO panels in Grafana
  -> prove the same signals in Prometheus
  -> kill one pod and watch Kubernetes recover
  -> create Argo CD drift
  -> sync back to Git desired state
  -> show policy guardrail
```

## Terms To Explain First

- SLI: service level indicator. The measured signal, such as availability percentage, request latency, or error percentage.
- SLO: service level objective. The target for that signal, such as 95 percent availability or 95 percent of requests under 500ms in this local demo.
- Error budget: the allowed gap between perfect service and the SLO. A 99 percent availability SLO gives a 1 percent error budget.
- Burn rate: how fast the service is consuming its error budget. `2x` means the service is spending budget twice as fast as allowed.
- p95 latency: the 95th percentile request time. If p95 is 500ms, 95 out of 100 requests were 500ms or faster, and 5 were slower.

Use this sentence in the demo:

```text
Kubernetes says whether the app is running. SLI and SLO panels say whether users are getting the service level we promised.
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

### 2. SLI/SLO Dashboard Read

In portal:

1. Open `Traffic Lab`.
2. Click `Run normal traffic`.
3. Open `Grafana`.
4. Watch `Request Rate`.
5. Watch `Availability SLI vs SLO`.
6. Watch `Latency SLI vs SLO`.
7. Watch `Latency P95`.

Talk track:

```text
Request Rate proves users are hitting the service.
Availability SLI vs SLO compares actual success percentage to the dashboard target.
Latency SLI vs SLO compares requests under the dashboard latency threshold to the dashboard target.
Latency P95 shows the slower edge of user experience, not just the average.
```

Expected:

- request rate moves after scrape
- availability stays near the SLO when traffic is healthy
- latency SLI stays above the 95 percent target when requests are fast
- p95 latency stays low during normal traffic

### 3. Prometheus Proof

In portal:

1. Open `Prometheus`.
2. Copy `Availability SLI vs 99 percent SLO`.
3. Paste it into Prometheus and run it.
4. Copy `Latency SLI under 500ms vs dashboard SLO`.
5. Paste it into Prometheus and run it.

Purpose:

```text
show that Grafana panels are not magic; they are PromQL queries over scraped metrics
```

### 4. Create SLO Burn

In portal:

1. Open `Traffic Lab`.
2. Click `Create 500 errors`.
3. Open `Grafana`.
4. Watch `Error Rate`.
5. Watch `Error Budget Burn`.
6. Open `Prometheus`.
7. Copy `Error percentage` or `Error budget burn rate`.
8. Run the query.

Expected:

- error rate moves after `/fail` traffic
- error percentage rises
- error budget burn rises when the error percentage exceeds the 1 percent demo budget
- Prometheus query matches the dashboard behavior

Talk track:

```text
This is the moment an operator cares about. The app can still be running, but the SLO says users are being hurt.
```

### 5. Slow User Experience

In portal:

1. Open `Traffic Lab`.
2. Click `Create slow requests`.
3. Open `Grafana`.
4. Watch `Latency P95`.
5. Watch `Latency SLI vs SLO`.

Expected:

- p95 latency rises after `/slow` traffic
- latency SLI drops when fewer requests finish under the dashboard latency threshold
- error rate can stay flat, proving latency and errors are different user-impact signals

### 6. Basic Traffic And Metrics

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

### 7. Pod Resilience

This is a resilience demo, not a rollback demo. It shows Kubernetes maintaining desired replicas after a single pod disappears.

Setup in portal:

1. Open `Traffic Lab`.
2. Click `Run normal traffic`.
3. Open `Grafana`.
4. Watch `Request Rate` and `Availability SLI vs SLO`.

In terminal:

```sh
make resilience
```

Expected:

- one `demo-api` pod is deleted
- Deployment creates a replacement pod
- `kubectl rollout status` returns healthy
- request rate should continue if traffic is active
- availability may dip briefly if requests hit the deleted pod during replacement

Talk track:

```text
The team did not manually restart the app.
The Deployment declared two replicas.
Kubernetes noticed one pod disappeared and created a replacement.
Telemetry tells us whether users noticed during recovery.
```

What this proves:

- resilience: the platform restores desired state
- availability: traffic can continue through another replica
- observability: Grafana shows whether the self-heal protected users

What it does not prove:

- no downtime under every failure
- database or dependency resilience
- bad release rollback

### 8. GitOps Drift And Recovery

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

### 9. Policy Guardrail

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
## Dashboard Controls

At the top of the Grafana dashboard, use the variables as demo controls:

- `Availability SLO %`: default 95 for demo visibility.
- `Latency SLO %`: default 95.
- `Latency threshold seconds`: default 0.5 because it matches a real histogram bucket.
- `Error budget %`: default 5 so local 500 traffic visibly burns budget.
- `Burn threshold`: default 2.
- `Demo window`: default 30s. This is short for live demos; real SLOs use longer windows.

These controls change the target lines and comparisons. They do not change traffic or the service.

Prometheus scrapes the demo API every 5s. After clicking a Traffic Lab button, wait one or two dashboard refreshes.
