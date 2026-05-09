# Lab 01 - Setup

Goal: create the local Kubernetes platform and prove the basic pieces exist.

## Run

```sh
make install
make bootstrap
make build
```

If tools are already installed, `make install` should print `ok` lines and exit.

## Check

```sh
kubectl config current-context
kubectl get nodes
kubectl get namespaces
kubectl get ns tenant-a tenant-b observability --ignore-not-found
```

Expected:

- current context points at the `guardrails-lab` k3d cluster
- at least one server node and one agent node exist
- `tenant-a`, `tenant-b`, and `observability` namespaces are `Active`

## What This Proves

- local cluster is reachable
- tenant namespaces exist
- demo API image is built and imported into k3d

## Next

Go to `labs/02-policy`.
