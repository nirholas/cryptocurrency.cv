# x402-conformance

Audit an x402 API's discovery contract, including the half nothing else checks.

```bash
npx @nirholas/x402-conformance https://your-api.example.com
```

```
  x402 conformance  https://your-api.example.com
  ------------------------------------------------------------------------------

  [ F ]  0/100   3 errors, 1 warning, 0 notes

  API        Example Search API
  Document   https://your-api.example.com/openapi.json
  Operations 12 (11 paid, 1 free)
  Probed     12 live, 11 challenged

  Document versus wire

  error  Document and challenge quote different prices (1,000,000x apart)
         X03_PRICE_DISAGREES  GET /api/search
         The document says $0.01; the challenge asks for 10000000000 atomic
         units of USDC, which is $10000. An agent budgets from the first
         number and is charged the second.
         Fix: Quote 10000 atomic units for $0.01 of USDC (6 decimals), or
         correct the declared price.
```

## Why

An x402 API states its price twice.

Once in the OpenAPI discovery document, in decimal USD:

```json
"x-payment-info": { "price": { "mode": "fixed", "currency": "USD", "amount": "0.010000" } }
```

Once in the `402` challenge it returns at the door, in the settlement token's
atomic units:

```json
"accepts": [{ "amount": "10000", "asset": "0x8335...2913", "network": "eip155:8453" }]
```

Different code writes them. Different units. Nothing forces them to agree.

Every other tool in this space validates the document, separately validates a
challenge, and reports on each. Both passes can be perfectly green while the two
describe different prices, different protection, or different call shapes, and
the failure only surfaces when an agent budgets from one and settles against the
other. This checks that fourth thing.

It also checks something no static validator can: whether the address in the
challenge can receive funds at all. A `payTo` of `0x0000...0000` passes every
schema in existence and burns the funds of the first agent that honours it. That
is what an unset environment variable looks like from the outside.

**Nothing here spends money.** Every probe is an ordinary unpaid request. A `402`
challenge is what a server hands any anonymous caller, so reading it is exactly
what a paying client does first.

## Install

```bash
npm install @nirholas/x402-conformance   # library
npx @nirholas/x402-conformance <origin>  # one-off audit, no install
```

Node 18+. Zero runtime dependencies. Runs in the browser too: the only platform
API it touches is `fetch`.

## CLI

```bash
x402-conformance <origin> [options]
```

| Option | Effect |
|---|---|
| `--json` | Full report as JSON |
| `--sarif` | SARIF 2.1.0, for code-scanning upload |
| `--out <file>` | Also write the chosen format to a file |
| `--probe <n>` | Probe `n` operations live (default 12) |
| `--probe-all` | Probe every declared operation |
| `--no-probe` | Read the document only, touch nothing live |
| `--baseline <file>` | Compare against a saved JSON report |
| `--fail-on <level>` | Exit 1 at `error` (default), `warn`, `any`, `never` |
| `--timeout <ms>` | Per-request timeout (default 10000) |
| `--verbose` | Include advisory notes |
| `--no-color` | Disable ANSI colour (also honours `NO_COLOR`) |

Exit codes: `0` clean, `1` findings at or above `--fail-on`, `2` the audit
itself could not run.

### Gate a deploy

```bash
x402-conformance https://your-api.example.com --fail-on error
```

### Catch regressions between deploys

An absolute grade is a one-off. A diff is a gate: a deploy that only fixes
things passes even while the score is still poor, and one that introduces a new
error fails even while the score is still good.

```bash
# once, on a known-good deploy
x402-conformance https://your-api.example.com --json --out baseline.json

# on every deploy after
x402-conformance https://your-api.example.com --baseline baseline.json
```

```
  Drift against baseline.json

  Score 96 -> 84 (-12)

  fixed    O11_SUMMARY_MISSING  /api/v1/news
  NEW      X03_PRICE_DISAGREES  /api/v1/ask  Document and challenge quote different prices
```

### Code scanning

```bash
x402-conformance https://your-api.example.com --sarif --out x402.sarif
```

Upload `x402.sarif` with whatever runs your CI. Each finding carries its rule
id, severity, the observed values, and the fix.

## Library

```ts
import { audit, renderText, diffReports } from '@nirholas/x402-conformance';

const report = await audit('https://your-api.example.com', { probeLimit: 20 });

console.log(renderText(report, { color: true }));
console.log(report.score);   // { value: 96, grade: 'A', errors: 0, warnings: 2, ... }

for (const finding of report.findings) {
  console.log(finding.code, finding.location.path, finding.fix);
}
```

### `audit(origin, options?)`

| Option | Default | Effect |
|---|---|---|
| `probeLimit` | `12` | How many operations to probe live |
| `probeAll` | `false` | Probe every declared operation |
| `documentOnly` | `false` | Skip the wire entirely |
| `timeoutMs` | `10000` | Per-request timeout |
| `fetchImpl` | `globalThis.fetch` | Injected for tests or for a proxied environment |
| `now` | current time | Injected so reports are reproducible |
| `userAgent` | package UA | Sent on every probe, so operators can identify the traffic |
| `onProgress` | none | `(phase, done, total)` for progress UI |

