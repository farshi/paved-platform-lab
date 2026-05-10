# Developer Self-Service Platform Runbook

Use this as the 30-minute demo story for a platform engineering, developer self-service platform conversation.

## Positioning

Start simple:

> This lab is a local version of the operating model I would bring to an API platform team. It shows how teams can deploy safely through a paved road: GitOps, Kubernetes, policy guardrails, observability, SLOs, and rollback. For a developer self-service platform, I would apply the same pattern to self-service delivery, identity-sensitive APIs, platform policy, quota control, and production evidence.

The lab is not trying to be gateway. It is showing the platform engineering controls around systems like gateway.

## 30-Minute Flow

### 0-3 minutes: Introduce the problem

Explain:

- identity APIs are high-impact because login, token, profile, consent, and session flows affect every customer journey.
- gateway is the API management and gateway layer where teams expose, secure, meter, and operate APIs.
- A DevOps engineer should make the safe path repeatable, not rely on manual approvals and tribal knowledge.

Say:

> My focus is the path from code to production evidence. A team should know how to deploy, what guardrails apply, what SLOs matter, and how rollback works before an incident happens.

### 3-7 minutes: Show the simple platform shape

Run or describe:

```sh
make bootstrap
make build
make install-kyverno
make deploy
```

Explain the layers:

```text
developer change
  -> Git
  -> Argo CD syncs desired state
  -> Kubernetes runs workload
  -> Kyverno enforces guardrails
  -> Prometheus/Grafana prove runtime behavior
  -> rollback restores known-good state
```

Tie to gateway:

```text
service interface change
  -> Git
  -> Argo CD syncs proxy/platform config
  -> gateway or gateway runtime applies policy
  -> telemetry shows traffic, latency, errors, quota, auth failures
  -> rollback restores previous proxy/config version
```

### 7-12 minutes: Show guardrails before runtime

Run:

```sh
make validate-policies
```

Explain:

- approved image registry protects supply chain
- required resources prevent noisy-neighbor risk
- non-root containers reduce runtime blast radius
- namespace scope keeps tenants bounded

gateway version of the same idea:

- proxy bundles must pass lint and policy checks
- JWT/OAuth policy must be present on protected APIs
- quota/spike arrest must exist for public or customer-facing APIs
- target endpoints and TLS settings must follow standards
- secrets must not live in proxy source

Say:

> The key is shifting safety left. If a proxy or deployment is obviously unsafe, it should fail before it reaches a shared runtime.

### 12-18 minutes: Show observability and noisy neighbors

Run:

```sh
make install-observability
make observability
make tools-up
```

Open:

```text
http://localhost:18000
```

Show:

- Grafana dashboard
- Prometheus queries
- Traffic Lab scenarios
- PromQL DSL accordion

Explain:

- request rate tells load
- error rate tells customer pain
- p95 latency tells user experience
- namespace and pod labels identify noisy neighbors
- quota and resource limits prevent one tenant from hurting others

Strong demo path:

1. Open Traffic Lab.
2. Run normal traffic.
3. Show request rate rising.
4. Run 500 error burst.
5. Show error rate rising.
6. Run slow request burst.
7. Show p95 latency rising.
8. Use Prometheus DSL samples to identify namespace-level impact.

Tie to identity:

- login API latency hurts conversion
- token API errors can block all customer access
- one partner or client app can become a noisy neighbor
- rate limits, quotas, and dashboards are business controls, not only infrastructure metrics

### 18-23 minutes: Add Argo CD to the story

Argo CD is the GitOps control loop.

Explain:

```text
Git is desired state
Argo CD compares Git to cluster state
Argo CD syncs approved changes
drift becomes visible
rollback is a Git or Argo CD operation
```

In this lab, Argo CD should manage:

- tenant overlays in `examples/tenant-a` and `examples/tenant-b`
- Kyverno policies in `policies/kyverno`
- observability manifests in `observability`
- future policy-shaped gateway/proxy config

What to say:

> I would not give every team cluster-admin access. Teams change repo-owned manifests. Argo CD applies them. Kyverno validates them. Prometheus and Grafana prove the result.

### 23-27 minutes: Explain gateway realism

Can we install gateway here?

Short answer:

> Not as a normal tiny k3d add-on.

Practical answer:

- gateway local development exists through Cloud Code and the gateway Emulator for local proxy testing.
- gateway hybrid is a real Kubernetes runtime plane, but it needs a supported Kubernetes platform and cloud/project setup. It is not a lightweight standalone component for this local lab.
- The gateway Operator for Kubernetes is not standalone; it is designed to work with gateway runtime.

What this repo can safely model:

- GitOps delivery of API platform config
- policy-as-code
- quota and noisy-neighbor thinking
- observability and SLOs
- rollback and drift detection
- identity API operational risk

What to add next for gateway relevance:

```text
api-platform/
  proxies/
    login-proxy/
    token-proxy/
  policies/
    require-jwt.yaml
    require-quota.yaml
    require-cors.yaml
  argocd/
    application.yaml
```

This would be policy-shaped without pretending to run full gateway locally.

### 27-30 minutes: Close with leadership angle

Say:

> The technical goal is not only Kubernetes or gateway. The goal is predictable delivery for identity-critical APIs. I would lead by making the desired path clear: GitOps for change control, policy for safety, observability for evidence, and practiced rollback for recovery.

Then ask:

> For your developer self-service platform, where is the biggest pain today: release governance, runtime reliability, policy consistency, noisy-neighbor traffic, or operational visibility?

## Hard Questions and Strong Answers

### Why not just let teams deploy manually?

Manual deployment does not scale across identity-critical APIs. GitOps creates reviewable desired state, Argo CD handles drift and sync, policy blocks unsafe changes, and observability proves runtime impact.

### How does this relate to gateway?

gateway is the API management layer. This lab shows the platform operating model around it: controlled config delivery, policy enforcement, SLO monitoring, and rollback. The same approach applies to API proxies, products, quota, auth policy, target routing, and developer onboarding.

### What is the noisy-neighbor risk in identity?

One client app, partner, tenant, or bad release can consume capacity, increase token latency, or spike auth failures. The platform needs rate limits, quota, per-client telemetry, and clear ownership labels.

### What would you monitor first?

For identity APIs:

- request rate by client, proxy, and environment
- 4xx and 5xx error rate
- auth failure reason
- p95 and p99 latency
- quota/spike arrest events
- target backend latency
- deployment version and rollback history

### Where does Argo CD help?

Argo CD makes platform state visible. It shows what Git says should run, what is actually running, what is out of sync, and what changed. That matters for audit, rollback, and production confidence.

### What would you not put in this local lab?

I would not force a full gateway hybrid install into a tiny k3d demo. It would distract from the demo story and create brittle setup. I would add policy-shaped config, policy checks, and GitOps flow locally, then explain how the same pattern maps to real gateway X or gateway hybrid.

## References

- gateway local development with Cloud Code and gateway Emulator: https://cloud.google.com/gateway/docs/api-platform/local-development/overview
- gateway hybrid overview: https://cloud.google.com/gateway/docs/hybrid/latest/what-is-hybrid
- gateway Operator for Kubernetes overview: https://cloud.google.com/gateway/docs/api-platform/gateway-kubernetes/gateway-apim-operator-overview
- gateway hybrid supported platforms: https://cloud.google.com/gateway/docs/hybrid/supported-platforms
