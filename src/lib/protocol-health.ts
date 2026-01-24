/**
 * Protocol Health & DeFi Risk Analysis Engine
 * 
 * Enterprise-grade smart contract security monitoring, protocol risk scoring,
 * and real-time DeFi safety intelligence.
 * 
 * Features:
 * - Smart contract audit tracking
 * - TVL monitoring and anomaly detection
 * - Exploit/hack real-time alerts
 * - Protocol risk scoring (A-F grades)
 * - Insurance coverage analysis
 * - Governance risk assessment
 * - Team/founder verification
 * - Code quality metrics
 * 
 * @module lib/protocol-health
 */

// =============================================================================
// Types & Interfaces
// =============================================================================

export interface Protocol {
  id: string;
  name: string;
  slug: string;
  category: ProtocolCategory;
  chains: string[];
  website: string;
  twitter?: string;
  github?: string;
  discord?: string;
  logo?: string;
  description: string;
  launchDate: string;
  isVerified: boolean;
}

export type ProtocolCategory = 
  | 'lending'
  | 'dex'
  | 'derivatives'
  | 'yield'
  | 'bridge'
  | 'cdp'
  | 'liquid-staking'
  | 'options'
  | 'insurance'
  | 'nft-marketplace'
  | 'gaming'
  | 'launchpad'
  | 'oracle'
  | 'privacy'
  | 'payments'
  | 'other';

export interface AuditReport {
  id: string;
  protocolId: string;
  auditor: string;
  auditorReputation: 'tier1' | 'tier2' | 'tier3' | 'unknown';
  date: string;
  version: string;
  scope: string[];
  findings: AuditFinding[];
  reportUrl?: string;
  isPublic: boolean;
  overallRating: 'pass' | 'pass-with-issues' | 'fail' | 'pending';
}

export interface AuditFinding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'informational';
  title: string;
  description: string;
  status: 'open' | 'acknowledged' | 'resolved' | 'wont-fix';
  cweId?: string;
  location?: string;
}

export interface TVLData {
  protocolId: string;
  timestamp: number;
  tvlUsd: number;
  change24h: number;
  change7d: number;
  change30d: number;
  chainBreakdown: Record<string, number>;
  tokenBreakdown: Array<{
    token: string;
    amount: number;
    valueUsd: number;
    percentage: number;
  }>;
  rank: number;
}

export interface SecurityIncident {
  id: string;
  protocolId: string;
  date: string;
  type: IncidentType;
  severity: 'critical' | 'high' | 'medium' | 'low';
  lossUsd: number;
  recoveredUsd: number;
  attackVector: string;
  description: string;
  postMortemUrl?: string;
  txHashes?: string[];
  isConfirmed: boolean;
  status: 'ongoing' | 'contained' | 'resolved' | 'investigating';
}

export type IncidentType = 
  | 'exploit'
  | 'rug-pull'
  | 'flash-loan-attack'
  | 'oracle-manipulation'
  | 'reentrancy'
  | 'access-control'
  | 'economic-attack'
  | 'bridge-hack'
  | 'governance-attack'
  | 'insider'
  | 'phishing'
  | 'unknown';

export interface ProtocolRiskScore {
  protocolId: string;
  overallScore: number; // 0-100
  grade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';
  lastUpdated: string;
  factors: {
    smartContractRisk: RiskFactor;
    centralzationRisk: RiskFactor;
    oracleRisk: RiskFactor;
    governanceRisk: RiskFactor;
    economicRisk: RiskFactor;
    operationalRisk: RiskFactor;
    auditStatus: RiskFactor;
    teamVerification: RiskFactor;
    insuranceCoverage: RiskFactor;
    trackRecord: RiskFactor;
  };
  recommendations: string[];
  warnings: string[];
}

export interface RiskFactor {
  name: string;
  score: number; // 0-100
  weight: number; // 0-1
  details: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  sources: string[];
}

export interface InsuranceCoverage {
  protocolId: string;
  providers: InsuranceProvider[];
  totalCoverageUsd: number;
  coverageRatio: number; // coverage / TVL
  averagePremium: number; // % annual
  lastUpdated: string;
}

export interface InsuranceProvider {
  name: string;
  coverageUsd: number;
  premium: number;
  deductible: number;
  coveredRisks: string[];
  excludedRisks: string[];
  policyUrl?: string;
  expiryDate?: string;
}

export interface GovernanceMetrics {
  protocolId: string;
  tokenSymbol: string;
  tokenAddress: string;
  totalSupply: number;
  circulatingSupply: number;
  holderCount: number;
  topHolderConcentration: number; // % held by top 10
  treasuryValue: number;
  proposalCount: number;
  averageVoterParticipation: number;
  timelockDuration: number; // hours
  multisigDetails?: {
    signers: number;
    threshold: number;
    knownSigners: string[];
  };
  recentProposals: GovernanceProposal[];
}

export interface GovernanceProposal {
  id: string;
  title: string;
  status: 'active' | 'passed' | 'rejected' | 'executed' | 'cancelled';
  votesFor: number;
  votesAgainst: number;
  quorum: number;
  endDate: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  summary: string;
}

