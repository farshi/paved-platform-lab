# Lab 02 - Policy

Goal: install Kyverno guardrails and prove good manifests pass while bad manifests fail.

## Run

```sh
make install-kyverno
make validate
```

`make validate` runs server-side dry runs for both good tenant overlays and the intentionally bad manifest.

## Check Good Manifests

```sh
kubectl apply -k examples/tenant-a --dry-run=server
kubectl apply -k examples/tenant-b --dry-run=server
```

Expected:

- tenant resources are accepted by the API server
- no real workload changes are made because this is a dry run

## Check Bad Manifest

```sh
kubectl apply -k examples/bad --dry-run=server
```

Expected: admission rejects the manifest.

The rejection should name policies like:

- `approved-image-registry`
- `require-container-resources`
- `require-nonroot-containers`

## Inspect Policies

```sh
kubectl get clusterpolicy
kubectl describe clusterpolicy approved-image-registry
```

Expected:

- policies are `READY`
- policy text explains what is enforced

## What This Proves

- good tenant workloads can self-serve through the paved road
- unsafe workloads are blocked before they run
- policy failure is visible enough to explain and fix

## Next

Go to `labs/03-rollback`.
