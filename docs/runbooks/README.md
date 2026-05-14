# User Guide

Platform Guardrails Lab is a local teaching environment for platform engineering. It shows one progressive path: prepare the lab, open the portal, prove the core platform controls, then map the same controls to API gateway, identity, and policy-shaped work.

This page is the only place that owns setup order. Other runbooks assume you already followed the steps here and only list commands needed for their specific demo.

## Golden Path

### 0. Check Workstation

You need:

- Docker Desktop, or another Docker-compatible runtime, already running
- Homebrew on macOS if local tools are missing
- `make`
- a normal local checkout of this repo

Run once:

```sh
make install
```

State after this step:

- `kubectl`, `k3d`, `helm`, and `argocd` are available or checked
- no local lab cluster is required yet

Next: prepare the full demo.

### 1. Prepare The Lab

Run:

```sh
make demo-ready
```

State after this step:

- local `guardrails-lab` k3d cluster exists
- Python app is deployed in `tenant-a`
- Java app is deployed in `tenant-b`
- Kyverno, observability, and Argo CD are installed
- API platform examples are registered for GitOps flow
- good and bad manifest checks have run

Next: open the browser guide and keep local ports alive.

### 2. Open The Portal

Run in a long-running terminal:

```sh
make tools-up
```

State after this step:

- portal runs at `http://localhost:18000`
- Grafana, Prometheus, Argo CD, and demo app port-forwards stay alive
- if `curl http://localhost:18000` fails, run `make tools-up` first

Keep this terminal open while using dashboard or portal-based steps.

Next: follow the runbooks below in order.

## Ordered Runbooks

1. [Core Lab](core-lab.md)
   Prove the basic platform path: deployed app, policy rejection, rollback, evidence.

2. [Dashboard Demo](dashboard-demo.md)
   Use the portal, traffic controls, Prometheus, and Grafana to show runtime health.

3. [Platform-as-a-Service Demo](platform-as-a-service.md)
   Explain the paved-road platform story from developer change to recovery.

4. [Platform Practices](platform-practices.md)
   Map the same platform controls to service interface governance and policy-shaped work.

5. [developer self-service platform](developer-self-service-platform.md)
   Show developer request flow, platform policy enforcement, and DevOps engineer mapping.

6. [API Platform Controls](../api-platform-controls.md)
   Use as the risk map when explaining why each API gateway control exists.

7. [Learning Tracks](../learning/README.md)
   Use for mentoring material after the demo path is clear.

## Recovery

Portal or local endpoints down:

```sh
make tools-up
```

Stale app image or missing new endpoint:

```sh
make build APP=demo-api TENANT=tenant-a
make deploy APP=demo-api TENANT=tenant-a
make tools-up
```

Stop running local instances but keep images:

```sh
make stop
```

Delete local lab resources but keep images:

```sh
make tear-down
```
