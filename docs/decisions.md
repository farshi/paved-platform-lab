# Decisions

Track the big calls here.

## Current Decisions

- k3d for local demo
- Kyverno for guardrails
- OpenTelemetry plus Grafana for observability
- SLO examples stay simple
- GCP stays phase 2
- Argo CD is the GitOps implementation lane for this lab.

## Delivery Tool Decision

Use one common delivery model:

```text
Git change
  -> review
  -> desired state in repo
  -> controller applies or reports drift
  -> policy validates
  -> telemetry proves runtime behavior
  -> rollback restores known-good state
```

For this Kubernetes-focused lab, implement that model with Argo CD.

Why Argo CD:

- Kubernetes-native GitOps controller.
- Fits the existing Kustomize overlays.
- Shows drift detection, sync, and app health without replacing the current manifests.
- Stronger fit for cloud-native platform demos and the developer self-service platform story.
- CNCF reports Argo CD as a majority-adopted GitOps solution for Kubernetes, and Argo is a CNCF graduated project.

Clarification:

- Argo CD and GoCD are different tools.
- This lab is about Argo CD.
- GoCD is not part of the planned demo path.

Decision: keep the demo language broad enough to discuss CI/CD and release governance, but build the hands-on GitOps proof with Argo CD.