Probing 400 routes is slow and inconsiderate, and mostly re-tests one code path.
The default sample is chosen deterministically to maximise variety instead:
distinct price points first, then distinct methods, then distinct path families,
plus one free and one paid route so both protection-agreement failures are
reachable. Same input, same sample, every run.

The individual layers are exported too, if you want to run one against data you
already have: `auditDocument`, `auditOperations`, `auditChallenge`,
`readChallenge`, `crossCheck`, `scoreFindings`, `renderSarif`.

## What it checks

### Document versus wire

The layer that only exists here.

| Code | What it catches |
|---|---|
| `X01_PAID_BUT_NOT_GATED` | Advertised at a price, serves unpaid callers anyway. Fails registration as "expected 402, got 200" |
| `X02_FREE_BUT_GATED` | Advertised free, charges on call |
| `X03_PRICE_DISAGREES` | The two quotes are not the same number. Reported with the ratio, because it is usually a clean factor of a million |
| `X04_PRICE_RATIO_IMPLAUSIBLE` | The quotes do not differ by any power of ten, so one is simply wrong |
| `X05_PRICE_DECIMALS_IMPLAUSIBLE` | They only agree if the token has a decimal count no settlement token uses |
| `X06_DYNAMIC_PRICE_ABOVE_MAX` | A dynamic quote above the ceiling the document advertised |
| `X07_INPUT_SCHEMA_DIVERGES` | The document and the challenge describe different inputs |
| `X08_UNDOCUMENTED_CHALLENGE` | Returns a 402 the document never mentions |
| `X09_GATE_AFTER_VALIDATION` | Argument validation runs ahead of the payment gate, so a probe gets 400 |
| `X10_QUOTE_UNSTABLE` | A fixed price that changes between two identical calls |
| `X11_PAYTO_UNSTABLE` | The payment address changes between calls |
| `X12_NETWORKS_INCONSISTENT` | The surface settles on more than one chain |

The price check needs no asset registry. For any honest pair the atomic amount
is the USD price times a power of ten, and the exponent is the token's decimals.
A pair that yields a non-integer exponent is a real disagreement, not an unknown
token.

### Live payment challenges

| Code | What it catches |
|---|---|
| `R09_PAYTO_UNSPENDABLE` | Payment directed at the zero address or a known burn |
| `R06_AMOUNT_IS_DECIMAL` | `"0.01"` where atomic units belong: a millionfold underpayment |
| `R15_EIP3009_DOMAIN_MISSING` | Exact-EVM with no `extra.name`/`extra.version`, so a wallet signs the wrong EIP-712 domain and the transfer reverts |
| `R18/R19_SCHEMA_UNRESOLVABLE` | Schemas present in the body but not at the path a v1 or v2 reader resolves |
| `R01_VALIDATION_BEFORE_PAYMENT` | 400 to an argument-free probe |
| `R02_PROBE_BLOCKED` | 403 to an unpaid caller, usually a bot filter in front of the gate |
| `R12_NETWORK_NOT_CAIP2` | A bare chain name a CAIP-2 client cannot route |
| `R20_RESOURCE_URL_MISMATCH` | The challenge names a different resource than the one called |

...plus missing version, empty `accepts`, malformed amounts and addresses, and
implausible payment windows.

### Discovery document and declared operations

Missing `openapi`/`title`/`version`/`x-guidance`/`contact`, duplicate
`operationId`s, a `servers` list that points at another host, security schemes
referenced but never declared, non-ISO-4217 currencies, and per-operation:
unstructured prices, dynamic pricing with no bounds, missing input or output
schemas, undeclared 402s, and routes that never say whether they are free.

One systemic mistake across 400 operations is one problem to fix, so repeats
collapse into a rollup line rather than 400 identical findings, and the score
decays repeats rather than compounding them into an automatic F.

## Grading

Start at 100. Errors cost 12, warnings 3, notes 0.5, with each repeat of the
same code costing less than the last.

Two overrides, because some failures are not a matter of degree:

- **Capped at 65** by anything that costs a paying agent real money: an
  unspendable `payTo`, an amount in the wrong units, or the two prices
  disagreeing. However good the rest of the surface is, it cannot pass.
- **Zero** when there is nothing to grade: no discovery document, or no
  operations in it.

`A` 95+, `B` 85+, `C` 70+, `D` 50+, `F` below.

## Hosted

The same engine runs at [cryptocurrency.cv/x402/conformance](https://cryptocurrency.cv/x402/conformance),
and as an API:

```bash
curl 'https://cryptocurrency.cv/api/x402/conformance?origin=https://your-api.example.com'
curl 'https://cryptocurrency.cv/api/x402/conformance?origin=https://your-api.example.com&format=sarif'
```

## Related

- [x402scan discovery spec](https://x402scan.com/discovery/spec) — the contract this audits against
- [docs/x402scan-discovery.md](../../docs/x402scan-discovery.md) — how cryptocurrency.cv implements it

## License

SEE LICENSE IN LICENSE. The hosted API is free to use.
