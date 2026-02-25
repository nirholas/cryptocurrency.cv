# Prompt 06: Load Testing & Chaos Engineering

## Context

The codebase has two existing load test scripts:
- `scripts/load-test.js` — basic K6 load test script
- `scripts/load-test-1m.js` — aspirational 1M user load test

Current scaling targets from `docs/SCALABILITY.md`:
- 10K users → Basic caching + CDN
- 100K users → Redis cluster + read replicas
- 1M users → Multi-region + sharding
- 10M users → Custom edge compute

The infrastructure includes:
- `docker-compose.scale.yml` — horizontal scaling with 3 API replicas + Nginx load balancer
- `nginx.conf` — proxy cache, rate limiting, upstream configuration
- 5-layer cache stack (CDN → Nginx → Redis → In-memory → Disk)
- Rate limiting: anonymous 60/min, free 200/min, pro 1K/min, enterprise 10K/min

## Task

### 1. Replace K6 Scripts with Comprehensive Test Suite

Create `scripts/load-tests/` directory:

#### `scripts/load-tests/baseline.js` — Normal Traffic Profile

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const errorRate = new Rate('errors');
const latency = new Trend('api_latency', true);
const cacheHits = new Counter('cache_hits');

export const options = {
  scenarios: {
    // Simulate realistic traffic mix
    news_readers: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },   // ramp up
        { duration: '5m', target: 500 },   // sustained load
        { duration: '2m', target: 1000 },  // peak
        { duration: '5m', target: 1000 },  // sustained peak
        { duration: '2m', target: 0 },     // ramp down
      ],
      exec: 'newsReader',
    },
    price_checkers: {
      executor: 'constant-arrival-rate',
      rate: 200,
      timeUnit: '1s',
      duration: '15m',
      preAllocatedVUs: 100,
      exec: 'priceChecker',
    },
    api_users: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      stages: [
        { duration: '5m', target: 50 },
        { duration: '5m', target: 100 },
        { duration: '5m', target: 50 },
      ],
      preAllocatedVUs: 200,
      exec: 'apiUser',
    },
  },
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<2000'],
    'errors': ['rate<0.01'],       // <1% error rate
    'cache_hits': ['count>1000'],  // cache must be working
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

const NEWS_ENDPOINTS = [
  '/api/news',
  '/api/news?category=bitcoin',
  '/api/news?category=ethereum',
  '/api/news?category=defi',
  '/api/news?limit=50',
];

const PRICE_ENDPOINTS = [
  '/api/prices/bitcoin',
  '/api/prices/ethereum',
  '/api/prices?ids=bitcoin,ethereum,solana',
  '/api/market/fear-greed',
];

const DEEP_ENDPOINTS = [
  '/api/defi/tvl',
  '/api/derivatives/funding-rates',
  '/api/onchain/gas',
  '/api/market/dominance',
  '/api/social/trending',
  '/api/search?q=bitcoin',
];

export function newsReader() {
  const url = NEWS_ENDPOINTS[Math.floor(Math.random() * NEWS_ENDPOINTS.length)];
  const res = http.get(`${BASE_URL}${url}`);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'has content-type': (r) => r.headers['Content-Type'] !== undefined,
  });

  errorRate.add(res.status !== 200);
  latency.add(res.timings.duration);
  if (res.headers['X-Cache'] === 'HIT') cacheHits.add(1);

  sleep(Math.random() * 3 + 1); // 1-4s think time
}

export function priceChecker() {
  const url = PRICE_ENDPOINTS[Math.floor(Math.random() * PRICE_ENDPOINTS.length)];
  const res = http.get(`${BASE_URL}${url}`);

  check(res, {
    'price status 200': (r) => r.status === 200,
    'price response < 200ms': (r) => r.timings.duration < 200,
  });

  errorRate.add(res.status !== 200);
  latency.add(res.timings.duration);
}

