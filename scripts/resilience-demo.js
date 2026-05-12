const cp = require("child_process");

function run(cmd, args) {
  return cp.execFileSync(cmd, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function tryRun(cmd, args) {
  try {
    return run(cmd, args);
  } catch (error) {
    return [
      error.stdout && error.stdout.toString().trim(),
      error.stderr && error.stderr.toString().trim(),
    ].filter(Boolean).join("\n");
  }
}

function getPods() {
  return run("kubectl", [
    "get",
    "pods",
    "-n",
    "tenant-a",
    "-l",
    "app.kubernetes.io/name=demo-api",
    "-o",
    "jsonpath={range .items[*]}{.metadata.name}{\"\\n\"}{end}",
  ]).split("\n").filter(Boolean);
}

function main() {
  console.log("== before ==");
  console.log(run("kubectl", ["get", "deployment", "demo-api", "-n", "tenant-a"]));
  console.log(run("kubectl", ["get", "pods", "-n", "tenant-a", "-l", "app.kubernetes.io/name=demo-api", "-o", "wide"]));

  const pods = getPods();
  if (pods.length === 0) {
    throw new Error("no demo-api pods found in tenant-a");
  }

  const victim = pods[0];
  console.log(`\n== kill one pod ==\npod=${victim}`);
  console.log(tryRun("kubectl", ["delete", "pod", victim, "-n", "tenant-a", "--wait=false"]));

  console.log("\n== immediately after delete ==");
  console.log(run("kubectl", ["get", "pods", "-n", "tenant-a", "-l", "app.kubernetes.io/name=demo-api", "-o", "wide"]));

  console.log("\n== wait for deployment recovery ==");
  console.log(run("kubectl", ["rollout", "status", "deployment/demo-api", "-n", "tenant-a", "--timeout=90s"]));

  console.log("\n== after ==");
  console.log(run("kubectl", ["get", "deployment", "demo-api", "-n", "tenant-a"]));
  console.log(run("kubectl", ["get", "pods", "-n", "tenant-a", "-l", "app.kubernetes.io/name=demo-api", "-o", "wide"]));

  console.log("\nwatch Grafana: request rate should continue, availability may dip if traffic was active during the kill, and Kubernetes restores replicas.");
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
