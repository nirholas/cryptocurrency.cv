# Gas Estimation APIs

> Real-time gas price estimation for Ethereum, Base, Arbitrum, Optimism and Polygon.

---

## eth_feeHistory (public JSON-RPC)

| | |
|---|---|
| **Method** | [`eth_feeHistory`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_feehistory) (EIP-1559) |
| **Key Required** | No |
| **Networks** | Ethereum, Base, Arbitrum, Optimism, Polygon |
| **Env Vars (optional)** | `ETHEREUM_RPC_URL`, `BASE_RPC_URL`, `ARBITRUM_RPC_URL`, `OPTIMISM_RPC_URL`, `POLYGON_RPC_URL` |

Gas tiers are derived from what the last 20 blocks actually paid: the median
priority fee at the 10th / 50th / 90th / 99th percentile is added to the base
fee of the next block (`slow` / `standard` / `fast` / `instant`; `instant` also
budgets a 12.5% base-fee rise). Each network fails over across several public
RPCs (publicnode, dRPC and the chain's official endpoint); set the matching
env var to put your own node first. Source:
`src/lib/providers/adapters/gas/fee-history.adapter.ts`.

This replaced Blocknative, whose gas API shut down on 2026-06-19 (thanks to
@cmdenney for the report in issue #44).

**Used by:** `/api/gas` (Ethereum fallback after Etherscan), `/api/v1/gas` (all networks).

---

## Polygon Gas Station

| | |
|---|---|
| **Base URL** | `https://gasstation.polygon.technology/v2` |
| **Key Required** | No |

**Used Endpoints:**

| Endpoint | Purpose |
|---|---|
| `GET /v2` | Polygon gas estimates |
