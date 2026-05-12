# Rollback And Telemetry Gates

## Concept

Rollback is a delivery capability. Telemetry gates decide whether a rollout is healthy enough to continue.

## Simple Meaning

Teams should not wait for a user complaint to learn that a deployment is bad.

## Why Teams Care

The real question after deploy is whether users are healthy. Grafana SLI/SLO panels turn that into a visible decision.

## Runnable Example

```sh
make deploy
make tools-up
make resilience
make rollback
make observability
```

## What Can Go Wrong

Kubernetes can keep pods running while 500s or latency still hurt users. A green pod is not the same as a healthy service.

## Platform Guardrail Or Best Practice

Use rollback commands and dashboard checks in the demo path. Do not treat them as emergency-only knowledge.

## Checkpoint

Which Grafana panel would you watch after running `Create 500 errors`?

## Lab Link

- Rollback lab: [../../../labs/03-rollback/README.md](../../../labs/03-rollback/README.md)
- Dashboard demo: [../../runbooks/dashboard-demo.md](../../runbooks/dashboard-demo.md)
- SLO examples: [../../../observability/slo-examples.md](../../../observability/slo-examples.md)
