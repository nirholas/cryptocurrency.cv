/**
 * Regulatory Intelligence Tracker
 * 
 * Comprehensive monitoring system for cryptocurrency regulatory developments:
 * - Multi-jurisdictional tracking (US, EU, UK, Asia-Pacific, etc.)
 * - Agency-level monitoring (SEC, CFTC, FinCEN, FCA, MiCA, etc.)
 * - Compliance impact scoring and risk assessment
 * - Deadline tracking for regulatory implementations
 * - Real-time regulatory news aggregation
 * - Entity-level compliance status tracking
 * 
 * @module regulatory-intelligence
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Regulatory jurisdiction with associated agencies
 */
export type Jurisdiction = 
  | 'us'           // United States
  | 'eu'           // European Union
  | 'uk'           // United Kingdom
  | 'cn'           // China
  | 'jp'           // Japan
  | 'sg'           // Singapore
  | 'ae'           // United Arab Emirates
  | 'kr'           // South Korea
  | 'au'           // Australia
  | 'br'           // Brazil
  | 'ch'           // Switzerland
  | 'hk'           // Hong Kong
  | 'ca'           // Canada
  | 'in'           // India
  | 'global';      // International/Multi-jurisdictional

/**
 * Regulatory agency identifier
 */
export type RegulatoryAgency =
  // United States
  | 'sec'          // Securities and Exchange Commission
  | 'cftc'         // Commodity Futures Trading Commission
  | 'fincen'       // Financial Crimes Enforcement Network
  | 'occ'          // Office of the Comptroller of the Currency
  | 'fdic'         // Federal Deposit Insurance Corporation
  | 'fed'          // Federal Reserve
  | 'doj'          // Department of Justice
  | 'irs'          // Internal Revenue Service
  | 'nysdfs'       // NY State Dept of Financial Services
  // European Union
  | 'esma'         // European Securities and Markets Authority
  | 'eba'          // European Banking Authority
  | 'ecb'          // European Central Bank
  | 'mica'         // Markets in Crypto-Assets (framework)
  // United Kingdom
  | 'fca'          // Financial Conduct Authority
  | 'boe'          // Bank of England
  | 'pra'          // Prudential Regulation Authority
  // Asia Pacific
  | 'jfsa'         // Japan Financial Services Agency
  | 'mas'          // Monetary Authority of Singapore
  | 'sfc'          // Hong Kong Securities and Futures Commission
  | 'hkma'         // Hong Kong Monetary Authority
  | 'fsc-kr'       // Korea Financial Services Commission
  | 'asic'         // Australian Securities and Investments Commission
  | 'rbi'          // Reserve Bank of India
  | 'pboc'         // People's Bank of China
  // Others
  | 'finma'        // Swiss Financial Market Supervisory Authority
  | 'fatf'         // Financial Action Task Force
  | 'bis'          // Bank for International Settlements
  | 'imf'          // International Monetary Fund
  | 'fsb';         // Financial Stability Board

/**
 * Types of regulatory actions
 */
export type RegulatoryActionType =
  | 'enforcement'        // Enforcement action, fine, or penalty
  | 'guidance'           // Regulatory guidance or clarification
  | 'rule-proposal'      // Proposed rule or regulation
  | 'rule-final'         // Final rule or regulation
  | 'investigation'      // Active investigation announcement
  | 'settlement'         // Settlement agreement
  | 'licensing'          // Licensing framework or requirements
  | 'ban'               // Prohibition or ban
  | 'warning'           // Warning or advisory
  | 'consultation'      // Public consultation request
  | 'framework'         // Regulatory framework announcement
  | 'compliance-deadline'; // Compliance deadline notification

/**
 * Regulatory impact level
 */
export type ImpactLevel = 'critical' | 'high' | 'medium' | 'low' | 'informational';

/**
 * Regulatory stance on crypto
 */
export type RegulatoryStance = 
  | 'restrictive'       // Heavy restrictions or bans
  | 'cautious'          // Careful approach with restrictions
  | 'neutral'           // Balanced approach
  | 'progressive'       // Innovation-friendly
  | 'unclear';          // Unclear or evolving

/**
 * Affected crypto sector
 */
export type AffectedSector =
  | 'exchanges'         // Centralized exchanges
  | 'defi'              // Decentralized finance
  | 'stablecoins'       // Stablecoins and CBDC
  | 'nft'               // NFTs and digital collectibles
  | 'custody'           // Custody services
  | 'mining'            // Mining and staking
  | 'payments'          // Payment services
  | 'lending'           // Lending and borrowing
  | 'derivatives'       // Derivatives and futures
  | 'securities'        // Security tokens
  | 'all';              // General crypto regulation

/**
 * Regulatory development event
 */
export interface RegulatoryEvent {
  id: string;
  title: string;
  description: string;
  jurisdiction: Jurisdiction;
  agency: RegulatoryAgency;
  actionType: RegulatoryActionType;
  impactLevel: ImpactLevel;
  affectedSectors: AffectedSector[];
  affectedAssets: string[];             // Specific assets affected (BTC, ETH, etc.)
  effectiveDate?: Date;                 // When it takes effect
  commentDeadline?: Date;               // Deadline for public comments
  publishedAt: Date;
  sourceUrl: string;
  sourceTitle?: string;
  entities: {                           // Entities mentioned
    companies: string[];
    people: string[];
    protocols: string[];
  };
  sentiment: 'positive' | 'negative' | 'neutral';
  tags: string[];
  isBreaking: boolean;
}

/**
 * Jurisdiction regulatory profile
 */
