/**
 * E2E Tests for Regulatory Intelligence API
 * 
 * Tests the regulatory tracking API endpoints:
 * - /api/regulatory (events listing)
 * - /api/regulatory?action=jurisdictions
 * - /api/regulatory?action=agencies  
 * - /api/regulatory?action=deadlines
 * - /api/regulatory?action=summary
 * - /api/regulatory?action=analyze
 * 
 * @module e2e/regulatory.spec
 */

import { test, expect, type APIResponse } from '@playwright/test';

const API_BASE = '/api/regulatory';

// Helper to validate common response structure
async function expectSuccessResponse(response: APIResponse) {
  expect(response.ok()).toBeTruthy();
  const json = await response.json();
  expect(json.success).toBe(true);
  expect(json.data).toBeDefined();
  return json;
}

// ============================================================================
// EVENTS ENDPOINT TESTS
// ============================================================================

test.describe('Regulatory Events API', () => {
  test('GET /api/regulatory returns regulatory events', async ({ request }) => {
    const response = await request.get(`${API_BASE}?action=events`);
    const json = await expectSuccessResponse(response);
    
    expect(json.data.events).toBeDefined();
    expect(Array.isArray(json.data.events)).toBe(true);
    expect(json.data.pagination).toBeDefined();
    expect(json.data.stats).toBeDefined();
  });

  test('GET /api/regulatory events have required fields', async ({ request }) => {
    const response = await request.get(`${API_BASE}?action=events&limit=5`);
    const json = await expectSuccessResponse(response);
    
    if (json.data.events.length > 0) {
      const event = json.data.events[0];
      expect(event).toHaveProperty('id');
      expect(event).toHaveProperty('title');
      expect(event).toHaveProperty('description');
      expect(event).toHaveProperty('jurisdiction');
      expect(event).toHaveProperty('agency');
      expect(event).toHaveProperty('actionType');
      expect(event).toHaveProperty('impactLevel');
      expect(event).toHaveProperty('affectedSectors');
      expect(event).toHaveProperty('publishedAt');
      expect(event).toHaveProperty('sentiment');
    }
  });

  test('GET /api/regulatory filters by jurisdiction', async ({ request }) => {
    const response = await request.get(`${API_BASE}?action=events&jurisdiction=us`);
    const json = await expectSuccessResponse(response);
    
    expect(json.data.filters.jurisdiction).toBe('us');
    
    for (const event of json.data.events) {
      expect(event.jurisdiction).toBe('us');
    }
  });

  test('GET /api/regulatory filters by agency', async ({ request }) => {
    const response = await request.get(`${API_BASE}?action=events&agency=sec`);
    const json = await expectSuccessResponse(response);
    
    expect(json.data.filters.agency).toBe('sec');
    
    for (const event of json.data.events) {
      expect(event.agency).toBe('sec');
    }
  });

  test('GET /api/regulatory filters by impact level', async ({ request }) => {
    const response = await request.get(`${API_BASE}?action=events&impact=critical`);
    const json = await expectSuccessResponse(response);
    
    expect(json.data.filters.impact).toBe('critical');
    
    for (const event of json.data.events) {
      expect(event.impactLevel).toBe('critical');
    }
  });

  test('GET /api/regulatory filters by sector', async ({ request }) => {
    const response = await request.get(`${API_BASE}?action=events&sector=exchanges`);
    const json = await expectSuccessResponse(response);
    
    expect(json.data.filters.sector).toBe('exchanges');
    
    for (const event of json.data.events) {
      expect(event.affectedSectors).toContain('exchanges');
    }
  });

  test('GET /api/regulatory supports pagination', async ({ request }) => {
    const response = await request.get(`${API_BASE}?action=events&limit=10&offset=0`);
    const json = await expectSuccessResponse(response);
    
    expect(json.data.pagination.limit).toBe(10);
    expect(json.data.pagination.offset).toBe(0);
    expect(json.data.pagination.total).toBeGreaterThanOrEqual(0);
    expect(typeof json.data.pagination.hasMore).toBe('boolean');
  });

  test('GET /api/regulatory limits max results to 100', async ({ request }) => {
    const response = await request.get(`${API_BASE}?action=events&limit=500`);
    const json = await expectSuccessResponse(response);
    
    // Limit should be capped at 100
    expect(json.data.events.length).toBeLessThanOrEqual(100);
  });

  test('GET /api/regulatory provides statistics', async ({ request }) => {
    const response = await request.get(`${API_BASE}?action=events`);
    const json = await expectSuccessResponse(response);
    
    expect(json.data.stats).toBeDefined();
    expect(json.data.stats.total).toBeGreaterThanOrEqual(0);
    expect(json.data.stats.byJurisdiction).toBeDefined();
    expect(json.data.stats.byAgency).toBeDefined();
    expect(json.data.stats.byImpact).toBeDefined();
    expect(json.data.stats.byActionType).toBeDefined();
  });

  test('GET /api/regulatory supports days parameter', async ({ request }) => {
    const response = await request.get(`${API_BASE}?action=events&days=3`);
    const json = await expectSuccessResponse(response);
    
    expect(json.data.filters.days).toBe(3);
  });
});

