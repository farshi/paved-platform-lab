# Step 5: etcd

## What etcd is

**etcd** is the data store for Kubernetes cluster state.

It stores things like:

- what Pods should exist
- which nodes are available
- which configs and settings are saved

## Simple meaning

etcd is like Kubernetes memory.

If Kubernetes wants to know the current cluster state, it looks in etcd.

## Example

If you create a Deployment with 3 Pods:

- Kubernetes stores that desired state in etcd
- controllers read it
- the cluster keeps trying to match it

## Why it matters

If etcd has problems, Kubernetes can lose track of cluster state.
That is why etcd is critical.

## Easy words

- **etcd**: Kubernetes state database
- **state**: what is running and what should be running

## Small example flow

```text
kubectl apply
  -> API server
  -> saves state in etcd
  -> controllers read state
  -> cluster acts on it
```

## Real-life example

If a Pod crashes:

- Kubernetes checks desired state in etcd
- sees the Pod should still exist
- creates a replacement Pod

