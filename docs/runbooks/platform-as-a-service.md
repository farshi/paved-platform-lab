# Platform-as-a-Service Demo

Goal: show how a small platform helps teams ship safely without waiting for a central platform engineer at every step.

For a 30-minute platform walkthrough, use `docs/runbooks/platform-practices.md`.

## Story

A product team owns a service. The platform gives them a paved road:

1. Build service.
2. Package container image.
3. Deploy through Kubernetes manifests.
4. Pass policy guardrails.
5. Emit telemetry.
6. Watch SLO health.
7. Roll back fast when a bad version hurts users.
8. Recover from one lost pod without manual repair.

This is self-service because the team can run the path themselves. It is safe because the platform adds defaults, policy, evidence, and rollback.

## SLI And SLO In This Demo

- SLI is the measured service signal: availability, latency, or error rate.
- SLO is the target the team promises to stay inside.
- p95 latency means 95 percent of requests are this fast or faster. It shows the slow edge users feel better than an average does.
- Error budget is the small amount of failure allowed by the SLO.
- Burn rate shows how quickly that budget is being consumed.

Demo SLOs:

- Availability: default dashboard target is 95 percent of demo requests avoiding 5xx errors.
- Latency: default dashboard target is 95 percent of demo requests finishing under 500ms.
- Error rate: default dashboard budget is 5 percent 5xx for visible local demos.

Where to show them:

- Grafana: `Availability SLI vs SLO`, `Latency SLI vs SLO`, `Latency P95`, and `Error Budget Burn`.
- Grafana variables: adjust SLO targets and latency threshold at the top of the dashboard.
- Prometheus: PromQL samples from the portal Prometheus card.
- Source doc: `observability/slo-examples.md`.

## Demo Steps

### 1. Install Tools

Run:

```sh
make install
```

What this teaches: teams should not need tribal knowledge to set up the platform tools.

### 2. Start Local Platform

Run:

```sh
make bootstrap
```

What this teaches: a local cluster lets teams learn the deployment path before touching shared environments.

### 3. Deploy Good Service

Run:

```sh
make build
make install-kyverno
make validate
make deploy
```

What this teaches: the safe path is automated. Teams should learn one repeatable route, not a pile of manual commands.

### 4. Break Something Safely

Run:

```sh
make break
```

What this teaches: guardrails should block unsafe changes before they become production incidents.

### 5. Roll Back

Run:

```sh
make rollback
```

What this teaches: deployment is not complete unless rollback is practiced.

### 6. Show SLO Health

Run:

```sh
make install-observability
make observability
make tools-up
```

In the portal:

1. Open `User Guide`.
2. Open `Traffic Lab` and run normal traffic.
3. Open `Grafana` and show `Availability SLI vs SLO`.
4. Open `Grafana` and show `Latency SLI vs SLO`.
5. Open `Traffic Lab` and create 500 errors.
6. Open `Grafana` and show `Error Budget Burn`.
7. Open `Traffic Lab` and create slow requests.
8. Open `Grafana` and show `Latency P95`.

What this teaches: the platform is not only deploy automation. It also gives teams a shared way to decide whether users are healthy after release.

### 7. Show Pod Resilience

Run normal traffic from Traffic Lab, then run:

```sh
make resilience
```

What this teaches: Kubernetes self-heals a missing pod back to the Deployment's desired replica count. Grafana shows whether request rate and availability stayed healthy while recovery happened.

## Next Runtime Demo

Add one tiny Java service. Keep it boring on purpose.

Service shape:

- Java HTTP API.
- SQLite database for one simple write/read flow.
- `/health` returns service health.
- `/orders` creates or lists simple records.
- `/slow` adds latency on purpose.
- `/fail` returns errors on purpose.
- Metrics show request count, latency, and error rate.
- Minimal OpenTelemetry exports traces and metrics.

Bad version:

- Makes `/orders` slow or flaky.
- Burns latency or error budget quickly.
- Still starts, so Kubernetes alone does not catch everything.

Lesson: Kubernetes can tell whether a pod is running. Telemetry tells whether users are hurting.

## Watcher Demo

Add one small watcher after the service exists.

Watcher behavior:

1. Poll service health.
2. Check rollout state.
3. Read simple error or latency signal.
4. Print plain diagnosis.
5. Run rollback when the bad version is obvious.

Keep it simple:

```text
watch -> detect bad health or fast SLO burn -> explain -> kubectl rollout undo
```

Do not build a full SRE platform here. The learning value is showing the operating model clearly.

## Talk Track

- The platform is a paved road, not a ticket queue.
- Guardrails are the default path, not late gatekeeping.
- Self-service is an operating model, not a portal.
- Fast feedback protects team behavior.
- Observability closes the loop from deploy to user impact.
- Rollback is part of delivery, not an emergency afterthought.
- Resilience starts with desired state, replicas, probes, and telemetry.

## Success Criteria

- New user can read one doc and understand the platform story.
- Demo proves safe self-service with commands.
- Runtime demo shows why telemetry matters.
- Watcher proves fast recovery without hiding the mechanics.
