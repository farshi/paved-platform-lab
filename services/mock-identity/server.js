const http = require("http");
const { createToken, jwks, userInfo } = require("../../scripts/lib/mock-identity");

const port = Number(process.env.PORT || 18090);

function send(res, status, body) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body, null, 2));
}

const server = http.createServer((req, res) => {
  if (req.url === "/login") {
    send(res, 200, {
      token_type: "Bearer",
      access_token: createToken(),
      expires_in: 3600,
    });
    return;
  }
  if (req.url === "/.well-known/jwks.json") {
    send(res, 200, jwks());
    return;
  }
  if (req.url === "/userinfo") {
    send(res, 200, userInfo());
    return;
  }
  send(res, 404, { status: "not_found" });
});

server.listen(port, () => {
  console.log(`mock identity issuer listening on http://localhost:${port}`);
});
