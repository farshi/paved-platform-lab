# Macquarie Open Source Showcase Plan

Prepared: May 6, 2026

## Recommendation

Yes. Build one small public repo that mirrors the role.

Do not build a random DevOps demo.

Build a repo that proves these exact things:

1. shared platform thinking
2. gateway and tenant controls
3. CI/CD guardrails
4. Kubernetes operations
5. regulated-environment judgment

## Best project to build

Repo name idea:

`platform-guardrails-lab`

One-line pitch:

`A multi-tenant API platform demo showing platform policy, Kubernetes guardrails, progressive delivery, and audit-friendly CI/CD.`

This is a better signal for Macquarie than another generic Terraform module or another AI helper.

## Why this project fits the role

The public Macquarie BFS DevOps role centers on:

- API gateways
- automation of consumer onboarding and migration
- guardrails
- governance
- self-service
- Kubernetes

This repo can show all of that in a public, non-proprietary way.

## MVP scope

Keep it small. One polished repo beats three half-finished repos.

### Core stack

1. Kubernetes on `kind` or `k3d` for local demo.
2. Gloo Gateway if you want maximum role fit.
3. `Envoy Gateway` or `Kong` if you want lower setup risk.
4. Kyverno or OPA Gatekeeper for policy enforcement.
5. Helm or plain YAML for deployment packaging.
6. GitHub Actions for CI.
7. Prometheus + Grafana for metrics.

### Functional demo

Build two fake tenants:

- `tenant-a`
- `tenant-b`

Each tenant gets:

- its own namespace
- its own service account
- its own rate limit
- its own secret boundary

Then enforce:

1. required CPU and memory requests
2. non-root containers
3. approved image registry
4. per-tenant rate limiting
5. per-tenant access control

Then show:

1. one good deployment that passes
2. one bad deployment that fails policy
3. one noisy-neighbor simulation that gets throttled
4. one canary rollout with automatic rollback trigger

## What the README should prove in 60 seconds

The README must answer:

1. What problem does this solve?
2. Why do regulated teams care?
3. How do I run the demo?
4. What policies are enforced?
5. What observability do I get?
6. What breaks when a team violates rules?

If a hiring manager cannot understand the repo in one minute, the repo is too big.

## Demo flow for a learning session

Use this exact story:

1. Shared platform serves many teams.
2. Platform team wants speed without manual tickets.
3. Golden path handles normal delivery automatically.
4. Guardrails block unsafe configs early.
5. Rate limits and isolation protect tenants.
6. Observability shows customer impact and rollback state.

That story maps almost directly to the role.

## Suggested repo structure

```text
platform-guardrails-lab/
  README.md
  Makefile
  docs/
    architecture.md
    runbook.md
    decisions.md
  gateway/
  policies/
  tenants/
    tenant-a/
    tenant-b/
  services/
    demo-api/
  .github/workflows/
```

## CI pipeline steps

Keep the pipeline concrete:

1. YAML lint / schema validate.
2. Helm lint if using Helm.
3. Policy check.
4. Image vulnerability scan.
5. Deploy to ephemeral local cluster in CI if feasible.
6. Smoke test gateway routes.

Nice extra:

7. Generate a small audit evidence artifact summarizing what policies passed.

That last item is a strong regulated-platform signal.

## What to avoid

1. Do not build a giant platform.
2. Do not build a toy hello-world with no policy or incident story.
3. Do not spend all time on UI.
4. Do not claim production readiness for a lab repo.
5. Do not hide complexity in a long video instead of a readable README.

## Fastest version if you only have 2 to 3 days

Use:

1. `kind`
2. `Kong` or `Envoy Gateway`
3. `Kyverno`
4. `GitHub Actions`
5. one small Go or Python API

Ship these three demo cases only:

1. valid deploy passes
2. invalid manifest blocked by policy
3. tenant rate limit works

That is enough to discuss intelligently.

## Stronger version if you have 1 to 2 weeks

Add:

1. Gloo Gateway
2. canary rollout
3. Grafana dashboards
4. synthetic checks
5. generated compliance evidence
6. onboarding template for new tenant or service

## What you already have that supports this

You already have credibility in:

- cloud security controls
- regulated delivery
- CI/CD
- open-source publishing

So the gap to close is not "can Reza do DevSecOps."

The gap to close is:

`Can Reza show a modern shared platform story with gateway + Kubernetes + guardrails in one public artifact?`

This repo answers that.

## Best talking point when showing the repo

Use this line:

`I built this to show how I think about platform engineering in a regulated environment: make the safe path the fast path, make policy visible early, and keep rollback cheap.`

## If you want the highest signal project

Build this one repo first.

After that, only add a second repo if it is a direct extension, such as:

`audit-evidence-exporter`

That second repo could take deployment and policy results and emit a compact audit report. Good signal, but secondary.

## Bottom line

Yes, open source can help you here.

But only if it is tightly aligned to the actual job.

`platform-guardrails-lab` is the best fit.
