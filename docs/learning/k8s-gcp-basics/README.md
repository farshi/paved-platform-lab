# K8s And GCP Basics

Goal: help a team connect Kubernetes vocabulary to the repo they can run locally.

Lessons:

1. [Namespaces, deployments, pods, and services](step-01-workload-basics.md)
2. [Manifests, policies, and CRDs](step-02-manifests-policies-crds.md)
3. [GitOps, observability, and cloud mapping](step-03-gitops-observability-cloud.md)

Run before starting:

```sh
make install
make bootstrap
make build
make install-addons
make deploy
```

Lab links:

- [../../questions/kubernetes-argocd-basics.md](../../questions/kubernetes-argocd-basics.md)
- [../../runbooks/core-lab.md](../../runbooks/core-lab.md)
- [../../../examples/tenant-a/kustomization.yaml](../../../examples/tenant-a/kustomization.yaml)
- [../../../services/demo-api/manifests/base/deployment.yaml](../../../services/demo-api/manifests/base/deployment.yaml)
