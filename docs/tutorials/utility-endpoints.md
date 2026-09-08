# Utility & Meta Endpoints Tutorial

These are the endpoints you call to find out what the API is, what it knows, and whether it is healthy. Every one of them is free: no API key, no payment, and no browser `User-Agent`. A plain `curl` is the intended way to use them.

## Endpoints Covered

| Endpoint | Description | Tier |
|----------|-------------|------|
| `/api/health` | Health status, per-subsystem checks, build identity | Exempt |
| `/api/version` | Running commit, build time, Cloud Run revision | Exempt |
| `/api/stats` | Article and source statistics over the last 24 hours | Free tier |
| `/api/sources` | The full 358-source catalog | Free tier |
| `/api/sources/health` | Which feeds are actually answering | Free tier |
| `/api/news/categories` | Article categories, with source counts | Free tier |
| `/api/feeds` | Every RSS, Atom and JSON feed URL | Free tier |
| `/api/openapi.json` | OpenAPI 3.1 specification | Exempt |
| `/api/docs` | Swagger UI, rendered in the browser | Exempt |
| `/api/llms.txt`, `/api/llms-full.txt` | LLM-oriented API reference | Exempt |
| `/api/sample` | A tiny, uncached-free taste of the API | Exempt |

!!! warning "Endpoints that no longer exist"
    Earlier revisions of this tutorial documented `/api/status`, `/api/categories`,
    `/api/currencies`, `/api/languages`, `/api/config` and `/api/openapi`. None of
    those routes exist. Their replacements are in the table above:
    `/api/health` + `/api/version` cover status, `/api/news/categories` covers
    categories, and the spec is served at `/api/openapi.json`.

---

## 1. Health, version and deploy verification

Two endpoints answer "is it up?" and "what is running?". Both are exempt from rate limiting and from x402, so a monitor can poll them without a budget.

=== "cURL"
    ```bash
    # Full health report
    curl https://cryptocurrency.cv/api/health | jq

    # Just the top-level verdict
    curl -s https://cryptocurrency.cv/api/health | jq -r .status

    # Which commit is live
    curl https://cryptocurrency.cv/api/version | jq

    # Liveness probe: prints the HTTP status only
    curl -s -o /dev/null -w "%{http_code}\n" https://cryptocurrency.cv/api/health
    ```

=== "Python"
    ```python
    import requests

    BASE_URL = "https://cryptocurrency.cv"

    def check_health() -> dict:
        return requests.get(f"{BASE_URL}/api/health", timeout=10).json()

    def get_version() -> dict:
        return requests.get(f"{BASE_URL}/api/version", timeout=10).json()

    health = check_health()
    icons = {"healthy": "✅", "degraded": "⚠️", "unhealthy": "❌"}
    print(f"Status: {icons.get(health['status'], '❓')} {health['status'].upper()}")
    print(f"Uptime: {health['uptime']}s")

    for name, check in health["checks"].items():
        icon = icons.get(check["status"], "❓")
        print(f"  {icon} {name}: {check['status']} ({check.get('responseTime', 0)}ms)")
        if check.get("message"):
            print(f"      {check['message']}")

    feeds = health["checks"]["feeds"]
    print(f"\nCached articles: {feeds['articleCount']}")
    print(f"Newest article age: {feeds['newestAgeMinutes']} min")

    version = get_version()
    print(f"\nCommit:   {version['commit']}")
    print(f"Built at: {version['builtAt']}")
    print(f"Revision: {version['revision']}")
    ```

=== "JavaScript"
    ```javascript
    const BASE_URL = 'https://cryptocurrency.cv';

    const checkHealth = () => fetch(`${BASE_URL}/api/health`).then((r) => r.json());
    const getVersion = () => fetch(`${BASE_URL}/api/version`).then((r) => r.json());

    const health = await checkHealth();
    const icons = { healthy: '✅', degraded: '⚠️', unhealthy: '❌' };

    console.log(`Status: ${icons[health.status]} ${health.status.toUpperCase()}`);
    console.log(`Uptime: ${health.uptime}s`);

    for (const [name, check] of Object.entries(health.checks)) {
      console.log(`  ${icons[check.status]} ${name}: ${check.responseTime ?? 0}ms`);
    }

    const { commit, builtAt, revision } = await getVersion();
    console.log(`Commit ${commit} built ${builtAt} on revision ${revision}`);
    ```

