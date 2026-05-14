# Java Telemetry API

Tiny Java service for SLO and rollback lessons.

Endpoints:

- `GET /healthz` - health check
- `GET /readyz` - readiness check
- `GET /success` - successful request path
- `GET /orders` - list recent SQLite-backed orders
- `POST /orders?item=demo` - create a SQLite-backed order
- `GET /slow?seconds=0.8` - intentional latency
- `GET /fail` - intentional 500
- `GET /metrics` - Prometheus metrics

Environment:

- `ERROR_RATE_PERCENT`: when above `0`, `/success` and `/orders` fail at that percentage.
- `DEFAULT_SLOW_SECONDS`: default delay for `/slow`.
- `OTEL_EXPORTER_OTLP_ENDPOINT`: OTLP HTTP trace endpoint. In-cluster default is set by the manifests.

Local build:

```sh
mvn -f services/java-telemetry-api/pom.xml package
```

Demo flow:

```sh
APP=java-telemetry-api TENANT=tenant-b make build
APP=java-telemetry-api TENANT=tenant-b make deploy
APP=java-telemetry-api TENANT=tenant-b make traffic
APP=java-telemetry-api TENANT=tenant-b make break
APP=java-telemetry-api TENANT=tenant-b make traffic
APP=java-telemetry-api TENANT=tenant-b make rollback-watch
```

Open Grafana and set `Service` to `java-telemetry-api` and `Tenant` to `tenant-b`. Good traffic should keep availability high. Bad traffic should create visible error-budget burn within the 30s demo window.

Use diagnose-only mode when you want to explain the watcher without changing the cluster:

```sh
ROLLBACK_WATCHER_MODE=diagnose APP=java-telemetry-api TENANT=tenant-b make rollback-watch
```
