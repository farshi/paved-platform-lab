# Paved Platform Lab Backlog

Local-only MVP. Use `k3d` as the playground and keep GCP out of the first cut.

## What Needs To Be Installed

Run `make install` before building or teaching the lab. It checks or installs:

- `docker` or `colima` with a running container runtime
- `kubectl`
- `k3d`
- `helm`
- `make`
- `git`

Recommended, but optional for faster validation:

- `kyverno` CLI
- `jq`
- `yq`

Installer scripts live under `installer/*.installer.sh`.

## Backlog

### 1. Repo Skeleton

- [x] Create `templates/service`
- [x] Create `policies/kyverno`
- [x] Create `examples/tenant-a`
- [x] Create `examples/tenant-b`
- [x] Create `labs/01-setup`
- [x] Create `labs/02-policy`
- [x] Create `labs/03-rollback`
- [x] Add top-level `README.md` summary for the demo story

### 2. Local Cluster Bootstrap

- [x] Add `k3d` bootstrap docs
- [x] Add `Makefile` target for cluster create
- [x] Add `Makefile` target for cluster delete/reset
- [x] Add namespace setup for lab tenants
- [x] Add baseline RBAC for each tenant namespace

### 3. Sample API Service

- [x] Create one small API app
- [x] Add deployment manifest for the app
- [x] Add service manifest for the app
- [x] Add ingress manifest for the app
- [x] Add a known-good image tag for the first deploy

### 4. Service Template

- [x] Create a service scaffold template
- [x] Add template variables for service name, namespace, image, and port
- [x] Add scaffold instructions for new teams
- [x] Add a generated example under `examples/tenant-a`

### 5. Kyverno Guardrails

- [x] Add policy for required CPU and memory requests
- [x] Add policy for non-root containers
- [x] Add policy for approved image registry
- [x] Add policy for resource limits
- [x] Add policy for namespace-scoped tenancy rules
- [x] Add policy test examples for pass and fail cases

### 6. Safe Self-Service

- [x] Add namespace creation workflow for a new team
- [x] Add RBAC example for a tenant admin role
- [x] Add resource quota or limit range example
- [x] Add one good manifest that passes all checks
- [x] Add one bad manifest that gets blocked before deploy

### 7. Deploy, Break, Roll Back

- [x] Add `Makefile` target for deploy
- [x] Add `Makefile` target for break
- [x] Add `Makefile` target for rollback
- [x] Demonstrate `kubectl rollout undo`
- [x] Capture a before/after rollout example in the lab docs

### 8. Labs

- [x] Write `labs/01-setup` for cluster bootstrap
- [x] Write `labs/02-policy` for policy enforcement
- [x] Write `labs/03-rollback` for runtime failure and recovery
- [x] Keep each lab runnable in minutes, not hours

### 9. Evidence And Audit

- [x] Add compact evidence output for demo runs
- [x] Add a summary of policy blocks and rollout events
- [x] Add a short audit view for what changed and why
- [ ] Decide if PatchPilot ships in MVP or stays phase 2

### 10. Observability

- [x] Add OpenTelemetry to the sample API
- [x] Add an OpenTelemetry Collector deployment for local export
- [x] Add Prometheus scraping for app and cluster metrics
- [x] Add Grafana dashboards for request rate, latency, and errors
- [x] Add a basic traces view for one request path
- [x] Add a short observability lab showing where signals come from

### 11. SLO Examples

- [x] Define one availability SLO for the sample API
- [x] Define one latency SLO for the sample API
- [x] Define one error-rate SLO for the sample API
- [x] Add one burn-rate alert example
- [x] Add one dashboard panel that shows SLI vs SLO
- [x] Keep SLO examples simple enough to explain in 5 minutes

### 12. Learning Tracks

- [x] Treat `k8s-gcp-basics` as the first mentoring track
- [x] Add `ci-cd-basics` as the next mentoring track
- [ ] Add a platform self-service track that explains paved roads, guardrails, and team autonomy
- [ ] Add a DevOps best-practices track that shows better build, test, deploy, rollback, and feedback loops
- [x] Keep every learning track step-based, plain-language, and tied to one runnable platform behavior
- [ ] Link learning tracks back to the local guardrails lab so teams can move from concept to practice

### 13. CI/CD Basics Track

- [ ] Explain Continuous Integration as daily mainline integration with an automated self-testing build
- [ ] Show why branch-only CI delays real integration risk
- [ ] Explain fast feedback as a team behavior control, not only a tool-speed metric
- [ ] Show the difference between deployment and release
- [ ] Add examples for feature toggles, rollback, blue-green, canary, and telemetry gates
- [ ] Add a simple pipeline path: lint -> unit test -> build image -> scan -> deploy -> smoke test -> rollback proof
- [ ] Keep examples small enough for teams to copy into their own services

### 14. Platform Mentoring System

- [x] Create a docs guide for how to write learning material in this repo
- [x] Capture reusable platform sentences from the project notes without turning docs into private notes
- [x] Teach self-service as an operating model, not a portal
- [x] Teach guardrails as the default path, not late gatekeeping
- [x] Teach variable governance: low-risk paths self-service, high-risk paths stronger controls
- [x] Add adoption checks: can a team use the guide without platform-team hand-holding?

### 15. Platform-as-a-Service Demo

- [x] Add one step-by-step doc that explains the self-service platform story
- [x] Show a team moving from service code to container image to Kubernetes deployment
- [x] Show guardrails blocking unsafe manifests before deploy
- [x] Show telemetry making runtime health visible
- [x] Show SLO burn from a deliberately bad version
- [ ] Show a simple watcher detecting the bad version and rolling back
- [x] Keep the full story simple enough to explain in a learning session

### 16. Tiny Java Telemetry Service

- [ ] Add a minimal Java service for the runtime demo
- [ ] Use SQLite for one simple persistent action
- [ ] Add health, success, slow, and failing endpoints
- [ ] Emit request count, latency, and error metrics
- [ ] Add minimal OpenTelemetry wiring
- [ ] Add a good deployment and one bad deployment
- [ ] Use the bad deployment to burn SLO budget quickly

### 17. Rollback Watcher

- [ ] Add a small watcher script after deploy
- [ ] Watch app health, rollout state, and simple metrics
- [ ] Print clear plain-language diagnosis
- [ ] Trigger `kubectl rollout undo` for the demo service when the burn is obvious
- [ ] Keep the watcher small enough for teams to read

## Suggested Build Order

1. Bootstrap the k3d cluster.
2. Scaffold the sample service.
3. Install Kyverno and apply guardrails.
4. Deploy the good version.
5. Push a bad manifest and confirm it is rejected.
6. Break runtime and roll back.
7. Add lab steps and evidence output.
8. Add observability and SLO examples after the core path works.
9. Add learning tracks after the runnable lab has enough proof to teach from.
10. Add CI/CD basics and platform mentoring docs as team-enablement material.
11. Add the tiny Java telemetry service and rollback watcher as the operator-grade runtime demo.

## Not In MVP

- GitOps on day 1
- Service mesh
- Canary controllers before the basics work
- More than one ingress/controller option
- Full SRE platform on day 1
