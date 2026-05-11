# Runbook

Use this repo as a live lab.

## Flow

1. bootstrap cluster
2. deploy sample service
3. apply policy
4. break a manifest
5. roll back runtime
6. review evidence

## Evidence

Run:

```sh
make evidence
```

The evidence output shows:

- current deployment image and revision
- in-cluster app health check
- policy block from the bad manifest
- rollout history
- recent rollout events
- short audit note for what changed and why

Before rollback example:

```sh
make break
```

Expected result: Kyverno rejects `examples/bad` because it uses an unapproved image, omits resource requests and limits, and does not run as non-root.

After rollback example:

```sh
make rollback
make evidence
```

Expected result: `deployment/demo-api` in `tenant-a` is rolled back and available.

App health check:

```sh
make check-app
```

Expected result: a temporary curl pod calls `http://demo-api.tenant-a.svc.cluster.local/healthz` and returns the app health response.
