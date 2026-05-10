# Tools

This lab uses small command-line tools to create a local platform, deploy a sample service, apply guardrails, and prove rollback.

Run:

```sh
make install
```

That runs the scripts in `installer/`.

## Required Tools

### Homebrew

Homebrew installs the other command-line tools on macOS.

- Used by: `make install`
- Installer: `installer/brew.installer.sh`
- Check: `brew --version`

### Docker

Docker builds and runs container images. The demo API becomes a container image before Kubernetes can run it.

- Used by: `make build`
- Installer: `installer/docker.installer.sh`
- Check: `docker info`

### Colima

Colima is a lightweight local container runtime for macOS. Use it when Docker Desktop is not running.

- Used by: Docker runtime support
- Installer: `installer/docker.installer.sh`
- Check: `colima status`

### kubectl

`kubectl` talks to Kubernetes. It creates namespaces, applies manifests, checks resources, and runs rollback commands.

- Used by: `make bootstrap`, `make validate`, `make deploy`, `make break`, `make rollback`
- Installer: `installer/kubectl.installer.sh`
- Check: `kubectl version --client`

`kubectl apply -k <path>` uses Kustomize. The `kustomization.yaml` file in that path is not a Kubernetes workload; it is the build instruction file that assembles Kubernetes YAML before apply.

Daily command guide: `docs/kubectl-daily-commands.md`.

### k3d

`k3d` runs a small Kubernetes cluster inside Docker. It gives the lab a local cluster without cloud cost.

- Used by: `make bootstrap`, `make reset`, `make build`
- Installer: `installer/k3d.installer.sh`
- Check: `k3d version`

This lab uses one k3s server container, one k3s agent container, and k3d's `serverlb` load balancer container. `serverlb` is created by k3d as a local entrypoint/proxy in front of the server node; it is not a pod or a Kubernetes workload.

### Helm

Helm installs packaged Kubernetes software. This lab uses it to install Kyverno and the observability stack.

- Used by: `make install-kyverno`, `make install-observability`
- Installer: `installer/helm.installer.sh`
- Check: `helm version`

### Node.js

Node.js runs the small local helper scripts. The lab uses dependency-free Node scripts so learners do not need an npm project or frontend build step.

- Used by: `make observability`, `make tools-up`
- Installer: `installer/node.installer.sh`
- Check: `node --version`

### make

`make` gives the lab short repeatable commands. Teams run `make bootstrap` instead of memorizing long command sequences.

- Used by: every lab command
- Installed by: macOS developer tools
- Check: `make --version`

### git

Git tracks changes. It lets teams review platform docs, policies, manifests, and installer changes before sharing them.

- Used by: repo workflow
- Installed by: macOS developer tools or Homebrew
- Check: `git --version`

## Validation Tools

### Kyverno CLI

Kyverno is the policy engine. The CLI can test policies locally before they run inside the cluster.

- Used by: policy validation and future policy tests
- Installer: `installer/kyverno.installer.sh`
- Check: `kyverno version`

Why Kyverno: policies are Kubernetes-style YAML, can audit/enforce multi-tenant guardrails, and can support supply-chain checks such as image signature verification.

### jq

`jq` reads and filters JSON. Use it when Kubernetes commands return JSON and docs need compact evidence.

- Used by: future evidence output
- Installer: `installer/jq.installer.sh`
- Check: `jq --version`

### yq

`yq` reads and edits YAML. Kubernetes manifests are YAML, so `yq` helps inspect and validate them.

- Used by: future manifest checks and evidence output
- Installer: `installer/yq.installer.sh`
- Check: `yq --version`

## How They Fit Together

```text
make
  -> installer scripts
  -> k3d creates local Kubernetes
  -> docker builds demo API image
  -> kubectl applies manifests
  -> helm installs platform add-ons
  -> Kyverno blocks unsafe workloads
  -> node runs local learning helpers
  -> jq/yq help produce clear evidence
```

Simple platform lesson: tools are not the platform. The platform is the repeatable path they create for teams.