export interface TeamInfo {
  protocolId: string;
  isDoxxed: boolean;
  isAnonymous: boolean;
  teamSize: number;
  founders: TeamMember[];
  advisors: TeamMember[];
  backers: string[];
  fundingRounds: FundingRound[];
  linkedInVerified: boolean;
  githubActivity?: {
    contributors: number;
    commits30d: number;
    lastCommit: string;
    openIssues: number;
    stars: number;
  };
}

export interface TeamMember {
  name: string;
  role: string;
  twitter?: string;
  linkedin?: string;
  github?: string;
  previousProjects?: string[];
  isVerified: boolean;
}

export interface FundingRound {
  date: string;
  type: 'seed' | 'series-a' | 'series-b' | 'series-c' | 'private' | 'public';
  amountUsd: number;
  valuation?: number;
  investors: string[];
}

export interface ProtocolHealthSummary {
  protocol: Protocol;
  riskScore: ProtocolRiskScore;
  tvl: TVLData;
  audits: AuditReport[];
  incidents: SecurityIncident[];
  insurance: InsuranceCoverage | null;
  governance: GovernanceMetrics | null;
  team: TeamInfo | null;
  alerts: HealthAlert[];
}

export interface HealthAlert {
  id: string;
  protocolId: string;
  type: 'tvl-drop' | 'new-incident' | 'audit-issue' | 'governance-risk' | 'team-change' | 'contract-upgrade' | 'unusual-activity';
  severity: 'info' | 'warning' | 'danger' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  actionRequired: boolean;
  link?: string;
}

// =============================================================================
// Constants
// =============================================================================

const TIER1_AUDITORS = [
  'Trail of Bits',
  'OpenZeppelin',
  'Consensys Diligence',
  'Halborn',
  'Quantstamp',
  'CertiK',
  'ChainSecurity',
  'Sigma Prime',
  'Runtime Verification',
  'Least Authority',
];

const TIER2_AUDITORS = [
  'PeckShield',
  'SlowMist',
  'BlockSec',
  'Hacken',
  'Dedaub',
  'Code4rena',
  'Sherlock',
  'Spearbit',
  'yAudit',
  'Zellic',
];

const CATEGORY_BASE_RISK: Record<ProtocolCategory, number> = {
  'oracle': 15,
  'insurance': 20,
  'liquid-staking': 25,
  'lending': 30,
  'dex': 30,
  'cdp': 35,
  'derivatives': 40,
  'yield': 45,
  'bridge': 55,
  'options': 40,
  'nft-marketplace': 25,
  'gaming': 35,
  'launchpad': 50,
  'privacy': 45,
  'payments': 20,
  'other': 40,
};

// =============================================================================
// Risk Scoring Engine
// =============================================================================

function calculateSmartContractRisk(audits: AuditReport[], incidents: SecurityIncident[]): RiskFactor {
  let score = 100;
  const details: string[] = [];
  const sources: string[] = [];

  // Check audit status
  if (audits.length === 0) {
    score -= 50;
    details.push('No audits found');
  } else {
    const tier1Audits = audits.filter(a => TIER1_AUDITORS.includes(a.auditor));
    const tier2Audits = audits.filter(a => TIER2_AUDITORS.includes(a.auditor));
    
    if (tier1Audits.length === 0 && tier2Audits.length === 0) {
      score -= 30;
      details.push('No reputable auditor');
    } else if (tier1Audits.length > 0) {
      score += 10;
      details.push(`Tier 1 audit by ${tier1Audits[0].auditor}`);
      sources.push(tier1Audits[0].auditor);
    }

    // Check for open critical/high findings
    const openHighFindings = audits.flatMap(a => 
      a.findings.filter(f => 
        (f.severity === 'critical' || f.severity === 'high') && 
        f.status !== 'resolved'
      )
    );
    
    if (openHighFindings.length > 0) {
      score -= openHighFindings.length * 15;
      details.push(`${openHighFindings.length} open high/critical findings`);
    }

    // Check audit age
    const latestAudit = audits.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
    
    const auditAge = (Date.now() - new Date(latestAudit.date).getTime()) / (1000 * 60 * 60 * 24);
    if (auditAge > 365) {
      score -= 20;
      details.push('Audit older than 1 year');
    } else if (auditAge > 180) {
      score -= 10;
      details.push('Audit older than 6 months');
    }
  }

  // Check incident history
  const recentIncidents = incidents.filter(i => {
    const incidentAge = (Date.now() - new Date(i.date).getTime()) / (1000 * 60 * 60 * 24);
    return incidentAge < 365;
  });

  if (recentIncidents.length > 0) {
    const criticalIncidents = recentIncidents.filter(i => i.severity === 'critical');
    const highIncidents = recentIncidents.filter(i => i.severity === 'high');
    
    score -= criticalIncidents.length * 25;
    score -= highIncidents.length * 15;
    
    if (criticalIncidents.length > 0) {
      details.push(`${criticalIncidents.length} critical incidents in past year`);
    }
  }

  score = Math.max(0, Math.min(100, score));

  return {
    name: 'Smart Contract Risk',
    score,
    weight: 0.25,
    details: details.join('; ') || 'Well audited with no major issues',
    severity: score >= 70 ? 'low' : score >= 50 ? 'medium' : score >= 30 ? 'high' : 'critical',
    sources,
  };
}

