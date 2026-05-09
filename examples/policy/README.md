# Policy Examples

Focused pass/fail examples for each Kyverno guardrail.

Run all examples:

```sh
make validate-policies
```

## Examples

| Path | Expected result | Policy shown |
| --- | --- | --- |
| `examples/policy/pass` | accepted | none |
| `examples/policy/fail-approved-registry` | rejected | `approved-image-registry` |
| `examples/policy/fail-missing-resources` | rejected | `require-container-resources` |
| `examples/policy/fail-nonroot` | rejected | `require-nonroot-containers` |

These examples use `--dry-run=server`, so the real Kubernetes API server and admission controllers evaluate them without creating workloads.

## Tenancy Scope

This lab currently covers tenancy through namespace isolation, namespace-scoped RBAC, `ResourceQuota`, `LimitRange`, and tenant overlays.

It does not yet enforce a dedicated Kyverno tenancy policy such as "tenant-a workloads must only deploy to namespace tenant-a." That is explicitly deferred until a later policy coverage pass.
