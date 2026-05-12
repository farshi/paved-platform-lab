# Variable Governance

## Concept

Variable governance decides which knobs teams can safely change themselves and which knobs need stronger controls.

## Simple Meaning

Not every setting has the same risk.

## Why Teams Care

Self-service stays fast when low-risk changes are easy and high-risk changes are clearly protected.

## Runnable Example

```sh
make tools-up
```

In Grafana, change dashboard variables such as `Availability SLO %`, `Latency threshold seconds`, and `Demo window`.

## What Can Go Wrong

If teams can change production-critical settings without review, they can hide risk. If every setting needs review, self-service dies.

## Platform Guardrail Or Best Practice

Classify variables by risk. Demo dashboard variables are safe learning controls. Image registry, runtime security, and production SLO policy should have stronger review.

## Checkpoint

Why is changing a Grafana demo SLO safer than changing an allowed image registry?

## Lab Link

- Dashboard demo: [../../runbooks/dashboard-demo.md](../../runbooks/dashboard-demo.md)
- Dashboard manifest: [../../../observability/grafana-dashboard-demo-api.yaml](../../../observability/grafana-dashboard-demo-api.yaml)