function calculateCentralizationRisk(governance: GovernanceMetrics | null): RiskFactor {
  let score = 100;
  const details: string[] = [];

  if (!governance) {
    score = 50;
    details.push('Governance data unavailable');
  } else {
    // Check top holder concentration
    if (governance.topHolderConcentration > 50) {
      score -= 30;
      details.push(`Top 10 holders control ${governance.topHolderConcentration.toFixed(1)}%`);
    } else if (governance.topHolderConcentration > 30) {
      score -= 15;
      details.push('Moderate token concentration');
    }

    // Check multisig
    if (governance.multisigDetails) {
      const { signers, threshold } = governance.multisigDetails;
      if (threshold < 3) {
        score -= 20;
        details.push(`Low multisig threshold (${threshold}/${signers})`);
      } else if (threshold < signers / 2) {
        score -= 10;
        details.push('Multisig threshold below 50%');
      }
    } else {
      score -= 25;
      details.push('No multisig protection');
    }

    // Check timelock
    if (governance.timelockDuration < 24) {
      score -= 20;
      details.push('Timelock under 24 hours');
    } else if (governance.timelockDuration < 48) {
      score -= 10;
      details.push('Short timelock period');
    }

    // Check voter participation
    if (governance.averageVoterParticipation < 5) {
      score -= 15;
      details.push('Very low voter participation');
    }
  }

  score = Math.max(0, Math.min(100, score));

  return {
    name: 'Centralization Risk',
    score,
    weight: 0.15,
    details: details.join('; ') || 'Well decentralized governance',
    severity: score >= 70 ? 'low' : score >= 50 ? 'medium' : score >= 30 ? 'high' : 'critical',
    sources: [],
  };
}

function calculateOracleRisk(protocol: Protocol): RiskFactor {
  let score = 80;
  const details: string[] = [];

  // Certain categories have higher oracle risk
  const highOracleRiskCategories: ProtocolCategory[] = ['lending', 'derivatives', 'options', 'cdp'];
  
  if (highOracleRiskCategories.includes(protocol.category)) {
    score -= 20;
    details.push(`${protocol.category} protocols are oracle-dependent`);
  }

  return {
    name: 'Oracle Risk',
    score,
    weight: 0.10,
    details: details.join('; ') || 'Standard oracle implementation',
    severity: score >= 70 ? 'low' : score >= 50 ? 'medium' : score >= 30 ? 'high' : 'critical',
    sources: [],
  };
}

function calculateTeamRisk(team: TeamInfo | null): RiskFactor {
  let score = 100;
  const details: string[] = [];

  if (!team) {
    score = 40;
    details.push('Team information unavailable');
  } else {
    if (team.isAnonymous && !team.isDoxxed) {
      score -= 30;
      details.push('Anonymous team');
    }

    if (!team.linkedInVerified) {
      score -= 10;
      details.push('Team not LinkedIn verified');
    }

    if (team.githubActivity && team.githubActivity.commits30d < 10) {
      score -= 15;
      details.push('Low development activity');
    }

    if (team.fundingRounds.length === 0) {
      score -= 10;
      details.push('No known funding rounds');
    }

    if (team.backers.length === 0) {
      score -= 10;
      details.push('No reputable backers');
    }
  }

  score = Math.max(0, Math.min(100, score));

  return {
    name: 'Team Verification',
    score,
    weight: 0.10,
    details: details.join('; ') || 'Verified team with strong track record',
    severity: score >= 70 ? 'low' : score >= 50 ? 'medium' : score >= 30 ? 'high' : 'critical',
    sources: [],
  };
}

function calculateInsuranceScore(insurance: InsuranceCoverage | null, tvl: TVLData): RiskFactor {
  let score = 50;
  const details: string[] = [];

  if (!insurance || insurance.totalCoverageUsd === 0) {
    score = 30;
    details.push('No insurance coverage');
  } else {
    const coverageRatio = insurance.totalCoverageUsd / tvl.tvlUsd;
    
    if (coverageRatio >= 0.5) {
      score = 90;
      details.push(`${(coverageRatio * 100).toFixed(1)}% of TVL insured`);
    } else if (coverageRatio >= 0.25) {
      score = 70;
      details.push(`Partial coverage (${(coverageRatio * 100).toFixed(1)}%)`);
    } else if (coverageRatio >= 0.1) {
      score = 50;
      details.push('Limited insurance coverage');
    } else {
      score = 40;
      details.push('Minimal insurance coverage');
    }

    if (insurance.providers.length > 1) {
      score += 10;
      details.push('Multiple insurance providers');
    }
  }

  score = Math.max(0, Math.min(100, score));

  return {
    name: 'Insurance Coverage',
    score,
    weight: 0.10,
    details: details.join('; ') || 'Adequate insurance protection',
    severity: score >= 70 ? 'low' : score >= 50 ? 'medium' : score >= 30 ? 'high' : 'critical',
    sources: insurance?.providers.map(p => p.name) || [],
  };
}

