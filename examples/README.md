# Tenant Examples

This directory shows two tenant overlays: `tenant-a` and `tenant-b`.

A tenant is a team or application boundary. Each tenant gets its own Kubernetes namespace, permissions, resource guardrails, and copy of the shared `demo-api` workload.

## API Platform Example

`examples/api-platform` contains an policy-shaped config example. It does not run gateway locally. It shows how service interface config, auth policy, quota, spike arrest, and target standards can be validated and delivered through the same GitOps model.

Run:

```sh
make validate-api-platform
make validate-self-service-platform
```

## How To Apply A Tenant

```sh
kubectl apply -k examples/tenant-a
kubectl apply -k examples/tenant-b
```

The `-k` flag tells `kubectl` to use Kustomize. Kustomize reads `kustomization.yaml`, assembles the listed files, applies patches, then sends the final Kubernetes manifests to the cluster.

## Files In Each Tenant

### `kustomization.yaml`

Kustomize build instructions for the tenant.

It does not create a Kubernetes object by itself. It tells Kustomize to:

- include tenant setup files
- include the shared app from `services/demo-api/manifests/base`
- deploy resources into the tenant namespace
- add a tenant label
- set the demo API image tag
- apply `patch-env.yaml`

### `namespace.yaml`

Creates the tenant namespace.

The namespace is the tenant's isolated Kubernetes area. Tenant A uses `tenant-a`; tenant B uses `tenant-b`.

### `rbac.yaml`

Creates tenant permissions.

It defines:

- `ServiceAccount`: identity used by the tenant workload
- `Role`: actions allowed inside the tenant namespace
- `RoleBinding`: connects the role to the service account

This keeps tenant permissions namespace-scoped instead of cluster-wide.

### `resourcequota.yaml`

Sets a maximum resource budget for the tenant namespace.

This prevents one tenant from consuming too much CPU, memory, or object count in the local cluster.

### `limitrange.yaml`

Sets default and allowed CPU/memory values for containers.

This gives workloads a resource shape even when a team forgets to set requests or limits.

### `patch-env.yaml`

Customizes the shared `demo-api` deployment for the tenant.

Tenant A sets tenant-specific environment values for `tenant-a`; tenant B does the same for `tenant-b`.

## Tenant A Vs Tenant B

The folders are intentionally almost identical.

The difference is tenant identity:

- namespace: `tenant-a` vs `tenant-b`
- label: `tenant: tenant-a` vs `tenant: tenant-b`
- app environment: `TENANT=tenant-a` vs `TENANT=tenant-b`

This shows the platform pattern: one shared service template, multiple tenant overlays.
