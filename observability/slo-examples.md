# SLO Examples

Use these SLOs to explain reliability with the demo API metrics already scraped by Prometheus.

The lab keeps the window short enough for a live demo. In a real service, use the same SLI shape over a 30-day window.

## Availability

- User promise: the API should return non-5xx responses for normal traffic.
- SLI: successful requests / total requests.
- Demo SLO: 99 percent over the demo window.
- 30-day SLO shape: 99.9 percent.
- Error budget: 1 percent in the demo, 0.1 percent over 30 days.
- PromQL:

```promql
100 * (
  sum(rate(http_requests_total{service="demo-api",status!~"5.."}[5m]))
  /
  sum(rate(http_requests_total{service="demo-api"}[5m]))
)
```

## Latency

- User promise: most successful requests should feel fast.
- SLI: requests completed under the dashboard latency threshold / total requests.
- Demo SLO: 95 percent under 500ms by default.
- 30-day SLO shape: 95 percent under a service-owned latency threshold.
- Related dashboard panel: `Latency P95` shows the 95th percentile request time. If p95 is 500ms, 95 percent of requests were 500ms or faster.
- Demo threshold note: the dashboard default is 500ms because `0.5` is a default Python Prometheus histogram bucket. Use dashboard variables to try `0.25`, `0.5`, `0.75`, or `1`.
- PromQL:

```promql
100 * (
  sum(rate(http_request_duration_seconds_bucket{service="demo-api",le="0.5"}[1m]))
  /
  sum(rate(http_request_duration_seconds_count{service="demo-api"}[1m]))
)
```

## Error Rate

- User promise: server-side failures should stay rare.
- SLI: 5xx responses / total requests.
- Demo SLO: below 1 percent 5xx.
- 30-day SLO shape: below 0.1 percent 5xx.
- PromQL:

```promql
100 * (
  sum(rate(http_requests_total{service="demo-api",status=~"5.."}[5m]))
  /
  sum(rate(http_requests_total{service="demo-api"}[5m]))
)
```

## Burn Rate

- Alert rule: `DemoApiFastBurnErrorBudget`.
- Dashboard demo budget: 5 percent errors, so 2x burn means more than 10 percent 5xx in the live demo window.
- Real-service shape: use a smaller budget, such as 1 percent or 0.1 percent, over longer windows such as 5m/1h and 30 days.
- Demo traffic: use Traffic Lab's "500 error burst" or call `/fail` repeatedly.
- Expected signal: Grafana shows Error Budget Burn above 2 and Prometheus loads the alert rule from `observability/prometheus-rule.yaml`.

## Dashboard Proof

- `Availability SLI vs SLO`: compares the current availability percentage to the dashboard SLO variable.
- `Latency SLI vs SLO`: compares requests under the dashboard latency threshold to the dashboard SLO variable.
- `Error Budget Burn`: shows live burn rate against the dashboard burn threshold.