function calculateTrackRecordScore(protocol: Protocol, incidents: SecurityIncident[], tvl: TVLData): RiskFactor {
  let score = 100;
  const details: string[] = [];

  // Protocol age
  const ageInDays = (Date.now() - new Date(protocol.launchDate).getTime()) / (1000 * 60 * 60 * 24);
  
  if (ageInDays < 90) {
    score -= 30;
    details.push('Protocol less than 3 months old');
  } else if (ageInDays < 180) {
    score -= 20;
    details.push('Protocol less than 6 months old');
  } else if (ageInDays < 365) {
    score -= 10;
    details.push('Protocol less than 1 year old');
  }

  // Total losses
  const totalLosses = incidents.reduce((sum, i) => sum + (i.lossUsd - i.recoveredUsd), 0);
  
  if (totalLosses > 100_000_000) {
    score -= 40;
    details.push(`$${(totalLosses / 1e6).toFixed(0)}M in historical losses`);
  } else if (totalLosses > 10_000_000) {
    score -= 25;
    details.push(`$${(totalLosses / 1e6).toFixed(0)}M in historical losses`);
  } else if (totalLosses > 1_000_000) {
    score -= 15;
    details.push(`$${(totalLosses / 1e6).toFixed(1)}M in historical losses`);
  }

  // TVL stability
  if (tvl.change30d < -50) {
    score -= 20;
    details.push('TVL dropped >50% in 30 days');
  } else if (tvl.change30d < -30) {
    score -= 10;
    details.push('Significant TVL decline');
  }

  score = Math.max(0, Math.min(100, score));

  return {
    name: 'Track Record',
    score,
    weight: 0.10,
    details: details.join('; ') || 'Strong historical track record',
    severity: score >= 70 ? 'low' : score >= 50 ? 'medium' : score >= 30 ? 'high' : 'critical',
    sources: [],
  };
}

function calculateEconomicRisk(protocol: Protocol, tvl: TVLData): RiskFactor {
  let score = 80;
  const details: string[] = [];
  const baseRisk = CATEGORY_BASE_RISK[protocol.category];

  score -= baseRisk * 0.3;

  // TVL considerations
  if (tvl.tvlUsd < 1_000_000) {
    score -= 20;
    details.push('Very low TVL (<$1M)');
  } else if (tvl.tvlUsd < 10_000_000) {
    score -= 10;
    details.push('Low TVL (<$10M)');
  }

  // Token concentration
  if (tvl.tokenBreakdown.length > 0) {
    const topTokenPercent = tvl.tokenBreakdown[0].percentage;
    if (topTokenPercent > 80) {
      score -= 15;
      details.push('Highly concentrated in single asset');
    }
  }

  score = Math.max(0, Math.min(100, score));

  return {
    name: 'Economic Risk',
    score,
    weight: 0.10,
    details: details.join('; ') || 'Healthy economic model',
    severity: score >= 70 ? 'low' : score >= 50 ? 'medium' : score >= 30 ? 'high' : 'critical',
    sources: [],
  };
}

function scoreToGrade(score: number): ProtocolRiskScore['grade'] {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'A-';
  if (score >= 80) return 'B+';
  if (score >= 75) return 'B';
  if (score >= 70) return 'B-';
  if (score >= 65) return 'C+';
  if (score >= 60) return 'C';
  if (score >= 55) return 'C-';
  if (score >= 50) return 'D';
  return 'F';
}

export function calculateRiskScore(
  protocol: Protocol,
  audits: AuditReport[],
  incidents: SecurityIncident[],
  tvl: TVLData,
  governance: GovernanceMetrics | null,
  insurance: InsuranceCoverage | null,
  team: TeamInfo | null
): ProtocolRiskScore {
  const smartContractRisk = calculateSmartContractRisk(audits, incidents);
  const centralizationRisk = calculateCentralizationRisk(governance);
  const oracleRisk = calculateOracleRisk(protocol);
  const governanceRisk = calculateCentralizationRisk(governance); // Same logic for now
  const economicRisk = calculateEconomicRisk(protocol, tvl);
  const teamVerification = calculateTeamRisk(team);
  const insuranceCoverage = calculateInsuranceScore(insurance, tvl);
  const trackRecord = calculateTrackRecordScore(protocol, incidents, tvl);

  // Placeholder for operational risk
  const operationalRisk: RiskFactor = {
    name: 'Operational Risk',
    score: 75,
    weight: 0.05,
    details: 'Standard operational practices',
    severity: 'low',
    sources: [],
  };

  // Placeholder for audit status factor
  const auditStatus: RiskFactor = {
    name: 'Audit Status',
    score: audits.length > 0 ? 80 : 30,
    weight: 0.05,
    details: audits.length > 0 ? `${audits.length} audit(s) on file` : 'No audits',
    severity: audits.length > 0 ? 'low' : 'high',
    sources: audits.map(a => a.auditor),
  };

  const factors = {
    smartContractRisk,
    centralzationRisk: centralizationRisk,
    oracleRisk,
    governanceRisk,
    economicRisk,
    operationalRisk,
    auditStatus,
    teamVerification,
    insuranceCoverage,
    trackRecord,
  };

  // Calculate weighted score
  const totalWeight = Object.values(factors).reduce((sum, f) => sum + f.weight, 0);
  const weightedScore = Object.values(factors).reduce(
    (sum, f) => sum + (f.score * f.weight),
    0
  ) / totalWeight;

  const overallScore = Math.round(weightedScore);
  const grade = scoreToGrade(overallScore);

  // Generate recommendations
  const recommendations: string[] = [];
  const warnings: string[] = [];

  Object.values(factors).forEach(factor => {
    if (factor.score < 50) {
      warnings.push(`${factor.name}: ${factor.details}`);
    } else if (factor.score < 70) {
      recommendations.push(`Consider: ${factor.name} - ${factor.details}`);
    }
  });

  return {
    protocolId: protocol.id,
    overallScore,
    grade,
    lastUpdated: new Date().toISOString(),
    factors,
    recommendations,
    warnings,
  };
}

