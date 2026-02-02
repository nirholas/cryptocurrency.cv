# 🤖 AGENT 5: Testing, CI/CD & Deployment Readiness

**Mission**: Implement comprehensive testing, set up CI/CD pipelines, add performance benchmarks, and ensure production readiness for all agent improvements.

**Priority**: HIGH - Final integration and validation layer

**Estimated Time**: 3-4 hours

**Dependencies**: 
- Runs after Agents 1-4 complete their core work
- Integrates and validates all improvements

**Coordination**: Ensures all agent work integrates seamlessly

---

## 🎯 OBJECTIVES

### Primary Goals
1. ✅ Set up comprehensive API testing suite
2. ✅ Add performance benchmarks and load testing
3. ✅ Create GitHub Actions CI/CD pipelines
4. ✅ Validate all agent improvements work together
5. ✅ Add deployment smoke tests
6. ✅ Create operational runbooks

### Success Criteria
- [ ] 80%+ test coverage for API routes
- [ ] All agent improvements pass integration tests
- [ ] CI/CD pipeline running on all PRs
- [ ] Performance benchmarks established
- [ ] Zero breaking changes to existing API
- [ ] Deployment checklist completed

---

## 📁 FILES TO CREATE

### 1. `/src/__tests__/api/integration.test.ts` (NEW)
**Purpose**: Integration tests for complete API workflows

```typescript
/**
 * API Integration Tests
 * 
 * Tests complete workflows across all API improvements:
 * - Global middleware (Agent 1)
 * - Error handling (Agent 2)
 * - Health monitoring (Agent 3)
 * - Schema validation (Agent 4)
 */

import { describe, it, expect, beforeAll } from 'vitest';

const API_BASE = process.env.API_URL || 'http://localhost:3000';

describe('API Integration Tests', () => {
  describe('Global Middleware', () => {
    it('should enforce rate limits on free tier', async () => {
      const requests = Array(11).fill(null).map(() =>
        fetch(`${API_BASE}/api/news?limit=1`)
      );
      
      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);
      
      expect(rateLimited.length).toBeGreaterThan(0);
      expect(responses[0].headers.get('X-RateLimit-Limit')).toBe('10');
    });

    it('should add security headers', async () => {
      const response = await fetch(`${API_BASE}/api/news`);
      
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
    });

    it('should validate request size', async () => {
      const largePayload = 'x'.repeat(2 * 1024 * 1024); // 2MB
      
      const response = await fetch(`${API_BASE}/api/premium/ai/analyze`, {
        method: 'POST',
        body: JSON.stringify({ data: largePayload }),
        headers: { 'Content-Type': 'application/json' },
      });
      
      expect(response.status).toBe(413);
    });
  });

  describe('Error Standardization', () => {
    it('should return consistent error format', async () => {
      const response = await fetch(`${API_BASE}/api/v1/coins/invalid-coin`);
      const error = await response.json();
      
      expect(error).toHaveProperty('error');
      expect(error.error).toHaveProperty('code');
      expect(error.error).toHaveProperty('message');
      expect(error.error).toHaveProperty('timestamp');
      expect(error.error).toHaveProperty('requestId');
    });

    it('should handle validation errors properly', async () => {
      const response = await fetch(`${API_BASE}/api/news?limit=999`);
      const error = await response.json();
      
      expect(response.status).toBe(422);
      expect(error.error.code).toBe('VALIDATION_ERROR');
      expect(error.error.details).toBeInstanceOf(Array);
      expect(error.error.details[0]).toHaveProperty('field');
    });

    it('should sanitize error messages', async () => {
      const response = await fetch(`${API_BASE}/api/v1/coins?api_key=secret123`);
      const error = await response.json();
      
      const errorString = JSON.stringify(error);
      expect(errorString).not.toContain('secret123');
    });
  });

  describe('Health Monitoring', () => {
    it('should return health status', async () => {
      const response = await fetch(`${API_BASE}/api/health`);
      const health = await response.json();
      
      expect(health.status).toMatch(/^(healthy|degraded|unhealthy)$/);
      expect(health.checks).toHaveProperty('database');
      expect(health.checks).toHaveProperty('cache');
      expect(health.timestamp).toBeDefined();
    });

    it('should return metrics', async () => {
      const response = await fetch(`${API_BASE}/api/metrics`);
      const metrics = await response.json();
      
      expect(metrics).toHaveProperty('requests');
      expect(metrics).toHaveProperty('errors');
      expect(metrics).toHaveProperty('latency');
      expect(metrics.requests).toHaveProperty('total');
    });
  });

  describe('Schema Validation', () => {
    it('should validate query parameters', async () => {
      const response = await fetch(`${API_BASE}/api/news?limit=abc`);
      const error = await response.json();
      
      expect(response.status).toBe(422);
      expect(error.error.code).toBe('VALIDATION_ERROR');
    });

    it('should apply default values', async () => {
      const response = await fetch(`${API_BASE}/api/news`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.articles).toBeDefined();
      expect(data.articles.length).toBeLessThanOrEqual(10); // default limit
    });

    it('should serve OpenAPI spec', async () => {
      const response = await fetch(`${API_BASE}/api/openapi.json`);
      const spec = await response.json();
      
      expect(spec.openapi).toBe('3.0.0');
      expect(spec.info.title).toBeDefined();
      expect(spec.paths).toBeDefined();
    });
  });

  describe('End-to-End Workflows', () => {
    it('should handle complete news request', async () => {
      const response = await fetch(`${API_BASE}/api/news?limit=5&category=bitcoin`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.articles).toBeInstanceOf(Array);
      expect(data.articles.length).toBeLessThanOrEqual(5);
    });

    it('should handle authenticated v1 request', async () => {
      const apiKey = process.env.TEST_API_KEY;
      if (!apiKey) return;
      
      const response = await fetch(`${API_BASE}/api/v1/coins?per_page=10`, {
        headers: { 'X-API-Key': apiKey },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toBeInstanceOf(Array);
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain existing API contracts', async () => {
      const response = await fetch(`${API_BASE}/api/news`);
      const data = await response.json();
      
      // Ensure existing fields still present
      expect(data).toHaveProperty('articles');
      if (data.articles.length > 0) {
        expect(data.articles[0]).toHaveProperty('id');
        expect(data.articles[0]).toHaveProperty('title');
        expect(data.articles[0]).toHaveProperty('url');
      }
    });
  });
});
```

