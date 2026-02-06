/**
 * Academic Access Program
 *
 * Special API access tier for researchers and academic institutions.
 * Provides enhanced rate limits, bulk data access, and citation tracking.
 *
 * Features:
 * - Academic institution verification
 * - Research project registration
 * - Enhanced API access (higher limits, bulk endpoints)
 * - Citation tracking and requirements
 * - Data usage agreements
 * - Publication tracking
 * - Collaborative research support
 * - IRB compliance support
 *
 * @module academic-access
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface AcademicInstitution {
  institutionId: string;
  name: string;
  shortName: string;
  type: InstitutionType;
  country: string;
  domains: string[]; // verified email domains
  rorId?: string; // Research Organization Registry ID
  gridId?: string; // Global Research Identifier Database
  verified: boolean;
  verifiedAt?: Date;
  createdAt: Date;
  metadata: InstitutionMetadata;
}

export type InstitutionType =
  | 'university'
  | 'research-institute'
  | 'government'
  | 'nonprofit'
  | 'think-tank'
  | 'industry-research'
  | 'independent';

export interface InstitutionMetadata {
  website: string;
  department?: string;
  researchAreas: string[];
  collaborators: string[];
  publications: number;
  activeProjects: number;
}

export interface AcademicResearcher {
  researcherId: string;
  institutionId: string;
  email: string;
  name: string;
  title: string;
  department?: string;
  orcidId?: string;
  googleScholarId?: string;
  verified: boolean;
  verificationMethod?: 'email-domain' | 'manual' | 'orcid' | 'institutional';
  verifiedAt?: Date;
  createdAt: Date;
  lastActiveAt: Date;
  projects: string[];
  apiKey?: string;
  accessLevel: AcademicAccessLevel;
  usageStats: ResearcherUsageStats;
}

export type AcademicAccessLevel =
  | 'pending' // awaiting verification
  | 'basic' // verified researcher
  | 'enhanced' // active research project
  | 'unlimited' // institutional agreement
  | 'suspended'; // access revoked

export interface ResearcherUsageStats {
  totalApiCalls: number;
  totalDataDownloaded: number; // bytes
  lastApiCall?: Date;
  monthlyUsage: Record<string, number>;
  topEndpoints: Record<string, number>;
}

export interface ResearchProject {
  projectId: string;
  title: string;
  description: string;
  principalInvestigator: string; // researcherId
  coInvestigators: string[];
  institutionId: string;
  status: ProjectStatus;
  startDate: Date;
  endDate?: Date;
  fundingSource?: string;
  irbApproved: boolean;
  irbNumber?: string;
  dataUsageAgreement: DataUsageAgreement;
  dataRequirements: DataRequirements;
  publications: Publication[];
  createdAt: Date;
  updatedAt: Date;
}

export type ProjectStatus =
  | 'pending-approval'
  | 'active'
  | 'completed'
  | 'published'
  | 'suspended'
  | 'expired';

export interface DataUsageAgreement {
  version: string;
  signedAt: Date;
  signedBy: string;
  terms: AgreementTerms;
  restrictions: string[];
}

export interface AgreementTerms {
  allowsPublicRelease: boolean;
  allowsDerivativeWorks: boolean;
  allowsCommercialUse: boolean;
  requiresCitation: boolean;
  requiresDataSharing: boolean;
  retentionPeriod?: number; // days
  geographicRestrictions?: string[];
}

export interface DataRequirements {
  dataTypes: DataType[];
  timeRange: { start: Date; end?: Date };
  refreshFrequency: 'one-time' | 'daily' | 'weekly' | 'monthly' | 'real-time';
  volumeEstimate: string;
  processingNeeds: string[];
}

export type DataType =
  | 'news-articles'
  | 'market-data'
  | 'social-signals'
  | 'on-chain'
  | 'predictions'
  | 'sentiment'
  | 'entities'
  | 'narratives'
  | 'all';

export interface Publication {
  publicationId: string;
  title: string;
  authors: string[];
  venue: string;
  venueType: 'journal' | 'conference' | 'preprint' | 'thesis' | 'report' | 'other';
  publishedAt?: Date;
  doi?: string;
  arxivId?: string;
  url?: string;
  citesOurData: boolean;
  citationText?: string;
  status: 'draft' | 'submitted' | 'accepted' | 'published';
}

export interface AcademicAPIConfig {
  rateLimits: {
    requestsPerMinute: number;
    requestsPerDay: number;
    bulkDownloadPerMonth: number; // MB
  };
  endpoints: {
    standard: string[];
    enhanced: string[];
    bulkExport: string[];
  };
  dataRetention: number; // days
  supportLevel: 'community' | 'email' | 'priority';
}

export interface CitationRequirement {
  citationId: string;
  projectId: string;
  style: CitationStyle;
  text: string;
  bibtex: string;
  dataVersion: string;
  dateAccessed: Date;
  dataDescription: string;
}

export type CitationStyle = 'apa' | 'mla' | 'chicago' | 'ieee' | 'bibtex' | 'acm';

export interface BulkExportRequest {
  requestId: string;
  projectId: string;
  researcherId: string;
  dataTypes: DataType[];
  timeRange: { start: Date; end: Date };
  format: 'json' | 'csv' | 'parquet' | 'sqlite';
  filters?: Record<string, unknown>;
  status: 'pending' | 'processing' | 'ready' | 'expired' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  downloadUrl?: string;
  expiresAt?: Date;
  sizeBytes?: number;
  error?: string;
}

// ============================================================================
// STORAGE
// ============================================================================

const institutions = new Map<string, AcademicInstitution>();
const researchers = new Map<string, AcademicResearcher>();
const projects = new Map<string, ResearchProject>();
const publications = new Map<string, Publication>();
const bulkExports = new Map<string, BulkExportRequest>();
const researcherByEmail = new Map<string, string>();
const researcherByApiKey = new Map<string, string>();

// ============================================================================
// ACCESS LEVEL CONFIGURATIONS
// ============================================================================

const ACCESS_CONFIGS: Record<AcademicAccessLevel, AcademicAPIConfig> = {
  pending: {
    rateLimits: {
      requestsPerMinute: 10,
      requestsPerDay: 100,
      bulkDownloadPerMonth: 0,
    },
    endpoints: {
      standard: ['/api/news', '/api/market'],
      enhanced: [],
      bulkExport: [],
    },
    dataRetention: 7,
    supportLevel: 'community',
  },
  basic: {
    rateLimits: {
      requestsPerMinute: 60,
      requestsPerDay: 5000,
      bulkDownloadPerMonth: 100,
    },
    endpoints: {
      standard: ['/api/news', '/api/market', '/api/sentiment', '/api/entities'],
      enhanced: ['/api/analyze', '/api/trending'],
      bulkExport: [],
    },
    dataRetention: 30,
    supportLevel: 'community',
  },
  enhanced: {
    rateLimits: {
      requestsPerMinute: 120,
      requestsPerDay: 20000,
      bulkDownloadPerMonth: 1000,
    },
    endpoints: {
      standard: ['/api/news', '/api/market', '/api/sentiment', '/api/entities'],
      enhanced: [
        '/api/analyze',
        '/api/trending',
        '/api/narratives',
        '/api/signals',
        '/api/predictions',
      ],
      bulkExport: ['/api/academic/bulk'],
    },
    dataRetention: 90,
    supportLevel: 'email',
  },
  unlimited: {
    rateLimits: {
      requestsPerMinute: 1000,
      requestsPerDay: 100000,
      bulkDownloadPerMonth: 50000,
    },
    endpoints: {
      standard: ['*'],
      enhanced: ['*'],
      bulkExport: ['/api/academic/bulk', '/api/academic/stream'],
    },
    dataRetention: 365,
    supportLevel: 'priority',
  },
  suspended: {
    rateLimits: {
      requestsPerMinute: 0,
      requestsPerDay: 0,
      bulkDownloadPerMonth: 0,
    },
    endpoints: {
      standard: [],
      enhanced: [],
      bulkExport: [],
    },
    dataRetention: 0,
    supportLevel: 'community',
  },
};

// ============================================================================
// INSTITUTION MANAGEMENT
// ============================================================================

/**
 * Register a new academic institution
 */
