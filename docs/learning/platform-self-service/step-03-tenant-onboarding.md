# Tenant Onboarding

## Concept

Tenant onboarding gives a team its namespace, limits, permissions, and deployment pattern.

## Simple Meaning

A team should get a ready place to run services, not a blank cluster.

## Why Teams Care

Clear onboarding reduces platform tickets and makes ownership boundaries visible.

## Runnable Example

```sh
kubectl apply -k examples/tenant-a --dry-run=server
kubectl apply -k examples/tenant-b --dry-run=server
kubectl get namespace tenant-a tenant-b
```

## What Can Go Wrong

Without resource quotas and RBAC, one team can accidentally consume shared cluster capacity or get permissions it does not need.

## Platform Guardrail Or Best Practice

Create tenant examples with namespace, RBAC, ResourceQuota, LimitRange, and app overlay together.

## Checkpoint

Which files define tenant resource boundaries?

## Lab Link

- Tenant A: [../../../examples/tenant-a](../../../examples/tenant-a)
- Tenant B: [../../../examples/tenant-b](../../../examples/tenant-b)
