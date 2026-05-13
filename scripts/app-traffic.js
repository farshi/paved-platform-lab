const cp = require("child_process");

const app = process.env.APP || "demo-api";
const namespace = process.env.APP_NAMESPACE || "tenant-a";
const service = process.env.APP_SERVICE || app;
const count = Number(process.env.APP_TRAFFIC_COUNT || 80);
const sleepMs = Number(process.env.APP_TRAFFIC_SLEEP_MS || 100);
const defaultPaths = service === "java-telemetry-api"
  ? "/success,/success,/orders,/slow?seconds=0.8"
  : "/,/slow?seconds=0.8";
const paths = (process.env.APP_TRAFFIC_PATHS || defaultPaths)
  .split(",")
  .map((path) => path.trim())
  .filter(Boolean);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function requestPath(path) {
  const proxyPath = `/api/v1/namespaces/${namespace}/services/http:${service}:80/proxy${path}`;
  const startedAt = Date.now();
  try {
    cp.execFileSync("kubectl", ["get", "--raw", proxyPath], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { path, status: 200, durationMs: Date.now() - startedAt };
  } catch (error) {
    const output = [error.stdout, error.stderr]
      .filter(Boolean)
      .map((value) => value.toString())
      .join("\n");
    const statusMatch = output.match(/\b(4\d\d|5\d\d)\b/);
    return {
      path,
      status: statusMatch ? Number(statusMatch[1]) : "error",
      durationMs: Date.now() - startedAt,
    };
  }
}

async function main() {
  const totals = new Map();
  console.log(`app traffic: app=${app} service=${service} namespace=${namespace} count=${count}`);
  for (let index = 0; index < count; index += 1) {
    const result = requestPath(paths[index % paths.length]);
    const key = String(result.status);
    totals.set(key, (totals.get(key) || 0) + 1);
    console.log(`${index + 1}/${count} ${result.path} status=${result.status} ${result.durationMs}ms`);
    await sleep(sleepMs);
  }
  console.log("\nsummary:");
  for (const [status, total] of [...totals.entries()].sort()) {
    console.log(`${status}: ${total}`);
  }
  console.log(`\nGrafana: select Service=${service} and Demo window=30s.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