export function registerInstitution(
  name: string,
  type: InstitutionType,
  country: string,
  domains: string[],
  metadata: Partial<InstitutionMetadata>
): AcademicInstitution {
  const institutionId = `inst_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const institution: AcademicInstitution = {
    institutionId,
    name,
    shortName: name.split(' ').map((w) => w[0]).join('').toUpperCase(),
    type,
    country,
    domains: domains.map((d) => d.toLowerCase()),
    verified: false,
    createdAt: new Date(),
    metadata: {
      website: metadata.website || '',
      researchAreas: metadata.researchAreas || [],
      collaborators: metadata.collaborators || [],
      publications: 0,
      activeProjects: 0,
      ...metadata,
    },
  };

  institutions.set(institutionId, institution);
  return institution;
}

/**
 * Verify an institution
 */
export function verifyInstitution(
  institutionId: string,
  rorId?: string,
  gridId?: string
): AcademicInstitution | null {
  const institution = institutions.get(institutionId);
  if (!institution) return null;

  institution.verified = true;
  institution.verifiedAt = new Date();
  if (rorId) institution.rorId = rorId;
  if (gridId) institution.gridId = gridId;

  return institution;
}

/**
 * Get institution by ID
 */
export function getInstitution(institutionId: string): AcademicInstitution | null {
  return institutions.get(institutionId) || null;
}

/**
 * Find institution by email domain
 */
export function findInstitutionByDomain(email: string): AcademicInstitution | null {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return null;

  for (const institution of institutions.values()) {
    if (institution.domains.includes(domain)) {
      return institution;
    }
  }
  return null;
}

/**
 * List all institutions
 */
export function listInstitutions(options?: {
  type?: InstitutionType;
  country?: string;
  verified?: boolean;
}): AcademicInstitution[] {
  let result = Array.from(institutions.values());

  if (options?.type) {
    result = result.filter((i) => i.type === options.type);
  }
  if (options?.country) {
    result = result.filter((i) => i.country === options.country);
  }
  if (options?.verified !== undefined) {
    result = result.filter((i) => i.verified === options.verified);
  }

  return result.sort((a, b) => a.name.localeCompare(b.name));
}

// ============================================================================
// RESEARCHER MANAGEMENT
// ============================================================================

/**
 * Register a new researcher
 */
export async function registerResearcher(
  email: string,
  name: string,
  title: string,
  institutionId: string,
  orcidId?: string
): Promise<AcademicResearcher> {
  // Check if already registered
  if (researcherByEmail.has(email.toLowerCase())) {
    throw new Error('Researcher already registered with this email');
  }

  const institution = institutions.get(institutionId);
  if (!institution) {
    throw new Error('Institution not found');
  }

  const researcherId = `res_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const apiKey = generateAcademicApiKey(researcherId);

  // Auto-verify if email domain matches institution
  const emailDomain = email.split('@')[1]?.toLowerCase();
  const autoVerified = institution.domains.includes(emailDomain);

  const researcher: AcademicResearcher = {
    researcherId,
    institutionId,
    email: email.toLowerCase(),
    name,
    title,
    orcidId,
    verified: autoVerified,
    verificationMethod: autoVerified ? 'email-domain' : undefined,
    verifiedAt: autoVerified ? new Date() : undefined,
    createdAt: new Date(),
    lastActiveAt: new Date(),
    projects: [],
    apiKey,
    accessLevel: autoVerified ? 'basic' : 'pending',
    usageStats: {
      totalApiCalls: 0,
      totalDataDownloaded: 0,
      monthlyUsage: {},
      topEndpoints: {},
    },
  };

  researchers.set(researcherId, researcher);
  researcherByEmail.set(email.toLowerCase(), researcherId);
  researcherByApiKey.set(apiKey, researcherId);

  return researcher;
}