### Reading the health response

```json
{
  "status": "healthy",
  "timestamp": "2026-08-28T03:14:52.656Z",
  "version": "1.0.10",
  "build": { "commit": "da46f180", "builtAt": "2026-08-28T02:40:11Z", "revision": "…" },
  "uptime": 2588,
  "checks": {
    "api": { "status": "healthy", "responseTime": 74 },
    "cache": { "status": "healthy", "message": "In-memory cache (no Redis or Vercel KV configured)" },
    "externalAPIs": { "status": "healthy", "responseTime": 74 },
    "feeds": {
      "status": "healthy",
      "articleCount": 1842,
      "newestPublishedAt": "2026-08-28T03:02:00.000Z",
      "newestAgeMinutes": 12,
      "responseTime": 0
    }
  }
}
```

Three things are worth knowing when you build alerting on this:

- **`feeds`** is the check that tells you whether news is actually flowing. It reports how many articles this instance has cached and how old the newest one is. `degraded` means either the instance has not aggregated yet (a cold start, before the first `/api/news` call fills the cache) or the newest cached article is more than 3 hours old. Alert on the second case, not the first.
- **`cache`** reports the in-memory cache as **healthy**. Running without Redis or Vercel KV is the designed single-instance mode, not a fault. A `degraded` or `unhealthy` cache means a Redis or Vercel KV that *is* configured is misbehaving. Do not page on "no Redis configured".
- **`x402Facilitator`** appears only when `X402_FACILITATOR_URL` or `X402_PAYMENT_ADDRESS` is set.

`/api/version` is the deploy-verification endpoint: `commit`, `builtAt`, `revision`, `service` and `region` are baked into the image at build time, so comparing `commit` against your git SHA proves a deploy actually landed. A locally-run dev server reports `"unknown"` and `null` for those fields, which is expected.

---

## 2. News sources

`/api/sources` is public and returns the whole catalog: all 358 feeds the aggregator reads, with no key and no token.

=== "cURL"
    ```bash
    # The full catalog
    curl https://cryptocurrency.cv/api/sources | jq

    # How many sources?
    curl -s https://cryptocurrency.cv/api/sources | jq '.count'

    # Just the names
    curl -s https://cryptocurrency.cv/api/sources | jq -r '.sources[].name'

    # Everything in one category
    curl -s https://cryptocurrency.cv/api/sources | jq '[.sources[] | select(.category=="defi")]'

    # Which feeds are actually answering right now
    curl https://cryptocurrency.cv/api/sources/health | jq
    ```

=== "Python"
    ```python
    import requests
    from collections import Counter

    BASE_URL = "https://cryptocurrency.cv"

    data = requests.get(f"{BASE_URL}/api/sources", timeout=15).json()
    sources = data["sources"]

    print(f"{data['count']} sources")

    by_category = Counter(s["category"] for s in sources)
    for category, count in by_category.most_common():
        print(f"  {category:16s} {count}")

    # Filter client-side: the catalog is small and cached for an hour
    defi = [s for s in sources if s["category"] == "defi"]
    for s in defi[:5]:
        print(f"{s['key']:20s} {s['name']:30s} tier={s.get('tier')}")
    ```

=== "JavaScript"
    ```javascript
    const res = await fetch('https://cryptocurrency.cv/api/sources');
    const { sources, count } = await res.json();

    console.log(`${count} sources`);

    const byCategory = sources.reduce((acc, s) => {
      acc[s.category] = (acc[s.category] ?? 0) + 1;
      return acc;
    }, {});
    console.table(byCategory);
    ```

Each entry carries `key`, `name`, `url`, `category`, `tier` and `status`:

```json
{
  "sources": [
    {
      "key": "coindesk",
      "name": "CoinDesk",
      "url": "https://www.coindesk.com/arc/outboundfeeds/rss/",
      "category": "general",
      "tier": "tier2",
      "status": "unknown"
    }
  ],
  "count": 358,
  "statusChecked": false
}
```