// ============================================================================
// JURISDICTIONS ENDPOINT TESTS
// ============================================================================

test.describe('Jurisdictions API', () => {
  test('GET /api/regulatory?action=jurisdictions returns all jurisdictions', async ({ request }) => {
    const response = await request.get(`${API_BASE}?action=jurisdictions`);
    const json = await expectSuccessResponse(response);
    
    expect(json.data.jurisdictions).toBeDefined();
    expect(Array.isArray(json.data.jurisdictions)).toBe(true);
    expect(json.data.count).toBeGreaterThan(0);
    expect(json.data.jurisdictions.length).toBe(json.data.count);
  });

  test('GET /api/regulatory jurisdictions have required fields', async ({ request }) => {
    const response = await request.get(`${API_BASE}?action=jurisdictions`);
    const json = await expectSuccessResponse(response);
    
    for (const jurisdiction of json.data.jurisdictions) {
      expect(jurisdiction).toHaveProperty('jurisdiction');
      expect(jurisdiction).toHaveProperty('name');
      expect(jurisdiction).toHaveProperty('flag');
      expect(jurisdiction).toHaveProperty('stance');
      expect(jurisdiction).toHaveProperty('stanceScore');
      expect(jurisdiction).toHaveProperty('primaryAgencies');
      expect(jurisdiction).toHaveProperty('riskLevel');
    }
  });

  test('GET /api/regulatory?action=jurisdictions&jurisdiction=us returns specific jurisdiction', async ({ request }) => {
    const response = await request.get(`${API_BASE}?action=jurisdictions&jurisdiction=us`);
    const json = await expectSuccessResponse(response);
    
    expect(json.data.jurisdiction).toBe('us');
    expect(json.data.name).toBe('United States');
    expect(json.data.flag).toBe('🇺🇸');
    expect(json.data.primaryAgencies).toContain('sec');
    expect(json.data.primaryAgencies).toContain('cftc');
  });

  test('GET /api/regulatory jurisdiction stance is valid', async ({ request }) => {
    const response = await request.get(`${API_BASE}?action=jurisdictions`);
    const json = await expectSuccessResponse(response);
    
    const validStances = ['restrictive', 'cautious', 'neutral', 'progressive', 'unclear'];
    const validRiskLevels = ['low', 'medium', 'high', 'critical'];
    
    for (const jurisdiction of json.data.jurisdictions) {
      expect(validStances).toContain(jurisdiction.stance);
      expect(validRiskLevels).toContain(jurisdiction.riskLevel);
      expect(typeof jurisdiction.stanceScore).toBe('number');
      expect(jurisdiction.stanceScore).toBeGreaterThanOrEqual(-100);
      expect(jurisdiction.stanceScore).toBeLessThanOrEqual(100);
    }
  });

  test('GET /api/regulatory invalid jurisdiction returns error', async ({ request }) => {
    const response = await request.get(`${API_BASE}?action=jurisdictions&jurisdiction=invalid`);
    expect(response.status()).toBe(400);
    
    const json = await response.json();
    expect(json.success).toBe(false);
    expect(json.error).toBeDefined();
  });
});

// ============================================================================
// AGENCIES ENDPOINT TESTS
// ============================================================================

