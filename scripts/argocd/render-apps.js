const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../..");
const apps = JSON.parse(fs.readFileSync(path.join(root, "argocd/apps.json"), "utf8"));
const repoUrl = process.env.ARGOCD_REPO_URL || "";
const targetRevision = process.env.ARGOCD_TARGET_REVISION || "main";

if (!repoUrl) {
  console.error("ARGOCD_REPO_URL is required.");
  console.error("Example: ARGOCD_REPO_URL=https://github.com/<owner>/<repo>.git make argocd-apps");
  process.exit(1);
}

function quote(value) {
  return JSON.stringify(value);
}

function renderApplication(app) {
  return `apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: ${app.name}
  namespace: argocd
  labels:
    app.kubernetes.io/part-of: platform-guardrails-lab
  annotations:
    platform-guardrails-lab/description: ${quote(app.description)}
spec:
  project: default
  source:
    repoURL: ${quote(repoUrl)}
    targetRevision: ${quote(targetRevision)}
    path: ${quote(app.path)}
  destination:
    server: https://kubernetes.default.svc
    namespace: ${quote(app.namespace)}
  syncPolicy:
    syncOptions:
      - CreateNamespace=true
`;
}

console.log(apps.map(renderApplication).join("---\n"));
