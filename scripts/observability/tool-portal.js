const http = require("http");
const cp = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const PORT = Number(process.env.PORTAL_PORT || 18000);
const promqlSamples = JSON.parse(fs.readFileSync(path.join(ROOT, "observability/promql-samples.json"), "utf8"));
const trafficScenarios = JSON.parse(fs.readFileSync(path.join(ROOT, "observability/traffic-scenarios.json"), "utf8"));
const guideFiles = [
  {
    title: "Start Here",
    path: "docs/runbooks/README.md",
    description: "Choose the right guided session.",
  },
  {
    title: "Core Lab",
    path: "docs/runbooks/core-lab.md",
    description: "Run the main platform guardrails path.",
  },
  {
    title: "Platform-as-a-Service",
    path: "docs/runbooks/platform-as-a-service.md",
    description: "Follow the paved-road platform story.",
  },
  {
    title: "Platform Practices",
    path: "docs/runbooks/platform-practices.md",
    description: "Map the platform model to API gateway and policy-shaped work.",
  },
  {
    title: "Operator Questions",
    path: "docs/questions/platform-operator.md",
    description: "Review hard platform tradeoff questions and answers.",
  },
].map((item) => ({
  ...item,
  markdown: fs.readFileSync(path.join(ROOT, item.path), "utf8"),
}));

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