`status` is `"unknown"` and `statusChecked` is `false` because the catalog is returned without probing anything. Use `key` as the value for `?source=` on `/api/news`.

!!! note "Only the live probe needs a token"
    `GET /api/sources?status=true` fires a HEAD request at all 358 feeds, so it stays behind an HMAC token:

    ```bash
    curl "https://cryptocurrency.cv/api/sources?status=true&token=$SOURCES_TOKEN"
    ```

    Without the token it answers `403 INVALID_TOKEN` and tells you to drop the parameter. For per-feed availability with no token at all, use `GET /api/sources/health`.

---

## 3. Categories

Categories live at `/api/news/categories`, not `/api/categories`.

=== "cURL"
    ```bash
    curl https://cryptocurrency.cv/api/news/categories | jq

    # Just the ids you can pass to ?category=
    curl -s https://cryptocurrency.cv/api/news/categories | jq -r '.categories[].id'

    # Categories with the most sources behind them
    curl -s https://cryptocurrency.cv/api/news/categories \
      | jq '.categories | sort_by(-.sourceCount) | .[0:5]'
    ```

=== "Python"
    ```python
    import requests

    data = requests.get("https://cryptocurrency.cv/api/news/categories", timeout=10).json()

    for c in sorted(data["categories"], key=lambda c: -c["sourceCount"]):
        print(f"{c['id']:16s} {c['sourceCount']:4d}  {c['description']}")

    # Then use an id to filter the feed
    news = requests.get(
        "https://cryptocurrency.cv/api/news",
        params={"category": "institutional", "limit": 5},
        timeout=10,
    ).json()
    for a in news["articles"]:
        print(a["title"])
    ```

Response:

```json
{
  "categories": [
    { "id": "general", "name": "General", "description": "Broad crypto industry news", "sourceCount": 31 },
    { "id": "institutional", "name": "Institutional", "description": "VC and institutional investor insights", "sourceCount": 21 }
  ],
  "usage": {
    "example": "/api/news?category=institutional",
    "description": "Use the category parameter to filter news by category"
  }
}
```

---

## 4. Statistics

`/api/stats` summarises the last 24 hours: how many articles arrived, from which sources, in which categories, and at what hours.

=== "cURL"
    ```bash
    curl https://cryptocurrency.cv/api/stats | jq '.summary'

    # Top 10 sources by article count
    curl -s https://cryptocurrency.cv/api/stats | jq '.bySource[0:10]'

    # Busiest hour
    curl -s https://cryptocurrency.cv/api/stats \
      | jq '.hourlyDistribution | max_by(.count)'
    ```

=== "Python"
    ```python
    import requests

    stats = requests.get("https://cryptocurrency.cv/api/stats", timeout=15).json()
    s = stats["summary"]

    print(f"{s['totalArticles']} articles in the last {s['timeRange']}")
    print(f"{s['activeSources']} of {s['totalSources']} sources active")
    print(f"~{s['avgArticlesPerHour']} articles/hour")

    print("\nTop sources:")
    for entry in stats["bySource"][:10]:
        print(f"  {entry['source']:24s} {entry['articleCount']:4d}  ({entry['percentage']}%)")
    ```

The response shape is `{ summary, bySource, byCategory, hourlyDistribution, fetchedAt }`. `summary` carries `totalArticles`, `activeSources`, `totalSources`, `avgArticlesPerHour` and `timeRange`.

---

## 5. Feeds

`/api/feeds` lists every syndication URL the site publishes, one set per indexed category.

=== "cURL"
    ```bash
    curl https://cryptocurrency.cv/api/feeds | jq

    # Every RSS URL
    curl -s https://cryptocurrency.cv/api/feeds | jq -r '.feeds[].rss'

    # Fetch one of them, capped at 20 items
    curl "https://cryptocurrency.cv/api/rss?category=defi&limit=20"
    ```

Each feed entry carries an `rss`, `atom` and `json` URL. Append `&limit=N` (max 50) to any of them.

