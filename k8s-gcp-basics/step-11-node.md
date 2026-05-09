# Step 11: Node

## What a Node is

A **node** is a machine that runs your Pods.

It can be:

- a physical machine, or
- a virtual machine

## Simple meaning

If the cluster is the city, the node is the house where Pods live.

## Example

In GKE:

- nodes run inside the cluster
- Pods are scheduled onto nodes
- if a node fails, Kubernetes can move Pods to another node

## Why it matters

Nodes provide CPU, memory, disk, and network for your app.

## Easy words

- **Node**: worker machine in Kubernetes
- **Worker**: machine that runs app Pods

## Small example flow

```text
cluster
  -> node selected
  -> Pod starts on node
  -> container runs there
```

## Real-life example

If a node runs out of memory:

- Pods on it may get restarted or moved
- Kubernetes tries to keep the desired number of Pods alive

