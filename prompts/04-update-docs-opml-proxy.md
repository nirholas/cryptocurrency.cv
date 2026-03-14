# Prompt 04: Update Documentation, OPML Export, and RSS Proxy

## Goal
Remove all references to deleted content farm and fintech sources from documentation, the OPML export endpoint, and the RSS proxy allowlist. Keep everything consistent with the source removals from prompt 01.

## Changes

### 1. `docs/SOURCES.md` — Remove content farm entries

Remove these rows from the sources table:
- `| ZyCrypto | General | News, analysis |` (line ~37)
- `| Blockonomi | General | News, guides |` (line ~39)
- `| CoinGape | General | News, analysis |` (line ~44)

If any of these other removed sources appear, remove them too: CoinEdition, BitcoinWorld, Invezz, DailyCoin, CoinPedia, The Coin Republic, AMBCrypto, CryptoPotato, Crypto.news, Finextra, PYMNTS, Fintech Futures.

### 2. `src/app/api/opml/route.ts` — Remove from OPML feed list

The OPML route has a hardcoded `RSS_SOURCES` array (lines ~14-48). Remove these entries:
- `{ name: 'CoinEdition', url: 'https://coinedition.com/feed/', ... }` (line ~24)

Also check for and remove any other entries that match the removed sources list. The OPML export should only contain sources we actually serve.

### 3. `src/app/api/rss-proxy/route.ts` — Remove from allowed domains

Remove `'coingape.com'` from the `ALLOWED_DOMAINS` set (line ~35).

Also check for and remove any other domains belonging to removed sources. The remaining allowed domains should only be for sources we still serve.

### 4. `docs/EXTERNAL-API-ROUTES.md` — Remove feed references

Search for and remove any references to removed source URLs:
- CoinEdition feed URL (around line 1346)
- Any other removed source references

### 5. `docs/API.md` — Update quality filter documentation

Add documentation for the new `quality` query parameter (added in prompt 02):

Under the `/api/news` endpoint parameters section, add:

```
| quality  | string | no       | Quality filter: `premium` (T1 + research), `high` (T1 + T2 + research), `all` (default, all tiers) |
```

Add a usage example:
```
GET /api/news?quality=high&limit=20
```

Document the tier metadata fields in the response:
```
Each article now includes:
- `tier`: Source quality tier (tier1, tier2, tier3, research)
- `credibility`: Source credibility score (0-1)
- `reputation`: Source reputation score (0-100)
```

### 6. `chatgpt/openapi.yaml` — Update ChatGPT plugin spec

If the OpenAPI spec for the ChatGPT plugin lists available sources or categories, remove `fintech` category and any references to removed sources. Add the `quality` parameter to the news endpoint if appropriate.

### 7. Source count references

Search the codebase for references to "350+" or similar source counts. After removing ~15 sources, update these to reflect the accurate count. Common locations:
- `src/lib/crypto-news.ts` comment at top: "350+ sources" → update to actual count
- `README.md` and translated README files if they mention source counts
- `docs/` files

Do a quick `grep -r "350" src/ docs/` to find all occurrences.

## Verification
- `GET /api/opml` returns valid OPML without removed sources
- `docs/SOURCES.md` has no content farm references
- `docs/API.md` documents the quality filter
- `bun run build` passes

## Commit message
`docs: update documentation and exports after source cleanup`
