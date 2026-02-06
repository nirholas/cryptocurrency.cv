/**
 * Regulatory Intelligence API
 * 
 * Comprehensive API for regulatory news and compliance tracking:
 * - GET /api/regulatory - List regulatory events with filtering
 * - GET /api/regulatory?action=jurisdictions - Get jurisdiction profiles
 * - GET /api/regulatory?action=agencies - Get agency information
 * - GET /api/regulatory?action=deadlines - Get upcoming compliance deadlines
 * - GET /api/regulatory?action=summary - Get intelligence summary
 * - GET /api/regulatory?action=analyze - Analyze a specific article
 * 
 * @module api/regulatory
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
import { headers } from 'next/headers';
import {
  Jurisdiction,
  RegulatoryAgency,
  RegulatoryEvent,
  JurisdictionProfile,
  AgencyProfile,
  ComplianceDeadline,
  RegulatoryIntelligenceSummary,
  JURISDICTION_INFO,
  AGENCY_INFO,
  isRegulatoryNews,
  extractJurisdiction,
  extractAgency,
  extractActionType,
  extractAffectedSectors,
  assessImpactLevel,
  determineRegulatorySentiment,
  createRegulatoryEvent,
  getJurisdictionProfile,
  generateIntelligenceSummary,
  ImpactLevel,
  RegulatoryActionType,
  AffectedSector,
} from '@/lib/regulatory-intelligence';
import { db } from '@/lib/database';
import { getLatestNews } from '@/lib/crypto-news';

// Cache keys
const CACHE_KEY_EVENTS = 'regulatory:events';
const CACHE_KEY_SUMMARY = 'regulatory:summary';
const CACHE_TTL = 300; // 5 minutes

/**
 * GET handler for regulatory intelligence API
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'events';
    const headersList = await headers();
    const host = headersList.get('host') || 'cryptocurrency.cv';
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? `https://${host}` 
      : `http://${host}`;

    switch (action) {
      case 'events':
        return handleEventsRequest(searchParams, baseUrl);
      
      case 'jurisdictions':
        return handleJurisdictionsRequest(searchParams);
      
      case 'agencies':
        return handleAgenciesRequest(searchParams);
      
      case 'deadlines':
        return handleDeadlinesRequest(searchParams);
      
      case 'summary':
        return handleSummaryRequest(baseUrl);
      
      case 'analyze':
        return handleAnalyzeRequest(searchParams);
      
      default:
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid action',
            validActions: ['events', 'jurisdictions', 'agencies', 'deadlines', 'summary', 'analyze'],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Regulatory API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle regulatory events listing
 */
