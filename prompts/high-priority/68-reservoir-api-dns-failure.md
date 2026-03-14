# 68 — Fix Reservoir API DNS Resolution Failure (ENOTFOUND)

## Goal

Fix the massive volume of `ENOTFOUND` errors for `api.reservoir.tools` during Vercel builds. This is the highest-volume error in the build log (~50+ occurrences) and may significantly slow down builds.

## Context

- **API:** Reservoir (NFT aggregation API)
- **Adapter:** `src/lib/providers/adapters/nft-market/reservoir.adapter.ts`
- **Additional usage:** `src/lib/apis/nft-markets.ts`
- **Provider chain:** NFT Market Chain (fallback: OpenSea → Reservoir → SimpleHash)
- **Error type:** DNS resolution failure — the domain `api.reservoir.tools` does not resolve

### Build Errors (50+ occurrences)

```
Reservoir API request failed: TypeError: fetch failed
  [cause]: Error: getaddrinfo ENOTFOUND api.reservoir.tools
    errno: -3008,
    code: 'ENOTFOUND',
    syscall: 'getaddrinfo',
    hostname: 'api.reservoir.tools'
```

### Root Cause

Reservoir shut down their public API. The domain `api.reservoir.tools` no longer resolves. Every NFT-related page triggers multiple failed fetch attempts to this dead endpoint, massively polluting the build log.

## Task

### Step 1: Confirm Reservoir API Is Dead

```bash
dig api.reservoir.tools
nslookup api.reservoir.tools
curl -sI https://api.reservoir.tools/
```

### Step 2: Disable or Remove Reservoir Adapter

If the API is confirmed dead:

**Option A — Disable the adapter** (quick fix):

In `src/lib/providers/adapters/nft-market/reservoir.adapter.ts`, either:
- Set it to always throw a descriptive error immediately (no network call)
- Remove it from the fallback chain in the NFT market provider index

**Option B — Remove the adapter entirely** (clean fix):
- Delete `reservoir.adapter.ts`
- Remove Reservoir from the provider chain in the NFT market index
- Update any direct imports of the Reservoir adapter

### Step 3: Update NFT Market Chain

In the NFT market provider chain index file, remove Reservoir from the fallback order:

```typescript
// Before: OpenSea → Reservoir → SimpleHash
// After:  OpenSea → SimpleHash
```

### Step 4: Clean Up Direct Usage

Check `src/lib/apis/nft-markets.ts` for any direct Reservoir API calls outside the provider chain and remove/replace them.

### Step 5: Find Replacement (Optional)

If NFT data coverage suffers, consider adding a replacement adapter:
- **Alchemy NFT API** — `https://docs.alchemy.com/reference/nft-api-quickstart`
- **Moralis NFT API** — `https://docs.moralis.io/web3-data-api/evm/nft-api`

## Files to Modify

- `src/lib/providers/adapters/nft-market/reservoir.adapter.ts` — disable or delete
- `src/lib/providers/adapters/nft-market/index.ts` — remove from chain
- `src/lib/apis/nft-markets.ts` — remove direct Reservoir references

## Acceptance Criteria

- [ ] Zero `ENOTFOUND api.reservoir.tools` errors in build log
- [ ] NFT pages still render (via OpenSea/SimpleHash fallback)
- [ ] Build time improves (no more 50+ failed DNS lookups)
- [ ] No dead code referencing Reservoir left in codebase