export interface JurisdictionProfile {
  jurisdiction: Jurisdiction;
  name: string;
  flag: string;
  stance: RegulatoryStance;
  stanceScore: number;                  // -100 (restrictive) to +100 (progressive)
  primaryAgencies: RegulatoryAgency[];
  majorRegulations: string[];           // Key regulatory frameworks
  recentActivity: number;               // Activity score (0-100)
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  keyDates: {
    date: Date;
    description: string;
    type: 'deadline' | 'implementation' | 'review';
  }[];
  lastUpdated: Date;
}

/**
 * Agency details
 */
export interface AgencyProfile {
  agency: RegulatoryAgency;
  name: string;
  jurisdiction: Jurisdiction;
  website: string;
  cryptoStance: RegulatoryStance;
  enforcementHistory: {
    totalActions: number;
    totalFines: number;                 // In USD
    recentActions: number;              // Last 12 months
  };
  keyPersonnel: {
    name: string;
    title: string;
    cryptoStance?: RegulatoryStance;
  }[];
  focusAreas: AffectedSector[];
  lastUpdated: Date;
}

/**
 * Compliance deadline
 */
export interface ComplianceDeadline {
  id: string;
  title: string;
  description: string;
  jurisdiction: Jurisdiction;
  agency: RegulatoryAgency;
  deadline: Date;
  affectedSectors: AffectedSector[];
  impactLevel: ImpactLevel;
  requirements: string[];
  penalties?: string;                   // Penalty for non-compliance
  sourceUrl: string;
  status: 'upcoming' | 'imminent' | 'passed';
  daysUntil: number;
}

/**
 * Regulatory risk score for an entity
 */
export interface RegulatoryRiskScore {
  entityId: string;
  entityName: string;
  entityType: 'exchange' | 'protocol' | 'token' | 'company';
  overallScore: number;                 // 0-100, higher = more risk
  jurisdictionScores: Record<Jurisdiction, number>;
  sectorScores: Record<AffectedSector, number>;
  pendingActions: number;
  activeInvestigations: number;
  historicalFines: number;
  riskFactors: {
    factor: string;
    impact: number;
    description: string;
  }[];
  recommendations: string[];
  lastUpdated: Date;
}

/**
 * Regulatory intelligence summary
 */