// =============================================================================
// Data Fetching Functions
// =============================================================================

export async function fetchProtocolHealth(protocolId: string): Promise<ProtocolHealthSummary | null> {
  try {
    // In production, these would be real API calls
    const [protocol, audits, incidents, tvl, governance, insurance, team] = await Promise.all([
      fetchProtocolInfo(protocolId),
      fetchAudits(protocolId),
      fetchIncidents(protocolId),
      fetchTVL(protocolId),
      fetchGovernance(protocolId),
      fetchInsurance(protocolId),
      fetchTeamInfo(protocolId),
    ]);

    if (!protocol || !tvl) {
      return null;
    }

    const riskScore = calculateRiskScore(
      protocol,
      audits,
      incidents,
      tvl,
      governance,
      insurance,
      team
    );

    const alerts = generateHealthAlerts(protocol, riskScore, tvl, incidents);

    return {
      protocol,
      riskScore,
      tvl,
      audits,
      incidents,
      insurance,
      governance,
      team,
      alerts,
    };
  } catch (error) {
    console.error(`[Protocol Health] Error fetching health for ${protocolId}:`, error);
    return null;
  }
}

async function fetchProtocolInfo(protocolId: string): Promise<Protocol | null> {
  // Real implementation would call DefiLlama or similar API
  const protocols = await getTopProtocols();
  return protocols.find(p => p.id === protocolId) || null;
}

async function fetchAudits(protocolId: string): Promise<AuditReport[]> {
  // Fetch from DeFi Safety API for audit information
  try {
    const response = await fetch(`https://api.defisafety.com/pqr/protocols`, {
      next: { revalidate: 3600 },
    });
    
    if (response.ok) {
      const protocols = await response.json();
      const protocol = protocols.find((p: { name: string; slug: string }) => 
        p.slug?.toLowerCase() === protocolId.toLowerCase() ||
        p.name?.toLowerCase().includes(protocolId.replace(/-/g, ' '))
      );
      
      if (protocol?.audits?.length) {
        return protocol.audits.map((audit: { auditor: string; date: string; link: string; findings?: Array<{ severity: string; title: string; status: string }> }) => ({
          id: `${protocolId}-${audit.auditor}-${audit.date}`,
          protocolId,
          auditor: audit.auditor || 'Unknown',
          auditorReputation: getAuditorReputation(audit.auditor),
          date: audit.date || new Date().toISOString(),
          version: '1.0',
          scope: ['smart-contracts'],
          findings: audit.findings || [],
          isPublic: !!audit.link,
          overallRating: 'pass',
        }));
      }
    }
  } catch (error) {
    console.error(`Failed to fetch audits from DeFi Safety:`, error);
  }

  // Fallback: Check rekt.news for audit info via their API
  try {
    const rektResponse = await fetch(`https://api.rekt.news/v1/protocols/${protocolId}`, {
      next: { revalidate: 3600 },
    });
    
    if (rektResponse.ok) {
      const data = await rektResponse.json();
      if (data.audits?.length) {
        return data.audits;
      }
    }
  } catch {
    // rekt.news API may not exist, that's okay
  }

  // Return empty array if no audits found
  return [];
}

function getAuditorReputation(auditor: string): 'tier1' | 'tier2' | 'tier3' | 'unknown' {
  const tier1 = ['trail of bits', 'openzeppelin', 'consensys diligence', 'certik', 'quantstamp', 'peckshield', 'slowmist'];
  const tier2 = ['halborn', 'hacken', 'mixbytes', 'chainsecurity', 'sigmaprime', 'zokyo', 'code4rena'];
  const tier3 = ['techrate', 'solidity finance', 'fairyproof', 'interfi'];
  
  const normalizedAuditor = auditor?.toLowerCase() || '';
  
  if (tier1.some(a => normalizedAuditor.includes(a))) return 'tier1';
  if (tier2.some(a => normalizedAuditor.includes(a))) return 'tier2';
  if (tier3.some(a => normalizedAuditor.includes(a))) return 'tier3';
  return 'unknown';
}

