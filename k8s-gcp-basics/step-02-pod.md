# Step 2: Pod

## What a Pod is

A **Pod** is the smallest unit Kubernetes runs.

It usually has:

- one container, or
- a few containers that must stay together

## Simple meaning

A Pod is like a small box around one app process.

Kubernetes does not run a raw container by itself most of the time.
It runs the container inside a Pod.

## Example

If your app needs:

- one web container
- one sidecar container for logs

both can live in the same Pod.

## Why Pod matters

- Pods get an IP address
- Pods can be moved by Kubernetes
- Pods can die and be recreated

So a Pod is not permanent. The app is treated as replaceable.

## Easy words

- **Pod**: the thing Kubernetes starts and manages.
- **Container**: the app process inside the Pod.

## Small example flow

```text
GKE cluster
  -> creates Pod
  -> Pod starts container
  -> Pod gets IP
  -> Service can send traffic to Pod
```

## Real-life example

In a customer-facing API:

- one Pod may run the payment service
- another Pod may run the auth service

If one Pod dies, Kubernetes can start a new one.

