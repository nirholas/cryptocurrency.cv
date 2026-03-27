# On-Chain / Blockchain Data APIs

> On-chain analytics, blockchain explorers, and whale tracking across Bitcoin, Ethereum, and multi-chain.

---

## Etherscan

| | |
|---|---|
| **Base URL** | `https://api.etherscan.io/api` |
| **Env Var** | `ETHERSCAN_API_KEY` |
| **Rate Limit** | 5 calls/sec |
| **Docs** | https://docs.etherscan.io/ |

**Used Endpoints:**

| Endpoint | Purpose | Source Files |
|---|---|---|
| `?module=gastracker&action=gasoracle` | Current gas prices | `src/app/api/gas/route.ts` |
| `?module=stats&action=ethsupply` | Total ETH supply | `src/app/api/on-chain/route.ts` |
| `?module=stats&action=ethsupply2` | ETH2 supply breakdown | `src/app/api/v1/onchain/route.ts` |
| `?module=account&action=txlist` | Transaction list for address | `src/app/api/whale-alerts/route.ts` |

**Unused Endpoints (high value):**

| Endpoint | Potential Use |
|---|---|
| `?module=account&action=balance` | Single address ETH balance |
| `?module=account&action=balancemulti` | Multi-address balance lookup |
| `?module=account&action=tokentx` | ERC-20 transfers — whale tracking |
| `?module=account&action=tokennfttx` | ERC-721 (NFT) transfers |
| `?module=account&action=token1155tx` | ERC-1155 transfers |
| `?module=account&action=txlistinternal` | Internal transactions |
| `?module=contract&action=getabi` | Contract ABI lookup |
| `?module=contract&action=getsourcecode` | Verified contract source |
| `?module=block&action=getblockreward` | Block reward data |
| `?module=stats&action=ethprice` | Latest ETH price |
| `?module=stats&action=nodecount` | Ethereum node count |
| `?module=stats&action=dailytxnfee` | Daily total gas fees |
| `?module=stats&action=dailyavggasprice` | Daily average gas price |
| `?module=stats&action=dailynetutilization` | Network utilization % |
| `?module=logs&action=getLogs` | Event log queries |
| `?module=token&action=tokeninfo` | Token metadata (name, supply, holders) |
| `?module=gastracker&action=gasestimate` | Gas estimate for confirmation time |

---

## Blockchain.info

| | |
|---|---|
| **Base URL** | `https://blockchain.info` |
| **Key Required** | No |
| **Rate Limit** | 30/min |

**Used Endpoints:**

| Endpoint | Purpose | Source Files |
|---|---|---|
| `GET /stats` | Bitcoin network stats | `src/app/api/on-chain/route.ts` |
| `GET /q/getblockcount` | Current block height | `src/app/api/on-chain/route.ts` |
| `GET /unconfirmed-transactions?format=json` | Mempool transactions | `src/app/api/whale-alerts/route.ts` |

**Unused Endpoints:**

| Endpoint | Potential Use |
|---|---|
| `GET /rawblock/{hash}` | Full block data with all transactions |
| `GET /rawtx/{txid}` | Transaction details |
| `GET /rawaddr/{address}` | Address balance & transactions |
| `GET /multiaddr?active={addrs}` | Multi-address lookup |
| `GET /balance?active={addrs}` | Multi-address balance |
| `GET /latestblock` | Latest block hash + height + time |
| `GET /ticker` | BTC price in multiple fiat currencies |
| `GET /charts/{chart-type}` | Chart data (market-price, hash-rate, tx-rate, mempool-size) |
| `GET /q/hashrate` | Current network hashrate |
| `GET /q/24hrbtcsent` | Total BTC sent in 24h |
| `GET /q/marketcap` | BTC market cap |
| `GET /q/totalbc` | Total BTC mined |

---

## Mempool.space

| | |
|---|---|
| **Base URL** | `https://mempool.space/api` |
| **Key Required** | No |
| **Rate Limit** | Unlimited |
| **Docs** | https://mempool.space/docs/api/rest |