export interface RegulatoryIntelligenceSummary {
  globalRiskLevel: 'stable' | 'elevated' | 'high' | 'critical';
  activeEvents: number;
  upcomingDeadlines: number;
  recentEnforcements: number;
  trendingTopics: {
    topic: string;
    mentions: number;
    sentiment: 'positive' | 'negative' | 'neutral';
  }[];
  hotJurisdictions: Jurisdiction[];
  recentEvents: RegulatoryEvent[];
  criticalDeadlines: ComplianceDeadline[];
  marketImpact: {
    shortTerm: 'bullish' | 'bearish' | 'neutral';
    longTerm: 'bullish' | 'bearish' | 'neutral';
    reasoning: string;
  };
  generatedAt: Date;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Jurisdiction metadata
 */
export const JURISDICTION_INFO: Record<Jurisdiction, { name: string; flag: string }> = {
  us: { name: 'United States', flag: '🇺🇸' },
  eu: { name: 'European Union', flag: '🇪🇺' },
  uk: { name: 'United Kingdom', flag: '🇬🇧' },
  cn: { name: 'China', flag: '🇨🇳' },
  jp: { name: 'Japan', flag: '🇯🇵' },
  sg: { name: 'Singapore', flag: '🇸🇬' },
  ae: { name: 'United Arab Emirates', flag: '🇦🇪' },
  kr: { name: 'South Korea', flag: '🇰🇷' },
  au: { name: 'Australia', flag: '🇦🇺' },
  br: { name: 'Brazil', flag: '🇧🇷' },
  ch: { name: 'Switzerland', flag: '🇨🇭' },
  hk: { name: 'Hong Kong', flag: '🇭🇰' },
  ca: { name: 'Canada', flag: '🇨🇦' },
  in: { name: 'India', flag: '🇮🇳' },
  global: { name: 'Global', flag: '🌍' },
};

/**
 * Agency metadata
 */
export const AGENCY_INFO: Record<RegulatoryAgency, { 
  name: string; 
  jurisdiction: Jurisdiction;
  website: string;
  description: string;
}> = {
  // United States
  sec: { 
    name: 'Securities and Exchange Commission', 
    jurisdiction: 'us',
    website: 'https://www.sec.gov',
    description: 'Primary securities regulator, focuses on crypto as securities'
  },
  cftc: { 
    name: 'Commodity Futures Trading Commission', 
    jurisdiction: 'us',
    website: 'https://www.cftc.gov',
    description: 'Regulates commodity futures and derivatives'
  },
  fincen: { 
    name: 'Financial Crimes Enforcement Network', 
    jurisdiction: 'us',
    website: 'https://www.fincen.gov',
    description: 'AML/KYC enforcement and money transmission'
  },
  occ: { 
    name: 'Office of the Comptroller of the Currency', 
    jurisdiction: 'us',
    website: 'https://www.occ.gov',
    description: 'National bank supervision and crypto custody'
  },
  fdic: { 
    name: 'Federal Deposit Insurance Corporation', 
    jurisdiction: 'us',
    website: 'https://www.fdic.gov',
    description: 'Deposit insurance and bank supervision'
  },
  fed: { 
    name: 'Federal Reserve', 
    jurisdiction: 'us',
    website: 'https://www.federalreserve.gov',
    description: 'Central banking and stablecoin policy'
  },
  doj: { 
    name: 'Department of Justice', 
    jurisdiction: 'us',
    website: 'https://www.justice.gov',
    description: 'Criminal enforcement for crypto fraud'
  },
  irs: { 
    name: 'Internal Revenue Service', 
    jurisdiction: 'us',
    website: 'https://www.irs.gov',
    description: 'Tax guidance and enforcement for crypto'
  },
  nysdfs: { 
    name: 'NY State Dept of Financial Services', 
    jurisdiction: 'us',
    website: 'https://www.dfs.ny.gov',
    description: 'BitLicense and NY crypto regulation'
  },
  // European Union
  esma: { 
    name: 'European Securities and Markets Authority', 
    jurisdiction: 'eu',
    website: 'https://www.esma.europa.eu',
    description: 'EU-wide securities supervision'
  },
  eba: { 
    name: 'European Banking Authority', 
    jurisdiction: 'eu',
    website: 'https://www.eba.europa.eu',
    description: 'EU banking regulation and crypto-assets'
  },
  ecb: { 
    name: 'European Central Bank', 
    jurisdiction: 'eu',
    website: 'https://www.ecb.europa.eu',
    description: 'Eurozone monetary policy and digital euro'
  },
  mica: { 
    name: 'Markets in Crypto-Assets Regulation', 
    jurisdiction: 'eu',
    website: 'https://www.eba.europa.eu/activities/single-rulebook/regulatory-activities/markets-crypto-assets-regulation-mica',
    description: 'Comprehensive EU crypto regulatory framework'
  },
  // United Kingdom
  fca: { 
    name: 'Financial Conduct Authority', 
    jurisdiction: 'uk',
    website: 'https://www.fca.org.uk',
    description: 'UK financial services regulator'
  },
  boe: { 
    name: 'Bank of England', 
    jurisdiction: 'uk',
    website: 'https://www.bankofengland.co.uk',
    description: 'UK central bank and systemic risk'
  },
  pra: { 
    name: 'Prudential Regulation Authority', 
    jurisdiction: 'uk',
    website: 'https://www.bankofengland.co.uk/pra',
    description: 'UK prudential supervision'
  },
  // Asia Pacific
  jfsa: { 
    name: 'Japan Financial Services Agency', 
    jurisdiction: 'jp',
    website: 'https://www.fsa.go.jp',
    description: 'Japan financial regulator'
  },
  mas: { 
    name: 'Monetary Authority of Singapore', 
    jurisdiction: 'sg',
    website: 'https://www.mas.gov.sg',
    description: 'Singapore central bank and regulator'
  },
  sfc: { 
    name: 'Securities and Futures Commission', 
    jurisdiction: 'hk',
    website: 'https://www.sfc.hk',
    description: 'Hong Kong securities regulator'
  },
  hkma: { 
    name: 'Hong Kong Monetary Authority', 
    jurisdiction: 'hk',
    website: 'https://www.hkma.gov.hk',
    description: 'Hong Kong central bank'
  },
  'fsc-kr': { 
    name: 'Financial Services Commission', 
    jurisdiction: 'kr',
    website: 'https://www.fsc.go.kr',
    description: 'Korea financial regulator'
  },
  asic: { 
    name: 'Australian Securities and Investments Commission', 
    jurisdiction: 'au',
    website: 'https://asic.gov.au',
    description: 'Australia securities regulator'
  },
  rbi: { 
    name: 'Reserve Bank of India', 
    jurisdiction: 'in',
    website: 'https://www.rbi.org.in',
    description: 'India central bank'
  },
  pboc: { 
    name: "People's Bank of China", 
    jurisdiction: 'cn',
    website: 'https://www.pbc.gov.cn',
    description: 'China central bank - crypto ban'
  },
  // International
  finma: { 
    name: 'Swiss Financial Market Supervisory Authority', 
    jurisdiction: 'ch',
    website: 'https://www.finma.ch',
    description: 'Switzerland financial regulator'
  },
  fatf: { 
    name: 'Financial Action Task Force', 
    jurisdiction: 'global',
    website: 'https://www.fatf-gafi.org',
    description: 'International AML standards body'
  },
  bis: { 
    name: 'Bank for International Settlements', 
    jurisdiction: 'global',
    website: 'https://www.bis.org',
    description: 'Central bank cooperation'
  },
  imf: { 
    name: 'International Monetary Fund', 
    jurisdiction: 'global',
    website: 'https://www.imf.org',
    description: 'International monetary cooperation'
  },
  fsb: { 
    name: 'Financial Stability Board', 
    jurisdiction: 'global',
    website: 'https://www.fsb.org',
    description: 'Global financial stability monitoring'
  },
};

/**
 * Regulatory keywords for news classification
 */
export const REGULATORY_KEYWORDS = {
  agencies: [
    'SEC', 'CFTC', 'FinCEN', 'OCC', 'FDIC', 'Federal Reserve', 'Fed', 'DOJ',
    'IRS', 'ESMA', 'EBA', 'ECB', 'MiCA', 'FCA', 'FSA', 'MAS', 'SFC', 'HKMA',
    'ASIC', 'RBI', 'PBOC', 'FINMA', 'FATF', 'BIS', 'IMF', 'FSB', 'BitLicense'
  ],
  actions: [
    'enforcement', 'fine', 'penalty', 'investigation', 'subpoena', 'lawsuit',
    'settlement', 'compliance', 'guidance', 'regulation', 'rule', 'proposal',
    'ban', 'restriction', 'license', 'registration', 'authorization', 'approval',
    'rejection', 'warning', 'advisory', 'consultation', 'framework', 'legislation',
    'law', 'bill', 'amendment', 'sanction', 'seizure', 'prosecution', 'indictment'
  ],
  sectors: [
    'exchange', 'custody', 'stablecoin', 'DeFi', 'NFT', 'mining', 'staking',
    'lending', 'derivatives', 'futures', 'options', 'securities', 'token',
    'ICO', 'IEO', 'STO', 'ETF', 'custodian', 'broker', 'dealer'
  ],
  people: [
    'Gary Gensler', 'Hester Peirce', 'Rostin Behnam', 'Janet Yellen',
    'Jerome Powell', 'Christine Lagarde', 'Changpeng Zhao', 'CZ',
    'Sam Bankman-Fried', 'SBF', 'Brian Armstrong', 'Brad Garlinghouse'
  ],
};

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Classify a news article as regulatory or not
 */
export function isRegulatoryNews(title: string, description: string): {
  isRegulatory: boolean;
  confidence: number;
  matchedKeywords: string[];
} {
  const text = `${title} ${description}`.toLowerCase();
  const matchedKeywords: string[] = [];
  
  // Check for agency mentions
  for (const agency of REGULATORY_KEYWORDS.agencies) {
    if (text.includes(agency.toLowerCase())) {
      matchedKeywords.push(agency);
    }
  }
  
  // Check for action keywords
  for (const action of REGULATORY_KEYWORDS.actions) {
    if (text.includes(action.toLowerCase())) {
      matchedKeywords.push(action);
    }
  }
  
  // Check for sector keywords in regulatory context
  const hasRegulatoryContext = matchedKeywords.length > 0;
  if (hasRegulatoryContext) {
    for (const sector of REGULATORY_KEYWORDS.sectors) {
      if (text.includes(sector.toLowerCase())) {
        matchedKeywords.push(sector);
      }
    }
  }
  
  // Calculate confidence based on keyword density
  const uniqueMatches = [...new Set(matchedKeywords)];
  const confidence = Math.min(uniqueMatches.length / 5, 1);
  
  return {
    isRegulatory: uniqueMatches.length >= 2,
    confidence,
    matchedKeywords: uniqueMatches,
  };
}

/**
 * Extract jurisdiction from news text
 */
export function extractJurisdiction(text: string): Jurisdiction {
  const normalized = text.toLowerCase();
  
  // US indicators
  if (/\b(sec|cftc|fincen|occ|fdic|fed|irs|nysdfs|u\.?s\.?|united states|american|washington|congress|senate|house of representatives)\b/i.test(normalized)) {
    return 'us';
  }
  
  // EU indicators
  if (/\b(eu|european union|esma|eba|ecb|mica|brussels|eurozone|european parliament)\b/i.test(normalized)) {
    return 'eu';
  }
  
  // UK indicators
  if (/\b(uk|britain|british|fca|boe|pra|london|england|wales|scotland)\b/i.test(normalized)) {
    return 'uk';
  }
  
  // China indicators
  if (/\b(china|chinese|pboc|beijing|shanghai|prc)\b/i.test(normalized)) {
    return 'cn';
  }
  
  // Japan indicators
  if (/\b(japan|japanese|jfsa|tokyo)\b/i.test(normalized)) {
    return 'jp';
  }
  
  // Singapore indicators
  if (/\b(singapore|singaporean|mas)\b/i.test(normalized)) {
    return 'sg';
  }
  
  // Hong Kong indicators
  if (/\b(hong kong|hk|sfc|hkma)\b/i.test(normalized)) {
    return 'hk';
  }
  
  // South Korea indicators
  if (/\b(korea|korean|fsc|seoul)\b/i.test(normalized)) {
    return 'kr';
  }
  
  // Australia indicators
  if (/\b(australia|australian|asic|sydney|melbourne|canberra)\b/i.test(normalized)) {
    return 'au';
  }
  
  // Switzerland indicators
  if (/\b(switzerland|swiss|finma|zurich|geneva|zug)\b/i.test(normalized)) {
    return 'ch';
  }
  
  // UAE indicators
  if (/\b(uae|dubai|abu dhabi|emirates)\b/i.test(normalized)) {
    return 'ae';
  }
  
  // India indicators
  if (/\b(india|indian|rbi|mumbai|delhi|sebi)\b/i.test(normalized)) {
    return 'in';
  }
  
  // Brazil indicators
  if (/\b(brazil|brazilian|sao paulo|brasilia)\b/i.test(normalized)) {
    return 'br';
  }
  
  // Canada indicators
  if (/\b(canada|canadian|toronto|ottawa|ontario|osc)\b/i.test(normalized)) {
    return 'ca';
  }
  
  // Global/International
  if (/\b(fatf|imf|bis|fsb|international|global|worldwide)\b/i.test(normalized)) {
    return 'global';
  }
  
  return 'global';
}

/**
 * Extract regulatory agency from news text
 */
export function extractAgency(text: string): RegulatoryAgency | null {
  const normalized = text.toLowerCase();
  
  // Direct agency mentions
  const agencyPatterns: [RegExp, RegulatoryAgency][] = [
    [/\bsec\b|securities and exchange commission/i, 'sec'],
    [/\bcftc\b|commodity futures trading commission/i, 'cftc'],
    [/\bfincen\b|financial crimes enforcement/i, 'fincen'],
    [/\bocc\b|office of the comptroller/i, 'occ'],
    [/\bfdic\b|federal deposit insurance/i, 'fdic'],
    [/\bfederal reserve\b|\bthe fed\b/i, 'fed'],
    [/\bdoj\b|department of justice/i, 'doj'],
    [/\birs\b|internal revenue service/i, 'irs'],
    [/\bnysdfs\b|bitlicense/i, 'nysdfs'],
    [/\besma\b|european securities and markets/i, 'esma'],
    [/\beba\b|european banking authority/i, 'eba'],
    [/\becb\b|european central bank/i, 'ecb'],
    [/\bmica\b|markets in crypto.?assets/i, 'mica'],
    [/\bfca\b|financial conduct authority/i, 'fca'],
    [/\bbank of england\b|\bboe\b/i, 'boe'],
    [/\bjfsa\b|japan financial services/i, 'jfsa'],
    [/\bmas\b|monetary authority of singapore/i, 'mas'],
    [/\bsfc\b|securities and futures commission/i, 'sfc'],
    [/\bhkma\b|hong kong monetary/i, 'hkma'],
    [/\basic\b|australian securities/i, 'asic'],
    [/\brbi\b|reserve bank of india/i, 'rbi'],
    [/\bpboc\b|people's bank of china/i, 'pboc'],
    [/\bfinma\b|swiss financial market/i, 'finma'],
    [/\bfatf\b|financial action task force/i, 'fatf'],
    [/\bbis\b|bank for international settlements/i, 'bis'],
    [/\bimf\b|international monetary fund/i, 'imf'],
    [/\bfsb\b|financial stability board/i, 'fsb'],
  ];
  
  for (const [pattern, agency] of agencyPatterns) {
    if (pattern.test(normalized)) {
      return agency;
    }
  }
  
  return null;
}

/**
 * Determine the action type from news text
 */
export function extractActionType(text: string): RegulatoryActionType {
  const normalized = text.toLowerCase();
  
  // Enforcement patterns
  if (/\b(charged|charges|fine[sd]?|penalty|penalt|sued|suing|lawsuit|enforcement action|settl|plea|guilty|fraud|violation)\b/i.test(normalized)) {
    if (/\bsettl/i.test(normalized)) return 'settlement';
    return 'enforcement';
  }
  
  // Investigation patterns
  if (/\b(investigat|probe|inquiry|examining|scrutin|subpoena|wells notice)\b/i.test(normalized)) {
    return 'investigation';
  }
  
  // Rule patterns
  if (/\b(propos|draft|comment period|seeking comment|proposed rule)\b/i.test(normalized)) {
    return 'rule-proposal';
  }
  if (/\b(final rule|adopt|enacted|effective|implementation)\b/i.test(normalized)) {
    return 'rule-final';
  }
  
  // Ban/restriction patterns
  if (/\b(ban|prohibit|restrict|block|forbid|outlaw)\b/i.test(normalized)) {
    return 'ban';
  }
  
  // Licensing patterns
  if (/\b(licens|registr|authoriz|approv|permit|certif)\b/i.test(normalized)) {
    return 'licensing';
  }
  
  // Warning patterns
  if (/\b(warn|alert|caution|advisory|risk)\b/i.test(normalized)) {
    return 'warning';
  }
  
  // Consultation patterns
  if (/\b(consult|feedback|input|stakeholder)\b/i.test(normalized)) {
    return 'consultation';
  }
  
  // Framework patterns
  if (/\b(framework|structure|regime|roadmap|blueprint)\b/i.test(normalized)) {
    return 'framework';
  }
  
  // Deadline patterns
  if (/\b(deadline|due date|must comply by|effective date)\b/i.test(normalized)) {
    return 'compliance-deadline';
  }
  
  return 'guidance';
}

/**
 * Assess the impact level of a regulatory event
 */
export function assessImpactLevel(
  actionType: RegulatoryActionType,
  affectedSectors: AffectedSector[],
  jurisdiction: Jurisdiction,
  fineAmount?: number
): ImpactLevel {
  let score = 0;
  
  // Action type scoring
  const actionScores: Record<RegulatoryActionType, number> = {
    'enforcement': 70,
    'ban': 90,
    'rule-final': 60,
    'settlement': 50,
    'investigation': 40,
    'rule-proposal': 35,
    'compliance-deadline': 45,
    'licensing': 30,
    'framework': 25,
    'consultation': 15,
    'guidance': 20,
    'warning': 35,
  };
  score += actionScores[actionType] || 20;
  
  // Sector impact
  if (affectedSectors.includes('all')) {
    score += 30;
  } else if (affectedSectors.includes('exchanges') || affectedSectors.includes('stablecoins')) {
    score += 20;
  } else if (affectedSectors.length > 2) {
    score += 15;
  }
  
  // Jurisdiction impact
  const jurisdictionWeight: Record<Jurisdiction, number> = {
    us: 25,
    eu: 20,
    global: 25,
    uk: 15,
    cn: 20,
    jp: 15,
    sg: 10,
    hk: 12,
    kr: 12,
    au: 10,
    ch: 8,
    ae: 8,
    ca: 8,
    br: 5,
    in: 10,
  };
  score += jurisdictionWeight[jurisdiction] || 5;
  
  // Fine amount impact
  if (fineAmount) {
    if (fineAmount >= 1000000000) score += 30;      // $1B+
    else if (fineAmount >= 100000000) score += 20;  // $100M+
    else if (fineAmount >= 10000000) score += 10;   // $10M+
    else if (fineAmount >= 1000000) score += 5;     // $1M+
  }
  
  // Normalize to impact level
  if (score >= 120) return 'critical';
  if (score >= 80) return 'high';
  if (score >= 50) return 'medium';
  if (score >= 25) return 'low';
  return 'informational';
}

/**
 * Extract affected sectors from news text
 */
export function extractAffectedSectors(text: string): AffectedSector[] {
  const normalized = text.toLowerCase();
  const sectors: AffectedSector[] = [];
  
  const sectorPatterns: [RegExp, AffectedSector][] = [
    [/\b(exchange|trading platform|coinbase|binance|kraken|gemini|bitstamp)\b/i, 'exchanges'],
    [/\b(defi|decentralized finance|uniswap|aave|compound|lending protocol)\b/i, 'defi'],
    [/\b(stablecoin|usdt|usdc|tether|circle|dai|busd)\b/i, 'stablecoins'],
    [/\b(nft|non.?fungible|collectible|opensea|blur)\b/i, 'nft'],
    [/\b(custody|custodian|safekeeping|cold storage)\b/i, 'custody'],
    [/\b(mining|miner|proof.?of.?work|hashrate|staking|validator)\b/i, 'mining'],
    [/\b(payment|remittance|transfer|money transmission)\b/i, 'payments'],
    [/\b(lending|borrowing|interest|yield|loan)\b/i, 'lending'],
    [/\b(derivative|future|option|perp|swap)\b/i, 'derivatives'],
    [/\b(security|security token|sto|howey)\b/i, 'securities'],
  ];
  
  for (const [pattern, sector] of sectorPatterns) {
    if (pattern.test(normalized)) {
      sectors.push(sector);
    }
  }
  
  // If mentions broad crypto regulation
  if (/\b(crypto|cryptocurrency|digital asset|virtual asset)\b/i.test(normalized) && 
      /\b(industry|sector|market|all|comprehensive)\b/i.test(normalized)) {
    sectors.push('all');
  }
  
  return [...new Set(sectors)];
}

/**
 * Extract fine amount from news text
 */
export function extractFineAmount(text: string): number | null {
  // Match patterns like "$4.3 billion", "4.3B", "$100 million", "100M"
  const patterns = [
    /\$([0-9,]+(?:\.[0-9]+)?)\s*(billion|b)\b/i,
    /\$([0-9,]+(?:\.[0-9]+)?)\s*(million|m)\b/i,
    /\$([0-9,]+(?:\.[0-9]+)?)\s*(thousand|k)\b/i,
    /\$([0-9,]+(?:\.[0-9]+)?)\b/,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const value = parseFloat(match[1].replace(/,/g, ''));
      const unit = match[2]?.toLowerCase();
      
      if (unit === 'billion' || unit === 'b') return value * 1000000000;
      if (unit === 'million' || unit === 'm') return value * 1000000;
      if (unit === 'thousand' || unit === 'k') return value * 1000;
      return value;
    }
  }
  
  return null;
}

/**
 * Determine regulatory sentiment
 */
export function determineRegulatorySentiment(
  actionType: RegulatoryActionType,
  text: string
): 'positive' | 'negative' | 'neutral' {
  // Actions typically negative for crypto
  if (['enforcement', 'ban', 'investigation'].includes(actionType)) {
    return 'negative';
  }
  
  // Actions typically positive for crypto
  if (['licensing', 'framework'].includes(actionType)) {
    // Check for positive signals
    if (/\b(approv|accept|grant|issu|clear|green light)\b/i.test(text)) {
      return 'positive';
    }
    // Check for negative signals
    if (/\b(reject|deny|refus|block)\b/i.test(text)) {
      return 'negative';
    }
    return 'positive';
  }
  
  // Context-dependent
  const positiveWords = /\b(clarity|progress|support|innovation|friendly|embrace|adopt)\b/i;
  const negativeWords = /\b(concern|risk|warn|restrict|limit|ban|fraud|scam)\b/i;
  
  const hasPositive = positiveWords.test(text);
  const hasNegative = negativeWords.test(text);
  
  if (hasPositive && !hasNegative) return 'positive';
  if (hasNegative && !hasPositive) return 'negative';
  
  return 'neutral';
}

// ============================================================================
// ANALYSIS FUNCTIONS
// ============================================================================

/**
 * Create a regulatory event from news data
 */
export function createRegulatoryEvent(
  id: string,
  title: string,
  description: string,
  sourceUrl: string,
  publishedAt: Date,
  entities?: { companies: string[]; people: string[]; protocols: string[] }
): RegulatoryEvent | null {
  const text = `${title} ${description}`;
  
  // Check if this is regulatory news
  const classification = isRegulatoryNews(title, description);
  if (!classification.isRegulatory) {
    return null;
  }
  
  const jurisdiction = extractJurisdiction(text);
  const agency = extractAgency(text);
  const actionType = extractActionType(text);
  const affectedSectors = extractAffectedSectors(text);
  const fineAmount = extractFineAmount(text);
  const impactLevel = assessImpactLevel(actionType, affectedSectors, jurisdiction, fineAmount || undefined);
  const sentiment = determineRegulatorySentiment(actionType, text);
  
  // Extract affected assets
  const assetPattern = /\b(BTC|ETH|XRP|SOL|ADA|DOGE|MATIC|LINK|AVAX|DOT|UNI|ATOM|LTC|SHIB|BCH|XLM|ALGO)\b/gi;
  const assetMatches = text.match(assetPattern) || [];
  const affectedAssets = [...new Set(assetMatches.map(a => a.toUpperCase()))];
  
  // Look for dates
  let effectiveDate: Date | undefined;
  let commentDeadline: Date | undefined;
  
  const effectiveDateMatch = text.match(/effective\s+(?:on\s+)?([A-Z][a-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4})/i);
  if (effectiveDateMatch) {
    effectiveDate = new Date(effectiveDateMatch[1]);
    if (isNaN(effectiveDate.getTime())) effectiveDate = undefined;
  }
  
  const commentMatch = text.match(/comment(?:s)?\s+(?:by|due|deadline)\s+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4})/i);
  if (commentMatch) {
    commentDeadline = new Date(commentMatch[1]);
    if (isNaN(commentDeadline.getTime())) commentDeadline = undefined;
  }
  
  return {
    id,
    title,
    description,
    jurisdiction,
    agency: agency || 'sec', // Default to SEC if unable to determine
    actionType,
    impactLevel,
    affectedSectors: affectedSectors.length > 0 ? affectedSectors : ['all'],
    affectedAssets,
    effectiveDate,
    commentDeadline,
    publishedAt,
    sourceUrl,
    entities: entities || { companies: [], people: [], protocols: [] },
    sentiment,
    tags: classification.matchedKeywords,
    isBreaking: impactLevel === 'critical' || impactLevel === 'high',
  };
}

