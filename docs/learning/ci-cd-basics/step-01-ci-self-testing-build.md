# Continuous Integration And Self-Testing Builds

## Concept

Continuous integration means frequent shared integration verified by an automated self-testing build.

## Simple Meaning

Do not wait days to discover that changes do not fit together. Build and validate the path early.

## Why Teams Care

Delayed integration creates delayed risk. Fast checks let teams fix small problems while context is still fresh.

## Runnable Example

```sh
make build
make validate
make validate-policies
```

## What Can Go Wrong

If validation only happens after deployment, teams learn about policy, image, or manifest problems too late.

## Platform Guardrail Or Best Practice

Keep build and validation commands repo-local so every team can run the same checks before asking the platform to deploy.

## Checkpoint

Which command proves the good tenant manifest passes and the bad manifest is rejected?

## Lab Link

- Build target: [../../../Makefile](../../../Makefile)
- Tenant manifest: [../../../examples/tenant-a/kustomization.yaml](../../../examples/tenant-a/kustomization.yaml)
- Policy lab: [../../../labs/02-policy/README.md](../../../labs/02-policy/README.md)