function callDemoApi(requestPath) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const clientRequest = http.request(
      {
        hostname: "127.0.0.1",
        port: 8080,
        path: requestPath,
        method: "GET",
        timeout: 5000,
      },
      (clientResponse) => {
        clientResponse.resume();
        clientResponse.on("end", () => {
          resolve({
            path: requestPath,
            status: clientResponse.statusCode,
            durationMs: Date.now() - startedAt,
          });
        });
      },
    );
    clientRequest.on("timeout", () => {
      clientRequest.destroy(new Error("timeout"));
    });
    clientRequest.on("error", (error) => {
      resolve({
        path: requestPath,
        error: error.message,
        durationMs: Date.now() - startedAt,
      });
    });
    clientRequest.end();
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function inlineMarkdown(value) {
  let output = escapeHtml(value);
  output = output.replace(/`([^`]+)`/g, "<code>$1</code>");
  output = output.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  output = output.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, href) => {
    if (href.endsWith(".md")) {
      return `<a href="#guide-${escapeHtml(href)}" data-guide-path="${escapeHtml(href)}">${label}</a>`;
    }
    return `<a href="${href}" target="_blank" rel="noreferrer">${label}</a>`;
  });
  return output;
}

function renderMarkdown(markdown) {
  const lines = markdown.split(/\r?\n/);
  const html = [];
  let inCode = false;
  let code = [];
  let inList = false;
  let listTag = "";

  function closeList() {
    if (!inList) return;
    html.push(`</${listTag}>`);
    inList = false;
    listTag = "";
  }

  function closeCode() {
    if (!inCode) return;
    html.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
    inCode = false;
    code = [];
  }

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCode) closeCode();
      else {
        closeList();
        inCode = true;
        code = [];
      }
      continue;
    }
    if (inCode) {
      code.push(line);
      continue;
    }
    if (!line.trim()) {
      closeList();
      continue;
    }
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      closeList();
      const level = Math.min(heading[1].length, 4);
      html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }
    const quote = line.match(/^>\s+(.+)$/);
    if (quote) {
      closeList();
      html.push(`<blockquote>${inlineMarkdown(quote[1])}</blockquote>`);
      continue;
    }
    const item = line.match(/^-\s+(.+)$/);
    if (item) {
      if (!inList || listTag !== "ul") {
        closeList();
        html.push("<ul>");
        inList = true;
        listTag = "ul";
      }
      html.push(`<li>${inlineMarkdown(item[1])}</li>`);
      continue;
    }
    const orderedItem = line.match(/^\d+\.\s+(.+)$/);
    if (orderedItem) {
      if (!inList || listTag !== "ol") {
        closeList();
        html.push("<ol>");
        inList = true;
        listTag = "ol";
      }
      html.push(`<li>${inlineMarkdown(orderedItem[1])}</li>`);
      continue;
    }
    closeList();
    html.push(`<p>${inlineMarkdown(line)}</p>`);
  }
  closeCode();
  closeList();
  return html.join("\n");
}

const renderedGuidePages = guideFiles.map((item) => ({
  title: item.title,
  path: item.path,
  description: item.description,
  html: renderMarkdown(item.markdown),
}));

async function runTrafficScenario(scenario) {
  const results = [];
  for (const step of scenario.steps) {
    const count = step.count || 1;
    for (let i = 0; i < count; i += 1) {
      results.push(await callDemoApi(step.path));
      if (step.delayMs) await sleep(step.delayMs);
    }
  }
  const ok = results.filter((result) => result.status && result.status < 500).length;
  const errors = results.filter((result) => result.status && result.status >= 500).length;
  const failed = results.filter((result) => result.error).length;
  const maxDurationMs = results.reduce((max, result) => Math.max(max, result.durationMs || 0), 0);
  return {
    scenario: scenario.title,
    requested: results.length,
    ok,
    errors,
    failed,
    maxDurationMs,
    results: results.slice(-12),
  };
}

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
      nav button, a.card {
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
      nav button:hover, nav button.active, a.card:hover {
        border-color: var(--accent);
      }
      nav button.active {
        background: #eef5ff;
      }
      .workspace {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 360px;
        min-width: 0;
      }
      .workspace.compact {
        grid-template-columns: minmax(0, 1fr);
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
      .promql {
        border-left: 1px solid var(--line);
        background: var(--panel);
        padding: 14px;
        overflow: auto;
      }
      .promql[hidden] {
        display: none;
      }
      .promql h2 {
        margin: 0;
        font-size: 16px;
      }
      .promql .hint {
        margin: 6px 0 14px;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.4;
      }
      details {
        border: 1px solid var(--line);
        border-radius: 8px;
        margin-bottom: 10px;
        background: #fff;
      }
      summary {
        padding: 11px 12px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 700;
      }
      details[open] summary {
        border-bottom: 1px solid var(--line);
      }
      .query-body {
        padding: 10px 12px 12px;
      }
      .query-body p {
        margin: 0 0 10px;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.4;
      }
      pre {
        margin: 0 0 10px;
        padding: 10px;
        overflow: auto;
        border-radius: 8px;
        background: #101828;
        color: #f8fafc;
        font-size: 12px;
        line-height: 1.45;
      }
      .copy {
        width: 100%;
        padding: 9px 10px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #f8fafc;
        color: var(--text);
        cursor: pointer;
        font-size: 12px;
        font-weight: 700;
      }
      .copy:hover {
        border-color: var(--accent);
      }
      @media (max-width: 860px) {
        main { grid-template-columns: 1fr; }
        nav { border-right: 0; border-bottom: 1px solid var(--line); }
        .workspace { grid-template-columns: 1fr; }
        .promql { border-left: 0; border-top: 1px solid var(--line); }
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
      <div class="workspace compact" id="workspace">
        <section class="viewer">
          <div class="toolbar">
            <div class="url" id="activeUrl"></div>
            <a class="open" id="openLink" target="_blank" rel="noreferrer">Open new tab</a>
          </div>
          <iframe id="frame" title="tool view"></iframe>
        </section>
        <aside class="promql" id="promqlPanel" hidden>
          <h2>PromQL DSL</h2>
          <div class="hint">Open a row, copy the query, paste it into the Prometheus expression box, then run it.</div>
          <div id="queryList"></div>
        </aside>
      </div>
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
          name: "Traffic Lab",
          description: "Generate traffic, errors, and slow requests for dashboard practice.",
          url: "http://localhost:${PORT}/traffic-lab"
        },
        {
          name: "User Guide",
          description: "Step through runbooks and questions with Start, Back, Next, and Done.",
          url: "http://localhost:${PORT}/guide"
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
      const workspace = document.getElementById("workspace");
      const promqlPanel = document.getElementById("promqlPanel");
      const queryList = document.getElementById("queryList");
      const toolButtons = new Map();

      const promqlSamples = ${JSON.stringify(promqlSamples)};

      function copyText(text, button) {
        const done = () => {
          const original = button.textContent;
          button.textContent = "Copied";
          setTimeout(() => {
            button.textContent = original;
          }, 1200);
        };
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(text).then(done);
          return;
        }
        const input = document.createElement("textarea");
        input.value = text;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        input.remove();
        done();
      }

      function renderPromqlSamples() {
        for (const sample of promqlSamples) {
          const details = document.createElement("details");
          const summary = document.createElement("summary");
          const body = document.createElement("div");
          const description = document.createElement("p");
          const pre = document.createElement("pre");
          const code = document.createElement("code");
          const copy = document.createElement("button");

          summary.textContent = sample.title;
          body.className = "query-body";
          description.textContent = sample.description;
          code.textContent = sample.query;
          copy.className = "copy";
          copy.type = "button";
          copy.textContent = "Copy query";
          copy.addEventListener("click", () => copyText(sample.query, copy));
          details.addEventListener("toggle", () => {
            if (!details.open) return;
            for (const other of queryList.querySelectorAll("details")) {
              if (other !== details) other.open = false;
            }
          });

          pre.appendChild(code);
          body.appendChild(description);
          body.appendChild(pre);
          body.appendChild(copy);
          details.appendChild(summary);
          details.appendChild(body);
          queryList.appendChild(details);
        }
      }

      function select(tool) {
        frame.src = tool.url;
        activeUrl.textContent = tool.url;
        openLink.href = tool.url;
        for (const [name, button] of toolButtons) {
          button.classList.toggle("active", name === tool.name);
        }
        const isPrometheus = tool.name === "Prometheus";
        promqlPanel.hidden = !isPrometheus;
        workspace.classList.toggle("compact", !isPrometheus);
      }

      for (const tool of tools) {
        const button = document.createElement("button");
        button.innerHTML = '<div class="title">' + tool.name + '</div><div class="desc">' + tool.description + '</div>';
        button.addEventListener("click", () => select(tool));
        toolButtons.set(tool.name, button);
        cards.appendChild(button);
      }

      renderPromqlSamples();
      select(tools[0]);
    </script>
  </body>
</html>`;

