# API Platform Controls

This lab maps platform practices risks to small local controls.

It does not install gateway locally. It models the controls around an API management runtime.

## Risk Map

| API platform risk | Local lab control | Demo proof |
| --- | --- | --- |
| unauthenticated traffic reaches sensitive API | `Verify-JWT.xml` and `OAuthV2-Verify-Access-Token.xml` | `make validate-api-platform` |
| customer token has wrong issuer or audience | `Verify-JWT.xml` issuer and audience checks | `make validate-self-service-platform` |
| backend cannot identify governed customer context | `Extract-Customer-Claims.xml` and `Assign-identity-Headers.xml` | validator checks customer and client headers |
| one client consumes shared capacity | `Quota-Per-Client.xml` and `Spike-Arrest.xml` | validator checks quota and spike arrest exist |
| proxy routes to unsafe backend | `targets/default.xml` requires HTTPS target | validator checks target URL |
| config drift changes live behavior | `platform-guardrails-api-platform` Argo CD app | `make argocd` after push |
| platform change lacks review trail | config lives in Git under `examples/api-platform` | repo diff and Argo app source path |
| runtime behavior is invisible | Prometheus, Grafana, and traffic scenarios | `make tools-up` |

## Boundary

Local lab:

- stores policy-shaped proxy config
- validates required policy shape
- delivers the Kubernetes representation through Argo CD
- explains the operating model

Real gateway:

- deploys API proxies
- enforces API policies at runtime
- manages API products, developers, apps, analytics, and runtime routing
- requires the official gateway local-development, gateway X, gateway hybrid, or gateway Operator path depending on the use case

## Demo Commands

```sh
make validate-api-platform
make validate-self-service-platform
make developer-flow-demo
node scripts/argocd/render-apps.js
make argocd-apps
make argocd
```

Explain:

```text
API config is code.
Validation proves required platform controls exist.
Argo CD makes drift visible.
Telemetry proves runtime behavior.
gateway remains the real runtime boundary.
```