async function fetchIncidents(protocolId: string): Promise<SecurityIncident[]> {
  // Fetch from rekt.news API for security incidents
  try {
    const response = await fetch('https://rekt.news/api/leaderboard', {
      next: { revalidate: 1800 },
    });
    
    if (response.ok) {
      const data = await response.json();
      const incidents = data.filter((item: { project: string }) => 
        item.project?.toLowerCase().includes(protocolId.replace(/-/g, ' '))
      );
      
      return incidents.map((item: { id?: string; date: string; type?: string; funds_lost: number; funds_returned?: number; technique?: string; description?: string }) => ({
        id: item.id || `${protocolId}-${item.date}`,
        protocolId,
        date: item.date,
        type: item.type || 'unknown',
        severity: item.funds_lost > 100_000_000 ? 'critical' : item.funds_lost > 10_000_000 ? 'high' : 'medium',
        lossUsd: item.funds_lost || 0,
        recoveredUsd: item.funds_returned || 0,
        attackVector: item.technique || 'Unknown',
        description: item.description || '',
        isConfirmed: true,
        status: 'resolved',
      }));
    }
  } catch (error) {
    console.error(`Failed to fetch incidents from rekt.news:`, error);
  }

  // Fallback: Check DeFiYield REKT database
  try {
    const response = await fetch(`https://api.defiyield.app/rekt/list?q=${protocolId}`, {
      next: { revalidate: 1800 },
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.data?.length) {
        return data.data.map((item: { id: string; date: string; category: string; fundsLost: number; fundsReturned?: number; technique?: string; description?: string; status?: string }) => ({
          id: item.id,
          protocolId,
          date: item.date,
          type: item.category,
          severity: item.fundsLost > 100_000_000 ? 'critical' : item.fundsLost > 10_000_000 ? 'high' : 'medium',
          lossUsd: item.fundsLost || 0,
          recoveredUsd: item.fundsReturned || 0,
          attackVector: item.technique || 'Unknown',
          description: item.description || '',
          isConfirmed: true,
          status: item.status || 'resolved',
        }));
      }
    }
  } catch {
    // DeFiYield API may not respond, that's okay
  }

  return [];
}

async function fetchTVL(protocolId: string): Promise<TVLData | null> {
  try {
    // Use DefiLlama API - this is the primary source for TVL data
    const response = await fetch(`https://api.llama.fi/protocol/${protocolId}`, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      console.error(`DefiLlama API error for ${protocolId}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    return {
      protocolId,
      timestamp: Date.now(),
      tvlUsd: data.tvl || 0,
      change24h: data.change_1d || 0,
      change7d: data.change_7d || 0,
      change30d: data.change_1m || 0,
      chainBreakdown: data.chainTvls || {},
      tokenBreakdown: [],
      rank: 0,
    };
  } catch (error) {
    console.error(`Failed to fetch TVL for ${protocolId}:`, error);
    return null;
  }
}

async function fetchGovernance(protocolId: string): Promise<GovernanceMetrics | null> {
  // Fetch governance data from Tally API or Snapshot
  try {
    // Try Tally first for on-chain governance
    const tallyResponse = await fetch(`https://api.tally.xyz/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-key': process.env.TALLY_API_KEY || '',
      },
      body: JSON.stringify({
        query: `
          query {
            governances(chainIds: ["eip155:1"], names: ["${protocolId}"]) {
              id
              name
              tokenSymbol
              proposalsCount
              votersCount
              tokenHoldersCount
            }
          }
        `,
      }),
      next: { revalidate: 3600 },
    });

    if (tallyResponse.ok) {
      const data = await tallyResponse.json();
      const gov = data?.data?.governances?.[0];
      
      if (gov) {
        return {
          protocolId,
          tokenSymbol: gov.tokenSymbol || protocolId.toUpperCase(),
          tokenAddress: '',
          totalSupply: 0,
          circulatingSupply: 0,
          holderCount: gov.tokenHoldersCount || 0,
          topHolderConcentration: 0,
          treasuryValue: 0,
          proposalCount: gov.proposalsCount || 0,
          averageVoterParticipation: 0,
          timelockDuration: 0,
          recentProposals: [],
        };
      }
    }
  } catch (error) {
    console.error(`Failed to fetch governance from Tally:`, error);
  }

  // Try Snapshot for off-chain governance
  try {
    const snapshotResponse = await fetch('https://hub.snapshot.org/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query {
            space(id: "${protocolId}.eth") {
              id
              name
              symbol
              proposalsCount
              followersCount
            }
          }
        `,
      }),
      next: { revalidate: 3600 },
    });

    if (snapshotResponse.ok) {
      const data = await snapshotResponse.json();
      const space = data?.data?.space;
      
      if (space) {
        return {
          protocolId,
          tokenSymbol: space.symbol || protocolId.toUpperCase(),
          tokenAddress: '',
          totalSupply: 0,
          circulatingSupply: 0,
          holderCount: space.followersCount || 0,
          topHolderConcentration: 0,
          treasuryValue: 0,
          proposalCount: space.proposalsCount || 0,
          averageVoterParticipation: 0,
          timelockDuration: 0,
          recentProposals: [],
        };
      }
    }
  } catch (error) {
    console.error(`Failed to fetch governance from Snapshot:`, error);
  }

  return null;
}

async function fetchInsurance(protocolId: string): Promise<InsuranceCoverage | null> {
  // Fetch from Nexus Mutual API for insurance coverage
  try {
    const response = await fetch('https://api.nexusmutual.io/v2/capacities', {
      next: { revalidate: 3600 },
    });

    if (response.ok) {
      const capacities = await response.json();
      const protocolCoverage = capacities.find((c: { productId: string; productName: string }) =>
        c.productName?.toLowerCase().includes(protocolId.replace(/-/g, ' ')) ||
        c.productId === protocolId
      );

      if (protocolCoverage) {
        return {
          protocolId,
          providers: [{
            name: 'Nexus Mutual',
            coverageUsd: protocolCoverage.capacityETH * 3500 || 0, // Approximate USD
            premium: protocolCoverage.minAnnualPrice * 100 || 2.5,
            deductible: 0,
            coveredRisks: ['smart-contract', 'oracle-failure'],
            excludedRisks: ['governance-attack', 'rug-pull'],
          }],
          totalCoverageUsd: protocolCoverage.capacityETH * 3500 || 0,
          coverageRatio: 0,
          averagePremium: protocolCoverage.minAnnualPrice * 100 || 2.5,
          lastUpdated: new Date().toISOString(),
        };
      }
    }
  } catch (error) {
    console.error(`Failed to fetch insurance from Nexus Mutual:`, error);
  }

  // Try InsurAce as fallback
  try {
    const insurAceResponse = await fetch(`https://api.insurace.io/v1/products?protocol=${protocolId}`, {
      next: { revalidate: 3600 },
    });

    if (insurAceResponse.ok) {
      const data = await insurAceResponse.json();
      if (data?.products?.length) {
        return {
          protocolId,
          providers: data.products.map((p: { name: string; capacity: number; premium: number }) => ({
            name: p.name || 'InsurAce',
            coverageUsd: p.capacity || 0,
            premium: p.premium || 0,
            deductible: 0,
            coveredRisks: ['smart-contract'],
            excludedRisks: [],
          })),
          totalCoverageUsd: data.products.reduce((sum: number, p: { capacity: number }) => sum + (p.capacity || 0), 0),
          coverageRatio: 0,
          averagePremium: data.products[0]?.premium || 0,
          lastUpdated: new Date().toISOString(),
        };
      }
    }
  } catch {
    // InsurAce API may not respond
  }

  return null;
}

