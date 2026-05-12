const cp = require("child_process");
const GREEN = "\x1b[32m";
const RESET = "\x1b[0m";

const namespace = process.env.NAMESPACE_A || "tenant-a";
const deployment = process.env.DEPLOYMENT || "demo-api";
const driftReplicas = process.env.DRIFT_REPLICAS || "1";
const argoNamespace = process.env.ARGOCD_NAMESPACE || "argocd";
const argoApp = process.env.ARGOCD_APP || "platform-guardrails-tenant-a";

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

if (!maybeRun(["get", "namespace", namespace, "-o", "name"])) {
  console.error(`namespace ${namespace} not found`);
  console.error("Run: make bootstrap && make deploy");
  process.exit(1);
}

if (!maybeRun(["get", "deployment", deployment, "-n", namespace, "-o", "name"])) {
  console.error(`deployment ${deployment} not found in namespace ${namespace}`);
  console.error("Run: make deploy");
  process.exit(1);
}

console.log("== create live drift ==");
console.log(`scaling deployment/${deployment} in ${namespace} to ${driftReplicas} replica`);
run(["scale", "deployment", deployment, "-n", namespace, `--replicas=${driftReplicas}`]);

console.log("");
console.log("== deployment ==");
console.log(run(["get", "deployment", deployment, "-n", namespace]));

console.log("");
console.log("== argo cd ==");
if (maybeRun(["get", "application", argoApp, "-n", argoNamespace, "-o", "name"])) {
  maybeRun(["annotate", "application", argoApp, "-n", argoNamespace, "argocd.argoproj.io/refresh=hard", "--overwrite"]);
  const sync = maybeRun(["get", "application", argoApp, "-n", argoNamespace, "-o", "jsonpath={.status.sync.status}"]);
  console.log(`${argoApp} sync=${sync || "refresh-requested"}`);
} else {
  console.log(`${argoApp} sync=unknown`);
  console.log("Run: make install-argocd && make argocd-apps");
}
console.log(`next: make argocd-sync, then kubectl get deployment ${deployment} -n ${namespace}`);
