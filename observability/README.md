# Observability

OpenTelemetry, Grafana, and SLO examples for the lab.

## Phase 2 Scope

- OpenTelemetry instrumentation in the sample API
- OpenTelemetry Collector in the cluster
- Prometheus metrics scraping
- Grafana dashboards
- basic traces
- simple SLOs and burn-rate examples

## Teaching Point

Observability should explain what happened and whether the platform stayed within guardrails. It should not turn the lab into an SRE product.

## Install

Use `make install-observability` after `make bootstrap`.

## What `make install-observability` Runs

`make install-observability` runs four commands.

### 1. Add the Helm chart repo

```sh
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
```

This teaches Helm where to find the `kube-prometheus-stack` chart.

### 2. Refresh local chart metadata

```sh
helm repo update
```

This downloads the latest chart index from configured Helm repositories.

### 3. Install or upgrade kube-prometheus-stack

```sh
helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  -n observability \
  --create-namespace \
  -f observability/kube-prometheus-stack-values.yaml \
  --wait
```

This installs the main observability platform pieces:

- Prometheus Operator
- Prometheus
- Grafana
- kube-state-metrics
- node exporter
- default Kubernetes dashboards, rules, and scrape config

Flags:

- `upgrade --install`: create it if missing, update it if already installed
- `-n observability`: put it in the `observability` namespace
- `--create-namespace`: create namespace if needed
- `-f observability/kube-prometheus-stack-values.yaml`: use this repo's Helm values
- `--wait`: wait until Helm-managed resources are ready

### 4. Apply this repo's observability manifests

```sh
kubectl apply -k observability
```

This applies `observability/kustomization.yaml`, which includes:

- `namespace.yaml`: namespace definition
- `otel-collector.yaml`: OpenTelemetry Collector config, Service, and Deployment
- `prometheus-rule.yaml`: demo API SLO alert rule
- `grafana-dashboard-demo-api.yaml`: Grafana dashboard ConfigMap
- `service-monitor-demo-api-a.yaml`: Prometheus scrape config for tenant A
- `service-monitor-demo-api-b.yaml`: Prometheus scrape config for tenant B

## Mental Model

Helm installs the shared observability platform. Kustomize applies this lab's app-specific observability config.

```text
make install-observability
  -> helm installs Prometheus/Grafana/operator
  -> kubectl apply -k observability adds demo API scraping, dashboard, SLO rule, and OTel collector
```

## Inspect

Run:

```sh
make observability
```

The check prints:

- observability pods
- demo API ServiceMonitors
- SLO rule and Grafana dashboard ConfigMap
- Prometheus scrape target health
- request rate, error rate, and latency p95 query values
- OpenTelemetry collector trace log signal when available

Metrics come from the demo API `/metrics` endpoint. Traces are sent from the Flask OpenTelemetry instrumentation to the in-cluster OpenTelemetry Collector at `otel-collector.observability.svc.cluster.local:4318`.

## PromQL Samples

PromQL is the query language for Prometheus. In this project, PromQL is the small DSL used to turn raw `/metrics` text into useful answers for Grafana panels, alerts, and troubleshooting.

Where to type it:

- Prometheus: open `http://localhost:9090`, paste the query into the expression box, then run it.
- Grafana: open `http://localhost:3000`, edit a panel, and put the query in the Prometheus query field.

The demo API exports metrics such as `http_requests_total` and `http_request_duration_seconds_bucket`.

The sample query source of truth is `observability/promql-samples.json`. It stores each sample's title, description, and query text.

To use the samples in the UI:

```sh
make tools-up
```

Then open `http://localhost:18000`, click the Prometheus card, open a PromQL DSL row, and copy the query.

## Local Tool Portal

Run:

```sh
make tools-up
```

This starts local port-forwards and a small portal page:

- portal: `http://localhost:18000`
- Grafana: `http://localhost:3000`
- Prometheus: `http://localhost:9090`
- demo API: `http://localhost:8080`

The portal has cards for Grafana, Prometheus, Traffic Lab, User Guide, the demo API, metrics, and health. Cards load the selected tool in an iframe and also include an "Open new tab" link. When the Prometheus card is selected, the portal shows a PromQL DSL accordion with copy buttons for common queries.

Traffic Lab lets learners trigger demo scenarios:

- normal traffic
- 500 error burst
- slow request burst
- mixed incident

These actions call the port-forwarded demo API and help show why DevOps engineers watch request rate, error rate, and latency together. Scenario source of truth: `observability/traffic-scenarios.json`.

User Guide renders Markdown from:

- `docs/runbooks/README.md`
- `docs/runbooks/dashboard-demo.md`
- `docs/runbooks/core-lab.md`
- `docs/runbooks/platform-as-a-service.md`
- `docs/runbooks/platform-practices.md`
- `docs/questions/kubernetes-argocd-basics.md`
- `docs/questions/platform-operator.md`

The guide has Start, Back, Next, and Done controls. Done state is stored in browser local storage.

`make tools-up` runs:

```sh
node scripts/observability/tool-portal.js
```

That script starts these `kubectl port-forward` processes:

```sh
kubectl -n observability port-forward svc/kube-prometheus-stack-grafana 3000:80
kubectl -n observability port-forward svc/kube-prometheus-stack-prometheus 9090:9090
kubectl -n tenant-a port-forward svc/demo-api 8080:80
```

Then it serves the portal page on `127.0.0.1:18000`.

Grafana login:

- username: `admin`
- password: `admin`

Stop the portal and port-forwards with `Ctrl-C`.
