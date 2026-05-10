const http = require("http");
const cp = require("child_process");

const ROOT = "/Users/rfar/dev/platform-guardrails-lab";
const PORT = Number(process.env.PORTAL_PORT || 18000);

const forwards = [
  {
    name: "Grafana",
    local: 3000,
    args: ["port-forward", "-n", "observability", "svc/kube-prometheus-stack-grafana", "3000:80"],
    url: "http://localhost:3000",
  },
  {
    name: "Prometheus",
    local: 9090,
    args: ["port-forward", "-n", "observability", "svc/kube-prometheus-stack-prometheus", "9090:9090"],
    url: "http://localhost:9090",
  },
  {
    name: "Demo API",
    local: 8080,
    args: ["port-forward", "-n", "tenant-a", "svc/demo-api", "8080:80"],
    url: "http://localhost:8080",
  },
];

const children = [];

function startForward(forward) {
  const child = cp.spawn("kubectl", forward.args, {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", (chunk) => {
    process.stdout.write(`[${forward.name}] ${chunk}`);
  });
  child.stderr.on("data", (chunk) => {
    process.stderr.write(`[${forward.name}] ${chunk}`);
  });
  children.push(child);
}

function stop() {
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
  process.exit(0);
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);

const page = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Platform Guardrails Lab Tools</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f5f7fb;
        --panel: #ffffff;
        --text: #17202a;
        --muted: #5c6670;
        --line: #d7dde5;
        --accent: #1f6feb;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: var(--bg);
        color: var(--text);
      }
      header {
        padding: 18px 22px;
        border-bottom: 1px solid var(--line);
        background: var(--panel);
      }
      h1 {
        margin: 0;
        font-size: 20px;
        font-weight: 700;
      }
      .sub {
        margin-top: 4px;
        color: var(--muted);
        font-size: 13px;
      }
      main {
        display: grid;
        grid-template-columns: 300px minmax(0, 1fr);
        min-height: calc(100vh - 76px);
      }
      nav {
        border-right: 1px solid var(--line);
        background: var(--panel);
        padding: 14px;
      }
      button, a.card {
        width: 100%;
        display: block;
        text-align: left;
        padding: 12px;
        margin-bottom: 10px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #fff;
        color: var(--text);
        text-decoration: none;
        cursor: pointer;
      }
      button:hover, a.card:hover {
        border-color: var(--accent);
      }
      .title {
        font-size: 14px;
        font-weight: 700;
      }
      .desc {
        margin-top: 4px;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.35;
      }
      .viewer {
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        min-width: 0;
      }
      .toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 10px 14px;
        border-bottom: 1px solid var(--line);
        background: #fbfcfe;
      }
      .url {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--muted);
        font-size: 13px;
      }
      .open {
        flex: none;
        color: var(--accent);
        font-size: 13px;
        text-decoration: none;
        font-weight: 700;
      }
      iframe {
        width: 100%;
        height: 100%;
        border: 0;
        background: white;
      }
      @media (max-width: 860px) {
        main { grid-template-columns: 1fr; }
        nav { border-right: 0; border-bottom: 1px solid var(--line); }
        .viewer { min-height: 70vh; }
      }
    </style>
  </head>
  <body>
    <header>
      <h1>Platform Guardrails Lab Tools</h1>
      <div class="sub">Port-forwards stay alive while this process runs. Stop with Ctrl-C.</div>
    </header>
    <main>
      <nav id="cards"></nav>
      <section class="viewer">
        <div class="toolbar">
          <div class="url" id="activeUrl"></div>
          <a class="open" id="openLink" target="_blank" rel="noreferrer">Open new tab</a>
        </div>
        <iframe id="frame" title="tool view"></iframe>
      </section>
    </main>
    <script>
      const tools = [
        {
          name: "Grafana",
          description: "Dashboards for request rate, errors, and latency.",
          url: "http://localhost:3000/d/demo-api/demo-api?orgId=1&refresh=10s"
        },
        {
          name: "Prometheus",
          description: "PromQL query UI for raw metrics.",
          url: "http://localhost:9090/graph"
        },
        {
          name: "Demo API",
          description: "Application root endpoint through Service port-forward.",
          url: "http://localhost:8080/"
        },
        {
          name: "Demo API metrics",
          description: "Raw Prometheus text exposed by the app.",
          url: "http://localhost:8080/metrics"
        },
        {
          name: "Demo API health",
          description: "Health endpoint used by checks.",
          url: "http://localhost:8080/healthz"
        }
      ];

      const cards = document.getElementById("cards");
      const frame = document.getElementById("frame");
      const activeUrl = document.getElementById("activeUrl");
      const openLink = document.getElementById("openLink");

      function select(tool) {
        frame.src = tool.url;
        activeUrl.textContent = tool.url;
        openLink.href = tool.url;
      }

      for (const tool of tools) {
        const button = document.createElement("button");
        button.innerHTML = '<div class="title">' + tool.name + '</div><div class="desc">' + tool.description + '</div>';
        button.addEventListener("click", () => select(tool));
        cards.appendChild(button);
      }

      select(tools[0]);
    </script>
  </body>
</html>`;

for (const forward of forwards) startForward(forward);

const server = http.createServer((request, response) => {
  if (request.url === "/" || request.url === "/index.html") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(page);
    return;
  }
  response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
  response.end("not found\n");
});

server.on("error", (error) => {
  console.error(`portal failed: ${error.message}`);
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
  process.exit(1);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("");
  console.log(`portal: http://localhost:${PORT}`);
  console.log("tools:");
  for (const forward of forwards) console.log(`- ${forward.name}: ${forward.url}`);
  console.log("");
  console.log("Grafana login: admin / admin");
  console.log("Stop with Ctrl-C.");
});
