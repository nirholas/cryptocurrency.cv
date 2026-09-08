# x402scan Discovery

How cryptocurrency.cv makes its 467 operations (408 paid, 59 free) discoverable
and invocable by agents, and how to verify that yourself before anything is
registered.

[x402scan](https://x402scan.com) is the directory agents read to find paid APIs.
It resolves an origin in two passes, and the second one overrules the first:

| Order | Source | Location |
|-------|--------|----------|
| 1 | OpenAPI document | `GET /openapi.json` |
| 2 | Runtime `402` challenge | Any paid endpoint, called without payment |

Static metadata that disagrees with the live `402` loses. An endpoint priced at
`$0.001` in the spec but quoting a different amount in its challenge is a
mismatch, not a rounding difference, and an agent that trusted the spec fails on
the first call.

Full specification: <https://x402scan.com/discovery/spec>.

## The two surfaces

### 1. `GET /openapi.json`

Served by [`src/app/api/openapi.json/route.ts`](https://github.com/nirholas/cryptocurrency.cv/blob/main/src/app/api/openapi.json/route.ts)
and rewritten to the root path in [`next.config.js`](https://github.com/nirholas/cryptocurrency.cv/blob/main/next.config.js). The
document is generated, never hand-edited, by
[`src/lib/openapi/generator.ts`](https://github.com/nirholas/cryptocurrency.cv/blob/main/src/lib/openapi/generator.ts).

Every operation carries:

```jsonc
{
  "summary": "Latest crypto news with filtering and pagination",
  "operationId": "getV1News",
  "x-payment-info": {
    "price": { "mode": "fixed", "currency": "USD", "amount": "0.001000" },
    "protocols": [{ "x402": {} }]
  },
  "parameters": [ /* the query string, one entry per parameter */ ],
  "responses": {
    "200": { "content": { "application/json": { "schema": { /* ... */ } } } },
    "402": { "description": "Payment Required" }
  }
}
```

Five details are load-bearing, and each one is a listing failure when it is
wrong:

- **`x-payment-info.price` is an object**, not a decimal string. The flat
  `{ pricingMode: "fixed", price: "0.001" }` form still parses, but only through
  a legacy fallback the audit reports as `L2_PAYMENT_INFO_LEGACY`.
- **`protocols` holds objects**, `[{ "x402": {} }]`. A bare `["x402"]` or a
  `{ "x402": true }` is reported as a malformed protocol entry.
- **`amount` is decimal USD.** The runtime challenge quotes the same price in
  token atomic units. Confusing the two is the single most common runtime
  failure, and it is silent until an agent overpays by a factor of a million.
- **Every operation has both an input and an output schema.** An operation with
  neither is rejected outright ("Operation has no input or output schema").
- **Only routes the gate actually charges for carry `x-payment-info`.** The free
  tier here is large: news, market data, the archive, the RSS and Atom feeds and
  the hosted MCP endpoint are all served without payment. Those operations
  declare `security: []` (explicitly public) and no `402`. Advertising a price
  on one is not a harmless over-declaration; the probe calls it, gets `200`, and
  reports "expected 402, got 200". The classification is read from the same
  `EXEMPT_PATTERNS` and `FREE_TIER_PATTERNS` the middleware gate uses, never
  from a second list kept alongside them.

### 2. The runtime `402`

Built by
[`src/lib/x402/payment-required.ts`](https://github.com/nirholas/cryptocurrency.cv/blob/main/src/lib/x402/payment-required.ts) and
returned by the middleware gate in
[`src/middleware/x402.ts`](https://github.com/nirholas/cryptocurrency.cv/blob/main/src/middleware/x402.ts) before the route handler
ever runs. That ordering matters: a registration probe sends a bare request with
no arguments, so if body or query validation ran first it would answer `400` and
the probe would never see a challenge.

```bash
curl -i https://cryptocurrency.cv/api/v1/news
```

```jsonc
{
  "x402Version": 2,
  "error": "Payment Required",
  "accepts": [{
    "scheme": "exact",
    "network": "eip155:42161",
    "amount": "1000",              // atomic units: $0.001 of 6-decimal USDC
    "asset": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    "payTo": "0x…",
    "maxTimeoutSeconds": 60,
    "extra": { "name": "USD Coin", "version": "2" },
    "outputSchema": { "input": { /* … */ }, "output": { /* … */ } }
  }],
  "resource": {
    "url": "https://cryptocurrency.cv/api/v1/news",
    "description": "Latest crypto news with filtering and pagination",
    "mimeType": "application/json"
  },
  "extensions": {
    "bazaar": {
      "info": { "input": { /* … */ }, "output": { /* … */ } },
      "schema": {
        "type": "object",
        "properties": {
          "input":  { "type": "object", "properties": { "queryParams": { /* JSON Schema */ } } },
          "output": { "type": "object", "properties": { "example":     { /* JSON Schema */ } } }
        }
      }
    }
  }
}
```

`extensions.bazaar.schema` looks redundant next to `bazaar.info`, and it is not.
A v2 validator reads the input schema from
`schema.properties.input.properties.body`, falling back to `.queryParams`, and
the output schema from `schema.properties.output.properties.example`. Those exact
paths are the contract. A flat parameter schema at `schema` resolves to neither,
which is how every endpoint here once probed as `SCHEMA_INPUT_MISSING` while
carrying a complete schema three keys away.

`accepts[].outputSchema.{input,output}` is the same pair in the older v1 shape.
Both are emitted so a v1 reader is not left empty-handed.

## Where the schemas come from

Nothing here is hand-written, because 467 hand-written schemas would be wrong
within a week.

`scripts/generate-endpoint-metadata.js` reads every `src/app/api/**/route.ts` and,
for each exported method, records:

- **Input** - query parameters from `searchParams.get()` calls, Zod query
  schemas, and destructured `await request.json()` bodies.
- **Output** - the top-level keys of every success JSON body the method actually
  returns (`NextResponse.json`, `Response.json`, `jsonResponse`), with each key's
  type inferred from its literal. Error branches, identified by an explicit 4xx
  or 5xx status, are excluded.

The `info.x-guidance` block is injected into agent context verbatim, so it is
held to the same standard: a test asserts every endpoint it names exists and
that it never quotes a price for a route the gate serves free.

The result lands in `src/lib/openapi/endpoint-metadata.generated.ts`, which the
OpenAPI generator, the `402` builder, and `/.well-known/x402` all read.

A route whose response body is not statically derivable, because it proxies an
upstream payload or assembles the body at runtime, advertises
`{ "type": "object", "additionalProperties": true }`. That is deliberately
uninformative rather than confidently wrong: naming properties the endpoint may
not return would break exactly the agents this document exists to serve.

Regenerate after adding or changing a route:

```bash
node scripts/generate-endpoint-metadata.js
```

## Verifying

Run the audit against a deployed origin. It reads the OpenAPI document, probes
the runtime challenge, and reports every mismatch:

```bash
npx -y @agentcash/discovery@latest discover https://cryptocurrency.cv
npx -y @agentcash/discovery@latest check    https://cryptocurrency.cv/api/v1/news
```

The contract is also pinned in
[`src/lib/openapi/__tests__/x402scan-discovery.test.ts`](https://github.com/nirholas/cryptocurrency.cv/blob/main/src/lib/openapi/__tests__/x402scan-discovery.test.ts),
so a regression fails `bun run test` instead of surfacing as a silent delisting
weeks later.

### Known warning

`L2_ROUTE_COUNT_HIGH` fires above 40 advertised routes, and this API advertises
467 (408 paid, 59 free). The hint is to shrink the advertised surface; that would mean delisting
most of a paid API to save tokens in an agent's zero-hop prompt. Agents that
fetch on demand are unaffected, so the full surface stays listed. This is a
product decision, not an oversight.

## Before registering

Registration creates a public listing that agents will call and pay for, so it
is gated on three things, all of which must be true:

1. **The implementation is live at its final origin.** `/openapi.json` served
   from that origin, audits clean against the deployed URL, not localhost and
   not a preview.
2. **`X402_PAYMENT_ADDRESS` is set** on the production service. Without it the
   `payTo` in every challenge is the zero address, and any agent that pays burns
   its USDC unrecoverably. Verify before registering:

   ```bash
   curl -s https://cryptocurrency.cv/api/v1/news | jq -r '.accepts[0].payTo'
   ```

   A `0x0000000000000000000000000000000000000000` here means the variable is
   missing. Do not register.
3. **The owner has approved registering that specific origin.**

Only then:

```bash
npx agentcash install   # provides fetch_with_auth (SIWX wallet authentication)
# POST https://x402scan.com/api/x402/registry/register-origin  { "origin": "https://cryptocurrency.cv" }
```

Manual alternative: <https://x402scan.com/resources/register>.

## Related

- [x402-conformance.md](x402-conformance.md) - the auditor that checks all of the above against a live origin, and the layer no other tool covers
- [X402.md](X402.md) - pricing tiers, payment flow, client integration
- [WELL-KNOWN.md](WELL-KNOWN.md) - `/.well-known/x402` and the other discovery files
- [API.md](API.md) - the full endpoint reference