test.describe('Agencies API', () => {
  test('GET /api/regulatory?action=agencies returns all agencies', async ({ request }) => {
    const response = await request.get(`${API_BASE}?action=agencies`);
    const json = await expectSuccessResponse(response);
    
    expect(json.data.agencies).toBeDefined();
    expect(Array.isArray(json.data.agencies)).toBe(true);
    expect(json.data.count).toBeGreaterThan(0);
  });

  test('GET /api/regulatory agencies have required fields', async ({ request }) => {
    const response = await request.get(`${API_BASE}?action=agencies`);
    const json = await expectSuccessResponse(response);
    
    for (const agency of json.data.agencies) {
      expect(agency).toHaveProperty('agency');
      expect(agency).toHaveProperty('name');
      expect(agency).toHaveProperty('jurisdiction');
      expect(agency).toHaveProperty('website');
    }
  });

  test('GET /api/regulatory?action=agencies&agency=sec returns SEC details', async ({ request }) => {
    const response = await request.get(`${API_BASE}?action=agencies&agency=sec`);
    const json = await expectSuccessResponse(response);
    
    expect(json.data.agency).toBe('sec');
    expect(json.data.name).toBe('Securities and Exchange Commission');
    expect(json.data.jurisdiction).toBe('us');
    expect(json.data.website).toContain('sec.gov');
  });

  test('GET /api/regulatory agencies filter by jurisdiction', async ({ request }) => {
    const response = await request.get(`${API_BASE}?action=agencies&jurisdiction=eu`);
    const json = await expectSuccessResponse(response);
    
    for (const agency of json.data.agencies) {
      expect(agency.jurisdiction).toBe('eu');
    }
  });

  test('GET /api/regulatory invalid agency returns error', async ({ request }) => {
    const response = await request.get(`${API_BASE}?action=agencies&agency=invalid_agency`);
    expect(response.status()).toBe(400);
    
    const json = await response.json();
    expect(json.success).toBe(false);
  });
});

// ============================================================================
// DEADLINES ENDPOINT TESTS
// ============================================================================

test.describe('Deadlines API', () => {
  test('GET /api/regulatory?action=deadlines returns compliance deadlines', async ({ request }) => {
    const response = await request.get(`${API_BASE}?action=deadlines`);
    const json = await expectSuccessResponse(response);
    
    expect(json.data.deadlines).toBeDefined();
    expect(Array.isArray(json.data.deadlines)).toBe(true);
  });

  test('GET /api/regulatory deadlines have required fields', async ({ request }) => {
    const response = await request.get(`${API_BASE}?action=deadlines`);
    const json = await expectSuccessResponse(response);
    
    if (json.data.deadlines.length > 0) {
      const deadline = json.data.deadlines[0];
      expect(deadline).toHaveProperty('id');
      expect(deadline).toHaveProperty('title');
      expect(deadline).toHaveProperty('description');
      expect(deadline).toHaveProperty('jurisdiction');
      expect(deadline).toHaveProperty('agency');
      expect(deadline).toHaveProperty('deadline');
      expect(deadline).toHaveProperty('affectedSectors');
      expect(deadline).toHaveProperty('impactLevel');
      expect(deadline).toHaveProperty('requirements');
      expect(deadline).toHaveProperty('status');
      expect(deadline).toHaveProperty('daysUntil');
    }
  });

  test('GET /api/regulatory deadlines status is valid', async ({ request }) => {
    const response = await request.get(`${API_BASE}?action=deadlines`);
    const json = await expectSuccessResponse(response);
    
    const validStatuses = ['upcoming', 'imminent', 'passed'];
    
    for (const deadline of json.data.deadlines) {
      expect(validStatuses).toContain(deadline.status);
      expect(typeof deadline.daysUntil).toBe('number');
    }
  });

  test('GET /api/regulatory deadlines filter by jurisdiction', async ({ request }) => {
    const response = await request.get(`${API_BASE}?action=deadlines&jurisdiction=eu`);
    const json = await expectSuccessResponse(response);
    
    for (const deadline of json.data.deadlines) {
      expect(deadline.jurisdiction).toBe('eu');
    }
  });

  test('GET /api/regulatory deadlines support days parameter', async ({ request }) => {
    const response = await request.get(`${API_BASE}?action=deadlines&days=30`);
    const json = await expectSuccessResponse(response);
    
    expect(json.data.filters.days).toBe(30);
    
    for (const deadline of json.data.deadlines) {
      expect(deadline.daysUntil).toBeLessThanOrEqual(30);
    }
  });

  test('GET /api/regulatory deadlines are sorted by date', async ({ request }) => {
    const response = await request.get(`${API_BASE}?action=deadlines`);
    const json = await expectSuccessResponse(response);
    
    const deadlines = json.data.deadlines;
    for (let i = 1; i < deadlines.length; i++) {
      expect(deadlines[i].daysUntil).toBeGreaterThanOrEqual(deadlines[i - 1].daysUntil);
    }
  });
});

// ============================================================================
// SUMMARY ENDPOINT TESTS
// ============================================================================