const trafficPage = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Traffic Lab</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f5f7fb;
        --panel: #ffffff;
        --text: #17202a;
        --muted: #5c6670;
        --line: #d7dde5;
        --accent: #1f6feb;
        --danger: #b42318;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 18px;
        background: var(--bg);
        color: var(--text);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      h1 {
        margin: 0;
        font-size: 22px;
      }
      .intro {
        margin: 6px 0 18px;
        max-width: 860px;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.45;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 12px;
      }
      .scenario {
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--panel);
        padding: 14px;
      }
      .scenario h2 {
        margin: 0;
        font-size: 16px;
      }
      .scenario p {
        margin: 8px 0;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.45;
      }
      .watch {
        margin: 10px 0;
        padding: 10px;
        border-radius: 8px;
        background: #f8fafc;
        color: var(--text);
        font-size: 12px;
        line-height: 1.45;
      }
      button {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid var(--accent);
        border-radius: 8px;
        background: var(--accent);
        color: #fff;
        cursor: pointer;
        font-weight: 700;
      }
      button:disabled {
        opacity: 0.55;
        cursor: wait;
      }
      .output {
        margin-top: 16px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #101828;
        color: #f8fafc;
        min-height: 190px;
        padding: 14px;
        overflow: auto;
        white-space: pre-wrap;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 12px;
        line-height: 1.5;
      }
      a {
        color: var(--accent);
        font-weight: 700;
      }
    </style>
  </head>
  <body>
    <h1>Traffic Lab</h1>
    <div class="intro">
      Run controlled demo traffic, then watch Grafana and Prometheus. Prometheus scrapes on an interval, so panels may take one or two scrape windows to move.
    </div>
    <div class="grid" id="scenarios"></div>
    <pre class="output" id="output">Choose an action. Then check Grafana request rate, error rate, and p95 latency panels.</pre>
    <script>
      const scenarios = ${JSON.stringify(trafficScenarios)};
      const output = document.getElementById("output");
      const container = document.getElementById("scenarios");

      function setBusy(isBusy) {
        for (const button of document.querySelectorAll("button")) button.disabled = isBusy;
      }

      async function runScenario(scenario) {
        setBusy(true);
        output.textContent = "running " + scenario.title + "...";
        try {
          const response = await fetch("/api/traffic?scenario=" + encodeURIComponent(scenario.id));
          const body = await response.json();
          output.textContent = JSON.stringify(body, null, 2) + "\\n\\nNext: open Grafana and watch the panels. If values do not move yet, wait for the next scrape.";
        } catch (error) {
          output.textContent = "failed: " + error.message;
        } finally {
          setBusy(false);
        }
      }

      for (const scenario of scenarios) {
        const card = document.createElement("section");
        card.className = "scenario";
        card.innerHTML =
          "<h2>" + scenario.title + "</h2>" +
          "<p>" + scenario.description + "</p>" +
          "<div class=\\"watch\\"><strong>Watch:</strong> " + scenario.watch + "</div>";
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = scenario.button;
        button.addEventListener("click", () => runScenario(scenario));
        card.appendChild(button);
        container.appendChild(card);
      }
    </script>
  </body>
