const cp = require("child_process");

function run(args) {
  try {
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
