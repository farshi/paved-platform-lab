# Guardrails

## Concept

Guardrails are automated checks that keep common mistakes out of the platform path.

## Simple Meaning

Policy runs before unsafe workloads become incidents.

## Why Teams Care

Teams can move faster when they know the platform will catch basic safety issues consistently.

## Runnable Example

```sh
make install-kyverno
make validate-policies
make break
```

## What Can Go Wrong

Guardrails that only exist in review comments are inconsistent and slow. Guardrails that are too hidden feel like random blockers.

## Platform Guardrail Or Best Practice

Pair each enforced policy with a pass example, a fail example, and a short explanation.

## Checkpoint

Which policy blocks a container that runs as root?

## Lab Link

- Policy docs: [../../../labs/02-policy/README.md](../../../labs/02-policy/README.md)
- Kyverno policies: [../../../policies/kyverno](../../../policies/kyverno)