The site-wide feeds live at the root and publish **50 items** each, with no key required:

```bash
curl https://cryptocurrency.cv/feed.xml     # RSS 2.0
curl https://cryptocurrency.cv/feed.json    # JSON Feed 1.1
```

These are not subject to the free-tier article cap that applies to `/api/news`.

---

## 6. Discovery: OpenAPI, docs and llms.txt

Everything an agent needs to work out what this API can do, without paying to read the manual.

=== "cURL"
    ```bash
    # The OpenAPI 3.1 spec
    curl https://cryptocurrency.cv/api/openapi.json | jq

    # Every path in the spec
    curl -s https://cryptocurrency.cv/api/openapi.json | jq -r '.paths | keys[]'

    # How many endpoints?
    curl -s https://cryptocurrency.cv/api/openapi.json | jq '.paths | length'

    # LLM-oriented reference (plain text, no parsing needed)
    curl https://cryptocurrency.cv/api/llms.txt
    curl https://cryptocurrency.cv/api/llms-full.txt
    ```

=== "Python"
    ```python
    import requests

    spec = requests.get("https://cryptocurrency.cv/api/openapi.json", timeout=20).json()

    print(f"{spec['info']['title']} {spec['info']['version']}")
    print(f"{len(spec['paths'])} paths")

    # Which endpoints take a `category` parameter?
    for path, ops in spec["paths"].items():
        for method, op in ops.items():
            names = {p.get("name") for p in op.get("parameters", [])}
            if "category" in names:
                print(f"{method.upper():5s} {path}")
                break
    ```

`/api/docs` serves Swagger UI in the browser, driven by the same spec. Open <https://cryptocurrency.cv/api/docs> to click through it.

`/api/sample` returns a deliberately tiny payload (2 headlines and 2 prices) plus pricing information. It is the "what does this thing even return" endpoint, useful for a first call from an agent that has no context.

---

## 7. A monitoring script you can actually run

```python
#!/usr/bin/env python3
"""Poll the free utility endpoints and print a one-screen status board."""

import sys
import requests

BASE_URL = "https://cryptocurrency.cv"
TIMEOUT = 15
ICONS = {"healthy": "✅", "degraded": "⚠️", "unhealthy": "❌"}


def get(path: str) -> dict:
    response = requests.get(f"{BASE_URL}{path}", timeout=TIMEOUT)
    response.raise_for_status()
    return response.json()


def main() -> int:
    health = get("/api/health")
    version = get("/api/version")
    stats = get("/api/stats")
    sources = get("/api/sources")

    print("=" * 60)
    print(f"{ICONS.get(health['status'], '❓')}  {health['status'].upper()}")
    print("=" * 60)

    print(f"\ncommit {version['commit']}  built {version['builtAt']}")
    print(f"revision {version['revision']}  uptime {health['uptime']}s")

    print("\nchecks:")
    for name, check in health["checks"].items():
        print(f"  {ICONS.get(check['status'], '❓')} {name:14s} {check['status']}")

    feeds = health["checks"]["feeds"]
    print(f"\ncached articles: {feeds['articleCount']}")
    print(f"newest article:  {feeds['newestAgeMinutes']} min old")

    summary = stats["summary"]
    print(f"\n{summary['totalArticles']} articles / {summary['timeRange']}")
    print(f"{summary['activeSources']}/{summary['totalSources']} sources active")
    print(f"{sources['count']} sources in the catalog")

    # Non-zero exit so a cron or a CI job can gate on it
    return 0 if health["status"] == "healthy" else 1


if __name__ == "__main__":
    sys.exit(main())
```

Run it as often as you like: `/api/health` and `/api/version` are exempt from rate limiting, and `/api/stats` and `/api/sources` are free-tier routes with a 120 requests/hour per-IP budget.

---

## Next Steps

- [News Basics](news-basics.md) - Get started with news endpoints
- [API Reference](../API.md) - Complete API documentation, including the access model and rate limits
- [News Sources](../SOURCES.md) - The catalog behind `/api/sources`
- [Examples](https://github.com/nirholas/cryptocurrency.cv/blob/main/examples/README.md) - Runnable code in several languages