function generateAcademicApiKey(researcherId: string): string {
  const prefix = 'acad_';
  const random = Array.from({ length: 32 }, () =>
    Math.random().toString(36).charAt(2)
  ).join('');
  return `${prefix}${random}`;
}

/**
 * Verify a researcher
 */
export function verifyResearcher(
  researcherId: string,
  method: 'email-domain' | 'manual' | 'orcid' | 'institutional'
): AcademicResearcher | null {
  const researcher = researchers.get(researcherId);
  if (!researcher) return null;

  researcher.verified = true;
  researcher.verificationMethod = method;
  researcher.verifiedAt = new Date();
  researcher.accessLevel = 'basic';

  return researcher;
}

/**
 * Get researcher by ID
 */
export function getResearcher(researcherId: string): AcademicResearcher | null {
  return researchers.get(researcherId) || null;
}

/**
 * Get researcher by API key
 */
export function getResearcherByApiKey(apiKey: string): AcademicResearcher | null {
  const researcherId = researcherByApiKey.get(apiKey);
  if (!researcherId) return null;
  return researchers.get(researcherId) || null;
}

/**
 * Update researcher access level
 */
export function updateAccessLevel(
  researcherId: string,
  level: AcademicAccessLevel
): AcademicResearcher | null {
  const researcher = researchers.get(researcherId);
  if (!researcher) return null;

  researcher.accessLevel = level;
  return researcher;
}

