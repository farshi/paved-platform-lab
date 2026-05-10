# Self-Service Demo Demo

Goal: show how a small platform helps teams ship safely without waiting for a central platform engineer at every step.

For a 30-minute developer self-service platform demo flow, use `docs/developer-self-service-platform-runbook.md`.

## Story

A product team owns a service. The platform gives them a paved road:

1. Build service.
2. Package container image.
3. Deploy through Kubernetes manifests.
4. Pass policy guardrails.
5. Emit telemetry.
6. Watch SLO health.
7. Roll back fast when a bad version hurts users.

This is self-service because the team can run the path themselves. It is safe because the platform adds defaults, policy, evidence, and rollback.

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

Do not build a full SRE platform here. The demo value is showing the operating model clearly.

## Demo Talk Track

- The platform is a paved road, not a ticket queue.
- Guardrails are the default path, not late gatekeeping.
- Self-service is an operating model, not a portal.
- Fast feedback protects team behavior.
- Observability closes the loop from deploy to user impact.
- Rollback is part of delivery, not an emergency afterthought.

## Success Criteria

- New user can read one doc and understand the platform story.
- Demo proves safe self-service with commands.
- Runtime demo shows why telemetry matters.
- Watcher proves fast recovery without hiding the mechanics.
