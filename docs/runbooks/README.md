# Runbooks

Platform Guardrails Lab is a local teaching environment for platform engineering. It shows how a team can move from service code to a safe Kubernetes deployment, then use guardrails, GitOps, telemetry, SLI/SLO dashboards, and rollback workflows to operate the app.

The demo uses two small apps:

- `Python Demo API`: Flask baseline app in `tenant-a`
- `Java app`: Java + SQLite telemetry app in `tenant-b`

The point is not to build a production platform. The point is to make the platform path visible: build an app, deploy it, block unsafe changes, create traffic, read Grafana, see SLO burn, and recover.

## Before You Continue

Set up these workstation tools first:

- Docker Desktop, or another Docker-compatible runtime, must be running.
- Homebrew should be available on macOS so the installer can add missing tools.
- `make` must be available from your terminal.
- A normal Git checkout of this repo must be available locally.

Then run:

```sh
make install
```

This checks or installs local command-line tools:

- `kubectl`: talks to Kubernetes
- `k3d`: creates a local Kubernetes cluster inside Docker
- `helm`: installs in-cluster add-ons
- `argocd`: talks to Argo CD after Argo CD is installed

After local tools are ready, run:

```sh
make demo-ready
```

This prepares the full local demo:

- creates the local `k3d` Kubernetes cluster
- builds and imports the Python and Java app images
- installs Kyverno policy guardrails
- installs Prometheus, Grafana, and the OpenTelemetry collector
- installs Argo CD and registers the lab applications
- deploys Python in `tenant-a` and Java in `tenant-b`
- validates the good and bad manifests

For the live browser guide, run:

```sh
make tools-up
```

This opens the local portal and keeps port-forwards alive for Grafana, Prometheus, Argo CD, and app views.

Start here:

1. ([dashboard-demo.md](dashboard-demo.md)) - terminal-plus-dashboard demo driver
2. ([core-lab.md](core-lab.md)) - short command flow and evidence checks
3. ([platform-as-a-service.md](platform-as-a-service.md)) - end-to-end paved-road story
4. ([platform-practices.md](platform-practices.md)) - API gateway and policy-shaped platform flow

API platform risk map: ([../api-platform-controls.md](../api-platform-controls.md))

SLI, SLO, p95 latency, error budget, burn rate definitions, and the low-stress noisy-neighbor demo path live in ([dashboard-demo.md](dashboard-demo.md)). Start there before showing Grafana panels.

Learning tracks for team mentoring live in ([../learning/README.md](../learning/README.md)).

These are written for live learning sessions. They also work as a personal rehearsal path when explaining the project.