/**
 * Record API usage for a researcher
 */
export function recordUsage(
  researcherId: string,
  endpoint: string,
  bytesDownloaded: number = 0
): void {
  const researcher = researchers.get(researcherId);
  if (!researcher) return;

  researcher.usageStats.totalApiCalls++;
  researcher.usageStats.totalDataDownloaded += bytesDownloaded;
  researcher.lastActiveAt = new Date();

  const monthKey = new Date().toISOString().slice(0, 7);
  researcher.usageStats.monthlyUsage[monthKey] =
    (researcher.usageStats.monthlyUsage[monthKey] || 0) + 1;

  researcher.usageStats.topEndpoints[endpoint] =
    (researcher.usageStats.topEndpoints[endpoint] || 0) + 1;
}

// ============================================================================
// PROJECT MANAGEMENT
// ============================================================================

/**
 * Create a new research project
 */
export function createProject(
  title: string,
  description: string,
  principalInvestigator: string,
  institutionId: string,
  dataRequirements: DataRequirements,
  agreementTerms: AgreementTerms
): ResearchProject {
  const projectId = `proj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const project: ResearchProject = {
    projectId,
    title,
    description,
    principalInvestigator,
    coInvestigators: [],
    institutionId,
    status: 'pending-approval',
    startDate: new Date(),
    irbApproved: false,
    dataUsageAgreement: {
      version: '1.0',
      signedAt: new Date(),
      signedBy: principalInvestigator,
      terms: agreementTerms,
      restrictions: [],
    },
    dataRequirements,
    publications: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  projects.set(projectId, project);

  // Add project to researcher
  const researcher = researchers.get(principalInvestigator);
  if (researcher) {
    researcher.projects.push(projectId);
  }

  return project;
}

/**
 * Approve a research project
 */
export function approveProject(projectId: string): ResearchProject | null {
  const project = projects.get(projectId);
  if (!project) return null;

  project.status = 'active';
  project.updatedAt = new Date();

  // Upgrade PI to enhanced access
  const pi = researchers.get(project.principalInvestigator);
  if (pi && pi.accessLevel === 'basic') {
    pi.accessLevel = 'enhanced';
  }

  // Update institution stats
  const institution = institutions.get(project.institutionId);
  if (institution) {
    institution.metadata.activeProjects++;
  }

  return project;
}

/**
 * Get project by ID
 */
export function getProject(projectId: string): ResearchProject | null {
  return projects.get(projectId) || null;
}

/**
 * Add co-investigator to project
 */
export function addCoInvestigator(
  projectId: string,
  researcherId: string
): ResearchProject | null {
  const project = projects.get(projectId);
  if (!project) return null;

  const researcher = researchers.get(researcherId);
  if (!researcher) return null;

  if (!project.coInvestigators.includes(researcherId)) {
    project.coInvestigators.push(researcherId);
    researcher.projects.push(projectId);
    project.updatedAt = new Date();
  }

  return project;
}

/**
 * Submit IRB approval for project
 */
export function submitIRBApproval(
  projectId: string,
  irbNumber: string
): ResearchProject | null {
  const project = projects.get(projectId);
  if (!project) return null;

  project.irbApproved = true;
  project.irbNumber = irbNumber;
  project.updatedAt = new Date();

  return project;
}

/**
 * List projects for a researcher
 */
export function listResearcherProjects(researcherId: string): ResearchProject[] {
  const researcher = researchers.get(researcherId);
  if (!researcher) return [];

  return researcher.projects
    .map((pid) => projects.get(pid))
    .filter(Boolean) as ResearchProject[];
}

// ============================================================================
// CITATION MANAGEMENT
// ============================================================================

const CITATION_BASE = {
  dataset: 'Free Crypto News API',
  url: 'https://cryptocurrency.cv',
  publisher: 'Free Crypto News',
};

/**
 * Generate citation for a research project
 */
export function generateCitation(
  projectId: string,
  style: CitationStyle,
  dateAccessed: Date = new Date()
): CitationRequirement {
  const project = projects.get(projectId);
  if (!project) {
    throw new Error('Project not found');
  }

  const year = dateAccessed.getFullYear();
  const month = dateAccessed.toLocaleString('en-US', { month: 'long' });
  const day = dateAccessed.getDate();
  const dateStr = `${month} ${day}, ${year}`;
  const isoDate = dateAccessed.toISOString().slice(0, 10);

  let text: string;
  let bibtex: string;

  switch (style) {
    case 'apa':
      text = `${CITATION_BASE.publisher}. (${year}). ${CITATION_BASE.dataset} [Data set]. Retrieved ${dateStr}, from ${CITATION_BASE.url}`;
      bibtex = `@misc{freecryptonews${year},
  author = {{${CITATION_BASE.publisher}}},
  title = {{${CITATION_BASE.dataset}}},
  year = {${year}},
  howpublished = {\\url{${CITATION_BASE.url}}},
  note = {Accessed: ${isoDate}}
}`;
      break;

    case 'mla':
      text = `"${CITATION_BASE.dataset}." ${CITATION_BASE.publisher}, ${CITATION_BASE.url}. Accessed ${day} ${month} ${year}.`;
      bibtex = generateBibtex(year, isoDate);
      break;

    case 'chicago':
      text = `${CITATION_BASE.publisher}. "${CITATION_BASE.dataset}." Accessed ${month} ${day}, ${year}. ${CITATION_BASE.url}.`;
      bibtex = generateBibtex(year, isoDate);
      break;

    case 'ieee':
      text = `${CITATION_BASE.publisher}, "${CITATION_BASE.dataset}," ${year}. [Online]. Available: ${CITATION_BASE.url}. [Accessed: ${dateStr}].`;
      bibtex = generateBibtex(year, isoDate);
      break;

    case 'acm':
      text = `${CITATION_BASE.publisher}. ${year}. ${CITATION_BASE.dataset}. Retrieved ${dateStr} from ${CITATION_BASE.url}`;
      bibtex = generateBibtex(year, isoDate);
      break;

    case 'bibtex':
    default:
      text = '';
      bibtex = generateBibtex(year, isoDate);
      break;
  }

  const citationId = `cit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  return {
    citationId,
    projectId,
    style,
    text,
    bibtex,
    dataVersion: '2.0',
    dateAccessed,
    dataDescription: `Cryptocurrency news aggregation and analytics data from ${CITATION_BASE.dataset}`,
  };
}

