# Kyverno Policies

Guardrails for the lab.

## Why Use Kyverno?

- No separate DSL required: Kyverno policies are Kubernetes resources written as YAML, so teams can review them with the same workflow they use for manifests. This is easier to introduce than asking every team to learn OPA/Rego first.
- Production-oriented guardrails: Kyverno can validate, mutate, generate, audit, and enforce policy in multi-tenant clusters. In this lab, it blocks unsafe workloads at admission time and gives clear policy names in `make evidence`.
- Security: Kyverno supports supply-chain and runtime guardrails, including image signature verification and security best-practice enforcement. This lab starts with approved registries, required CPU/memory requests and limits, and non-root containers.

## Policy Goals

- require CPU and memory requests
- require resource limits
- block privileged or non-root-incompatible containers
- allow only approved image registries
- keep tenant boundaries explicit

## Lab Flow

1. apply policy
2. deploy valid manifest
3. try invalid manifest
4. show reject event and fix

## Focused Policy Checks

Run:

```sh
make validate-policies
```

Examples:

- `examples/policy/pass`: accepted by all policies
- `examples/policy/fail-approved-registry`: rejected by `approved-image-registry`
- `examples/policy/fail-missing-resources`: rejected by `require-container-resources`
- `examples/policy/fail-nonroot`: rejected by `require-nonroot-containers`

Tenancy policy note: these policies apply to `tenant-a` and `tenant-b`. Tenant boundaries are also covered through namespaces, namespace-scoped RBAC, `ResourceQuota`, `LimitRange`, and tenant overlays. A dedicated Kyverno policy that validates tenant naming conventions is deferred.
