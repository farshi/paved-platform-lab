const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const proxyRoot = path.join(root, "examples/api-platform/gateway-proxy/apiproxy");
const configPath = path.join(root, "examples/api-platform/api-proxy-config.yaml");

function read(relativePath) {
  return fs.readFileSync(path.join(proxyRoot, relativePath), "utf8");
}

function assertIncludes(file, label, pattern) {
  const content = read(file);
  if (!pattern.test(content)) {
    throw new Error(`${label} missing in ${file}`);
  }
  console.log(`pass: ${label}`);
}

function assertNoSecrets(file) {
  const content = read(file);
  const secretPattern = /(client_secret|private_key|password|-----BEGIN PRIVATE KEY-----)/i;
  if (secretPattern.test(content)) {
    throw new Error(`secret-like value found in ${file}`);
  }
  console.log(`pass: no secrets in ${file}`);
}

function main() {
  assertIncludes("orders-v1.xml", "proxy name", /<APIProxy name="orders-v1">/);
  assertIncludes("proxies/default.xml", "jwt policy step", /<Name>Verify-JWT<\/Name>/);
  assertIncludes("proxies/default.xml", "oauth policy step", /<Name>OAuthV2-Verify-Access-Token<\/Name>/);
  assertIncludes("proxies/default.xml", "customer claim extraction step", /<Name>Extract-Customer-Claims<\/Name>/);
  assertIncludes("proxies/default.xml", "identity header assignment step", /<Name>Assign-identity-Headers<\/Name>/);
  assertIncludes("proxies/default.xml", "quota policy step", /<Name>Quota-Per-Client<\/Name>/);
  assertIncludes("proxies/default.xml", "spike arrest policy step", /<Name>Spike-Arrest<\/Name>/);
  assertIncludes("policies/Verify-JWT.xml", "jwt algorithm", /<Algorithm>RS256<\/Algorithm>/);
  assertIncludes("policies/Verify-JWT.xml", "jwt audience", /<Audience>orders-api<\/Audience>/);
  assertIncludes("policies/Verify-JWT.xml", "identity issuer", /<Issuer>https:\/\/identity\.example\.com\/oauth2\/default<\/Issuer>/);
  assertIncludes("policies/Extract-Customer-Claims.xml", "customer id claim", /jwt\.Verify-JWT\.claim\.customer_id/);
  assertIncludes("policies/Extract-Customer-Claims.xml", "client id claim", /jwt\.Verify-JWT\.claim\.client_id/);
  assertIncludes("policies/Assign-identity-Headers.xml", "customer id header", /<Header name="X-Customer-ID">\{identity\.customer_id\}<\/Header>/);
  assertIncludes("policies/Assign-identity-Headers.xml", "client id header", /<Header name="X-Client-ID">\{identity\.client_id\}<\/Header>/);
  assertIncludes("policies/OAuthV2-Verify-Access-Token.xml", "oauth verify access token", /<Operation>VerifyAccessToken<\/Operation>/);
  assertIncludes("policies/Quota-Per-Client.xml", "quota client identifier", /<Identifier ref="client_id"\/>/);
  assertIncludes("policies/Quota-Per-Client.xml", "quota interval", /<Interval>1<\/Interval>\s*<TimeUnit>hour<\/TimeUnit>/);
  assertIncludes("policies/Spike-Arrest.xml", "spike arrest rate", /<Rate>30ps<\/Rate>/);
  assertIncludes("targets/default.xml", "https target", /<URL>https:\/\/api\.example\.com\/orders<\/URL>/);
  const config = fs.readFileSync(configPath, "utf8");
  if (!/identity\.issuer: https:\/\/identity\.example\.com\/oauth2\/default/.test(config)) {
    throw new Error("identity issuer missing in api-proxy-config.yaml");
  }
  console.log("pass: identity issuer in config");
  for (const file of [
    "policies/Verify-JWT.xml",
    "policies/OAuthV2-Verify-Access-Token.xml",
    "policies/Extract-Customer-Claims.xml",
    "policies/Assign-identity-Headers.xml",
  ]) {
    assertNoSecrets(file);
  }
  console.log("api-platform examples: ok");
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