function generateBibtex(year: number, isoDate: string): string {
  return `@misc{freecryptonews${year},
  author = {{${CITATION_BASE.publisher}}},
  title = {{${CITATION_BASE.dataset}}},
  year = {${year}},
  howpublished = {\\url{${CITATION_BASE.url}}},
  note = {Accessed: ${isoDate}}
}`;
}

// ============================================================================
// PUBLICATION TRACKING
// ============================================================================

/**
 * Register a publication that uses our data
 */
export function registerPublication(
  projectId: string,
  title: string,
  authors: string[],
  venue: string,
  venueType: Publication['venueType'],
  citationText?: string
): Publication {
  const project = projects.get(projectId);
  if (!project) {
    throw new Error('Project not found');
  }

  const publicationId = `pub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const publication: Publication = {
    publicationId,
    title,
    authors,
    venue,
    venueType,
    citesOurData: true,
    citationText,
    status: 'draft',
  };

  publications.set(publicationId, publication);
  project.publications.push(publication);
  project.updatedAt = new Date();

  // Update institution stats
  const institution = institutions.get(project.institutionId);
  if (institution) {
    institution.metadata.publications++;
  }

  return publication;
}

/**
 * Update publication status
 */
export function updatePublicationStatus(
  publicationId: string,
  status: Publication['status'],
  details?: { doi?: string; arxivId?: string; url?: string; publishedAt?: Date }
): Publication | null {
  const publication = publications.get(publicationId);
  if (!publication) return null;

  publication.status = status;
  if (details?.doi) publication.doi = details.doi;
  if (details?.arxivId) publication.arxivId = details.arxivId;
  if (details?.url) publication.url = details.url;
  if (details?.publishedAt) publication.publishedAt = details.publishedAt;

  return publication;
}

/**
 * List all publications using our data
 */
export function listPublications(options?: {
  status?: Publication['status'];
  venueType?: Publication['venueType'];
  limit?: number;
}): Publication[] {
  let result = Array.from(publications.values());

  if (options?.status) {
    result = result.filter((p) => p.status === options.status);
  }
  if (options?.venueType) {
    result = result.filter((p) => p.venueType === options.venueType);
  }

  result.sort((a, b) => {
    if (a.publishedAt && b.publishedAt) {
      return b.publishedAt.getTime() - a.publishedAt.getTime();
    }
    return 0;
  });

  if (options?.limit) {
    result = result.slice(0, options.limit);
  }

  return result;
}

// ============================================================================
// BULK EXPORT MANAGEMENT
// ============================================================================

/**
 * Request a bulk data export
 */
export function requestBulkExport(
  projectId: string,
  researcherId: string,
  dataTypes: DataType[],
  timeRange: { start: Date; end: Date },
  format: BulkExportRequest['format'],
  filters?: Record<string, unknown>
): BulkExportRequest {
  const project = projects.get(projectId);
  if (!project) {
    throw new Error('Project not found');
  }

  const researcher = researchers.get(researcherId);
  if (!researcher) {
    throw new Error('Researcher not found');
  }

  const config = ACCESS_CONFIGS[researcher.accessLevel];
  if (!config.endpoints.bulkExport.length) {
    throw new Error('Bulk export not available at current access level');
  }

  const requestId = `export_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const request: BulkExportRequest = {
    requestId,
    projectId,
    researcherId,
    dataTypes,
    timeRange,
    format,
    filters,
    status: 'pending',
    createdAt: new Date(),
  };

  bulkExports.set(requestId, request);
  return request;
}