async function fetchTeamInfo(protocolId: string): Promise<TeamInfo | null> {
  // Fetch from GitHub API for activity metrics
  try {
    // Try to find the protocol's GitHub org
    const orgMappings: Record<string, string> = {
      'aave-v3': 'aave',
      'uniswap-v3': 'Uniswap',
      'compound-v3': 'compound-finance',
      'makerdao': 'makerdao',
      'curve-finance': 'curvefi',
      'lido': 'lidofinance',
    };

    const org = orgMappings[protocolId] || protocolId.replace(/-v\d+$/, '');
    
    const response = await fetch(`https://api.github.com/orgs/${org}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': process.env.GITHUB_TOKEN ? `token ${process.env.GITHUB_TOKEN}` : '',
      },
      next: { revalidate: 3600 },
    });

    if (response.ok) {
      const orgData = await response.json();
      
      // Get repos to estimate activity
      const reposResponse = await fetch(`https://api.github.com/orgs/${org}/repos?sort=updated&per_page=10`, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': process.env.GITHUB_TOKEN ? `token ${process.env.GITHUB_TOKEN}` : '',
        },
        next: { revalidate: 3600 },
      });

      let githubActivity = undefined;
      if (reposResponse.ok) {
        const repos = await reposResponse.json();
        const totalStars = repos.reduce((sum: number, r: { stargazers_count: number }) => sum + (r.stargazers_count || 0), 0);
        const totalIssues = repos.reduce((sum: number, r: { open_issues_count: number }) => sum + (r.open_issues_count || 0), 0);
        
        githubActivity = {
          contributors: 0,
          commits30d: 0,
          lastCommit: repos[0]?.updated_at || new Date().toISOString(),
          openIssues: totalIssues,
          stars: totalStars,
        };
      }

      return {
        protocolId,
        isDoxxed: true, // Has public GitHub org
        isAnonymous: false,
        teamSize: orgData.public_repos || 0,
        founders: [],
        advisors: [],
        backers: [],
        fundingRounds: [],
        linkedInVerified: false,
        githubActivity,
      };
    }
  } catch (error) {
    console.error(`Failed to fetch team info from GitHub:`, error);
  }

  // Return minimal info if no data found
  return {
    protocolId,
    isDoxxed: false,
    isAnonymous: true,
    teamSize: 0,
    founders: [],
    advisors: [],
    backers: [],
    fundingRounds: [],
    linkedInVerified: false,
  };
}

function generateHealthAlerts(
  protocol: Protocol,
  riskScore: ProtocolRiskScore,
  tvl: TVLData,
  incidents: SecurityIncident[]
): HealthAlert[] {
  const alerts: HealthAlert[] = [];

  // TVL drop alert
  if (tvl.change24h < -20) {
    alerts.push({
      id: `tvl-drop-${protocol.id}`,
      protocolId: protocol.id,
      type: 'tvl-drop',
      severity: tvl.change24h < -50 ? 'critical' : 'danger',
      title: 'Significant TVL Drop',
      message: `${protocol.name} TVL dropped ${Math.abs(tvl.change24h).toFixed(1)}% in 24 hours`,
      timestamp: new Date().toISOString(),
      actionRequired: true,
    });
  }

  // Risk score warnings
  if (riskScore.overallScore < 50) {
    alerts.push({
      id: `low-score-${protocol.id}`,
      protocolId: protocol.id,
      type: 'governance-risk',
      severity: 'danger',
      title: 'Low Safety Score',
      message: `${protocol.name} has a risk score of ${riskScore.overallScore}/100 (${riskScore.grade})`,
      timestamp: new Date().toISOString(),
      actionRequired: false,
    });
  }

  // Active incidents
  const activeIncidents = incidents.filter(i => i.status === 'ongoing' || i.status === 'investigating');
  for (const incident of activeIncidents) {
    alerts.push({
      id: `incident-${incident.id}`,
      protocolId: protocol.id,
      type: 'new-incident',
      severity: 'critical',
      title: 'Active Security Incident',
      message: `${incident.type}: ${incident.description}`,
      timestamp: incident.date,
      actionRequired: true,
    });
  }

  return alerts;
}

