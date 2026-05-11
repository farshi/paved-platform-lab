# Step 3: Cluster

## What a Cluster is

A **cluster** is the full Kubernetes system.

It is made of:

- one or more machines that run workloads
- the control plane that manages them

## Simple meaning

A cluster is the whole Kubernetes setup.
It is the place where Pods run.

## Example

In GKE (Google Kubernetes Engine):

- Google manages the Kubernetes control plane
- your app Pods run on nodes in the cluster

## Why cluster matters

If you have one cluster, you can run many apps inside it.
If needed, you can also use separate clusters for:

- dev
- test
- prod

## Easy words

- **Cluster**: the full Kubernetes environment.
- **GKE**: Google Kubernetes Engine, Google-managed Kubernetes in GCP.

## Small example flow

```text
GCP project
  -> GKE cluster
  -> nodes inside cluster
  -> Pods run on nodes
```

## Real-life example

For a regulated platform:

- one cluster may host API gateway services
- another cluster may host batch jobs

This helps control risk and separate workloads.

