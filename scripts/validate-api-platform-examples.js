const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const proxyRoot = path.join(root, "examples/api-platform/gateway-proxy/apiproxy");

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

function main() {
  assertIncludes("orders-v1.xml", "proxy name", /<APIProxy name="orders-v1">/);
  assertIncludes("proxies/default.xml", "jwt policy step", /<Name>Verify-JWT<\/Name>/);
  assertIncludes("proxies/default.xml", "oauth policy step", /<Name>OAuthV2-Verify-Access-Token<\/Name>/);
  assertIncludes("proxies/default.xml", "quota policy step", /<Name>Quota-Per-Client<\/Name>/);
  assertIncludes("proxies/default.xml", "spike arrest policy step", /<Name>Spike-Arrest<\/Name>/);
  assertIncludes("policies/Verify-JWT.xml", "jwt algorithm", /<Algorithm>RS256<\/Algorithm>/);
  assertIncludes("policies/Verify-JWT.xml", "jwt audience", /<Audience>orders-api<\/Audience>/);
  assertIncludes("policies/OAuthV2-Verify-Access-Token.xml", "oauth verify access token", /<Operation>VerifyAccessToken<\/Operation>/);
  assertIncludes("policies/Quota-Per-Client.xml", "quota client identifier", /<Identifier ref="client_id"\/>/);
  assertIncludes("policies/Quota-Per-Client.xml", "quota interval", /<Interval>1<\/Interval>\s*<TimeUnit>hour<\/TimeUnit>/);
  assertIncludes("policies/Spike-Arrest.xml", "spike arrest rate", /<Rate>30ps<\/Rate>/);
  assertIncludes("targets/default.xml", "https target", /<URL>https:\/\/api\.example\.com\/orders<\/URL>/);
  console.log("api-platform examples: ok");
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
