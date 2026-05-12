# Work Queue

Source: `backlog.md`, checked against current repo files on 2026-05-08.

## Rule

Keep one teaching spine:

1. Bootstrap local `k3d`.
2. Scaffold and deploy sample service.
3. Apply Kyverno guardrails.
4. Prove a bad manifest is blocked.
5. Break runtime and roll back.
6. Capture evidence.
7. Add observability and SLO examples after core path works.

## Current State

- Repo skeleton exists.
- Demo API exists.
- Service template exists.
- Tenant examples exist.
- Kyverno policies exist.
- Setup, policy, and rollback labs exist.
- Make targets exist for `bootstrap`, `reset`, `build`, `scaffold`, `install-kyverno`, `install-observability`, `validate`, `deploy`, `break`, `rollback`, and `observability`.
- Observability scaffold exists with collector, ServiceMonitors, PrometheusRule, Grafana dashboard, and SLO notes.
- Platform-as-a-service demo story exists in `docs/runbooks/platform-as-a-service.md`.
- Core local run was proved on 2026-05-09: bootstrap, build, Kyverno install, validate, deploy, blocked bad manifest, and rollback.
- Evidence output exists through `make evidence`.
- Gateway stays phase 2 unless ingress becomes insufficient.
- GCP stays out of MVP.

## Next Work

### Q0 - Platform-as-a-Service Demo Story

Goal: document the simple story a user can follow to learn self-service platform engineering.

- [x] Create one step-by-step platform demo doc.
- [x] Explain how a team goes from service code to safe deployment.
- [x] Show where guardrails protect the platform.
- [x] Show where telemetry proves user impact.
- [x] Define the tiny Java + SQLite + telemetry service.
- [x] Define the small watcher that detects fast SLO burn and triggers rollback.
- [x] Keep the path simple enough to explain in five minutes.

Done when: the repo has one readable story for a team learning the platform.

### Q1 - Prove Core Lab Runs

Goal: make the local demo runnable end to end.

- [x] Run `make install` if required tools are missing.
- [x] Run `make bootstrap`.
- [x] Run `make build`.
- [x] Run `make install-kyverno`.
- [x] Run `make validate`.
- [x] Run `make deploy`.
- [x] Run `make break`.
- [x] Run `make rollback`.
- [x] Fix any command drift between Makefile, manifests, and lab docs.

Done when: fresh local run completes bootstrap -> policy -> deploy -> blocked manifest -> rollback.

### Q2 - Evidence Output

Goal: make the demo easy to inspect and explain.

- [x] Add compact evidence output for demo runs.
- [x] Show policy blocks.
- [x] Show rollout events.
- [x] Show current deployment image and revision.
- [x] Add a short audit view for what changed and why.
- [x] Document one before/after rollback example.

Done when: one command or short command sequence produces operator-ready proof.

### Q3 - Lab Docs Tightening

Goal: each lab stays runnable in minutes.

- [x] Update `labs/01-setup` with exact expected commands and expected checks.
- [x] Update `labs/02-policy` with pass/fail policy examples.
- [x] Update `labs/03-rollback` with exact failure and recovery checks.
- [x] Keep copy short and operational.
- [x] Cross-link labs from `README.md`.

Done when: a reader can follow labs without knowing the repo internals.

### Q4 - Policy Coverage

Goal: guardrails match the self-service story.

- [x] Confirm required CPU and memory requests policy blocks bad manifests.
- [x] Confirm non-root policy blocks bad manifests.
- [x] Confirm approved registry policy blocks bad manifests.
- [x] Confirm resource limit expectations are covered.
- [x] Confirm namespace tenancy rules are covered or explicitly deferred.
- [x] Add pass/fail examples for every policy.

Done when: policy behavior is visible before deploy and in-cluster.

### Q5 - Observability Phase 2

Goal: show signals without bloating MVP.

- [x] Run `make install-observability`.
- [x] Run `make observability`.
- [x] Confirm app metrics scrape through ServiceMonitor.
- [x] Confirm request rate, latency, and error dashboard panels work.
- [x] Confirm one basic trace path or defer traces explicitly.
- [x] Add `make tools-up` local portal for Grafana, Prometheus, and demo API.
- [x] Keep the observability lab separate from core path.

Done when: user can explain where metrics/traces come from in five minutes.

### Q6 - SLO Examples Phase 2

Goal: show practical SLO thinking with minimal machinery.

- [x] Define one availability SLO.
- [x] Define one latency SLO.
- [x] Define one error-rate SLO.
- [x] Confirm burn-rate alert rule loads.
- [x] Confirm one dashboard panel shows SLI vs SLO.

Done when: SLO examples are concrete and demoable, not theoretical.

### Q7 - Learning Tracks

Goal: turn the platform lab into mentoring material for teams.

- [x] Connect `k8s-gcp-basics` lessons back to repo examples, commands, and manifests.
- [x] Create `ci-cd-basics` with step-based docs for CI, self-testing builds, pipeline-as-code, deploy vs release, rollback, and telemetry gates.
- [x] Create `platform-self-service` with paved-road, guardrail, tenant onboarding, variable governance, and adoption-check lessons.
- [x] Use `docs/learning-docs.md` as the style and quality guide.
- [x] Keep every lesson practical: concept -> example -> best practice -> lab link.

Done when: a team can use the docs to learn the platform path without platform-team hand-holding.

### Q8 - Tiny Java Telemetry Service

Goal: add one small realistic service for SLO and rollback lessons.

- [ ] Add a minimal Java service.
- [ ] Use SQLite for one simple stateful operation.
- [ ] Expose health, success, slow, and failing paths.
- [ ] Emit request count, latency, and error metrics.
- [ ] Keep OpenTelemetry wiring minimal.
- [ ] Add manifests that deploy the good version.
- [ ] Add one bad version that burns error or latency budget quickly.

Done when: the lab can create visible SLO burn from a tiny service.

### Q9 - Simple Rollback Watcher

Goal: show automated detection and rollback without building a big platform.

- [ ] Add a small watcher script.
- [ ] Watch app health, rollout state, and simple metrics.
- [ ] Print what is wrong in plain language.
- [ ] Trigger `kubectl rollout undo` when the demo service is unhealthy.
- [ ] Keep manual override obvious.

Done when: the watcher detects the broken deploy and rolls back cleanly.

### Q10 - Argo CD GitOps Loop

Goal: show the common delivery model with one implementation lane: Argo CD.

- [x] Install Argo CD locally.
- [x] Add an Argo CD Application for tenant overlays.
- [x] Add an Argo CD Application for observability manifests.
- [x] Show drift detection.
- [x] Show sync and rollback from Git.
- [x] Keep the docs clear that this is Argo CD, not GoCD.
- [x] Keep this as GitOps proof, not a full enterprise deployment system.

Done when: user can explain Git -> Argo CD -> Kubernetes -> policy -> telemetry in under five minutes.

### Q11 - Platform Practices Lens

Goal: make the lab directly relevant to an platform practices learning path.

- [x] Add policy-shaped service interface examples without pretending to run full gateway locally.
- [x] Add policy checks for JWT/OAuth, quota, spike arrest, and target standards.
- [x] Add a GitOps flow for API platform config.
- [x] Add docs mapping API platform risks to platform controls.
- [x] Keep official gateway local development and hybrid install boundaries clear.

Done when: the lab can explain how Kubernetes guardrails, GitOps, and observability map to self-service platform operations.

## Deferred

- Gateway layer.
- PatchPilot MVP decision.