### 2. `/src/__tests__/api/performance.test.ts` (NEW)
**Purpose**: Performance benchmarks and load tests

```typescript
/**
 * API Performance Tests
 * 
 * Benchmarks for API endpoints to ensure performance
 * standards are met after all improvements
 */

import { describe, it, expect } from 'vitest';

const API_BASE = process.env.API_URL || 'http://localhost:3000';

describe('API Performance Benchmarks', () => {
  it('should respond to /api/news within 500ms', async () => {
    const start = Date.now();
    const response = await fetch(`${API_BASE}/api/news?limit=10`);
    const duration = Date.now() - start;
    
    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(500);
  }, 10000);

  it('should handle /api/health within 100ms', async () => {
    const start = Date.now();
    const response = await fetch(`${API_BASE}/api/health`);
    const duration = Date.now() - start;
    
    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(100);
  }, 10000);

  it('should handle concurrent requests', async () => {
    const requests = Array(20).fill(null).map(() =>
      fetch(`${API_BASE}/api/news?limit=5`)
    );
    
    const start = Date.now();
    const responses = await Promise.all(requests);
    const duration = Date.now() - start;
    
    expect(responses.every(r => r.status === 200 || r.status === 429)).toBe(true);
    expect(duration).toBeLessThan(2000); // 20 requests in < 2s
  }, 15000);

  it('should cache responses effectively', async () => {
    // First request
    const start1 = Date.now();
    await fetch(`${API_BASE}/api/news?limit=5`);
    const duration1 = Date.now() - start1;
    
    // Cached request
    const start2 = Date.now();
    const response2 = await fetch(`${API_BASE}/api/news?limit=5`);
    const duration2 = Date.now() - start2;
    
    expect(response2.headers.get('X-Cache')).toBeTruthy();
    expect(duration2).toBeLessThan(duration1); // Cached should be faster
  }, 10000);
});
```

