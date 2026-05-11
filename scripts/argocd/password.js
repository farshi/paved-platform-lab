const cp = require("child_process");

try {
  const encoded = cp.execFileSync(
    "kubectl",
    ["get", "secret", "-n", "argocd", "argocd-initial-admin-secret", "-o", "jsonpath={.data.password}"],
    { encoding: "utf8" },
  );
  console.log(Buffer.from(encoded, "base64").toString("utf8"));
} catch (error) {
  console.error("Argo CD initial admin password not found.");
  console.error("Run: make install-argocd");
  process.exit(1);
}
