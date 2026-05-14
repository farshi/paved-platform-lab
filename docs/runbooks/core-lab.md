# Core Lab

Start here after the [User Guide](README.md) setup steps.

Already done:

- `make demo-ready` prepared the cluster, apps, policy, observability, and Argo CD
- `make tools-up` started the portal and port-forwards if you need browser views

Goal: prove the platform can deploy safely, reject unsafe config, recover from a bad runtime change, and print evidence.

## 1. Print Current Evidence

Run:

```sh
make evidence
```

Expected result:

- current deployment image and revision
- in-cluster app health check
- policy block from the bad manifest
- rollout history
- recent rollout events
- short audit note for what changed and why

State after this step: baseline is visible.

Next: create a safe failure.

## 2. Break Runtime Safely

Run:

```sh
make break
```

Expected result: the selected demo app becomes unhealthy or burns SLO budget. This is a controlled lab failure.

State after this step: the app has a bad runtime state.

Next: roll back.

## 3. Roll Back

Run:

```sh
make rollback
make evidence
```

Expected result: the selected deployment is available again and evidence shows recovery.

State after this step: known-good runtime is restored.

Next: check in-cluster service health.

## 4. Check App Health

Run:

```sh
make check-app
```

Expected result: a temporary curl pod calls `http://demo-api.tenant-a.svc.cluster.local/healthz` and returns the app health response.

Next runbook: [Dashboard Demo](dashboard-demo.md).