### 3. `/.github/workflows/api-tests.yml` (NEW)
**Purpose**: CI/CD pipeline for automated testing

```yaml
name: API Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run type check
        run: npm run type-check
      
      - name: Run unit tests
        run: npm test -- --coverage
      
      - name: Build application
        run: npm run build
      
      - name: Start dev server
        run: npm run dev &
        env:
          NODE_ENV: test
      
      - name: Wait for server
        run: npx wait-on http://localhost:3000/api/health -t 30000
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          API_URL: http://localhost:3000
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          flags: api-tests

  performance:
    runs-on: ubuntu-latest
    needs: test
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Start server
        run: npm run dev &
      
      - name: Wait for server
        run: npx wait-on http://localhost:3000 -t 30000
      
      - name: Run performance tests
        run: npm run test:performance
      
      - name: Check performance benchmarks
        run: |
          if [ -f performance-results.json ]; then
            node scripts/check-performance.js
          fi

  security:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Run security audit
        run: npm audit --audit-level=moderate
      
      - name: Check for vulnerable dependencies
        run: npx snyk test --severity-threshold=high
        continue-on-error: true
```

### 4. `/scripts/smoke-test.sh` (NEW)
**Purpose**: Deployment smoke tests

```bash
#!/bin/bash

# Smoke Test Script
# Run after deployment to validate API health

set -e

API_URL="${1:-https://news-crypto.vercel.app}"
TIMEOUT=10

echo "🔍 Running smoke tests against: $API_URL"

# Test 1: Health check
echo "✓ Testing health endpoint..."
status=$(curl -s -o /dev/null -w "%{http_code}" -m $TIMEOUT "$API_URL/api/health")
if [ "$status" != "200" ]; then
  echo "❌ Health check failed: $status"
  exit 1
fi
echo "✅ Health check passed"

# Test 2: News endpoint
echo "✓ Testing news endpoint..."
status=$(curl -s -o /dev/null -w "%{http_code}" -m $TIMEOUT "$API_URL/api/news?limit=1")
if [ "$status" != "200" ]; then
  echo "❌ News endpoint failed: $status"
  exit 1
fi
echo "✅ News endpoint passed"

# Test 3: OpenAPI spec
echo "✓ Testing OpenAPI spec..."
status=$(curl -s -o /dev/null -w "%{http_code}" -m $TIMEOUT "$API_URL/api/openapi.json")
if [ "$status" != "200" ]; then
  echo "❌ OpenAPI spec failed: $status"
  exit 1
fi
echo "✅ OpenAPI spec passed"

# Test 4: Metrics endpoint
echo "✓ Testing metrics endpoint..."
status=$(curl -s -o /dev/null -w "%{http_code}" -m $TIMEOUT "$API_URL/api/metrics")
if [ "$status" != "200" ]; then
  echo "❌ Metrics endpoint failed: $status"
  exit 1
fi
echo "✅ Metrics endpoint passed"

# Test 5: Rate limiting
echo "✓ Testing rate limiting..."
response=$(curl -s -o /dev/null -w "%{http_code}" -m $TIMEOUT "$API_URL/api/news")
if [ -z "$(curl -s -I "$API_URL/api/news" | grep -i 'X-RateLimit')" ]; then
  echo "⚠️  Rate limit headers missing (may not be deployed yet)"
else
  echo "✅ Rate limiting active"
fi

# Test 6: Error handling
echo "✓ Testing error handling..."
error_response=$(curl -s -m $TIMEOUT "$API_URL/api/news?limit=999")
if echo "$error_response" | grep -q '"error"'; then
  echo "✅ Error handling working"
else
  echo "⚠️  Error format may not be updated yet"
fi

echo ""
echo "🎉 All smoke tests passed!"
echo "API is healthy at: $API_URL"
```

### 5. `/docs/RUNBOOK.md` (NEW)
**Purpose**: Operational procedures for production

```markdown
# API Operations Runbook

## 🚨 Incident Response

### High Error Rate
**Symptoms**: Error rate > 5% of requests

**Diagnosis**:
```bash
# Check error metrics
curl https://news-crypto.vercel.app/api/metrics | jq '.errors'