test.describe('Summary API', () => {
  test('GET /api/regulatory?action=summary returns intelligence summary', async ({ request }) => {
    const response = await request.get(`${API_BASE}?action=summary`);
    const json = await expectSuccessResponse(response);
    
    expect(json.data.globalRiskLevel).toBeDefined();
    expect(json.data.activeEvents).toBeDefined();
    expect(json.data.upcomingDeadlines).toBeDefined();
    expect(json.data.recentEnforcements).toBeDefined();
    expect(json.data.trendingTopics).toBeDefined();
    expect(json.data.hotJurisdictions).toBeDefined();
    expect(json.data.recentEvents).toBeDefined();
    expect(json.data.marketImpact).toBeDefined();
    expect(json.data.generatedAt).toBeDefined();
  });

  test('GET /api/regulatory summary has valid risk level', async ({ request }) => {
    const response = await request.get(`${API_BASE}?action=summary`);
    const json = await expectSuccessResponse(response);
    
    const validRiskLevels = ['stable', 'elevated', 'high', 'critical'];
    expect(validRiskLevels).toContain(json.data.globalRiskLevel);
  });

  test('GET /api/regulatory summary has valid market impact', async ({ request }) => {
    const response = await request.get(`${API_BASE}?action=summary`);
    const json = await expectSuccessResponse(response);
    
    const validImpacts = ['bullish', 'bearish', 'neutral'];
    expect(validImpacts).toContain(json.data.marketImpact.shortTerm);
    expect(validImpacts).toContain(json.data.marketImpact.longTerm);
    expect(typeof json.data.marketImpact.reasoning).toBe('string');
  });

  test('GET /api/regulatory summary trending topics have required fields', async ({ request }) => {
    const response = await request.get(`${API_BASE}?action=summary`);
    const json = await expectSuccessResponse(response);
    
    for (const topic of json.data.trendingTopics) {
      expect(topic).toHaveProperty('topic');
      expect(topic).toHaveProperty('mentions');
      expect(topic).toHaveProperty('sentiment');
    }
  });

  test('GET /api/regulatory summary hot jurisdictions are valid', async ({ request }) => {
    const response = await request.get(`${API_BASE}?action=summary`);
    const json = await expectSuccessResponse(response);
    
    const validJurisdictions = [
      'us', 'eu', 'uk', 'cn', 'jp', 'sg', 'ae', 'kr', 
      'au', 'br', 'ch', 'hk', 'ca', 'in', 'global'
    ];
    
    for (const jurisdiction of json.data.hotJurisdictions) {
      expect(validJurisdictions).toContain(jurisdiction);
    }
  });
});

// ============================================================================
// ANALYZE ENDPOINT TESTS
// ============================================================================

