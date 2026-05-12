# Namespaces, Deployments, Pods, And Services

## Concept

Kubernetes runs workloads as pods, but teams usually manage them through Deployments and reach them through Services.

## Simple Meaning

- Namespace: a boundary for a team or tenant.
- Deployment: desired state for running copies of an app.
- Pod: one running copy.
- Service: stable network entrypoint that routes to ready pods.

## Why Teams Care

Teams should not debug random pod names first. They should understand the path from team namespace to app Deployment to Service traffic.

## Runnable Example

```sh
kubectl get namespace tenant-a
kubectl get deployment demo-api -n tenant-a
kubectl get pods -n tenant-a -l app.kubernetes.io/name=demo-api
kubectl describe service demo-api -n tenant-a
```

## What Can Go Wrong

A pod can disappear. That does not mean the service is permanently down if the Deployment still wants two replicas.

## Platform Guardrail Or Best Practice

Use Deployments and readiness probes so the platform can keep the desired replica count and route only to ready pods.

## Checkpoint

Why does this lab show one Service but two pods?

## Lab Link

- Manifest: [../../../services/demo-api/manifests/base/deployment.yaml](../../../services/demo-api/manifests/base/deployment.yaml)
- Manifest: [../../../services/demo-api/manifests/base/service.yaml](../../../services/demo-api/manifests/base/service.yaml)
- Demo command: `make resilience`
