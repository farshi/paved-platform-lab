# Mock identity Issuer

Tiny local-only identity teaching surface.

It does not replace a real identity provider. It shows the shape of customer identity:

- login issues an OAuth/OIDC-style token
- token contains issuer, audience, client id, customer id, scope, and expiry
- APIs receive bearer tokens
- policy-style policy validates token and enforces platform rules before backend traffic

For the runnable demo, use:

```sh
make developer-flow-demo
```
