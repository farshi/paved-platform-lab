const cp = require("child_process");
const GREEN = "\x1b[32m";
const RESET = "\x1b[0m";

const attempts = Number(process.env.ARGOCD_PASSWORD_ATTEMPTS || 30);
const delayMs = Number(process.env.ARGOCD_PASSWORD_DELAY_MS || 2000);

function show(args) {
  const rendered = args.map((arg) => (/[\s"'{}]/.test(arg) ? JSON.stringify(arg) : arg)).join(" ");
  console.log(`${GREEN}$ kubectl ${rendered}${RESET}`);
}

function run(args) {
  try {
    show(args);
    return cp.execFileSync("kubectl", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch (error) {
    return "";
  }
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

if (!run(["get", "namespace", "argocd", "-o", "name"])) {
  console.error("Argo CD namespace not found.");
  console.error("Run: make install-argocd");
  process.exit(1);
}

for (let attempt = 1; attempt <= attempts; attempt += 1) {
  const encoded = run(["get", "secret", "-n", "argocd", "argocd-initial-admin-secret", "-o", "jsonpath={.data.password}"]);
  if (encoded) {
    console.log(Buffer.from(encoded, "base64").toString("utf8"));
    process.exit(0);
  }
  if (attempt < attempts) sleep(delayMs);
}

console.error("Argo CD initial admin password not found yet.");
console.error("Check: kubectl get pods -n argocd");
console.error("Then retry: make argocd-password");
process.exit(1);
