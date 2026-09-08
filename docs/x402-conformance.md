# x402 Conformance

A paid API states its price twice, and nothing makes the two agree.

Once in the OpenAPI discovery document an agent reads before it calls anything,
in decimal USD:

```json
"x-payment-info": { "price": { "mode": "fixed", "currency": "USD", "amount": "0.001000" } }
```

Once in the `402` challenge the server returns at the door, in the settlement
token's atomic units:

```json
"accepts": [{ "amount": "1000", "asset": "0xaf88...5831", "network": "eip155:42161" }]
```

Different code writes them. Different units. An agent budgets from the first and
settles against the second, and when they drift apart nothing tells anyone.

This page covers the auditor built to catch that, the endpoint that runs it, and
the page that shows it. For how this site's own discovery contract is built, see
[x402scan-discovery.md](x402scan-discovery.md).

## The gap

x402scan's own audit reads the discovery document. It also probes a live
challenge. Both passes can be green while the two describe entirely different
things, because neither pass ever compares them.

Four failures live in that gap, and every one of them has shipped on a live
origin:

| Failure | Looks like | Costs |
|---|---|---|
| Prices disagree | Both sides validate | The agent is charged something other than the price it agreed to |
| Paid route serves free | Document says $0.001 | Registration probe reads "expected 402, got 200" and delists it |
| Free route charges | Document says free | An agent that planned a free call is billed, or fails |
| Schemas diverge | Both present | The call the agent planned is not the call the endpoint takes |

And one failure no static validator can see at all: a challenge whose `payTo` is
the zero address. Every field validates. The first agent to honour it burns its
funds, unrecoverably, on an endpoint it still cannot unlock. That is what a
missing environment variable looks like from the outside.

## Using it

### Hosted

<https://cryptocurrency.cv/x402/conformance> audits any public origin, including
this one. Enter a host, get a graded report with the exact fix for each finding.

### API

```bash
# audit this origin
curl https://cryptocurrency.cv/api/x402/conformance

# audit someone else's
curl 'https://cryptocurrency.cv/api/x402/conformance?origin=https://your-api.example.com'

# SARIF, for a code-scanning upload
curl 'https://cryptocurrency.cv/api/x402/conformance?origin=https://your-api.example.com&format=sarif'
```

| Parameter | Default | Effect |
|---|---|---|
| `origin` | this origin | Public HTTPS origin to audit |
| `probe` | `12` | Operations to probe live, capped at 40 |
| `documentOnly` | off | Read the discovery document, touch nothing live |
| `format` | `json` | `sarif` for SARIF 2.1.0 |

Free, unauthenticated, and rate-limited like the rest of the free tier. The
endpoint refuses anything that is not a public HTTPS hostname, so it cannot be
pointed at a private network.

### CLI

```bash
npx @nirholas/x402-conformance https://your-api.example.com
```

In this repo:

```bash
npm run audit:x402          # audit production
npm run audit:x402:local    # audit localhost:3000, exit 1 on any error
```

Gate a deploy:

```bash
npx @nirholas/x402-conformance https://your-api.example.com --fail-on error
```

Catch regressions, which is the more useful gate. An absolute grade is a
snapshot; a diff tells you whether this deploy made things worse:

```bash
npx @nirholas/x402-conformance https://your-api.example.com --json --out baseline.json
npx @nirholas/x402-conformance https://your-api.example.com --baseline baseline.json
```

```
  Drift against baseline.json

  Score 96 -> 84 (-12)

  fixed    O11_SUMMARY_MISSING  /api/v1/news
  NEW      X03_PRICE_DISAGREES  /api/v1/ask  Document and challenge quote different prices
```

### Library

```ts
import { audit, renderText } from '@nirholas/x402-conformance';

const report = await audit('https://your-api.example.com', { probeLimit: 20 });
console.log(renderText(report, { color: true }));
if (report.score.errors > 0) process.exit(1);
```

## How the price check works

Without an asset registry, and without trusting either side.

For any honest pair, the atomic amount is the declared USD price multiplied by a
power of ten, and that exponent is the token's decimals:

```
$0.001 charged as "1000"  -> log10(1000 / 0.001) = 6  -> a 6-decimal token, i.e. USDC
$0.05  charged as "50000" -> log10(50000 / 0.05) = 6  -> agrees
$0.01  charged as "10000000000" -> 12                 -> no settlement token has 12 decimals
```

A ratio that is not a clean power of ten is a disagreement, not an unknown
token. A ratio that is a clean power of ten but an implausible one is reported
separately, because it is almost always an exponent off by six.

Where the asset is a recognised stablecoin the check is exact rather than
inferred, and the finding names both numbers and the expected atomic amount.

## What it checks

Four layers, in the order the failures bite.

**Document versus wire** (`X01`-`X12`). The layer that only exists here: price
agreement, protection agreement in both directions, dynamic quotes inside their
advertised ceiling, input-schema agreement, whether the gate runs before
validation, whether a fixed quote is actually fixed, and whether the payment
address holds still between calls.

**Live payment challenges** (`R00`-`R21`). Unspendable `payTo`, amounts in
dollars where atomic units belong, missing EIP-712 domain fields on an
exact-EVM challenge, schemas present in the body but not where any reader
resolves them, bot filters answering 403 to unpaid callers, validation answering
400, non-CAIP-2 networks, implausible payment windows.

**Discovery document** (`D00`-`D13`). Missing `openapi`, `title`, `version`,
`x-guidance` or `contact`; duplicate `operationId`s; a `servers` list pointing at
another host; security schemes referenced but never declared.

**Declared operations** (`O01`-`O11`). Unstructured prices, dynamic pricing with
no bounds to budget against, missing input or output schemas, undeclared 402s,
and routes that never say whether they are free.

The full table is in the [package README](../sdk/x402-conformance/README.md).

## Grading

Start at 100. Errors cost 12, warnings 3, notes 0.5, and each repeat of the same
code costs less than the last, because one systemic mistake across 400
operations is one thing to fix.

Two overrides:

- **Capped at 65** by anything that costs a paying agent real money: an
  unspendable `payTo`, an amount in the wrong units, or the two prices
  disagreeing.
- **Zero** when there is nothing to grade: no discovery document at all.

`A` 95+, `B` 85+, `C` 70+, `D` 50+, `F` below.

## Nothing here spends money

Every probe is an ordinary unpaid request. A `402` challenge is what a server
hands any anonymous caller, so reading it is exactly what a paying client does
first and costs the operator one request. No payment header is constructed, no
wallet is involved, no transaction is ever signed.

The default sample is 12 operations, chosen deterministically to cover distinct
price points, methods and path families rather than hammering one route family.
Two extra probes are sent only where they can teach something: a repeat call to
test quote stability, and one with an unexpected argument to test whether
validation runs ahead of the gate.

## Where it lives

| Piece | Path |
|---|---|
| Engine and CLI | [sdk/x402-conformance](../sdk/x402-conformance) |
| App entry point | [src/lib/x402/conformance.ts](../src/lib/x402/conformance.ts) |
| API endpoint | [src/app/api/x402/conformance/route.ts](../src/app/api/x402/conformance/route.ts) |
| Page | [src/app/[locale]/x402/conformance](../src/app/%5Blocale%5D/x402/conformance) |

The site and the npm package run the same code, aliased rather than copied, so a
grade from the browser and a grade from a terminal can never disagree.

## Related

- [x402scan-discovery.md](x402scan-discovery.md) — how this site's own discovery contract is built
- [X402.md](X402.md) — pricing, payment flow, client integration
- [x402scan discovery spec](https://x402scan.com/discovery/spec) — the contract being audited against