/**
 * Get jurisdiction profile with current stance and activity
 */
export function getJurisdictionProfile(jurisdiction: Jurisdiction): JurisdictionProfile {
  const info = JURISDICTION_INFO[jurisdiction];
  
  // Jurisdiction stance data (could be fetched from API in production)
  const stanceData: Record<Jurisdiction, { stance: RegulatoryStance; score: number }> = {
    us: { stance: 'cautious', score: -20 },
    eu: { stance: 'neutral', score: 10 },
    uk: { stance: 'cautious', score: -10 },
    cn: { stance: 'restrictive', score: -80 },
    jp: { stance: 'neutral', score: 20 },
    sg: { stance: 'progressive', score: 50 },
    ae: { stance: 'progressive', score: 60 },
    kr: { stance: 'cautious', score: -10 },
    au: { stance: 'neutral', score: 0 },
    br: { stance: 'neutral', score: 5 },
    ch: { stance: 'progressive', score: 55 },
    hk: { stance: 'progressive', score: 40 },
    ca: { stance: 'cautious', score: -15 },
    in: { stance: 'cautious', score: -30 },
    global: { stance: 'neutral', score: 0 },
  };
  
  const { stance, score } = stanceData[jurisdiction];
  
  // Get primary agencies for jurisdiction
  const primaryAgencies: RegulatoryAgency[] = Object.entries(AGENCY_INFO)
    .filter(([, info]) => info.jurisdiction === jurisdiction)
    .map(([agency]) => agency as RegulatoryAgency);
  
  // Risk level based on stance
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  if (score >= 30) riskLevel = 'low';
  else if (score >= -20) riskLevel = 'medium';
  else if (score >= -50) riskLevel = 'high';
  else riskLevel = 'critical';
  
  return {
    jurisdiction,
    name: info.name,
    flag: info.flag,
    stance,
    stanceScore: score,
    primaryAgencies,
    majorRegulations: getMajorRegulations(jurisdiction),
    recentActivity: 50, // Would be calculated from actual events
    riskLevel,
    keyDates: getKeyDates(jurisdiction),
    lastUpdated: new Date(),
  };
}