// =============================================================================
// Public API Functions
// =============================================================================

export async function getTopProtocols(limit: number = 100): Promise<Protocol[]> {
  try {
    const response = await fetch('https://api.llama.fi/protocols', {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      console.error(`DefiLlama protocols API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    
    return data.slice(0, limit).map((p: { slug: string; name: string; category: string; chains: string[]; url: string; twitter?: string; logo?: string; description?: string }) => ({
      id: p.slug,
      name: p.name,
      slug: p.slug,
      category: mapCategory(p.category),
      chains: p.chains || [],
      website: p.url || '',
      twitter: p.twitter,
      logo: p.logo,
      description: p.description || '',
      launchDate: '2020-01-01', // DefiLlama doesn't provide this
      isVerified: true,
    }));
  } catch (error) {
    console.error('Failed to fetch protocols from DefiLlama:', error);
    return [];
  }
}

function mapCategory(category: string): ProtocolCategory {
  const mapping: Record<string, ProtocolCategory> = {
    'Lending': 'lending',
    'Dexes': 'dex',
    'Derivatives': 'derivatives',
    'Yield': 'yield',
    'Bridge': 'bridge',
    'CDP': 'cdp',
    'Liquid Staking': 'liquid-staking',
    'Options': 'options',
    'Insurance': 'insurance',
    'NFT Marketplace': 'nft-marketplace',
    'Gaming': 'gaming',
    'Launchpad': 'launchpad',
    'Oracle': 'oracle',
    'Privacy': 'privacy',
    'Payments': 'payments',
  };

  return mapping[category] || 'other';
}

export async function getProtocolRanking(
  category?: ProtocolCategory,
  chain?: string,
  limit: number = 50
): Promise<Array<{ protocol: Protocol; score: ProtocolRiskScore; tvl: TVLData }>> {
  const protocols = await getTopProtocols(200);
  
  let filtered = protocols;
  if (category) {
    filtered = filtered.filter(p => p.category === category);
  }
  if (chain) {
    filtered = filtered.filter(p => p.chains.includes(chain));
  }

  const rankings = await Promise.all(
    filtered.slice(0, limit).map(async (protocol) => {
      const health = await fetchProtocolHealth(protocol.id);
      if (!health) return null;
      return {
        protocol,
        score: health.riskScore,
        tvl: health.tvl,
      };
    })
  );

  return rankings
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => b.score.overallScore - a.score.overallScore);
}

export async function getRecentIncidents(limit: number = 20): Promise<SecurityIncident[]> {
  // Fetch from rekt.news API for recent security incidents
  try {
    const response = await fetch('https://rekt.news/api/leaderboard', {
      next: { revalidate: 1800 },
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.slice(0, limit).map((item: { id?: string; project: string; date: string; type?: string; funds_lost: number; funds_returned?: number; technique?: string; description?: string }) => ({
        id: item.id || `incident-${item.project}-${item.date}`,
        protocolId: item.project?.toLowerCase().replace(/\s+/g, '-') || 'unknown',
        date: item.date,
        type: item.type || 'unknown',
        severity: item.funds_lost > 100_000_000 ? 'critical' : item.funds_lost > 10_000_000 ? 'high' : 'medium',
        lossUsd: item.funds_lost || 0,
        recoveredUsd: item.funds_returned || 0,
        attackVector: item.technique || 'Unknown',
        description: item.description || '',
        isConfirmed: true,
        status: 'resolved',
      }));
    }
  } catch (error) {
    console.error('Failed to fetch recent incidents:', error);
  }

  // Fallback: Try DeFiYield REKT database
  try {
    const response = await fetch('https://api.defiyield.app/rekt/list?limit=' + limit, {
      next: { revalidate: 1800 },
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.data?.length) {
        return data.data.map((item: { id: string; project: { name: string }; date: string; category: string; fundsLost: number; fundsReturned?: number; technique?: string; description?: string; status?: string }) => ({
          id: item.id,
          protocolId: item.project?.name?.toLowerCase().replace(/\s+/g, '-') || 'unknown',
          date: item.date,
          type: item.category,
          severity: item.fundsLost > 100_000_000 ? 'critical' : item.fundsLost > 10_000_000 ? 'high' : 'medium',
          lossUsd: item.fundsLost || 0,
          recoveredUsd: item.fundsReturned || 0,
          attackVector: item.technique || 'Unknown',
          description: item.description || '',
          isConfirmed: true,
          status: item.status || 'resolved',
        }));
      }
    }
  } catch {
    // DeFiYield API may not respond
  }

  return [];
}

export async function searchProtocols(query: string): Promise<Protocol[]> {
  const protocols = await getTopProtocols(500);
  const lowerQuery = query.toLowerCase();
  
  return protocols.filter(p => 
    p.name.toLowerCase().includes(lowerQuery) ||
    p.slug.toLowerCase().includes(lowerQuery) ||
    p.category.includes(lowerQuery)
  );
}

// =============================================================================
// Export all
// =============================================================================

export const protocolHealth = {
  fetchProtocolHealth,
  getTopProtocols,
  getProtocolRanking,
  getRecentIncidents,
  searchProtocols,
  calculateRiskScore,
};

export default protocolHealth;
