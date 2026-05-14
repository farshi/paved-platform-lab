# Dashboard Demo

Use this after the [User Guide](README.md) golden path.

Already done:

- `make demo-ready` prepared both demo apps and observability
- `make tools-up` opened the portal and kept Grafana, Prometheus, Argo CD, and app port-forwards alive

Goal: show that telemetry explains user health better than pod status alone.

## Terms To Explain First

- SLI: measured signal, such as availability, latency, or error rate.
- SLO: target for that signal.
- Error budget: allowed gap between perfect service and the SLO.
- Burn rate: how fast the service is spending the error budget.
- p95 latency: 95 percent of requests were this fast or faster.
- Noisy neighbor: one tenant or workload creates enough load, errors, or latency to hurt service quality.

Say:

```text
Kubernetes says whether the app is running. SLI and SLO panels say whether users are getting the service level we promised.
```

## 1. Reset Demo State

Run:

```sh
make demo-clean
```

State after this step:

- Python app in `tenant-a` is healthy baseline
- Java app in `tenant-b` is healthy noisy-neighbor target
- recent traffic exists so Grafana panels have data

Next: prove normal traffic.

## 2. Show Baseline Traffic

Run:

```sh
make traffic
APP=java-telemetry-api TENANT=tenant-b make traffic
```

In Grafana:

1. Set time range to `Last 2 minutes`.
2. Set refresh to `5s` or `10s`.
3. For baseline, set `Service=demo-api` and `Tenant=tenant-a`.
4. For noisy-neighbor app, set `Service=java-telemetry-api` and `Tenant=tenant-b`.
5. Set `Demo window=30s`.

Expected result: request rate moves while availability and latency stay healthy.

Next: create tenant-b errors.

## 3. Create Error Burn

Run:

```sh
APP=java-telemetry-api TENANT=tenant-b make break
APP=java-telemetry-api TENANT=tenant-b make traffic
```

Expected result:

- tenant-b 5xx panels move
- availability drops for tenant-b
- error budget burn rises
- tenant-a stays separate when Grafana filters are set to `Service=demo-api`, `Tenant=tenant-a`

Next: create latency burn.

## 4. Create Slow Requests

Run:

```sh
APP=java-telemetry-api TENANT=tenant-b make traffic-slow
```

Expected result: tenant-b p95 latency rises.

Next: recover with the watcher.

## 5. Watcher Recovery

Run:

```sh
APP=java-telemetry-api TENANT=tenant-b make rollback-watch
APP=java-telemetry-api TENANT=tenant-b make traffic
```

Expected result:

- watcher prints diagnosis
- watcher rolls tenant-b back when burn is obvious
- tenant-b moves back toward healthy after recovery traffic

Next runbook: [Platform-as-a-Service Demo](platform-as-a-service.md).

## If Something Feels Stuck

- no Grafana data: check `Service`, `Tenant`, and `Demo window`
- old 5xx still visible: run `make demo-clean`, set `Last 2 minutes`, wait 30s, then refresh
- no Java pods: rebuild and redeploy from the User Guide recovery section
- port-forward lost: run `make tools-up` from the User Guide recovery section
- panels move slowly: wait one or two 5s scrape intervals and run traffic again
- watcher only diagnoses: check whether `ROLLBACK_WATCHER_MODE=diagnose` is set

## User Guide Controls

In the portal, click `User Guide`.

Use:

- `Start`: first guide page
- `Next`: next guide page
- `Back`: previous guide page
- `Done`: mark page complete in browser local storage

Keep terminal visible beside the browser.
