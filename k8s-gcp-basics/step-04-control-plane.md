# Step 4: Control Plane

## What the Control Plane is

The **control plane** is the brain of Kubernetes.

It decides:

- which Pod should run
- where it should run
- when to restart it
- when to scale it

## Simple meaning

It does not run your app.  
It manages the cluster.

## Main parts

- **API server**: receives commands from `kubectl` and other tools
- **Scheduler**: picks a node for a Pod
- **Controller manager**: makes sure desired state stays true
- **etcd**: stores cluster data

## Example

If you ask for 3 Pods:

- the control plane checks current state
- scheduler picks nodes
- controllers keep it at 3 Pods

## Why it matters

If the control plane is healthy, the cluster stays organized.
If it has problems, Pods may not start or update correctly.

## Easy words

- **Control plane**: the manager of Kubernetes
- **Desired state**: what you want Kubernetes to keep running

## Small example flow

```text
kubectl apply
  -> API server
  -> scheduler
  -> node chosen
  -> Pod created
```

## Real-life example

In GKE:

- Google manages the control plane for you
- you usually do not log into it directly
- you use `kubectl` to talk to it

