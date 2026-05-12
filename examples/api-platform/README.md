# API Platform Example

This example is policy-shaped, but it does not run gateway locally.

It models the config a platform team would govern:

- service interface identity: `orders-v1`
- auth policy: JWT and OAuth access token verification
- traffic policy: quota and spike arrest
- target standard: HTTPS backend only
- GitOps object: Kubernetes `ConfigMap` representing the approved API platform config

Use:

```sh
make validate-api-platform
```

This validates the proxy bundle shape without requiring an gateway organization.

GitOps flow:

```text
examples/api-platform
  -> Argo CD Application platform-guardrails-api-platform
  -> namespace/api-platform
  -> configmap/orders-v1-api-platform-config
```

Boundary:

```text
local lab: validates config shape and delivery controls
real gateway: deploys API proxies and enforces policies at runtime
```
