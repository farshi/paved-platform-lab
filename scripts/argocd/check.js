const cp = require("child_process");
const GREEN = "\x1b[32m";
const RESET = "\x1b[0m";

function show(args) {
  const rendered = args.map((arg) => (/[\s"'{}]/.test(arg) ? JSON.stringify(arg) : arg)).join(" ");
  console.log(`${GREEN}$ kubectl ${rendered}${RESET}`);
}

function run(args) {
  try {
    show(args);
    return cp.execFileSync("kubectl", args, { encoding: "utf8" }).trim();
  } catch (error) {
    return "";
  }
}

const namespace = run(["get", "namespace", "argocd", "-o", "name"]);
if (!namespace) {
  console.log("argocd=not-installed");
  console.log("next=make install-argocd");
  process.exit(0);
}

const pods = run(["get", "pods", "-n", "argocd", "--no-headers"]);
const apps = run(["get", "applications.argoproj.io", "-n", "argocd", "--no-headers"]);

console.log("argocd=installed");
console.log("");
console.log("== pods ==");
console.log(pods || "none");
console.log("");
console.log("== applications ==");
console.log(apps || "none registered");
console.log("");
console.log("next=ARGOCD_REPO_URL=<repo-url> make argocd-apps");