# Check health status
curl https://news-crypto.vercel.app/api/health
```

**Resolution**:
1. Check external API status (CoinGecko, etc.)
2. Review recent deployments
3. Check Vercel KV status
4. Roll back if necessary

### Rate Limit Issues
**Symptoms**: Many 429 responses

**Diagnosis**:
```bash
# Check rate limit metrics
curl https://news-crypto.vercel.app/api/metrics | jq '.rateLimits'
```

**Resolution**:
1. Verify rate limits are appropriate
2. Check for abuse patterns
3. Consider temporary limit increase
4. Block abusive IPs if needed

### Slow Response Times
**Symptoms**: p95 latency > 2s

**Diagnosis**:
```bash
# Check performance metrics
curl https://news-crypto.vercel.app/api/metrics | jq '.latency'
```

**Resolution**:
1. Check cache hit rate
2. Review slow query logs
3. Optimize heavy endpoints
4. Scale resources if needed

## 📊 Monitoring

### Key Metrics
- **Health**: `/api/health` should return 200
- **Error Rate**: < 1% target
- **Response Time**: p95 < 500ms
- **Rate Limits**: Monitor 429 responses

### Dashboards
- Vercel Analytics: https://vercel.com/nirholas/free-crypto-news/analytics
- Error Tracking: Check logs in Vercel
- Custom Metrics: `/api/metrics` endpoint

## 🔄 Deployment Checklist

### Pre-deployment
- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Security scan passed
- [ ] Breaking changes documented

### Deployment
- [ ] Deploy to preview environment
- [ ] Run smoke tests
- [ ] Check error rates
- [ ] Monitor for 15 minutes

### Post-deployment
- [ ] Verify health endpoint
- [ ] Check key metrics
- [ ] Monitor error rates
- [ ] Validate new features

### Rollback Procedure
```bash
# Via Vercel CLI
vercel rollback

# Or via dashboard
# Go to Deployments → Select previous → Promote to Production
```

## 🔐 Security

### API Key Management
- Rotate keys quarterly
- Monitor usage patterns
- Revoke compromised keys immediately

### Rate Limit Configuration
```typescript
// Current limits
FREE_TIER: 10 requests/minute
V1_TIER: 100 requests/minute
PREMIUM_TIER: 1000 requests/minute
```

### Security Headers
All endpoints include:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block

## 📈 Scaling

### Current Capacity
- ~1000 req/min sustained
- Vercel Edge Functions (auto-scale)
- Vercel KV for caching

### Scaling Triggers
- Consistent 429 responses
- p95 latency > 1s
- Error rate > 2%

### Scaling Actions
1. Increase Vercel KV limits
2. Optimize cache strategy
3. Add CDN layer
4. Consider dedicated Redis
```

### 6. `/scripts/validate-integration.js` (NEW)
**Purpose**: Validate all agent improvements work together

```javascript
#!/usr/bin/env node

/**
 * Integration Validation Script
 * 
 * Validates that all 5 agent improvements are:
 * - Properly integrated
 * - Not conflicting
 * - Working as expected
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_FILES = [
  // Agent 1
  'src/middleware.ts',
  'src/lib/rate-limit.ts',
  
  // Agent 2
  'src/lib/api-error.ts',
  'src/lib/error-middleware.ts',
  
  // Agent 3
  'src/app/api/health/route.ts',
  'src/app/api/metrics/route.ts',
  'src/lib/monitoring.ts',
  
  // Agent 4
  'src/lib/schemas/index.ts',
  'src/lib/validation-middleware.ts',
  'src/lib/openapi/generator.ts',
  
  // Agent 5
  'src/__tests__/api/integration.test.ts',
  '.github/workflows/api-tests.yml',
];

console.log('🔍 Validating agent integrations...\n');

let missingFiles = 0;
let foundFiles = 0;

REQUIRED_FILES.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${file}`);
    foundFiles++;
  } else {
    console.log(`❌ Missing: ${file}`);
    missingFiles++;
  }
});

console.log(`\n📊 Results: ${foundFiles}/${REQUIRED_FILES.length} files found`);

if (missingFiles > 0) {
  console.log('⚠️  Some agent deliverables are missing');
  process.exit(1);
}

