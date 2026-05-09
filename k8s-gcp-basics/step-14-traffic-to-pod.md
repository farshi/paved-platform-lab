# Step 14: How traffic reaches a Pod

## Simple path

```text
user
  -> Service
  -> Pod
  -> container
```

## What happens

1. User sends a request.
2. Service gets the request.
3. Service chooses a healthy Pod.
4. Pod runs the container and returns the response.

## Why this matters

Users do not talk to Pod IPs directly most of the time.
They talk to the Service.

## Example

For a login API:

- user calls `login-service`
- Service sends traffic to one healthy login Pod
- if that Pod dies, Service sends traffic to another Pod

## Easy words

- **Traffic**: request data moving through the system
- **Healthy Pod**: a Pod ready to take traffic

## Real-life example

If one payment Pod fails:

- Service stops sending it traffic
- traffic goes to the other payment Pods
- users may not notice the failure