test.describe('Analyze API', () => {
  test('GET /api/regulatory?action=analyze analyzes regulatory text', async ({ request }) => {
    const response = await request.get(
      `${API_BASE}?action=analyze&title=SEC%20charges%20crypto%20exchange%20with%20securities%20violations`
    );
    const json = await expectSuccessResponse(response);
    
    expect(json.data.isRegulatory).toBe(true);
    expect(json.data.confidence).toBeGreaterThan(0);
    expect(json.data.matchedKeywords).toBeDefined();
    expect(json.data.analysis).toBeDefined();
  });

  test('GET /api/regulatory analyze returns jurisdiction info', async ({ request }) => {
    const response = await request.get(
      `${API_BASE}?action=analyze&title=SEC%20charges%20exchange&description=US%20regulatory%20enforcement`
    );
    const json = await expectSuccessResponse(response);
    
    expect(json.data.analysis.jurisdiction).toBeDefined();
    expect(json.data.analysis.jurisdiction.code).toBe('us');
    expect(json.data.analysis.jurisdiction.name).toBe('United States');
  });

  test('GET /api/regulatory analyze detects agency', async ({ request }) => {
    const response = await request.get(
      `${API_BASE}?action=analyze&title=CFTC%20approves%20new%20derivatives%20product`
    );
    const json = await expectSuccessResponse(response);
    
    expect(json.data.analysis.agency).toBeDefined();
    expect(json.data.analysis.agency.code).toBe('cftc');
  });

  test('GET /api/regulatory analyze detects action type', async ({ request }) => {
    const response = await request.get(
      `${API_BASE}?action=analyze&title=SEC%20files%20lawsuit%20against%20crypto%20company`
    );
    const json = await expectSuccessResponse(response);
    
    expect(json.data.analysis.actionType).toBeDefined();
    expect(['enforcement', 'investigation']).toContain(json.data.analysis.actionType);
  });

  test('GET /api/regulatory analyze detects affected sectors', async ({ request }) => {
    const response = await request.get(
      `${API_BASE}?action=analyze&title=New%20stablecoin%20regulations%20for%20exchanges&description=DeFi%20and%20lending%20platforms%20affected`
    );
    const json = await expectSuccessResponse(response);
    
    expect(json.data.analysis.affectedSectors).toBeDefined();
    expect(Array.isArray(json.data.analysis.affectedSectors)).toBe(true);
  });

  test('GET /api/regulatory analyze returns sentiment', async ({ request }) => {
    const response = await request.get(
      `${API_BASE}?action=analyze&title=Crypto%20company%20banned%20from%20operating`
    );
    const json = await expectSuccessResponse(response);
    
    expect(json.data.analysis.sentiment).toBeDefined();
    expect(['positive', 'negative', 'neutral']).toContain(json.data.analysis.sentiment);
  });

  test('GET /api/regulatory analyze requires text input', async ({ request }) => {
    const response = await request.get(`${API_BASE}?action=analyze`);
    expect(response.status()).toBe(400);
    
    const json = await response.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain('required');
  });

  test('GET /api/regulatory analyze identifies non-regulatory content', async ({ request }) => {
    const response = await request.get(
      `${API_BASE}?action=analyze&title=Bitcoin%20price%20rises%205%20percent%20today`
    );
    const json = await expectSuccessResponse(response);
    
    // Non-regulatory content should have low confidence
    expect(json.data.isRegulatory).toBe(false);
  });

  test('GET /api/regulatory analyze MiCA content correctly', async ({ request }) => {
    const response = await request.get(
      `${API_BASE}?action=analyze&title=EU%20MiCA%20regulation%20implementation%20deadline%20approaches`
    );
    const json = await expectSuccessResponse(response);
    
    expect(json.data.isRegulatory).toBe(true);
    expect(json.data.analysis.jurisdiction.code).toBe('eu');
    expect(json.data.analysis.agency?.code).toBe('mica');
  });
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

test.describe('Error Handling', () => {
  test('GET /api/regulatory with invalid action returns 400', async ({ request }) => {
    const response = await request.get(`${API_BASE}?action=invalid_action`);
    expect(response.status()).toBe(400);
    
    const json = await response.json();
    expect(json.success).toBe(false);
    expect(json.validActions).toBeDefined();
  });

  test('OPTIONS /api/regulatory returns API documentation', async ({ request }) => {
    const response = await request.fetch(`${API_BASE}`, { method: 'OPTIONS' });
    expect(response.ok()).toBeTruthy();
    
    const json = await response.json();
    expect(json.name).toBe('Regulatory Intelligence API');
    expect(json.version).toBeDefined();
    expect(json.endpoints).toBeDefined();
    expect(json.jurisdictions).toBeDefined();
    expect(json.agencies).toBeDefined();
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

test.describe('Integration Tests', () => {
  test('Full regulatory workflow: summary -> events -> deadlines', async ({ request }) => {
    // 1. Get summary
    const summaryRes = await request.get(`${API_BASE}?action=summary`);
    const summary = await expectSuccessResponse(summaryRes);
    
    expect(summary.data.globalRiskLevel).toBeDefined();
    
    // 2. Get events for hot jurisdictions
    if (summary.data.hotJurisdictions.length > 0) {
      const hotJurisdiction = summary.data.hotJurisdictions[0];
      const eventsRes = await request.get(
        `${API_BASE}?action=events&jurisdiction=${hotJurisdiction}`
      );
      const events = await expectSuccessResponse(eventsRes);
      
      for (const event of events.data.events) {
        expect(event.jurisdiction).toBe(hotJurisdiction);
      }
    }
    
    // 3. Get upcoming deadlines
    const deadlinesRes = await request.get(`${API_BASE}?action=deadlines&days=90`);
    const deadlines = await expectSuccessResponse(deadlinesRes);
    
    expect(deadlines.data.deadlines.length).toBeGreaterThanOrEqual(0);
  });

  test('Regulatory page loads without errors', async ({ page }) => {
    await page.goto('/en/regulatory');
    
    // Check page title
    await expect(page).toHaveTitle(/Regulatory Intelligence/);
    
    // Check main heading
    const heading = page.getByRole('heading', { name: /Regulatory Intelligence/i });
    await expect(heading).toBeVisible();
  });
});