</html>`;

const guidePage = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Paved Platform Lab Guide</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f5f7fb;
        --panel: #ffffff;
        --text: #17202a;
        --muted: #5c6670;
        --line: #d7dde5;
        --accent: #1f6feb;
        --done: #0f766e;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: var(--bg);
        color: var(--text);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 14px 18px;
        border-bottom: 1px solid var(--line);
        background: var(--panel);
      }
      h1 {
        margin: 0;
        font-size: 19px;
      }
      .sub {
        margin-top: 4px;
        color: var(--muted);
        font-size: 13px;
      }
      .layout {
        display: grid;
        grid-template-columns: 280px minmax(0, 1fr);
        min-height: calc(100vh - 73px);
      }
      aside {
        border-right: 1px solid var(--line);
        background: var(--panel);
        padding: 14px;
      }
      .step {
        width: 100%;
        display: block;
        text-align: left;
        padding: 11px 12px;
        margin-bottom: 10px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #fff;
        color: var(--text);
        cursor: pointer;
      }
      .step.active {
        border-color: var(--accent);
        background: #eef5ff;
      }
      .step.done {
        border-color: #99f6e4;
      }
      .step-title {
        font-size: 13px;
        font-weight: 700;
      }
      .step-desc {
        margin-top: 4px;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.35;
      }
      main {
        min-width: 0;
        padding: 18px;
      }
      .controls {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        margin: 0 auto 14px;
      }
      .controls button {
        min-width: 44px;
        min-height: 38px;
        padding: 9px 12px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #fff;
        color: var(--text);
        cursor: pointer;
        font-weight: 700;
      }
      .controls.bottom {
        margin: 14px auto 0;
      }
      .controls button.primary {
        border-color: var(--accent);
        background: var(--accent);
        color: #fff;
      }
      .controls button.done {
        border-color: var(--done);
        background: var(--done);
        color: #fff;
      }
      .controls button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .progress {
        margin-left: 8px;
        color: var(--muted);
        font-size: 13px;
      }
      .progress.done {
        color: var(--done);
        font-weight: 700;
      }
      article {
        max-width: 980px;
        padding: 22px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--panel);
      }
      article h1, article h2, article h3, article h4 {
        margin: 18px 0 8px;
      }
      article h1:first-child {
        margin-top: 0;
      }
      article p, article li {
        color: #26313d;
        line-height: 1.6;
      }
      article blockquote {
        margin: 14px 0;
        padding: 10px 14px;
        border-left: 4px solid var(--accent);
        background: #f8fafc;
        color: #26313d;
      }
      article code {
        padding: 2px 5px;
        border-radius: 5px;
        background: #eef2f7;
      }
      article pre {
        overflow: auto;
        padding: 12px;
        border-radius: 8px;
        background: #101828;
        color: #f8fafc;
        line-height: 1.5;
      }
      article pre code {
        padding: 0;
        background: transparent;
        color: inherit;
      }
      @media (max-width: 860px) {
        header { align-items: flex-start; flex-direction: column; }
        .layout { grid-template-columns: 1fr; }
        aside { border-right: 0; border-bottom: 1px solid var(--line); }
        .controls { flex-wrap: wrap; }
        .progress { margin-left: 0; width: 100%; text-align: center; }
      }
    </style>
  </head>
  <body>
    <header>
      <div>
        <h1>Paved Platform Lab Guide</h1>
        <div class="sub">Rendered from Markdown in docs/runbooks and docs/questions.</div>
      </div>
    </header>
    <div class="layout">
      <aside id="steps"></aside>
      <main>
        <div class="controls" id="topControls">
          <button class="back" aria-label="Back">&lt;</button>
          <button class="next primary" aria-label="Next">&gt;</button>
          <div class="progress"></div>
        </div>
        <article id="content"></article>
        <div class="controls bottom" id="bottomControls">
          <button class="back" aria-label="Back">&lt;</button>
          <button class="next primary" aria-label="Next">&gt;</button>
          <div class="progress"></div>
        </div>
      </main>
    </div>
    <script>
      const pages = ${JSON.stringify(renderedGuidePages)};
      const doneKey = "paved-platform-lab-guide-done";
      const indexKey = "paved-platform-lab-guide-index";
      const doneSet = new Set(JSON.parse(localStorage.getItem(doneKey) || "[]"));
      let index = Number(localStorage.getItem(indexKey) || 0);
      if (!Number.isFinite(index) || index < 0 || index >= pages.length) index = 0;

      const steps = document.getElementById("steps");
      const content = document.getElementById("content");
      const progressItems = [...document.querySelectorAll(".progress")];
      const backButtons = [...document.querySelectorAll(".back")];
      const nextButtons = [...document.querySelectorAll(".next")];
      const buttons = [];

      function escapeText(value) {
        return String(value).replace(/[&<>"']/g, (char) => ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char]);
      }

      function persist() {
        localStorage.setItem(doneKey, JSON.stringify([...doneSet]));
        localStorage.setItem(indexKey, String(index));
      }

      function guideIndexForPath(guidePath) {
        const normalized = guidePath.replace(/^\\.\\//, "");
        return pages.findIndex((page) => (
          page.path === normalized ||
          page.path.endsWith("/" + normalized) ||
          page.path.split("/").pop() === normalized.split("/").pop()
        ));
      }

      function render() {
        const page = pages[index];
        const allDone = doneSet.size === pages.length;
        const guideComplete = allDone && index === pages.length - 1;
        content.innerHTML = page.html;
        for (const item of progressItems) {
          item.textContent = "Step " + (index + 1) + " of " + pages.length + " | " + doneSet.size + " done";
          item.classList.toggle("done", allDone);
          item.hidden = guideComplete;
        }
        for (const button of backButtons) {
          button.hidden = false;
          button.disabled = index === 0;
        }
        for (const button of nextButtons) {
          button.hidden = guideComplete;
          button.disabled = false;
        }
        for (let i = 0; i < buttons.length; i += 1) {
          buttons[i].classList.toggle("active", i === index);
          buttons[i].classList.toggle("done", doneSet.has(i));
        }
        persist();
      }

      for (let i = 0; i < pages.length; i += 1) {
        const page = pages[i];
        const button = document.createElement("div");
        button.className = "step";
        button.setAttribute("role", "button");
        button.tabIndex = 0;
        button.innerHTML =
          '<div class="step-title">' + (i + 1) + ". " + escapeText(page.title) + '</div>' +
          '<div class="step-desc">' + escapeText(page.description) + '</div>';
        button.addEventListener("click", () => {
          index = i;
          render();
        });
        button.addEventListener("keydown", (event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          index = i;
          render();
        });
        buttons.push(button);
        steps.appendChild(button);
      }

      content.addEventListener("click", (event) => {
        const link = event.target.closest("a[data-guide-path]");
        if (!link) return;
        const nextIndex = guideIndexForPath(link.dataset.guidePath || "");
        if (nextIndex < 0) return;
        event.preventDefault();
        index = nextIndex;
        render();
      });

      for (const button of backButtons) button.addEventListener("click", () => {
        if (index > 0) {
          index -= 1;
        }
        render();
      });
      for (const button of nextButtons) button.addEventListener("click", () => {
        doneSet.add(index);
        if (index < pages.length - 1) index += 1;
        render();
      });

      render();
    </script>
  </body>
</html>`;

for (const forward of forwards) startForward(forward);

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://127.0.0.1:${PORT}`);
  if (url.pathname === "/" || url.pathname === "/index.html") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(page);
    return;
  }
  if (url.pathname === "/traffic-lab") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(trafficPage);
    return;
  }
  if (url.pathname === "/guide") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(guidePage);
    return;
  }
  if (url.pathname === "/api/traffic") {
    const scenario = trafficScenarios.find((item) => item.id === url.searchParams.get("scenario"));
    if (!scenario) {
      response.writeHead(404, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: "unknown scenario" }));
      return;
    }
    const result = await runTrafficScenario(scenario);
    response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify(result));
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
