# Step 10: RBAC

## What RBAC is

**RBAC** means **Role-Based Access Control**.

It decides what a user or service account can do in Kubernetes.

## Simple meaning

RBAC is the permission system inside the cluster.

## Example

You may let one team:

- read Pods
- create Deployments

But not:

- delete the cluster
- read other team secrets

## Why it matters

RBAC helps protect the cluster from wrong access.

## Easy words

- **Role**: a list of allowed actions
- **RoleBinding**: connects a role to a user or service account
- **Service account**: identity used by apps inside Kubernetes

## Small example flow

```text
user or app
  -> RBAC check
  -> allow or deny
```

## Real-life example

In GKE:

- developer A can see only namespace A
- developer B can see only namespace B
- app Pod can read only the secret it needs

That keeps access simple and safe.

