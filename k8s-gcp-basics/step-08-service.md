# Step 8: Service

## What a Service is

A **Service** gives one stable way to reach a group of Pods.

Pods can change, but the Service name stays the same.

## Simple meaning

Service is like a stable phone number for Pods.

## Example

If a Deployment has 3 Pods:

- Pods come and go
- Service keeps sending traffic to the current healthy Pods

## Why it matters

Without a Service, users would need to know Pod IPs.
That would be bad because Pod IPs change.

## Easy words

- **Service**: stable access point to Pods
- **Pod IP**: Pod network address

## Small example flow

```text
user request
  -> Service
  -> one healthy Pod
  -> response
```

## Real-life example

For a login API:

- users call `login-service`
- the Service routes traffic to any healthy login Pod
- if one Pod dies, users keep using the Service name

