# Step 13: Control Plane vs Data Plane

## What they mean

- **Control plane**: decides what should happen
- **Data plane**: does the work and carries traffic

## Simple meaning

Control plane is the manager.  
Data plane is the worker path.

## Example

In Kubernetes:

- control plane decides which Pod should run
- data plane is where the Pod runs and where traffic flows

In GKE:

- Google manages the control plane
- your nodes and Pods are part of the data plane

## Why it matters

This helps you explain who makes decisions and where the app actually runs.

## Easy words

- **Control plane**: the decision maker
- **Data plane**: the traffic and app execution path

## Small example flow

```text
kubectl apply
  -> control plane decides
  -> node runs Pod
  -> data plane serves traffic
```

## Real-life example

If an API request comes in:

- the Service sends it to a Pod
- the Pod runs on a node
- that node is part of the data plane

The control plane does not serve the user request itself.

