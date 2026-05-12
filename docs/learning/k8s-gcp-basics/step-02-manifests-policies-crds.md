# Manifests, Policies, And CRDs

## Concept

Kubernetes YAML describes desired state. CRDs extend Kubernetes with new resource types. Policies decide which desired states are allowed.

## Simple Meaning

- Manifest: the file sent to the Kubernetes API.
- CRD: a custom resource type installed by a platform add-on.
- Kyverno policy: a rule that can reject unsafe manifests.
- ServiceMonitor: a Prometheus custom resource that tells Prometheus what to scrape.

## Why Teams Care

Teams need to know whether a failure is a bad app, a rejected manifest, or a missing platform add-on.

## Runnable Example

```sh
kubectl get crd
kubectl get clusterpolicies
kubectl apply -k examples/tenant-a --dry-run=server
make validate-policies
```

## What Can Go Wrong

A manifest can look valid as YAML but still be unsafe: missing resources, running as root, or using an unapproved image registry.

## Platform Guardrail Or Best Practice

Run policy checks before deploy and keep pass/fail examples in the repo so teams can learn the rule without reading policy internals first.

## Checkpoint

What is the difference between YAML syntax passing and admission policy allowing the workload?

## Lab Link

- Policies: [../../../policies/kyverno](../../../policies/kyverno)
- Pass example: [../../../examples/policy/pass/deployment.yaml](../../../examples/policy/pass/deployment.yaml)
- Fail example: [../../../examples/policy/fail-nonroot/deployment.yaml](../../../examples/policy/fail-nonroot/deployment.yaml)
- Demo command: `make validate-policies`