/**
 * Get major regulations for a jurisdiction
 */
function getMajorRegulations(jurisdiction: Jurisdiction): string[] {
  const regulations: Record<Jurisdiction, string[]> = {
    us: ['Securities Act 1933', 'Securities Exchange Act 1934', 'Bank Secrecy Act', 'Howey Test'],
    eu: ['MiCA Regulation', 'DORA', 'AML Directive 6', 'GDPR'],
    uk: ['Financial Services and Markets Act', 'Crypto-Asset Regime (2024)', 'AML Regulations'],
    cn: ['Crypto Trading Ban (2021)', 'Mining Ban (2021)', 'Digital Yuan Regulations'],
    jp: ['Payment Services Act', 'Financial Instruments and Exchange Act', 'JVCEA Guidelines'],
    sg: ['Payment Services Act 2019', 'MAS Guidelines', 'Securities and Futures Act'],
    ae: ['VARA Regulations', 'ADGM Framework', 'DIFC Crypto Regime'],
    kr: ['Act on Reporting and Using Specified Financial Transaction Info', 'Virtual Asset Service Provider Act'],
    au: ['Corporations Act', 'AML/CTF Act', 'Token Mapping Consultation'],
    br: ['Crypto Framework Law (2022)', 'Central Bank Regulations'],
    ch: ['DLT Act', 'FINMA Guidance', 'Banking Act'],
    hk: ['Securities and Futures Ordinance', 'VASP Licensing Regime', 'Stablecoin Consultation'],
    ca: ['Securities Regulation', 'MSB Registration', 'Crypto Trading Platform Guidelines'],
    in: ['VDA Taxation (2022)', 'TDS Requirements', 'RBI Circular (contested)'],
    global: ['FATF Travel Rule', 'FATF Recommendations', 'Basel Framework'],
  };
  
  return regulations[jurisdiction] || [];
}

