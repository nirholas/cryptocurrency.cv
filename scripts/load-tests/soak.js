/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import http from 'k6/http';
import { check } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Custom metrics
const errorRate = new Rate('error_rate');
const apiLatency = new Trend('api_latency', true);
const cacheHits = new Counter('cache_hits');
const memoryUsage = new Gauge('memory_usage_mb');
const memoryGrowthRate = new Trend('memory_growth_rate_mb');
const connectionPoolActive = new Gauge('connection_pool_active');

// Memory tracking state
let previousMemoryMb = 0;
let memoryCheckCount = 0;

export const options = {
  scenarios: {
    soak_traffic: {
      executor: 'constant-arrival-rate',
      rate: 50,
      timeUnit: '1s',
      duration: '24h',
      preAllocatedVUs: 100,
      maxVUs: 500,
      exec: 'soakTraffic',
    },
    health_monitor: {
      executor: 'constant-arrival-rate',
      rate: 1,
      timeUnit: '30s',  // 1 check every 30 seconds
      duration: '24h',
      preAllocatedVUs: 1,
      maxVUs: 2,
      exec: 'healthMonitor',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<3000'],
    error_rate: ['rate<0.001'],
    http_req_failed: ['rate<0.001'],
    api_latency: ['p(95)<2000', 'p(99)<3000'],
    memory_usage_mb: ['value<2048'],  // Alert if memory exceeds 2GB
  },
};

const ENDPOINTS = [
  { url: '/api/news', weight: 30 },
  { url: '/api/news?category=bitcoin', weight: 15 },
  { url: '/api/news?category=ethereum', weight: 10 },
  { url: '/api/prices/bitcoin', weight: 15 },
  { url: '/api/prices/ethereum', weight: 5 },
  { url: '/api/market/fear-greed', weight: 8 },
  { url: '/api/defi/tvl', weight: 5 },
  { url: '/api/derivatives/funding-rates', weight: 4 },
  { url: '/api/search?q=bitcoin', weight: 5 },
  { url: '/api/search?q=ethereum', weight: 3 },
];

// Build weighted endpoint selection
const WEIGHTED_ENDPOINTS = [];
for (const ep of ENDPOINTS) {
  for (let i = 0; i < ep.weight; i++) {
    WEIGHTED_ENDPOINTS.push(ep.url);
  }
}

function trackResponse(res, endpointName) {
  const success = res.status === 200;
  errorRate.add(!success);
  apiLatency.add(res.timings.duration);

  const cacheHeader = res.headers['X-Cache'] || res.headers['x-cache'] || '';
  if (cacheHeader.toLowerCase() === 'hit') {
    cacheHits.add(1);
  }

  check(res, {
    [`${endpointName} status 200`]: (r) => r.status === 200,
    [`${endpointName} response time < 3s`]: (r) => r.timings.duration < 3000,
    [`${endpointName} has body`]: (r) => r.body && r.body.length > 0,
  });
}

export function soakTraffic() {
  const endpoint = WEIGHTED_ENDPOINTS[Math.floor(Math.random() * WEIGHTED_ENDPOINTS.length)];
  const res = http.get(`${BASE_URL}${endpoint}`, {
    tags: { name: 'soak' },
  });
  trackResponse(res, endpoint);
}

export function healthMonitor() {
  const res = http.get(`${BASE_URL}/api/health`, {
    tags: { name: 'health_monitor' },
  });

  const success = check(res, {
    'health endpoint returns 200': (r) => r.status === 200,
    'health endpoint responds < 1s': (r) => r.timings.duration < 1000,
  });

  if (success && res.body) {
    try {
      const healthData = JSON.parse(res.body);

      // Track memory usage
      if (healthData.memoryUsage) {
        const heapUsedMb = (healthData.memoryUsage.heapUsed || 0) / (1024 * 1024);
        const rssMb = (healthData.memoryUsage.rss || 0) / (1024 * 1024);
        const currentMemoryMb = rssMb || heapUsedMb;

        memoryUsage.add(currentMemoryMb);

        // Track memory growth rate
        if (previousMemoryMb > 0) {
          const growth = currentMemoryMb - previousMemoryMb;
          memoryGrowthRate.add(growth);

          // Check for potential memory leak (>50MB growth per check)
          check(null, {
            'no memory leak detected': () => growth < 50,
          });
        }
        previousMemoryMb = currentMemoryMb;
        memoryCheckCount++;

        // After 10 checks, verify memory is not continuously growing
        if (memoryCheckCount > 10) {
          check(null, {
            'memory within bounds': () => currentMemoryMb < 2048,
          });
        }
      }

      // Track connection pool if available
      if (healthData.connections) {
        const active = healthData.connections.active || healthData.connections.total || 0;
        connectionPoolActive.add(active);

        check(null, {
          'connection pool not exhausted': () => active < 1000,
        });
      }
    } catch (_e) {
      // Health endpoint may not return JSON with memory info
    }
  }
}

export function handleSummary(data) {
  const durationHours = 24;
  const summary = {
    timestamp: new Date().toISOString(),
    scenario: 'soak-test',
    duration: `${durationHours}h`,
    metrics: {
      http_req_duration_p95: data.metrics.http_req_duration?.values?.['p(95)'],
      http_req_duration_p99: data.metrics.http_req_duration?.values?.['p(99)'],
      http_req_duration_avg: data.metrics.http_req_duration?.values?.avg,
      http_req_failed: data.metrics.http_req_failed?.values?.rate,
      error_rate: data.metrics.error_rate?.values?.rate,
      api_latency_p95: data.metrics.api_latency?.values?.['p(95)'],
      api_latency_p99: data.metrics.api_latency?.values?.['p(99)'],
      cache_hits: data.metrics.cache_hits?.values?.count,
      total_requests: data.metrics.http_reqs?.values?.count,
      rps: data.metrics.http_reqs?.values?.rate,
      memory_usage_mb_final: data.metrics.memory_usage_mb?.values?.value,
      memory_growth_avg: data.metrics.memory_growth_rate_mb?.values?.avg,
    },
    analysis: {
      memoryLeakSuspected:
        (data.metrics.memory_growth_rate_mb?.values?.avg || 0) > 1,
      highErrorRate:
        (data.metrics.error_rate?.values?.rate || 0) > 0.001,
      latencyDegradation:
        (data.metrics.http_req_duration?.values?.['p(99)'] || 0) > 3000,
    },
  };

  return {
    stdout: JSON.stringify(summary, null, 2) + '\n',
  };
}