**Used Endpoints:**

| Endpoint | Purpose | Source Files |
|---|---|---|
| `GET /v1/fees/recommended` | Recommended fee rates (fast/medium/slow) | `src/app/api/on-chain/route.ts` |
| `GET /blocks/tip/height` | Latest block height | `src/app/api/on-chain/route.ts` |

**Unused Endpoints (high value):**

| Endpoint | Potential Use |
|---|---|
| `GET /mempool` | Mempool stats (count, vsize, total fee) |
| `GET /mempool/txids` | All mempool transaction IDs |
| `GET /mempool/recent` | Recent mempool entries |
| `GET /v1/fees/mempool-blocks` | Projected next blocks with fee ranges |
| `GET /block/{hash}` | Full block details |
| `GET /block/{hash}/txs` | Transactions in a block |
| `GET /blocks/{startHeight}` | Block list from height |
| `GET /v1/mining/pools/{timePeriod}` | Mining pool rankings & hashrate share |
| `GET /v1/mining/pool/{slug}/hashrate` | Individual pool hashrate over time |
| `GET /v1/mining/hashrate/pools/{timePeriod}` | Hashrate distribution |
| `GET /v1/mining/difficulty-adjustments` | Difficulty adjustment history |
| `GET /tx/{txid}` | Transaction details |
| `GET /address/{address}` | Address info |
| `GET /v1/lightning/statistics` | Lightning Network stats (capacity, channels, nodes) |
| `GET /v1/lightning/nodes/rankings` | Top Lightning nodes |
| `GET /v1/lightning/nodes/{pubkey}` | Individual Lightning node |
| `GET /v1/prices` | Historical BTC price |

---

## Glassnode

| | |
|---|---|
| **Base URL** | `https://api.glassnode.com/v1` |
| **Env Var** | `GLASSNODE_API_KEY` |
| **Docs** | https://docs.glassnode.com/ |

**Used Endpoints:**

| Endpoint | Purpose | Source Files |
|---|---|---|
| `GET /metrics/{metric}` | Various on-chain metrics | `src/lib/apis/glassnode.ts` |
| `GET /metrics/distribution/balance_1pct_holders` | Top holder concentration | `src/lib/new-integrations.ts` |

---

## CryptoQuant

| | |
|---|---|
| **Base URL** | `https://api.cryptoquant.com/v1` |
| **Env Var** | `CRYPTOQUANT_API_KEY` |

**Used Endpoints:**

| Endpoint | Purpose | Source Files |
|---|---|---|
| `GET /btc/exchange-flows/netflow` | BTC exchange net inflow/outflow | `src/lib/apis/cryptoquant.ts`, `src/app/api/flows/route.ts` |

---

## IntoTheBlock

| | |
|---|---|
| **Base URL** | `https://api.intotheblock.com/v1` |
| **Env Var** | `INTOTHEBLOCK_API_KEY` |

**Used Endpoints:**

| Endpoint | Purpose | Source Files |
|---|---|---|
| `GET /ownership/{coin}` | Ownership concentration | `src/app/api/premium/alerts/whales/route.ts` |

---

## Blockchair

| | |
|---|---|
| **Base URL** | `https://api.blockchair.com` |
| **Key Required** | No |

**Used Endpoints:**

| Endpoint | Purpose | Source Files |
|---|---|---|
| `GET /{chain}/transactions` | Recent transactions for chain | `src/app/api/whale-alerts/route.ts` |
| `GET /ethereum/transactions` | Ethereum transactions | `src/app/api/v1/whale-alerts/route.ts` |
| `GET /bitcoin/transactions` | Bitcoin transactions | `src/app/api/whale-alerts/route.ts` |

---

## Whale Alert

| | |
|---|---|
| **Base URL** | `https://api.whale-alert.io/v1` |
| **Env Var** | `WHALE_ALERT_API_KEY` |

**Used Endpoints:**

| Endpoint | Purpose | Source Files |
|---|---|---|
| `GET /transactions` | Large crypto transactions | `src/app/api/premium/alerts/whales/route.ts` |
