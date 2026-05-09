# Architecture

Local-only platform guardrails lab.

## Layers

1. k3d cluster
2. sample API service
3. namespace and RBAC guardrails
4. Kyverno policy enforcement
5. ingress for basic traffic flow
6. OpenTelemetry and Grafana as observability layer

## Local k3d Shape

The lab uses `k3d` to run Kubernetes locally inside Docker.

`make bootstrap` creates the cluster with:

```make
K3D_ARGS ?= --agents 1 --servers 1 --wait
```

That creates:

- `k3d-guardrails-lab-server-0`: k3s server node. This is the local control-plane/server container.
- `k3d-guardrails-lab-agent-0`: k3s agent node. This is the local worker container.
- `k3d-guardrails-lab-serverlb`: k3d load balancer container. k3d creates this as the local entrypoint in front of server nodes.

`serverlb` is a k3d-specific helper, not a normal Kubernetes node concept. k3d uses it to proxy exposed ports into the cluster. The k3d docs describe it as the load balancer container in front of cluster server nodes.

## GKE Equivalent

In Google Kubernetes Engine, the same mental model maps differently:

| Local k3d | GKE equivalent |
| --- | --- |
| `server-0` container | Google-managed Kubernetes control plane |
| `agent-0` container | Compute Engine VM in a node pool |
| `serverlb` container | Google Cloud Load Balancer, Ingress, or Gateway resources |
| Docker network | Google VPC networking |
| local image import | Artifact Registry or another image registry |

The app-facing Kubernetes concepts stay the same:

- `Deployment` runs pods.
- `Service` gives pods a stable in-cluster address.
- `Ingress` or Gateway exposes traffic outside the cluster.
- DNS names like `demo-api.tenant-a.svc.cluster.local` work inside the cluster.

What changes is ownership. In k3d, the control plane and worker nodes are local Docker containers. In GKE, Google manages the control plane, and worker nodes are cloud VMs in node pools.

## Teaching Intent

Show how a platform lets teams self-serve safely without skipping control.
