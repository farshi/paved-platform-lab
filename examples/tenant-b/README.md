# Tenant B

Second tenant example. Use this namespace to explain isolation and noisy-neighbor behavior.

In the main demo, Java telemetry can run here while Python `demo-api` stays in `tenant-a`. Tenant B can produce high error rate or high latency without changing tenant A's deployment.

## Includes

- namespace
- service account
- workload
- ingress
- policy-compliant manifest set

See `examples/README.md` for the purpose of each YAML file.
