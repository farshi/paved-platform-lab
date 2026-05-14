const ISSUER = process.env.identity_ISSUER || "https://identity.example.com/oauth2/default";
const AUDIENCE = process.env.identity_AUDIENCE || "orders-api";
const CLIENT_ID = process.env.identity_CLIENT_ID || "mobile-app";
const CUSTOMER_ID = process.env.identity_CUSTOMER_ID || "cust-1001";

function base64url(value) {
  return Buffer.from(JSON.stringify(value))
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/g, "");
}

function createToken(options = {}) {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "RS256",
    typ: "JWT",
    kid: "local-demo-key",
  };
  const payload = {
    iss: ISSUER,
    aud: AUDIENCE,
    iat: now,
    exp: now + 3600,
    client_id: CLIENT_ID,
    customer_id: CUSTOMER_ID,
    scope: "openid profile orders:read",
    ...options,
  };
  return `${base64url(header)}.${base64url(payload)}.local-demo-signature`;
}

function jwks() {
  return {
    keys: [
      {
        kty: "RSA",
        kid: "local-demo-key",
        use: "sig",
        alg: "RS256",
        n: "local-demo-public-key",
        e: "AQAB",
      },
    ],
  };
}

function userInfo() {
  return {
    sub: CUSTOMER_ID,
    customer_id: CUSTOMER_ID,
    client_id: CLIENT_ID,
    name: "Demo Customer",
  };
}

module.exports = {
  AUDIENCE,
  CLIENT_ID,
  CUSTOMER_ID,
  ISSUER,
  createToken,
  jwks,
  userInfo,
};
