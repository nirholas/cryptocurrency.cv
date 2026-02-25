/**
 * 1 M-User Scale Load Test
 *
 * Simulates traffic patterns expected at 1 million monthly active users:
 *   • ~350 req/s sustained (1 M users × ~30 requests/day ÷ 86 400 s)
 *   • Peak bursts of 1 500+ req/s during breaking-news events
 *   • Mixed read patterns: 60 % news, 20 % prices, 10 % search, 10 % other
 *   • Geographic spread simulated via randomised think-time
 *
 * Prerequisites:
 *   brew install k6          # macOS
 *   sudo apt install k6      # Linux
 *
 * Usage:
 *   BASE_URL=https://your-domain.com k6 run scripts/load-test-1m.js
 *
 *   # Quick soak (5 min, 500 VUs)
 *   k6 run --vus 500 --duration 5m scripts/load-test-1m.js
 *
 *   # Full suite
 *   k6 run scripts/load-test-1m.js
 *
 * Docker:
 *   docker run -i -e BASE_URL=https://your-domain.com grafana/k6 run - < scripts/load-test-1m.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// =============================================================================
// CONFIG
// =============================================================================

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Custom metrics
const errorRate      = new Rate('error_rate');
const rateLimited    = new Counter('rate_limited_429');
const circuitOpen    = new Counter('circuit_open_503');
const cacheHitRate   = new Rate('cdn_cache_hit');
const newsDuration   = new Trend('news_p95_ms');
const priceDuration  = new Trend('prices_p95_ms');
const searchDuration = new Trend('search_p95_ms');
const wsConnections  = new Gauge('ws_active_connections');

export const options = {
  scenarios: {
    // ── Phase 1: Warm-up (validate health) ─────────────────────────────
    warmup: {
      executor: 'constant-vus',
      vus: 5,
      duration: '30s',
      startTime: '0s',
      tags: { phase: 'warmup' },
    },

    // ── Phase 2: Ramp to steady state (~350 RPS) ───────────────────────
    steady_state: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m',  target: 200 },   // ramp up
        { duration: '10m', target: 500 },   // sustained ~350 rps
        { duration: '2m',  target: 0 },     // ramp down
      ],
      startTime: '30s',
      tags: { phase: 'steady' },
    },

    // ── Phase 3: Breaking-news spike (1 500+ RPS) ──────────────────────
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 1500 },  // instant spike
        { duration: '2m',  target: 1500 },  // hold at peak
        { duration: '30s', target: 200 },   // settle back
        { duration: '2m',  target: 200 },   // hold at base
        { duration: '1m',  target: 0 },     // ramp down
      ],
      startTime: '15m',
      tags: { phase: 'spike' },
    },

    // ── Phase 4: Soak test (detect memory leaks / cache drift) ─────────
    soak: {
      executor: 'constant-vus',
      vus: 300,
      duration: '20m',
      startTime: '22m',
      tags: { phase: 'soak' },
    },
  },

  thresholds: {
    http_req_duration:  ['p(95)<800', 'p(99)<2000'],  // 95 % < 800 ms
    http_req_failed:    ['rate<0.02'],                 // < 2 % errors
    error_rate:         ['rate<0.02'],
    rate_limited_429:   ['count<500'],                 // Expected some 429s
    news_p95_ms:        ['p(95)<600'],
    prices_p95_ms:      ['p(95)<400'],
  },
};

// =============================================================================
// HELPERS
// =============================================================================

const JSON_HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'K6-ScaleTest/1.0',
};

function tag(response, endpoint) {
  // Track CDN cache hits via Vercel/Nginx headers
  const xCache = response.headers['X-Cache'] || response.headers['x-vercel-cache'] || '';
  if (xCache === 'HIT' || xCache === 'STALE') {
    cacheHitRate.add(1);
  } else {
    cacheHitRate.add(0);
  }

  if (response.status === 429) {
    rateLimited.add(1);
  }
  if (response.status === 503) {
    circuitOpen.add(1);
  }

  const ok = check(response, {
    [`${endpoint} status OK`]: (r) => r.status >= 200 && r.status < 300,
    [`${endpoint} < 1 s`]:     (r) => r.timings.duration < 1000,
  });

  if (!ok) errorRate.add(1);
  else errorRate.add(0);
}

function jitter(base) {
  // Simulate geographic spread: 0.2 – 1.5× the base think time
  return base * (0.2 + Math.random() * 1.3);
}

// =============================================================================
// MAIN VU FUNCTION
// =============================================================================

export default function () {
  const roll = Math.random();

  // ── 60 % of traffic → /api/news ──────────────────────────────────────
  if (roll < 0.60) {
    group('news', () => {
      const page = Math.random() < 0.3 ? '&page=2' : '';
      const r = http.get(`${BASE_URL}/api/news?limit=10${page}`, { headers: JSON_HEADERS, tags: { endpoint: 'news' } });
      newsDuration.add(r.timings.duration);
      tag(r, 'news');
    });
    sleep(jitter(1));
    return;
  }

  // ── 20 % → /api/prices ───────────────────────────────────────────────
  if (roll < 0.80) {
    group('prices', () => {
      const coins = ['bitcoin', 'ethereum', 'solana', 'cardano', 'polkadot'];
      const coin = coins[Math.floor(Math.random() * coins.length)];
      const r = http.get(`${BASE_URL}/api/prices?coins=${coin}`, { headers: JSON_HEADERS, tags: { endpoint: 'prices' } });
      priceDuration.add(r.timings.duration);
      tag(r, 'prices');
    });
    sleep(jitter(0.5));
    return;
  }

  // ── 10 % → /api/search ───────────────────────────────────────────────
  if (roll < 0.90) {
    group('search', () => {
      const queries = ['bitcoin halving', 'SEC ETF', 'ethereum merge', 'defi hack', 'solana outage'];
      const q = queries[Math.floor(Math.random() * queries.length)];
      const r = http.get(`${BASE_URL}/api/search?q=${encodeURIComponent(q)}`, { headers: JSON_HEADERS, tags: { endpoint: 'search' } });
      searchDuration.add(r.timings.duration);
      tag(r, 'search');
    });
    sleep(jitter(1.5));
    return;
  }

  // ── 10 % → mixed (trending, sentiment, health) ───────────────────────
  group('misc', () => {
    const endpoints = [
      '/api/trending',
      '/api/fear-greed',
      '/api/health',
      '/api/sentiment',
      '/api/market/global',
    ];
    const ep = endpoints[Math.floor(Math.random() * endpoints.length)];
    const r = http.get(`${BASE_URL}${ep}`, { headers: JSON_HEADERS, tags: { endpoint: ep } });
    tag(r, ep);
  });
  sleep(jitter(2));
}

// =============================================================================
// LIFECYCLE
// =============================================================================

export function setup() {
  const r = http.get(`${BASE_URL}/api/health`);
  if (r.status !== 200) {
    throw new Error(`API not reachable: status ${r.status}`);
  }
  console.log(`\n  Target:  ${BASE_URL}`);
  console.log(`  Health:  ${JSON.parse(r.body).status || 'unknown'}\n`);
  return { start: Date.now() };
}

export function teardown(data) {
  const s = ((Date.now() - data.start) / 1000).toFixed(1);
  console.log(`\n  Test completed in ${s} s\n`);
}

export function handleSummary(data) {
  const m = data.metrics;
  const fmt = (v) => (v != null ? v.toFixed(1) : 'N/A');

  const lines = [
    '',
    '═'.repeat(64),
    '  FREE CRYPTO NEWS — 1 M USER SCALE TEST RESULTS',
    '═'.repeat(64),
    '',
    `  Total requests ........  ${m.http_reqs?.values?.count || 0}`,
    `  Failed requests .......  ${fmt((m.http_req_failed?.values?.rate || 0) * 100)} %`,
    `  Rate-limited (429) ....  ${m.rate_limited_429?.values?.count || 0}`,
    `  Circuit-open (503) ....  ${m.circuit_open_503?.values?.count || 0}`,
    `  CDN cache hit rate ....  ${fmt((m.cdn_cache_hit?.values?.rate || 0) * 100)} %`,
    '',
    '  Response times (ms):',
    `    p50 ................  ${fmt(m.http_req_duration?.values?.['p(50)'])}`,
    `    p95 ................  ${fmt(m.http_req_duration?.values?.['p(95)'])}`,
    `    p99 ................  ${fmt(m.http_req_duration?.values?.['p(99)'])}`,
    '',
    '  Endpoint p95 (ms):',
    `    /api/news ..........  ${fmt(m.news_p95_ms?.values?.['p(95)'])}`,
    `    /api/prices ........  ${fmt(m.prices_p95_ms?.values?.['p(95)'])}`,
    `    /api/search ........  ${fmt(m.search_p95_ms?.values?.['p(95)'])}`,
    '',
    '═'.repeat(64),
    '',
  ];

  return {
    stdout: lines.join('\n'),
    'load-test-1m-results.json': JSON.stringify(data, null, 2),
  };
}