async function handleEventsRequest(
  searchParams: URLSearchParams,
  baseUrl: string
): Promise<NextResponse> {
  // Parse filters
  const jurisdiction = searchParams.get('jurisdiction') as Jurisdiction | null;
  const agency = searchParams.get('agency') as RegulatoryAgency | null;
  const actionType = searchParams.get('actionType') as RegulatoryActionType | null;
  const impact = searchParams.get('impact') as ImpactLevel | null;
  const sector = searchParams.get('sector') as AffectedSector | null;
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const offset = parseInt(searchParams.get('offset') || '0');
  const days = Math.min(parseInt(searchParams.get('days') || '7'), 30);
  
  // Try to get cached events
  const cacheKey = `${CACHE_KEY_EVENTS}:${jurisdiction || 'all'}:${agency || 'all'}:${days}`;
  const cached = await db.get<RegulatoryEvent[]>(cacheKey);
  
  let events: RegulatoryEvent[];
  
  if (cached) {
    events = cached;
  } else {
    // Fetch articles and filter for regulatory news
    events = await fetchRegulatoryEvents(baseUrl, days);
    
    // Cache the results
    await db.set(cacheKey, events, CACHE_TTL);
  }
  
  // Apply filters
  let filteredEvents = events;
  
  if (jurisdiction) {
    filteredEvents = filteredEvents.filter(e => e.jurisdiction === jurisdiction);
  }
  
  if (agency) {
    filteredEvents = filteredEvents.filter(e => e.agency === agency);
  }
  
  if (actionType) {
    filteredEvents = filteredEvents.filter(e => e.actionType === actionType);
  }
  
  if (impact) {
    filteredEvents = filteredEvents.filter(e => e.impactLevel === impact);
  }
  
  if (sector) {
    filteredEvents = filteredEvents.filter(e => e.affectedSectors.includes(sector));
  }
  
  // Sort by date and impact
  filteredEvents.sort((a, b) => {
    // Critical/high items first
    const impactOrder: Record<ImpactLevel, number> = { 
      critical: 0, high: 1, medium: 2, low: 3, informational: 4 
    };
    const impactDiff = impactOrder[a.impactLevel] - impactOrder[b.impactLevel];
    if (impactDiff !== 0) return impactDiff;
    
    // Then by date
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
  
  // Paginate
  const total = filteredEvents.length;
  const paginatedEvents = filteredEvents.slice(offset, offset + limit);
  
  // Generate statistics
  const stats = generateEventStats(events);
  
  return NextResponse.json({
    success: true,
    data: {
      events: paginatedEvents,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      stats,
      filters: {
        jurisdiction,
        agency,
        actionType,
        impact,
        sector,
        days,
      },
    },
  });
}

/**
 * Fetch regulatory events from news articles
 */
async function fetchRegulatoryEvents(
  baseUrl: string,
  days: number
): Promise<RegulatoryEvent[]> {
  const events: RegulatoryEvent[] = [];
  
  try {
    // Fetch recent articles
    const since = new Date();
    since.setDate(since.getDate() - days);
    
    const newsResponse = await getLatestNews(50, undefined, {
      from: since.toISOString(),
    });
    const articles = newsResponse.articles || [];
    
    // Process each article
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      // Generate a unique ID from article properties
      const articleId = `reg-${article.sourceKey}-${new Date(article.pubDate).getTime()}-${i}`;
      
      const event = createRegulatoryEvent(
        articleId,
        article.title,
        article.description || '',
        article.link,
        new Date(article.pubDate),
        undefined // NewsArticle doesn't have entities, will be extracted from text
      );
      
      if (event) {
        events.push(event);
      }
    }
  } catch (error) {
    console.error('Error fetching regulatory events:', error);
    return []; // Return empty array instead of sample data
  }
  
  return events;
}

/**
 * Generate event statistics
 */
function generateEventStats(events: RegulatoryEvent[]) {
  const byJurisdiction = new Map<string, number>();
  const byAgency = new Map<string, number>();
  const byImpact = new Map<string, number>();
  const byActionType = new Map<string, number>();
  const bySector = new Map<string, number>();
  
  for (const event of events) {
    byJurisdiction.set(event.jurisdiction, (byJurisdiction.get(event.jurisdiction) || 0) + 1);
    byAgency.set(event.agency, (byAgency.get(event.agency) || 0) + 1);
    byImpact.set(event.impactLevel, (byImpact.get(event.impactLevel) || 0) + 1);
    byActionType.set(event.actionType, (byActionType.get(event.actionType) || 0) + 1);
    for (const sector of event.affectedSectors) {
      bySector.set(sector, (bySector.get(sector) || 0) + 1);
    }
  }
  
  return {
    total: events.length,
    byJurisdiction: Object.fromEntries(byJurisdiction),
    byAgency: Object.fromEntries(byAgency),
    byImpact: Object.fromEntries(byImpact),
    byActionType: Object.fromEntries(byActionType),
    bySector: Object.fromEntries(bySector),
  };
}

/**
 * Handle jurisdictions listing
 */
async function handleJurisdictionsRequest(
  searchParams: URLSearchParams
): Promise<NextResponse> {
  const requestedJurisdiction = searchParams.get('jurisdiction') as Jurisdiction | null;
  
  if (requestedJurisdiction) {
    if (!JURISDICTION_INFO[requestedJurisdiction]) {
      return NextResponse.json(
        { success: false, error: 'Invalid jurisdiction' },
        { status: 400 }
      );
    }
    
    const profile = getJurisdictionProfile(requestedJurisdiction);
    return NextResponse.json({
      success: true,
      data: profile,
    });
  }
  
  // Return all jurisdictions
  const jurisdictions: JurisdictionProfile[] = Object.keys(JURISDICTION_INFO)
    .map(j => getJurisdictionProfile(j as Jurisdiction));
  
  return NextResponse.json({
    success: true,
    data: {
      jurisdictions,
      count: jurisdictions.length,
    },
  });
}

/**
 * Handle agencies listing
 */
async function handleAgenciesRequest(
  searchParams: URLSearchParams
): Promise<NextResponse> {
  const requestedAgency = searchParams.get('agency') as RegulatoryAgency | null;
  const jurisdiction = searchParams.get('jurisdiction') as Jurisdiction | null;
  
  if (requestedAgency) {
    const info = AGENCY_INFO[requestedAgency];
    if (!info) {
      return NextResponse.json(
        { success: false, error: 'Invalid agency' },
        { status: 400 }
      );
    }
    
    const profile: AgencyProfile = {
      agency: requestedAgency,
      name: info.name,
      jurisdiction: info.jurisdiction,
      website: info.website,
      cryptoStance: 'neutral', // Would be from database
      enforcementHistory: {
        totalActions: 0,
        totalFines: 0,
        recentActions: 0,
      },
      keyPersonnel: [],
      focusAreas: [],
      lastUpdated: new Date(),
    };
    
    return NextResponse.json({
      success: true,
      data: profile,
    });
  }
  
  // Return all agencies (optionally filtered by jurisdiction)
  let agencies = Object.entries(AGENCY_INFO).map(([key, info]) => ({
    agency: key,
    ...info,
  }));
  
  if (jurisdiction) {
    agencies = agencies.filter(a => a.jurisdiction === jurisdiction);
  }
  
  return NextResponse.json({
    success: true,
    data: {
      agencies,
      count: agencies.length,
    },
  });
}

/**
 * Handle compliance deadlines listing
 * Note: Regulatory deadlines are sourced from official agency announcements
 * and updated periodically. These represent real regulatory compliance dates.
 */
async function handleDeadlinesRequest(
  searchParams: URLSearchParams
): Promise<NextResponse> {
  const jurisdiction = searchParams.get('jurisdiction') as Jurisdiction | null;
  const days = Math.min(parseInt(searchParams.get('days') || '90'), 365);
  
  // Known regulatory deadlines from official sources
  const now = new Date();
  let deadlines: ComplianceDeadline[] = [
    {
      id: 'deadline-mica-2024',
      title: 'MiCA Full Implementation',
      description: 'All crypto-asset service providers must be fully compliant with MiCA requirements.',
      jurisdiction: 'eu',
      agency: 'mica',
      deadline: new Date('2024-12-30'),
      affectedSectors: ['exchanges', 'custody', 'stablecoins', 'all'],
      impactLevel: 'critical',
      requirements: [
        'CASP authorization',
        'Whitepaper requirements',
        'Capital requirements',
        'Governance standards',
      ],
      penalties: 'Prohibition from operating in EU',
      sourceUrl: 'https://www.esma.europa.eu/esmas-activities/digital-finance-and-innovation/markets-crypto-assets-regulation-mica',
      status: 'upcoming',
      daysUntil: Math.ceil((new Date('2024-12-30').getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    },
    {
      id: 'deadline-uk-fca-2024',
      title: 'UK FCA Crypto Marketing Rules',
      description: 'All crypto asset promotions must comply with FCA marketing rules.',
      jurisdiction: 'uk',
      agency: 'fca',
      deadline: new Date('2024-10-08'),
      affectedSectors: ['exchanges', 'all'],
      impactLevel: 'high',
      requirements: [
        'Risk warnings',
        'Cooling-off period',
        'No incentives to invest',
      ],
      penalties: 'Up to 2 years imprisonment or unlimited fine',
      sourceUrl: 'https://www.fca.org.uk/firms/cryptoassets',
      status: 'upcoming',
      daysUntil: Math.ceil((new Date('2024-10-08').getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    },
    {
      id: 'deadline-fatf-2024',
      title: 'FATF Travel Rule Full Adoption',
      description: 'Member jurisdictions expected to fully implement travel rule for VASPs.',
      jurisdiction: 'global',
      agency: 'fatf',
      deadline: new Date('2024-12-31'),
      affectedSectors: ['exchanges', 'payments'],
      impactLevel: 'high',
      requirements: [
        'Originator information collection',
        'Beneficiary information verification',
        'Information sharing protocols',
      ],
      sourceUrl: 'https://www.fatf-gafi.org/en/topics/virtual-assets.html',
      status: 'upcoming',
      daysUntil: Math.ceil((new Date('2024-12-31').getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    },
  ];
  
  // Filter by jurisdiction if specified
  if (jurisdiction) {
    deadlines = deadlines.filter(d => d.jurisdiction === jurisdiction);
  }
  
  // Filter by days
  deadlines = deadlines.filter(d => d.daysUntil <= days && d.daysUntil >= -7); // Include recently passed
  
  // Update status based on days until
  deadlines = deadlines.map(d => ({
    ...d,
    status: d.daysUntil < 0 ? 'passed' : d.daysUntil <= 30 ? 'imminent' : 'upcoming',
  }));
  
  // Sort by deadline
  deadlines.sort((a, b) => a.daysUntil - b.daysUntil);
  
  return NextResponse.json({
    success: true,
    data: {
      deadlines,
      count: deadlines.length,
      filters: {
        jurisdiction,
        days,
      },
    },
  });
}

/**
 * Handle intelligence summary request
 */
async function handleSummaryRequest(baseUrl: string): Promise<NextResponse> {
  // Try cache first
  const cached = await db.get<RegulatoryIntelligenceSummary>(CACHE_KEY_SUMMARY);
  if (cached) {
    return NextResponse.json({
      success: true,
      data: cached,
      cached: true,
    });
  }
  
  // Fetch events and deadlines
  const events = await fetchRegulatoryEvents(baseUrl, 7);
  
  // Get deadlines
  const deadlinesResponse = await handleDeadlinesRequest(new URLSearchParams());
  const deadlinesData = await deadlinesResponse.json();
  const deadlines: ComplianceDeadline[] = deadlinesData.data?.deadlines || [];
  
  // Generate summary
  const summary = generateIntelligenceSummary(events, deadlines);
  
  // Cache the summary
  await db.set(CACHE_KEY_SUMMARY, summary, CACHE_TTL);
  
  return NextResponse.json({
    success: true,
    data: summary,
    cached: false,
  });
}

/**
 * Handle article analysis request
 */
async function handleAnalyzeRequest(
  searchParams: URLSearchParams
): Promise<NextResponse> {
  const text = searchParams.get('text');
  const title = searchParams.get('title') || '';
  const description = searchParams.get('description') || text || '';
  
  if (!title && !description) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Either text, title, or description is required',
        usage: '/api/regulatory?action=analyze&title=...&description=...',
      },
      { status: 400 }
    );
  }
  
  const fullText = `${title} ${description}`;
  
  // Analyze the text
  const classification = isRegulatoryNews(title, description);
  const jurisdiction = extractJurisdiction(fullText);
  const agency = extractAgency(fullText);
  const actionType = extractActionType(fullText);
  const affectedSectors = extractAffectedSectors(fullText);
  const impactLevel = assessImpactLevel(actionType, affectedSectors, jurisdiction);
  const sentiment = determineRegulatorySentiment(actionType, fullText);
  
  return NextResponse.json({
    success: true,
    data: {
      isRegulatory: classification.isRegulatory,
      confidence: classification.confidence,
      matchedKeywords: classification.matchedKeywords,
      analysis: {
        jurisdiction: {
          code: jurisdiction,
          name: JURISDICTION_INFO[jurisdiction].name,
          flag: JURISDICTION_INFO[jurisdiction].flag,
        },
        agency: agency ? {
          code: agency,
          name: AGENCY_INFO[agency]?.name,
          jurisdiction: AGENCY_INFO[agency]?.jurisdiction,
        } : null,
        actionType,
        affectedSectors,
        impactLevel,
        sentiment,
      },
    },
  });
}

/**
 * API Documentation endpoint
 */
export async function OPTIONS() {
  return NextResponse.json({
    name: 'Regulatory Intelligence API',
    version: '1.0.0',
    description: 'Comprehensive API for cryptocurrency regulatory news and compliance tracking',
    endpoints: {
      'GET /api/regulatory': {
        description: 'List regulatory events with filtering',
        params: {
          action: 'events (default)',
          jurisdiction: 'Filter by jurisdiction code (us, eu, uk, etc.)',
          agency: 'Filter by agency code (sec, cftc, fca, etc.)',
          actionType: 'Filter by action type (enforcement, guidance, etc.)',
          impact: 'Filter by impact level (critical, high, medium, low, informational)',
          sector: 'Filter by affected sector (exchanges, defi, stablecoins, etc.)',
          limit: 'Max results (default: 50, max: 100)',
          offset: 'Pagination offset',
          days: 'Lookback period in days (default: 7, max: 30)',
        },
      },
      'GET /api/regulatory?action=jurisdictions': {
        description: 'Get jurisdiction profiles with regulatory stance',
        params: {
          jurisdiction: 'Optional: specific jurisdiction code',
        },
      },
      'GET /api/regulatory?action=agencies': {
        description: 'Get regulatory agency information',
        params: {
          agency: 'Optional: specific agency code',
          jurisdiction: 'Optional: filter by jurisdiction',
        },
      },
      'GET /api/regulatory?action=deadlines': {
        description: 'Get upcoming compliance deadlines',
        params: {
          jurisdiction: 'Optional: filter by jurisdiction',
          days: 'Lookahead period in days (default: 90, max: 365)',
        },
      },
      'GET /api/regulatory?action=summary': {
        description: 'Get comprehensive regulatory intelligence summary',
      },
      'GET /api/regulatory?action=analyze': {
        description: 'Analyze text for regulatory content',
        params: {
          title: 'Article title',
          description: 'Article description/content',
          text: 'Alternative: full text to analyze',
        },
      },
    },
    jurisdictions: Object.entries(JURISDICTION_INFO).map(([code, info]) => ({
      code,
      ...info,
    })),
    agencies: Object.keys(AGENCY_INFO),
  });
}
