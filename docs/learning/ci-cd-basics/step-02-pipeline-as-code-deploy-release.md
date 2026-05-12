# Pipeline As Code And Deploy Versus Release

## Concept

Pipeline-as-code means delivery steps are versioned with the service. Deployment is technical rollout. Release is user exposure or business activation.

## Simple Meaning

The repo should show the delivery path in commands and files, not in someone's memory.

## Why Teams Care

Teams need to know which steps build, validate, deploy, and expose change. Mixing deployment and release makes rollback decisions unclear.

## Runnable Example

```sh
make install-addons
make deploy
make argocd
make tools-up
```

## What Can Go Wrong

A team can deploy a technically valid service and still release it without telemetry, rollback, or support readiness.

## Platform Guardrail Or Best Practice

Keep delivery steps repeatable in `Makefile`, manifests, and GitOps app definitions. Use feature flags or traffic controls for release decisions when the platform grows.

## Checkpoint

In this lab, which commands deploy infrastructure add-ons and which command deploys the tenant app?

## Lab Link

- Make targets: [../../../Makefile](../../../Makefile)
- Argo CD apps: [../../../argocd/apps.json](../../../argocd/apps.json)
- Demo order: [../../runbooks/dashboard-demo.md](../../runbooks/dashboard-demo.md)