export function apiUser() {
  // Mix of endpoints — heavy users hit everything
  const endpoints = [...NEWS_ENDPOINTS, ...PRICE_ENDPOINTS, ...DEEP_ENDPOINTS];
  const url = endpoints[Math.floor(Math.random() * endpoints.length)];
  const res = http.get(`${BASE_URL}${url}`, {
    headers: { 'X-API-Key': __ENV.API_KEY || '' },
  });

  check(res, {
    'api status ok': (r) => r.status === 200 || r.status === 429,
    'rate limit returns retry-after': (r) =>
      r.status !== 429 || r.headers['Retry-After'] !== undefined,
  });

  errorRate.add(res.status >= 500);
  latency.add(res.timings.duration);
  sleep(0.5);
}
```

#### `scripts/load-tests/breaking-news-spike.js` — Breaking News Event

Simulates a sudden 10x traffic spike (e.g., major exchange hack):

```javascript
export const options = {
  scenarios: {
    // Normal baseline
    normal_traffic: {
      executor: 'constant-vus',
      vus: 50,
      duration: '20m',
      exec: 'normalTraffic',
    },
    // Spike at 5 min mark — simulates everyone refreshing
    breaking_news_spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5m', target: 0 },      // quiet
        { duration: '30s', target: 2000 },   // sudden spike
        { duration: '3m', target: 2000 },    // sustained frenzy
        { duration: '2m', target: 500 },     // settling
        { duration: '5m', target: 100 },     // back to normal
      ],
      exec: 'breakingNewsTraffic',
    },
    // WebSocket reconnection storm
    ws_reconnect_storm: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5m', target: 0 },
        { duration: '1m', target: 500 },     // everyone reconnects
        { duration: '5m', target: 500 },
      ],
      exec: 'websocketReconnect',
    },
  },
  thresholds: {
    'http_req_duration': ['p(95)<3000'],      // relaxed during spike
    'errors': ['rate<0.05'],                   // allow 5% errors during spike
    'ws_connecting': ['p(95)<5000'],
  },
};
```

#### `scripts/load-tests/soak.js` — 24-Hour Soak Test

Detects memory leaks, connection pool exhaustion, Redis connection buildup:

```javascript
export const options = {
  scenarios: {
    sustained_load: {
      executor: 'constant-arrival-rate',
      rate: 50,
      timeUnit: '1s',
      duration: '24h',
      preAllocatedVUs: 100,
      maxVUs: 200,
    },
  },
  thresholds: {
    'http_req_duration': ['p(99)<3000'],
    'errors': ['rate<0.001'],         // stricter — 0.1% over 24h
    'http_req_failed': ['rate<0.001'],
  },
};
// Also collect memory/CPU metrics from /api/health every 60s
```

### 2. Chaos Engineering

#### `scripts/chaos/upstream-failure.sh`

Simulate upstream API failures (CoinGecko down, Etherscan rate-limited):

```bash
#!/bin/bash
# Block CoinGecko for 5 minutes — tests circuit breaker + fallback
echo "Blocking api.coingecko.com..."
iptables -A OUTPUT -d api.coingecko.com -j DROP

sleep 300

echo "Restoring CoinGecko..."
iptables -D OUTPUT -d api.coingecko.com -j DROP
```

#### `scripts/chaos/redis-failure.sh`

Simulate Redis outage — cache layer 3 fails and system should still serve from CDN/Nginx/disk:

```bash
#!/bin/bash
echo "Pausing Redis container..."
docker pause redis

# Run load test during outage
k6 run scripts/load-tests/baseline.js --duration 5m

echo "Resuming Redis..."
docker unpause redis
```

#### `scripts/chaos/network-latency.sh`

Inject 500ms latency to upstream APIs:

```bash
#!/bin/bash
# Requires tc (traffic control)
tc qdisc add dev eth0 root netem delay 500ms 100ms

sleep 600

tc qdisc del dev eth0 root
```

### 3. CI Integration

Add to GitHub Actions:

```yaml
# .github/workflows/load-test.yml
name: Load Test
on:
  schedule:
    - cron: '0 3 * * 1'  # weekly Monday 3am
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    services:
      redis:
        image: redis:7-alpine
        ports: ['6379:6379']
    steps:
      - uses: actions/checkout@v4
      - uses: grafana/k6-action@v0.3.1
        with:
          filename: scripts/load-tests/baseline.js
          flags: --out json=results.json
          cloud: false
        env:
          BASE_URL: http://localhost:3000
      - uses: actions/upload-artifact@v4
        with:
          name: load-test-results
          path: results.json
```

### 4. Performance Budget

Create `scripts/load-tests/budgets.json`:

```json
{
  "endpoints": {
    "/api/news": { "p95": 200, "p99": 500 },
    "/api/prices/*": { "p95": 100, "p99": 300 },
    "/api/market/*": { "p95": 300, "p99": 800 },
    "/api/defi/*": { "p95": 500, "p99": 1500 },
    "/api/search": { "p95": 500, "p99": 2000 }
  },
  "global": {
    "errorRate": 0.01,
    "cacheHitRate": 0.70,
    "maxConcurrentConnections": 10000,
    "maxRPS": 5000
  }
}
```

## Environment Variables

```bash
BASE_URL=http://localhost:3000
K6_PROMETHEUS_RW_SERVER_URL=http://localhost:9090/api/v1/write
API_KEY=test-key-for-load-tests
```

## Success Criteria

- [ ] 3 K6 test scripts created (baseline, spike, soak)
- [ ] Baseline test passes at 1000 VUs with p95 < 500ms
- [ ] Breaking news spike handles 2000 VUs with < 5% error rate
- [ ] Soak test runs 24h without memory growth > 50%
- [ ] Chaos scripts for upstream failure, Redis outage, network latency
- [ ] Circuit breakers activate within 10s of upstream failure
- [ ] System degrades gracefully to cached data during Redis outage
- [ ] GitHub Actions workflow for weekly load test
- [ ] Performance budgets defined and enforced