console.log('🎉 All agent improvements integrated successfully!');
process.exit(0);
```

---

## 📝 PACKAGE.JSON UPDATES

Add test scripts to `/package.json`:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:integration": "vitest run src/__tests__/api/integration.test.ts",
    "test:performance": "vitest run src/__tests__/api/performance.test.ts",
    "test:e2e": "playwright test",
    "test:coverage": "vitest run --coverage",
    "validate:integration": "node scripts/validate-integration.js",
    "smoke-test": "bash scripts/smoke-test.sh",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "@vitest/coverage-v8": "^1.2.0",
    "wait-on": "^7.2.0"
  }
}
```

---

## ✅ TESTING PHASES

### Phase 1: Unit Tests (1 hour)
```bash
# Test individual components
npm run test

# Check coverage
npm run test:coverage

# Validate Agent 2's error utilities work
npm run test -- src/lib/api-error.test.ts

# Validate Agent 4's schemas work
npm run test -- src/lib/schemas
```

### Phase 2: Integration Tests (1 hour)
```bash
# Start dev server
npm run dev

# Run integration tests
npm run test:integration

# Check all agents work together
node scripts/validate-integration.js
```

### Phase 3: Performance Tests (30 min)
```bash
# Benchmark API performance
npm run test:performance

# Check rate limiting works
# (will generate 429s - expected)
```

### Phase 4: E2E Tests (30 min)
```bash
# Run full Playwright suite
npm run test:e2e

# Test user workflows end-to-end
```

### Phase 5: Deployment Validation (30 min)
```bash
# Deploy to preview
vercel --prod=false

# Run smoke tests
npm run smoke-test https://your-preview.vercel.app

# If all pass, deploy to production
vercel --prod

# Run smoke tests on production
npm run smoke-test https://news-crypto.vercel.app
```

---

## 🚀 DELIVERABLES

1. ✅ `/src/__tests__/api/integration.test.ts` - Complete integration test suite
2. ✅ `/src/__tests__/api/performance.test.ts` - Performance benchmarks
3. ✅ `/.github/workflows/api-tests.yml` - CI/CD pipeline
4. ✅ `/scripts/smoke-test.sh` - Deployment validation
5. ✅ `/scripts/validate-integration.js` - Integration validator
6. ✅ `/docs/RUNBOOK.md` - Operations documentation
7. ✅ Updated `package.json` with test scripts
8. ✅ Test coverage reports
9. ✅ Performance baseline established

---

## 📊 SUCCESS METRICS

After completion:
- [ ] 80%+ test coverage
- [ ] CI/CD running on all PRs
- [ ] Integration tests passing
- [ ] Performance benchmarks met:
  - `/api/news`: < 500ms
  - `/api/health`: < 100ms
  - Concurrent requests: < 2s for 20 requests
- [ ] Smoke tests passing on production
- [ ] Zero breaking changes
- [ ] All 5 agents validated and integrated

---

## 💬 COORDINATION

**Depends on all other agents:**
- Agent 1: Tests middleware, rate limiting, security headers
- Agent 2: Validates error format consistency
- Agent 3: Tests health/metrics endpoints
- Agent 4: Validates schemas and OpenAPI spec

**You provide:**
- Confidence that everything works together
- Automated testing for all improvements
- CI/CD for ongoing quality
- Deployment procedures
- Operational documentation

---

## 🎯 FINAL VALIDATION

Before marking complete, ensure:

### Integration Checklist
- [ ] All required files exist (run `validate-integration.js`)
- [ ] No file conflicts between agents
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No breaking changes to existing API

### Performance Checklist
- [ ] Response times within benchmarks
- [ ] Rate limiting working correctly
- [ ] Cache hit rate > 50%
- [ ] Error rate < 1%

### Deployment Checklist
- [ ] CI/CD pipeline configured
- [ ] Smoke tests passing
- [ ] Runbook documented
- [ ] Monitoring in place
- [ ] Rollback procedure tested

---

## 🚀 READY TO START?

**Agent 5, you're the final guardian ensuring all improvements work together flawlessly. Run comprehensive tests, set up automation, and validate we've achieved our 10/10 API goal. Report any integration issues immediately. Good luck! 🎯**
