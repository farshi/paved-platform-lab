const cp = require("child_process");
const GREEN = "\x1b[32m";
const RESET = "\x1b[0m";

const namespace = process.env.ARGOCD_NAMESPACE || "argocd";
const app = process.env.ARGOCD_APP || "platform-guardrails-tenant-a";
const workloadNamespace = process.env.NAMESPACE_A || "tenant-a";
const deployment = process.env.DEPLOYMENT || "demo-api";
const attempts = Number(process.env.ARGOCD_SYNC_ATTEMPTS || 30);
const delayMs = Number(process.env.ARGOCD_SYNC_DELAY_MS || 2000);

function show(args) {
  const rendered = args.map((arg) => (/[\s"'{}]/.test(arg) ? JSON.stringify(arg) : arg)).join(" ");
  console.log(`${GREEN}$ kubectl ${rendered}${RESET}`);
}

function run(args) {
  try {
    show(args);
    return cp.execFileSync("kubectl", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch (error) {
    const stderr = error.stderr ? String(error.stderr).trim() : error.message;
    throw new Error(stderr);
  }
}

function maybeRun(args) {
  try {
    return run(args);
  } catch (error) {
    return "";
  }
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function appValue(jsonPath) {
  return maybeRun(["get", "application", app, "-n", namespace, "-o", `jsonpath=${jsonPath}`]);
}

if (!maybeRun(["get", "namespace", namespace, "-o", "name"])) {
  console.error(`namespace ${namespace} not found`);
  console.error("Run: make install-argocd");
  process.exit(1);
}

if (!maybeRun(["get", "application", app, "-n", namespace, "-o", "name"])) {
  console.error(`application ${app} not found in namespace ${namespace}`);
  console.error("Run: make argocd-apps");
  process.exit(1);
}

console.log("== request argo cd sync ==");
console.log(`application/${app}`);
run(["patch", "application", app, "-n", namespace, "--type", "merge", "-p", "{\"operation\":{\"sync\":{}}}"]);

for (let attempt = 1; attempt <= attempts; attempt += 1) {
  const phase = appValue("{.status.operationState.phase}") || "Pending";
  const sync = appValue("{.status.sync.status}") || "Unknown";
  const health = appValue("{.status.health.status}") || "Unknown";
  console.log(`attempt=${attempt} phase=${phase} sync=${sync} health=${health}`);

  if (phase === "Succeeded" && sync === "Synced") {
    console.log("");
    console.log("== rollout ==");
    console.log(run(["rollout", "status", `deployment/${deployment}`, "-n", workloadNamespace, "--timeout=60s"]));
    console.log("");
    console.log("== deployment ==");
    console.log(maybeRun(["get", "deployment", deployment, "-n", workloadNamespace]) || "deployment not found");
    process.exit(0);
  }

  if (phase === "Failed" || phase === "Error") {
    console.error(`Argo CD sync ${phase.toLowerCase()}`);
    console.error("Check: make argocd");
    process.exit(1);
  }

  if (attempt < attempts) sleep(delayMs);
}

console.error("Argo CD sync did not finish before timeout.");
console.error("Check: make argocd");
process.exit(1);