/**
 * Get key upcoming dates for a jurisdiction
 */
function getKeyDates(jurisdiction: Jurisdiction): JurisdictionProfile['keyDates'] {
  const now = new Date();
  const dates: JurisdictionProfile['keyDates'] = [];
  
  // Example key dates (would be maintained in database)
  if (jurisdiction === 'eu') {
    dates.push({
      date: new Date('2024-06-30'),
      description: 'MiCA Full Implementation Deadline',
      type: 'deadline',
    });
  }
  
  if (jurisdiction === 'uk') {
    dates.push({
      date: new Date('2024-10-01'),
      description: 'FCA Crypto Marketing Rules',
      type: 'implementation',
    });
  }
  
  if (jurisdiction === 'hk') {
    dates.push({
      date: new Date('2024-06-01'),
      description: 'VASP Licensing Deadline',
      type: 'deadline',
    });
  }
  
  return dates.filter(d => d.date > now);
}

/**
 * Generate regulatory intelligence summary
 */
export function generateIntelligenceSummary(
  events: RegulatoryEvent[],
  deadlines: ComplianceDeadline[]
): RegulatoryIntelligenceSummary {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // Recent events
  const recentEvents = events.filter(e => e.publishedAt > last7d);
  const breakingEvents = recentEvents.filter(e => e.isBreaking);
  
  // Critical deadlines (next 30 days)
  const criticalDeadlines = deadlines
    .filter(d => d.daysUntil <= 30 && d.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil);
  
  // Enforcement count
  const recentEnforcements = recentEvents.filter(
    e => e.actionType === 'enforcement' || e.actionType === 'settlement'
  ).length;
  
  // Trending topics
  const topicCounts = new Map<string, { count: number; sentiment: number }>();
  for (const event of recentEvents) {
    for (const tag of event.tags) {
      const current = topicCounts.get(tag) || { count: 0, sentiment: 0 };
      current.count++;
      current.sentiment += event.sentiment === 'positive' ? 1 : event.sentiment === 'negative' ? -1 : 0;
      topicCounts.set(tag, current);
    }
  }
  
  const trendingTopics: {
    topic: string;
    mentions: number;
    sentiment: 'positive' | 'negative' | 'neutral';
  }[] = Array.from(topicCounts.entries())
    .map(([topic, data]) => ({
      topic,
      mentions: data.count,
      sentiment: (data.sentiment > 0 ? 'positive' : data.sentiment < 0 ? 'negative' : 'neutral') as 'positive' | 'negative' | 'neutral',
    }))
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 10);
  
  // Hot jurisdictions
  const jurisdictionActivity = new Map<Jurisdiction, number>();
  for (const event of recentEvents) {
    jurisdictionActivity.set(
      event.jurisdiction,
      (jurisdictionActivity.get(event.jurisdiction) || 0) + (event.impactLevel === 'critical' ? 3 : event.impactLevel === 'high' ? 2 : 1)
    );
  }
  
  const hotJurisdictions = Array.from(jurisdictionActivity.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([j]) => j);
  
  // Global risk level
  const criticalCount = recentEvents.filter(e => e.impactLevel === 'critical').length;
  const highCount = recentEvents.filter(e => e.impactLevel === 'high').length;
  
  let globalRiskLevel: 'stable' | 'elevated' | 'high' | 'critical' = 'stable';
  if (criticalCount >= 3 || (criticalCount >= 1 && highCount >= 5)) {
    globalRiskLevel = 'critical';
  } else if (criticalCount >= 1 || highCount >= 3) {
    globalRiskLevel = 'high';
  } else if (highCount >= 1 || recentEnforcements >= 3) {
    globalRiskLevel = 'elevated';
  }
  
  // Market impact assessment
  const negativeEvents = recentEvents.filter(e => e.sentiment === 'negative').length;
  const positiveEvents = recentEvents.filter(e => e.sentiment === 'positive').length;
  
  let shortTerm: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  let longTerm: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  
  if (negativeEvents > positiveEvents * 2) {
    shortTerm = 'bearish';
  } else if (positiveEvents > negativeEvents * 2) {
    shortTerm = 'bullish';
  }
  
  // Long-term is positive if regulatory clarity is increasing
  const frameworkEvents = recentEvents.filter(
    e => e.actionType === 'framework' || e.actionType === 'licensing'
  ).length;
  if (frameworkEvents >= 3) {
    longTerm = 'bullish';
  }
  
  const reasoning = generateImpactReasoning(
    globalRiskLevel,
    hotJurisdictions,
    recentEnforcements,
    frameworkEvents
  );
  
  return {
    globalRiskLevel,
    activeEvents: recentEvents.length,
    upcomingDeadlines: criticalDeadlines.length,
    recentEnforcements,
    trendingTopics,
    hotJurisdictions,
    recentEvents: recentEvents.slice(0, 20),
    criticalDeadlines: criticalDeadlines.slice(0, 10),
    marketImpact: {
      shortTerm,
      longTerm,
      reasoning,
    },
    generatedAt: now,
  };
}

/**
 * Generate market impact reasoning text
 */
function generateImpactReasoning(
  riskLevel: string,
  hotJurisdictions: Jurisdiction[],
  enforcements: number,
  frameworks: number
): string {
  const parts: string[] = [];
  
  if (riskLevel === 'critical') {
    parts.push('Significant regulatory pressure across multiple jurisdictions.');
  } else if (riskLevel === 'high') {
    parts.push('Elevated regulatory activity detected.');
  }
  
  if (hotJurisdictions.includes('us')) {
    parts.push('US regulatory focus remains high priority.');
  }
  if (hotJurisdictions.includes('eu')) {
    parts.push('EU MiCA implementation continues to shape market.');
  }
  
  if (enforcements >= 3) {
    parts.push(`${enforcements} enforcement actions in past week may impact sentiment.`);
  }
  
  if (frameworks >= 3) {
    parts.push('Positive regulatory clarity emerging in multiple regions.');
  }
  
  return parts.length > 0 ? parts.join(' ') : 'Regulatory environment remains stable with no significant developments.';
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  getMajorRegulations,
  getKeyDates,
};
