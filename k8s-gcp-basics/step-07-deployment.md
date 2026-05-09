# Step 7: Deployment

## What a Deployment is

A **Deployment** tells Kubernetes how to run and update Pods.

It defines things like:

- how many Pods you want
- which image to use
- how to replace old Pods with new ones

## Simple meaning

If Pod is the running unit, Deployment is the manager for Pods.

## Example

If you want 3 copies of your app:

- Deployment says `replicas: 3`
- Kubernetes creates 3 Pods
- if one dies, it makes another one

## Why it matters

Deployments help with:

- rollout of new versions
- rollback to old versions
- keeping desired number of Pods running

## Easy words

- **Deployment**: the controller that manages Pods
- **Replica**: one copy of the app
- **Rollback**: go back to the previous version

## Small example flow

```text
new image pushed
  -> Deployment updated
  -> old Pods stop slowly
  -> new Pods start
  -> service keeps running
```

## Real-life example

For a banking API:

- version 1 is running
- you update Deployment to version 2
- Kubernetes starts new Pods first
- if version 2 fails, you roll back to version 1

