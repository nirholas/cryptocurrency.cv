# Prompt 01: Remove Content Farm & Fintech Sources

## Goal

Remove all low-quality content farm (tier4) and off-topic fintech sources from the codebase. These sources produce clickbait, rehashed content, and dilute our feed quality. We are keeping tier1, tier2, tier3, and research sources only.

## Sources to Remove

### Fintech (all 3 — off-topic, barely crypto-related)

- `finextra` — Finextra
- `pymnts` — PYMNTS Crypto
- `fintechfutures` — Fintech Futures

### Tier 4 Content Farms (all 12 — aggregators, content farms, low editorial standards)

- `coinedition` — CoinEdition
- `bitcoinworld` — BitcoinWorld
- `invezz` — Invezz Crypto
- `zycrypto` — ZyCrypto
- `dailycoin` — DailyCoin
- `coinpedia` — CoinPedia
- `coingape` — CoinGape
- `blockonomi` — Blockonomi
- `thecoinrepublic` — The Coin Republic
- `ambcrypto` — AMBCrypto
- `cryptopotato` — CryptoPotato
- `cryptonews` — Crypto.news

## Files to Edit

### 1. `src/lib/source-tiers.ts`

- Delete the entire `// Fintech` section (lines ~116-118): `finextra`, `pymnts`, `fintechfutures`
- Delete the entire `// Tier 4 — Aggregators & volume sources` section (lines ~89-95): `cryptonews`, `ambcrypto`, `cryptopotato`, `coinedition`, `bitcoinworld`, `invezz`
- Delete the entire `// Tier 4 — Volume / aggregator new sources` section (lines ~179-184): `coingape`, `coinpedia`, `blockonomi`, `zycrypto`, `dailycoin`, `thecoinrepublic`
- Remove `'tier4'` and `'fintech'` from the `SourceTier` type union (line ~33). It should become: `type SourceTier = 'tier1' | 'tier2' | 'tier3' | 'research';`
- Update the tier doc comment at the top to remove tier4 and fintech rows

### 2. `src/lib/crypto-news.ts`

Remove these entries from the `RSS_SOURCES` object:

- `coingape` (around line 223-225)
- `zycrypto` (around line 274-276)
- `blockonomi` (around line 284-286)
- `dailycoin` (around line 743-745)
- `coinpedia` (around line 748-750)
- `ambcrypto` (around line 193-196) — in the "Trading & Market Analysis" section
- `cryptopotato` (around line 120-124) — in the "TIER 2: Established News Sources" section
- `cryptonews` (around line 115-119) — in the "TIER 2: Established News Sources" section
- `coinedition` (around line 1075-1077)
- `bitcoinworld` (around line 1080-1082)
- `thecoinrepublic` (around line 1227-1229)
- `finextra` (around line 1359)
- `pymnts_crypto` (around line 1360)

Also in `crypto-news.ts`:

- Remove the `isFintechSource` import from `source-tiers` (line ~48)
- Remove all `isFintechSource()` usage in `calculateTrendingScore()` (around line 3626-3635) — remove the fintech penalty logic entirely; just use `return baseScore;`
- Remove fintech cap logic in the trending diversity section (around line 4048-4060) — remove `let fintechCount = 0`, the `isFintechSource()` check, and `exceedsFintechLimit`. Simplify to just the max-2-per-source cap.
- Remove fintech filter in `getHomepageNews()` if present (around line 4739)
- Remove `'fintech'` from any category arrays/enums if referenced

### 3. `src/app/api/rss-proxy/route.ts`

Remove `coingape.com` from the `ALLOWED_DOMAINS` set (line ~35)

### 4. `src/lib/source-credibility.ts`

Remove these from `SOURCE_BASELINES` (around lines 90-93):

- `cryptonews`
- `cryptopotato`
  (If any other removed sources appear here, remove them too)

## Important Notes

- Do NOT touch archive data (`archive/` folder) — historical articles stay for the record
- Do NOT touch import scripts (`scripts/archive/`) — they handle historical data
- Do NOT remove the `'fintech'` category from the news API schema yet — that happens in prompt 02
- After making changes, run `bun run build` to verify no import/type errors
- Run `bun run test` to see which tests need updating (handled in prompt 05)
- Commit message: `feat: remove content farm and fintech sources for quality focus`
