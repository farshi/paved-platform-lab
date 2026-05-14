# developer self-service platform Walkthrough

Use this runbook to explain how the local lab maps to a platform engineering - developer self-service platform role.

Start after the [User Guide](README.md) golden path.

Already done:

- `make demo-ready` built and deployed the local apps
- `make tools-up` opened the portal and app port-forwards
- [Platform Practices](platform-practices.md) explained the broader platform operating model

This page only runs the identity/gateway proof commands.

## What developer self-service Means

identity is Customer Identity and Access Management. It handles customer signup, login, MFA, password reset, consent, profile, OAuth/OIDC tokens, and customer access rules.

gateway is the API gateway and API management layer. It sits in front of backend APIs and applies policy before traffic reaches services.

Together:

```text
customer logs in
-> identity issues OAuth/OIDC token
-> app calls API with bearer token
-> gateway validates token and platform policy
-> backend receives only governed traffic
-> platform team observes reliability, security, quota, and drift
```

## Local Demo Boundary

This repo does not run gateway hybrid locally.

The local lab proves the platform engineering shape:

- token-shaped identity flow
- protected customer API
- policy-shaped proxy config
- policy validation before deploy
- GitOps delivery for API platform config
- telemetry and rollback for backend runtime behavior

Real gateway remains the production runtime boundary.

## Files

| Area | File |
| --- | --- |
| customer API | `services/demo-api/app.py` |
| mock identity helper | `scripts/lib/mock-identity.js` |
| runnable demo | `scripts/developer-flow-demo.js` |
| optional issuer service | `services/mock-identity/server.js` |
| gateway proxy | `examples/api-platform/gateway-proxy/apiproxy` |
| policy validator | `scripts/validate-api-platform-examples.js` |
| risk map | `docs/api-platform-controls.md` |

## Golden Path

### 1. Validate Gateway Controls

Validate the policy-shaped controls:

```sh
make validate-self-service-platform
```

Expected result:

- JWT policy checks RS256, issuer, and audience
- OAuth access token policy exists
- customer and client claims are extracted
- customer context headers are assigned
- quota and spike arrest policies exist
- no secret-like values are stored in proxy policy files

State after this step: service interface governance is proven as code.

Next: run the local developer request flow.

### 2. Run Customer Token Flow

```sh
make developer-flow-demo
```

Expected result:

- a mock identity token is issued with issuer, audience, client id, customer id, scope, and expiry
- request without token is denied by the customer API
- request with token reaches `/customer/orders`

If the endpoint is down, go back to the User Guide recovery step and run `make tools-up`.

If the customer path is missing, rebuild and redeploy the Python app from the User Guide recovery section.

State after this step: the login-token-gateway-backend story is visible.

Next: use the talking points below for the demo practice mapping.

## What To Say In Demo

I would not force a full gateway hybrid runtime into a small local k3d demo. That would hide the important platform behavior behind install complexity.

Instead, I model the operational controls that matter for a developer self-service platform:

- service interface config is reviewed as code.
- identity tokens must match issuer, audience, client id, customer id, scope, and expiry expectations.
- Gateway policies enforce JWT/OAuth, quota, spike arrest, and target standards before backend traffic.
- Argo CD shows config drift and sync state.
- Prometheus and Grafana show backend health after gateway traffic reaches services.
- Rollback stays available when a backend release burns SLO budget.

That is the job shape: make customer-facing APIs safe, observable, repeatable, and recoverable.

## Platform Practices Mapped

| Practice area | Lab proof |
| --- | --- |
| identity/OIDC understanding | mock token with issuer, audience, customer id, client id, scope |
| API gateway governance | policy-shaped proxy policies under `examples/api-platform` |
| CI/CD quality gate | `make validate-self-service-platform` |
| GitOps delivery | API platform config represented under `examples/api-platform` and synced by Argo CD |
| platform observability | portal, Prometheus, Grafana, and app endpoints from User Guide setup |
| runtime reliability | traffic, SLO, rollback watcher, and recovery runbooks |
