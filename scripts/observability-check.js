const cp = require("child_process");

const ROOT = "/Users/rfar/dev/platform-guardrails-lab";

function run(cmd, args, options = {}) {
  return cp.execFileSync(cmd, args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: options.timeout || 30000,
  }).trim();
}

function tryRun(cmd, args, options = {}) {
  try {
    return run(cmd, args, options);
  } catch (error) {
    return (error.stdout && error.stdout.toString().trim()) || "";
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  console.log("== observability pods ==");
  console.log(run("kubectl", ["get", "pods", "-n", "observability"]));

  console.log("\n== service monitors ==");
  console.log(run("kubectl", ["get", "servicemonitor", "-n", "observability"]));

  console.log("\n== rules and dashboard ==");
  console.log(run("kubectl", ["get", "prometheusrule", "demo-api-slo", "-n", "observability"]));
  console.log(run("kubectl", ["get", "configmap", "demo-api-dashboard", "-n", "observability"]));

  console.log("\n== generate demo traffic ==");
  const trafficPaths = ["/", "/healthz", "/slow?seconds=0.05", "/fail"];
  for (const path of trafficPaths) {
    tryRun("kubectl", [
      "get",
      "--raw",
      `/api/v1/namespaces/tenant-a/services/http:demo-api:80/proxy${path}`,
    ]);
    console.log(`called ${path}`);
  }

  console.log("\n== prometheus ==");
  console.log("waiting 10s for first scrape window...");
  await sleep(10000);
  for (const path of trafficPaths) {
    tryRun("kubectl", [
      "get",
      "--raw",
      `/api/v1/namespaces/tenant-a/services/http:demo-api:80/proxy${path}`,
    ]);
  }
  console.log("waiting 10s for second scrape window...");
  await sleep(10000);
  console.log("opening local Prometheus port-forward on 19093...");
  const portForward = cp.spawn(
    "kubectl",
    [
      "port-forward",
      "-n",
      "observability",
      "svc/kube-prometheus-stack-prometheus",
      "19093:9090",
    ],
    { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] },
  );

  try {
    await sleep(3000);
    const get = async (path) => {
      return fetchJson(`http://127.0.0.1:19093${path}`);
    };

    const targets = await get("/api/v1/targets?state=active");
    const demoTargets = (targets.data.activeTargets || []).filter((target) =>
      JSON.stringify(target).includes("demo-api"),
    );
    console.log(`demo_targets=${demoTargets.length}`);
    for (const target of demoTargets) {
      console.log(`target=${target.health} url=${target.scrapeUrl}`);
    }

    const queries = [
      ["request_rate", 'sum(rate(http_requests_total{service="demo-api"}[5m]))'],
      [
        "error_rate",
        'sum(rate(http_requests_total{service="demo-api",status=~"5.."}[5m]))',
      ],
      ["error_total", 'sum(http_requests_total{service="demo-api",status=~"5.."})'],
      [
        "latency_p95",
        'histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{service="demo-api"}[5m])) by (le))',
      ],
    ];

    for (const [name, query] of queries) {
      const result = await get(`/api/v1/query?query=${encodeURIComponent(query)}`);
      const value = result.data.result[0] && result.data.result[0].value
        ? result.data.result[0].value[1]
        : "no-data";
      console.log(`${name}=${value}`);
    }
  } finally {
    portForward.kill("SIGTERM");
  }

  console.log("\n== traces ==");
  const logs = tryRun("kubectl", [
    "logs",
    "deployment/otel-collector",
    "-n",
    "observability",
    "--tail=40",
  ]);
  const traceLines = logs
    .split(/\r?\n/)
    .filter((line) => /Traces|ResourceSpans|Span/i.test(line))
    .slice(-10);
  if (traceLines.length === 0) {
    console.log("trace_path=collector-ready-no-span-log");
  } else {
    console.log(traceLines.join("\n"));
  }
}

main().catch((error) => {
  console.error(`observability check failed: ${error.message}`);
  process.exit(1);
});