/**
 * Get bulk export request status
 */
export function getBulkExport(requestId: string): BulkExportRequest | null {
  return bulkExports.get(requestId) || null;
}

/**
 * Update bulk export status (called by processing system)
 */
export function updateBulkExportStatus(
  requestId: string,
  status: BulkExportRequest['status'],
  details?: {
    downloadUrl?: string;
    sizeBytes?: number;
    expiresAt?: Date;
    error?: string;
  }
): BulkExportRequest | null {
  const request = bulkExports.get(requestId);
  if (!request) return null;

  request.status = status;
  if (status === 'ready' || status === 'failed') {
    request.completedAt = new Date();
  }
  if (details?.downloadUrl) request.downloadUrl = details.downloadUrl;
  if (details?.sizeBytes) request.sizeBytes = details.sizeBytes;
  if (details?.expiresAt) request.expiresAt = details.expiresAt;
  if (details?.error) request.error = details.error;

  return request;
}

/**
 * List bulk exports for a researcher
 */
export function listBulkExports(researcherId: string): BulkExportRequest[] {
  return Array.from(bulkExports.values())
    .filter((e) => e.researcherId === researcherId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// ============================================================================
// ACCESS CONTROL
// ============================================================================

/**
 * Check if a researcher can access an endpoint
 */
export function canAccessEndpoint(
  researcherId: string,
  endpoint: string
): { allowed: boolean; reason?: string } {
  const researcher = researchers.get(researcherId);
  if (!researcher) {
    return { allowed: false, reason: 'Researcher not found' };
  }

  if (!researcher.verified) {
    return { allowed: false, reason: 'Researcher not verified' };
  }

  const config = ACCESS_CONFIGS[researcher.accessLevel];

  // Check standard endpoints
  if (
    config.endpoints.standard.includes('*') ||
    config.endpoints.standard.includes(endpoint)
  ) {
    return { allowed: true };
  }

  // Check enhanced endpoints
  if (
    config.endpoints.enhanced.includes('*') ||
    config.endpoints.enhanced.includes(endpoint)
  ) {
    return { allowed: true };
  }

  // Check bulk export endpoints
  if (config.endpoints.bulkExport.includes(endpoint)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `Endpoint ${endpoint} not available at ${researcher.accessLevel} access level`,
  };
}

/**
 * Check rate limits for a researcher
 */
export function checkRateLimits(researcherId: string): {
  allowed: boolean;
  remaining: { minute: number; day: number };
  resetAt: Date;
} {
  const researcher = researchers.get(researcherId);
  if (!researcher) {
    return {
      allowed: false,
      remaining: { minute: 0, day: 0 },
      resetAt: new Date(),
    };
  }

  const config = ACCESS_CONFIGS[researcher.accessLevel];
  const now = new Date();
  const monthKey = now.toISOString().slice(0, 7);
  const todayUsage = researcher.usageStats.monthlyUsage[monthKey] || 0;

  // Simplified rate limit check (in production, use Redis or similar)
  const dayUsed = todayUsage;
  const dayRemaining = Math.max(0, config.rateLimits.requestsPerDay - dayUsed);

  return {
    allowed: dayRemaining > 0,
    remaining: {
      minute: config.rateLimits.requestsPerMinute,
      day: dayRemaining,
    },
    resetAt: new Date(now.getTime() + 60 * 1000),
  };
}

/**
 * Get API configuration for a researcher
 */
export function getAPIConfig(researcherId: string): AcademicAPIConfig | null {
  const researcher = researchers.get(researcherId);
  if (!researcher) return null;

  return ACCESS_CONFIGS[researcher.accessLevel];
}

// ============================================================================
// STATISTICS & REPORTING
// ============================================================================

export interface AcademicProgramStats {
  totalInstitutions: number;
  verifiedInstitutions: number;
  totalResearchers: number;
  verifiedResearchers: number;
  activeProjects: number;
  totalPublications: number;
  publishedPapers: number;
  totalApiCalls: number;
  totalDataDownloaded: number;
  topInstitutions: { name: string; researchers: number; publications: number }[];
  accessLevelDistribution: Record<AcademicAccessLevel, number>;
}

/**
 * Get program-wide statistics
 */
export function getProgramStats(): AcademicProgramStats {
  const allInstitutions = Array.from(institutions.values());
  const allResearchers = Array.from(researchers.values());
  const allProjects = Array.from(projects.values());
  const allPublications = Array.from(publications.values());

  const accessLevelDistribution: Record<AcademicAccessLevel, number> = {
    pending: 0,
    basic: 0,
    enhanced: 0,
    unlimited: 0,
    suspended: 0,
  };

  let totalApiCalls = 0;
  let totalDataDownloaded = 0;

  for (const researcher of allResearchers) {
    accessLevelDistribution[researcher.accessLevel]++;
    totalApiCalls += researcher.usageStats.totalApiCalls;
    totalDataDownloaded += researcher.usageStats.totalDataDownloaded;
  }

  // Calculate top institutions
  const institutionStats = new Map<string, { name: string; researchers: number; publications: number }>();
  for (const institution of allInstitutions) {
    institutionStats.set(institution.institutionId, {
      name: institution.name,
      researchers: 0,
      publications: institution.metadata.publications,
    });
  }
  for (const researcher of allResearchers) {
    const stats = institutionStats.get(researcher.institutionId);
    if (stats) {
      stats.researchers++;
    }
  }

  const topInstitutions = Array.from(institutionStats.values())
    .sort((a, b) => b.researchers + b.publications - (a.researchers + a.publications))
    .slice(0, 10);

  return {
    totalInstitutions: allInstitutions.length,
    verifiedInstitutions: allInstitutions.filter((i) => i.verified).length,
    totalResearchers: allResearchers.length,
    verifiedResearchers: allResearchers.filter((r) => r.verified).length,
    activeProjects: allProjects.filter((p) => p.status === 'active').length,
    totalPublications: allPublications.length,
    publishedPapers: allPublications.filter((p) => p.status === 'published').length,
    totalApiCalls,
    totalDataDownloaded,
    topInstitutions,
    accessLevelDistribution,
  };
}

// ============================================================================
// INITIALIZATION (SAMPLE DATA)
// ============================================================================

/**
 * Initialize with sample institutions
 */
export function initializeSampleData(): void {
  // Add some well-known universities
  const mit = registerInstitution(
    'Massachusetts Institute of Technology',
    'university',
    'US',
    ['mit.edu'],
    {
      website: 'https://mit.edu',
      researchAreas: ['blockchain', 'cryptography', 'finance'],
    }
  );
  verifyInstitution(mit.institutionId, 'https://ror.org/042nb2s44');

  const stanford = registerInstitution(
    'Stanford University',
    'university',
    'US',
    ['stanford.edu'],
    {
      website: 'https://stanford.edu',
      researchAreas: ['AI', 'blockchain', 'economics'],
    }
  );
  verifyInstitution(stanford.institutionId, 'https://ror.org/00f54p054');

  const oxford = registerInstitution(
    'University of Oxford',
    'university',
    'UK',
    ['ox.ac.uk', 'oxford.ac.uk'],
    {
      website: 'https://ox.ac.uk',
      researchAreas: ['economics', 'computer science'],
    }
  );
  verifyInstitution(oxford.institutionId, 'https://ror.org/052gg0110');
}
