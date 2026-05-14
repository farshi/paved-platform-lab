const http = require("http");
const { AUDIENCE, CLIENT_ID, CUSTOMER_ID, ISSUER, createToken } = require("./lib/mock-identity");

const appUrl = process.env.APP_URL || "http://localhost:8080";
const token = createToken();

function request(path, headers = {}) {
  return new Promise((resolve) => {
    const url = new URL(path, appUrl);
    const req = http.request(
      url,
      {
        method: "GET",
        headers,
        timeout: 4000,
      },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          resolve({ status: res.statusCode, body });
        });
      }
    );
    req.on("timeout", () => {
      req.destroy(new Error("timeout"));
    });
    req.on("error", (error) => {
      resolve({ error: error.message });
    });
    req.end();
  });
}

function printTokenSummary() {
  console.log("identity token issued");
  console.log(`issuer: ${ISSUER}`);
  console.log(`audience: ${AUDIENCE}`);
  console.log(`client_id: ${CLIENT_ID}`);
  console.log(`customer_id: ${CUSTOMER_ID}`);
}

async function main() {
  printTokenSummary();
  console.log("");
  console.log("self-service platform policy shape:");
  console.log("- Verify-JWT validates issuer, audience, RS256 key");
  console.log("- OAuthV2 verifies access token");
  console.log("- Extract-Customer-Claims forwards customer context");
  console.log("- quota and spike arrest protect shared capacity");
  console.log("");

  const denied = await request("/customer/orders");
  if (denied.error) {
    console.log(`app endpoint unavailable at ${appUrl}`);
    console.log("Run: make tools-up");
    console.log("");
    console.log("Manual check after tools-up:");
    console.log(`curl -H 'Authorization: Bearer ${token}' ${appUrl}/customer/orders`);
    return;
  }

  if (denied.status === 404) {
    console.log(`customer API path missing at ${appUrl}`);
    console.log("Run: make build APP=demo-api TENANT=tenant-a");
    console.log("Then: make deploy APP=demo-api TENANT=tenant-a");
    console.log("Then: make tools-up");
    return;
  }

  console.log(`without token: HTTP ${denied.status}`);
  const allowed = await request("/customer/orders", { Authorization: `Bearer ${token}` });
  if (allowed.status === 404) {
    console.log(`customer API path missing at ${appUrl}`);
    console.log("Run: make build APP=demo-api TENANT=tenant-a");
    console.log("Then: make deploy APP=demo-api TENANT=tenant-a");
    console.log("Then: make tools-up");
    return;
  }
  console.log(`with identity token: HTTP ${allowed.status}`);
  if (allowed.body) {
    console.log(allowed.body.trim());
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
