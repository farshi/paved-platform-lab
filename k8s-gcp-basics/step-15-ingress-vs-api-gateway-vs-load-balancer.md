# Step 15: Ingress vs API Gateway vs Load Balancer

## What each one does

- **Load Balancer**: sends traffic into your system
- **Ingress**: routes web traffic to Services inside Kubernetes
- **API Gateway**: manages API traffic with more rules, auth, and control

## Simple meaning

They all help traffic reach the right place.
They are not the same thing.

## Example path

```text
web user
  -> Load Balancer
  -> Ingress or API Gateway
  -> Service
  -> Pod
```

## When to use each one

- **Load Balancer** when you want a public entry point
- **Ingress** when you want simple HTTP/HTTPS routing into Kubernetes
- **API Gateway** when you want more API rules like auth, quotas, versioning, and logging

## Easy words

- **Ingress**: traffic router for Kubernetes web apps
- **API Gateway**: smarter front door for APIs
- **Load Balancer**: traffic distributor at the edge

## Example 1: simple web app

You have a company site:

- user opens browser
- Load Balancer receives request
- Ingress sends `/login` to login Service
- Ingress sends `/pay` to payment Service

## Example 2: banking API

You have partner APIs:

- API Gateway checks token
- API Gateway applies quota
- API Gateway logs the request
- request then goes to the right Service in GKE

## Important demo note

Do not say `GKE has its own API gateway` for app traffic.
Say:

- Kubernetes has its own **API server** for cluster control
- your app traffic uses **Ingress**, **Gateway API**, **Load Balancer**, or a separate **API Gateway**

