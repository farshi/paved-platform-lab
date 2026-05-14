const cp = require("child_process");

const app = process.env.APP || "java-telemetry-api";
const namespace = process.env.APP_NAMESPACE || process.env.TENANT || "tenant-b";
const service = process.env.APP_SERVICE || app;
const deployment = process.env.APP_DEPLOYMENT || service;
const window = process.env.ROLLBACK_WATCHER_WINDOW || "30s";
const errorThreshold = Number(process.env.ROLLBACK_WATCHER_ERROR_PERCENT || 10);
const minRequestRate = Number(process.env.ROLLBACK_WATCHER_MIN_REQUEST_RATE || 0.05);
const mode = process.env.ROLLBACK_WATCHER_MODE || "rollback";

function run(args, options = {}) {
  try {
    return {
      ok: true,
      stdout: cp.execFileSync("kubectl", args, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        timeout: options.timeout || 10000,
      }).trim(),
    };
  } catch (error) {
    const stderr = [error.stdout, error.stderr]
      .filter(Boolean)
      .map((value) => value.toString().trim())
      .filter(Boolean)
      .join("\n");
    return { ok: false, stdout: "", error: stderr || error.message };
  }
}

function parseJson(result, fallback) {
  if (!result.ok || !result.stdout) return fallback;
  try {
    return JSON.parse(result.stdout);
  } catch (_error) {
    return fallback;
  }
}

function serviceStatus(path) {
  const proxyPath = `/api/v1/namespaces/${namespace}/services/http:${service}:80/proxy${path}`;
  const result = run(["get", "--raw", proxyPath], { timeout: 7000 });
  if (result.ok) return { status: 200 };
  const statusMatch = (result.error || "").match(/\b(4\d\d|5\d\d)\b/);
  return {
    status: statusMatch ? Number(statusMatch[1]) : "error",
    error: result.error,
  };
}

function deploymentState() {
  const result = run(["get", "deployment", deployment, "-n", namespace, "-o", "json"]);
  const deploymentJson = parseJson(result, null);
  if (!deploymentJson) {
    return {
      found: false,
      reason: result.error || "deployment not found",
    };
  }
  const spec = deploymentJson.spec || {};
  const status = deploymentJson.status || {};
  const desired = spec.replicas || 0;
  const ready = status.readyReplicas || 0;
  const available = status.availableReplicas || 0;
  const updated = status.updatedReplicas || 0;
  return {
    found: true,
    desired,
    ready,
    available,
    updated,
    healthy: desired > 0 && ready >= desired && available >= desired && updated >= desired,
  };
}

function prometheusQuery(query) {
  const proxyPath = `/api/v1/namespaces/observability/services/http:kube-prometheus-stack-prometheus:9090/proxy/api/v1/query?query=${encodeURIComponent(query)}`;
  const result = run(["get", "--raw", proxyPath], { timeout: 10000 });
  const body = parseJson(result, null);
  if (!body || body.status !== "success") return null;
  const first = body.data && body.data.result && body.data.result[0];
  const rawValue = first && first.value && first.value[1];
  const value = Number(rawValue);
  return Number.isFinite(value) ? value : null;
}

function metricState() {
  const labels = `service="${service}",tenant="${namespace}"`;
  const totalRate = prometheusQuery(`sum(rate(http_requests_total{${labels}}[${window}]))`);
  const errorPercent = prometheusQuery(`100 * sum(rate(http_requests_total{${labels},status=~"5.."}[${window}])) / sum(rate(http_requests_total{${labels}}[${window}]))`);
  return { totalRate, errorPercent };
}

function printDiagnosis(health, rollout, metrics, reasons) {
  console.log(`watching app=${app} service=${service} namespace=${namespace} deployment=${deployment}`);
  console.log(`mode=${mode} window=${window} error-threshold=${errorThreshold}% min-request-rate=${minRequestRate}/s`);
  console.log("");
  console.log("health:");
  console.log(`  /healthz status=${health.status}${health.error ? ` error=${health.error}` : ""}`);
  console.log("");
  console.log("rollout:");
  if (!rollout.found) {
    console.log(`  missing: ${rollout.reason}`);
  } else {
    console.log(`  desired=${rollout.desired} ready=${rollout.ready} available=${rollout.available} updated=${rollout.updated}`);
  }
  console.log("");
  console.log("metrics:");
  console.log(`  request-rate=${metrics.totalRate === null ? "not enough data" : `${metrics.totalRate.toFixed(3)}/s`}`);
  console.log(`  error-percent=${metrics.errorPercent === null ? "not enough data" : `${metrics.errorPercent.toFixed(1)}%`}`);
  console.log("");
  if (reasons.length === 0) {
    console.log("diagnosis: app looks healthy enough. No rollback.");
    return;
  }
  console.log("diagnosis: rollback needed");
  for (const reason of reasons) console.log(`  - ${reason}`);
}

function rollback() {
  console.log("");
  if (mode === "diagnose") {
    console.log("manual override: ROLLBACK_WATCHER_MODE=diagnose, so rollback skipped.");
    return true;
  }
  console.log("action: kubectl rollout undo");
  const undo = run(["rollout", "undo", `deployment/${deployment}`, "-n", namespace], { timeout: 30000 });
  if (!undo.ok) {
    console.error(undo.error);
    return false;
  }
  if (undo.stdout) console.log(undo.stdout);
  const status = run(["rollout", "status", `deployment/${deployment}`, "-n", namespace, "--timeout=120s"], { timeout: 130000 });
  if (!status.ok) {
    console.error(status.error);
    return false;
  }
  if (status.stdout) console.log(status.stdout);
  console.log("rollback complete");
  return true;
}

function main() {
  const health = serviceStatus("/healthz");
  const rollout = deploymentState();
  const metrics = metricState();
  const reasons = [];

  if (health.status !== 200) reasons.push(`/healthz returned ${health.status}`);
  if (!rollout.found) reasons.push("deployment missing");
  if (rollout.found && !rollout.healthy) {
    reasons.push(`deployment not fully available: desired=${rollout.desired}, ready=${rollout.ready}, available=${rollout.available}`);
  }
  if (
    metrics.totalRate !== null &&
    metrics.totalRate >= minRequestRate &&
    metrics.errorPercent !== null &&
    metrics.errorPercent >= errorThreshold
  ) {
    reasons.push(`5xx error percentage ${metrics.errorPercent.toFixed(1)}% is above ${errorThreshold}%`);
  }

  printDiagnosis(health, rollout, metrics, reasons);
  if (reasons.length === 0) return;
  if (!rollback()) process.exit(1);
}

main();
