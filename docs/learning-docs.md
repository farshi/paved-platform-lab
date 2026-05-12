# Learning Docs Guide

Purpose: turn this lab into a mentoring platform for teams learning Kubernetes, GCP basics, CI/CD, DevOps practice, and self-service platform patterns.

## Audience

- Product teams that need to ship services through a safer platform path.
- Engineers who know some cloud terms but need the operating model.
- Platform engineers who need reusable teaching material, not one-off explanations.

## Writing Shape

Use this structure for each learning track:

1. Concept.
2. Simple meaning.
3. Why teams should care.
4. Small runnable example.
5. What can go wrong.
6. Platform guardrail or best practice.
7. Checkpoint question.
8. Link back to the lab command, manifest, policy, or dashboard.

Keep each step short. One idea per file. One practical behavior per lesson.

## Current Tracks

### `k8s-gcp-basics`

Use as the foundation track. It teaches the path from code to container image, pod, cluster, control plane, registry, deployment, service, ingress, RBAC, nodes, scheduler, and traffic flow.

Track files: [learning/k8s-gcp-basics/README.md](learning/k8s-gcp-basics/README.md)

### `ci-cd-basics`

Track files: [learning/ci-cd-basics/README.md](learning/ci-cd-basics/README.md)

It teaches:

- Continuous Integration as mainline integration plus automated self-testing build.
- Why delayed integration creates delayed risk.
- Fast feedback as a behavior design problem.
- Versioned pipeline definitions.
- Build, test, image, scan, deploy, smoke test, rollback.
- Difference between deployment and release.
- Feature toggles, blue-green, canary, and telemetry gates.
- Flaky tests as reliability bugs in the delivery system.

### Platform Self-Service

Track files: [learning/platform-self-service/README.md](learning/platform-self-service/README.md)

It teaches:

- Paved roads: teams move quickly because the safe path is the easy path.
- Guardrails: policy and automation run before mistakes reach production.
- Self-service: an end-to-end operating model, not only a portal.
- Variable governance: low-risk paths stay self-service; high-risk paths get stronger controls.
- Adoption: docs are good only if teams can use them without platform-team hand-holding.

## Reusable Phrasing

Use these as internal phrasing anchors. Adapt them to the lesson; do not overquote them.

- CI is not the CI server. It is the discipline of frequent shared integration verified by an automated self-testing build.
- Integration pain compounds. Cadence is the cheapest risk control.
- Fast feedback protects developer behavior; slow feedback teaches batching.
- Deployment is technical; release is business.
- A deployment without practiced rollback is a production guess.
- Observability closes the loop from deploy to user impact.
- Guardrails should be the default path, not last-minute gatekeeping.
- Self-service is an operating model, not a portal.
- Security controls should be built into delivery paths, not bolted on at release time.

## Quality Bar

- Every doc must teach one concept clearly.
- Every doc must include one concrete example.
- Every doc must explain the platform best practice behind the example.
- Every doc must link to a command, manifest, policy, dashboard, or runbook when possible.
- No abstract DevOps slogans without runnable proof.
- No cloud expansion until the local path explains the concept.

## Suggested File Layout

```text
learning/
  README.md
  k8s-gcp-basics/
    README.md
    step-01-workload-basics.md
    step-02-manifests-policies-crds.md
    step-03-gitops-observability-cloud.md
  ci-cd-basics/
    README.md
    step-01-ci-self-testing-build.md
    step-02-pipeline-as-code-deploy-release.md
    step-03-rollback-telemetry-gates.md
  platform-self-service/
    README.md
    step-01-paved-road.md
    step-02-guardrails.md
    step-03-tenant-onboarding.md
    step-04-variable-governance.md
    step-05-adoption-checks.md
```
