/**
 * Academic Citation Network
 *
 * Track, analyze, and visualize academic citations of cryptocurrency news data.
 * Supports bibliometric analysis, impact tracking, and citation graph visualization.
 *
 * Features:
 * - Citation graph construction and traversal
 * - Impact factor calculation
 * - H-index computation
 * - Co-citation analysis
 * - Research front detection
 * - Citation context extraction
 * - Bibliometric metrics
 * - Export to standard formats (BibTeX, RIS, CSL-JSON)
 *
 * @module citation-network
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CitationNode {
  nodeId: string;
  nodeType: 'paper' | 'dataset' | 'article' | 'preprint' | 'report';
  title: string;
  authors: Author[];
  year: number;
  venue?: string;
  doi?: string;
  arxivId?: string;
  url?: string;
  abstract?: string;
  keywords: string[];
  citationCount: number;
  references: string[]; // nodeIds
  citedBy: string[]; // nodeIds
  metadata: CitationMetadata;
  addedAt: Date;
  updatedAt: Date;
}

export interface Author {
  name: string;
  affiliations: string[];
  orcid?: string;
  email?: string;
  isCorresponding?: boolean;
}

export interface CitationMetadata {
  source: 'manual' | 'crossref' | 'semantic-scholar' | 'google-scholar' | 'arxiv';
  sourceId?: string;
  publicationDate?: Date;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  publisher?: string;
  license?: string;
  openAccess: boolean;
  peerReviewed: boolean;
  language: string;
  fieldsOfStudy: string[];
}

export interface CitationEdge {
  fromNodeId: string;
  toNodeId: string;
  context?: CitationContext;
  strength: number; // 1 = standard, higher = multiple citations
  createdAt: Date;
}

export interface CitationContext {
  section: 'introduction' | 'methods' | 'results' | 'discussion' | 'other';
  sentiment: 'positive' | 'negative' | 'neutral';
  purpose: CitationPurpose;
  surroundingText?: string;
  pageNumber?: number;
}

export type CitationPurpose =
  | 'background' // provides context
  | 'methodology' // describes methods used
  | 'comparison' // compares results
  | 'extension' // extends the work
  | 'support' // supports claims
  | 'contrast' // contrasts/disagrees with
  | 'data-source' // uses as data source
  | 'tool'; // uses as tool/software

export interface BibliometricMetrics {
  nodeId: string;
  citationCount: number;
  hIndex: number;
  gIndex: number;
  i10Index: number;
  selfCitationRate: number;
  averageCitationsPerYear: number;
  citationVelocity: number; // recent citation rate
  fieldNormalizedCitationImpact: number;
  relativeImpact: number;
  percentileRank: number;
}

export interface AuthorMetrics {
  authorName: string;
  paperCount: number;
  totalCitations: number;
  hIndex: number;
  gIndex: number;
  i10Index: number;
  coauthors: string[];
  coauthorCount: number;
  averageCitationsPerPaper: number;
  mostCitedPaper: string;
  recentPapers: number; // last 5 years
  collaborationIndex: number;
}

export interface NetworkMetrics {
  nodeCount: number;
  edgeCount: number;
  averageDegree: number;
  density: number;
  clustering: number;
  diameter: number;
  averagePathLength: number;
  centralNodes: { nodeId: string; centrality: number }[];
  communities: { id: string; nodes: string[]; label: string }[];
}

export interface ResearchFront {
  frontId: string;
  name: string;
  description: string;
  coreDocuments: string[];
  citingDocuments: string[];
  emergenceScore: number; // 0-1
  growthRate: number;
  keywords: string[];
  yearStarted: number;
  isActive: boolean;
}

export interface CoCitationCluster {
  clusterId: string;
  members: string[]; // nodeIds
  strength: number;
  label: string;
  keywords: string[];
  coherence: number;
}

export interface CitationBurst {
  nodeId: string;
  burstStart: number; // year
  burstEnd: number;
  burstStrength: number;
  isOngoing: boolean;
}

export interface ExportFormat {
  format: 'bibtex' | 'ris' | 'csl-json' | 'endnote' | 'plain';
  content: string;
}

// ============================================================================
// STORAGE
// ============================================================================

const nodes = new Map<string, CitationNode>();
const edges: CitationEdge[] = [];
const authorIndex = new Map<string, Set<string>>(); // author -> nodeIds
const yearIndex = new Map<number, Set<string>>(); // year -> nodeIds
const keywordIndex = new Map<string, Set<string>>(); // keyword -> nodeIds

// Our dataset as a special node
const OUR_DATASET_ID = 'dataset:free-crypto-news';

// ============================================================================
// CITATION GRAPH CLASS
// ============================================================================

export class CitationGraph {
  /**
   * Add a citation node to the graph
   */
  addNode(node: CitationNode): void {
    nodes.set(node.nodeId, node);

    // Update indexes
    for (const author of node.authors) {
      const key = this.normalizeAuthorName(author.name);
      if (!authorIndex.has(key)) {
        authorIndex.set(key, new Set());
      }
      authorIndex.get(key)!.add(node.nodeId);
    }

    if (!yearIndex.has(node.year)) {
      yearIndex.set(node.year, new Set());
    }
    yearIndex.get(node.year)!.add(node.nodeId);

    for (const keyword of node.keywords) {
      const key = keyword.toLowerCase();
      if (!keywordIndex.has(key)) {
        keywordIndex.set(key, new Set());
      }
      keywordIndex.get(key)!.add(node.nodeId);
    }
  }

  /**
   * Add a citation edge
   */
  addEdge(edge: CitationEdge): void {
    edges.push(edge);

    // Update citation counts
    const fromNode = nodes.get(edge.fromNodeId);
    const toNode = nodes.get(edge.toNodeId);

    if (fromNode && toNode) {
      if (!fromNode.references.includes(edge.toNodeId)) {
        fromNode.references.push(edge.toNodeId);
      }
      if (!toNode.citedBy.includes(edge.fromNodeId)) {
        toNode.citedBy.push(edge.fromNodeId);
        toNode.citationCount = toNode.citedBy.length;
      }
    }
  }

  /**
   * Get a node by ID
   */
  getNode(nodeId: string): CitationNode | undefined {
    return nodes.get(nodeId);
  }

  /**
   * Get all nodes
   */
  getAllNodes(): CitationNode[] {
    return Array.from(nodes.values());
  }

  /**
   * Get all edges
   */
  getAllEdges(): CitationEdge[] {
    return [...edges];
  }

  /**
   * Find papers by author
   */
  findByAuthor(authorName: string): CitationNode[] {
    const key = this.normalizeAuthorName(authorName);
    const nodeIds = authorIndex.get(key);
    if (!nodeIds) return [];
    return Array.from(nodeIds)
      .map((id) => nodes.get(id))
      .filter(Boolean) as CitationNode[];
  }

  /**
   * Find papers by year
   */
  findByYear(year: number): CitationNode[] {
    const nodeIds = yearIndex.get(year);
    if (!nodeIds) return [];
    return Array.from(nodeIds)
      .map((id) => nodes.get(id))
      .filter(Boolean) as CitationNode[];
  }

  /**
   * Find papers by keyword
   */
  findByKeyword(keyword: string): CitationNode[] {
    const nodeIds = keywordIndex.get(keyword.toLowerCase());
    if (!nodeIds) return [];
    return Array.from(nodeIds)
      .map((id) => nodes.get(id))
      .filter(Boolean) as CitationNode[];
  }

  /**
   * Get papers that cite our dataset
   */
  getPapersCitingUs(): CitationNode[] {
    const ourNode = nodes.get(OUR_DATASET_ID);
    if (!ourNode) return [];
    return ourNode.citedBy
      .map((id) => nodes.get(id))
      .filter(Boolean) as CitationNode[];
  }

  /**
   * Get citation chain (path from one paper to another through citations)
   */
  getCitationPath(fromId: string, toId: string): string[] | null {
    const visited = new Set<string>();
    const queue: { nodeId: string; path: string[] }[] = [
      { nodeId: fromId, path: [fromId] },
    ];

    while (queue.length > 0) {
      const { nodeId, path } = queue.shift()!;

      if (nodeId === toId) {
        return path;
      }

      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const node = nodes.get(nodeId);
      if (!node) continue;

      for (const refId of node.references) {
        if (!visited.has(refId)) {
          queue.push({
            nodeId: refId,
            path: [...path, refId],
          });
        }
      }
    }

    return null;
  }

  /**
   * Normalize author name for matching
   */
  private normalizeAuthorName(name: string): string {
    return name.toLowerCase().trim().replace(/\s+/g, ' ');
  }
}

// Global graph instance
const graph = new CitationGraph();

// ============================================================================
// BIBLIOMETRIC CALCULATIONS
// ============================================================================

/**
 * Calculate H-index for a set of papers
 */
export function calculateHIndex(citations: number[]): number {
  const sorted = [...citations].sort((a, b) => b - a);
  let h = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] >= i + 1) {
      h = i + 1;
    } else {
      break;
    }
  }
  return h;
}

/**
 * Calculate G-index for a set of papers
 */
export function calculateGIndex(citations: number[]): number {
  const sorted = [...citations].sort((a, b) => b - a);
  let cumulative = 0;
  let g = 0;
  for (let i = 0; i < sorted.length; i++) {
    cumulative += sorted[i];
    if (cumulative >= (i + 1) * (i + 1)) {
      g = i + 1;
    }
  }
  return g;
}

/**
 * Calculate i10-index (papers with >= 10 citations)
 */
export function calculateI10Index(citations: number[]): number {
  return citations.filter((c) => c >= 10).length;
}

/**
 * Calculate bibliometric metrics for a paper
 */
export function calculatePaperMetrics(nodeId: string): BibliometricMetrics | null {
  const node = nodes.get(nodeId);
  if (!node) return null;

  const currentYear = new Date().getFullYear();
  const yearsPublished = currentYear - node.year + 1;

  // Self-citation rate (authors citing their own work)
  const authorNames = new Set(node.authors.map((a) => a.name.toLowerCase()));
  let selfCitations = 0;
  for (const citerId of node.citedBy) {
    const citer = nodes.get(citerId);
    if (citer) {
      const citerAuthors = citer.authors.map((a) => a.name.toLowerCase());
      if (citerAuthors.some((a) => authorNames.has(a))) {
        selfCitations++;
      }
    }
  }

  const selfCitationRate = node.citationCount > 0
    ? selfCitations / node.citationCount
    : 0;

  // Citation velocity (citations in last 2 years)
  const recentCitations = node.citedBy.filter((citerId) => {
    const citer = nodes.get(citerId);
    return citer && citer.year >= currentYear - 2;
  }).length;
  const citationVelocity = recentCitations / 2;

  // Calculate percentile rank
  const allCitations = Array.from(nodes.values()).map((n) => n.citationCount);
  allCitations.sort((a, b) => a - b);
  const rank = allCitations.findIndex((c) => c >= node.citationCount);
  const percentileRank = rank >= 0 ? (rank / allCitations.length) * 100 : 50;

  return {
    nodeId,
    citationCount: node.citationCount,
    hIndex: calculateHIndex([node.citationCount]),
    gIndex: calculateGIndex([node.citationCount]),
    i10Index: node.citationCount >= 10 ? 1 : 0,
    selfCitationRate,
    averageCitationsPerYear: node.citationCount / yearsPublished,
    citationVelocity,
    fieldNormalizedCitationImpact: 1.0, // Would need field data
    relativeImpact: node.citationCount / (averageCitationsByYear(node.year) || 1),
    percentileRank,
  };
}

function averageCitationsByYear(year: number): number {
  const papersInYear = yearIndex.get(year);
  if (!papersInYear || papersInYear.size === 0) return 1;

  let total = 0;
  for (const nodeId of papersInYear) {
    const node = nodes.get(nodeId);
    if (node) total += node.citationCount;
  }
  return total / papersInYear.size;
}

/**
 * Calculate author metrics
 */
export function calculateAuthorMetrics(authorName: string): AuthorMetrics | null {
  const key = authorName.toLowerCase().trim();
  const nodeIds = authorIndex.get(key);
  if (!nodeIds || nodeIds.size === 0) return null;

  const papers = Array.from(nodeIds)
    .map((id) => nodes.get(id))
    .filter(Boolean) as CitationNode[];

  const citations = papers.map((p) => p.citationCount);
  const totalCitations = citations.reduce((a, b) => a + b, 0);

  // Find coauthors
  const coauthorSet = new Set<string>();
  for (const paper of papers) {
    for (const author of paper.authors) {
      const normalizedName = author.name.toLowerCase().trim();
      if (normalizedName !== key) {
        coauthorSet.add(normalizedName);
      }
    }
  }

  // Most cited paper
  const mostCited = papers.reduce((best, p) =>
    p.citationCount > (best?.citationCount || 0) ? p : best
  );

  // Recent papers (last 5 years)
  const currentYear = new Date().getFullYear();
  const recentPapers = papers.filter((p) => p.year >= currentYear - 5).length;

  return {
    authorName,
    paperCount: papers.length,
    totalCitations,
    hIndex: calculateHIndex(citations),
    gIndex: calculateGIndex(citations),
    i10Index: calculateI10Index(citations),
    coauthors: Array.from(coauthorSet),
    coauthorCount: coauthorSet.size,
    averageCitationsPerPaper: totalCitations / papers.length,
    mostCitedPaper: mostCited?.nodeId || '',
    recentPapers,
    collaborationIndex: coauthorSet.size / papers.length,
  };
}

// ============================================================================
// NETWORK ANALYSIS
// ============================================================================

/**
 * Calculate network metrics
 */
export function calculateNetworkMetrics(): NetworkMetrics {
  const allNodes = Array.from(nodes.values());
  const nodeCount = allNodes.length;
  const edgeCount = edges.length;

  if (nodeCount === 0) {
    return {
      nodeCount: 0,
      edgeCount: 0,
      averageDegree: 0,
      density: 0,
      clustering: 0,
      diameter: 0,
      averagePathLength: 0,
      centralNodes: [],
      communities: [],
    };
  }

  // Calculate degrees
  const degrees: number[] = allNodes.map(
    (n) => n.references.length + n.citedBy.length
  );
  const averageDegree = degrees.reduce((a, b) => a + b, 0) / nodeCount;

  // Density
  const maxPossibleEdges = nodeCount * (nodeCount - 1);
  const density = maxPossibleEdges > 0 ? edgeCount / maxPossibleEdges : 0;

  // Clustering coefficient (simplified)
  let totalClustering = 0;
  for (const node of allNodes) {
    const neighbors = new Set([...node.references, ...node.citedBy]);
    const k = neighbors.size;
    if (k < 2) continue;

    let triangles = 0;
    const neighborArray = Array.from(neighbors);
    for (let i = 0; i < neighborArray.length; i++) {
      for (let j = i + 1; j < neighborArray.length; j++) {
        const n1 = nodes.get(neighborArray[i]);
        const n2 = nodes.get(neighborArray[j]);
        if (n1 && n2) {
          if (
            n1.references.includes(neighborArray[j]) ||
            n1.citedBy.includes(neighborArray[j])
          ) {
            triangles++;
          }
        }
      }
    }
    const possibleTriangles = (k * (k - 1)) / 2;
    totalClustering += triangles / possibleTriangles;
  }
  const clustering = nodeCount > 0 ? totalClustering / nodeCount : 0;

  // Calculate centrality (simplified - using degree centrality)
  const centralities = allNodes.map((n) => ({
    nodeId: n.nodeId,
    centrality: (n.references.length + n.citedBy.length) / (2 * (nodeCount - 1) || 1),
  }));
  centralities.sort((a, b) => b.centrality - a.centrality);
  const centralNodes = centralities.slice(0, 10);

  // Detect communities using label propagation
  const communities = detectCommunities(allNodes);

  return {
    nodeCount,
    edgeCount,
    averageDegree,
    density,
    clustering,
    diameter: 0, // Would need full BFS
    averagePathLength: 0, // Would need full BFS
    centralNodes,
    communities,
  };
}

function detectCommunities(allNodes: CitationNode[]): NetworkMetrics['communities'] {
  const labels = new Map<string, string>();
  for (const node of allNodes) {
    labels.set(node.nodeId, node.nodeId);
  }

  // Label propagation
  for (let iter = 0; iter < 50; iter++) {
    let changed = false;
    const shuffled = [...allNodes].sort(() => Math.random() - 0.5);

    for (const node of shuffled) {
      const neighbors = [...node.references, ...node.citedBy];
      if (neighbors.length === 0) continue;

      const labelCounts = new Map<string, number>();
      for (const neighborId of neighbors) {
        const label = labels.get(neighborId);
        if (label) {
          labelCounts.set(label, (labelCounts.get(label) || 0) + 1);
        }
      }

      if (labelCounts.size > 0) {
        const maxLabel = Array.from(labelCounts.entries())
          .sort((a, b) => b[1] - a[1])[0][0];
        if (maxLabel !== labels.get(node.nodeId)) {
          labels.set(node.nodeId, maxLabel);
          changed = true;
        }
      }
    }

    if (!changed) break;
  }

  // Group by label
  const groups = new Map<string, string[]>();
  for (const [nodeId, label] of labels) {
    if (!groups.has(label)) {
      groups.set(label, []);
    }
    groups.get(label)!.push(nodeId);
  }

  // Filter small groups and create communities
  let communityIndex = 1;
  const communities: NetworkMetrics['communities'] = [];
  for (const [, nodeIds] of groups) {
    if (nodeIds.length >= 3) {
      // Extract common keywords for label
      const allKeywords = new Map<string, number>();
      for (const nodeId of nodeIds) {
        const node = nodes.get(nodeId);
        if (node) {
          for (const kw of node.keywords) {
            allKeywords.set(kw, (allKeywords.get(kw) || 0) + 1);
          }
        }
      }
      const topKeywords = Array.from(allKeywords.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([kw]) => kw);

      communities.push({
        id: `community-${communityIndex++}`,
        nodes: nodeIds,
        label: topKeywords.join(', ') || `Community ${communityIndex - 1}`,
      });
    }
  }

  return communities.sort((a, b) => b.nodes.length - a.nodes.length);
}

// ============================================================================
// CO-CITATION ANALYSIS
// ============================================================================

/**
 * Find co-citation clusters (papers frequently cited together)
 */
export function findCoCitationClusters(minStrength: number = 3): CoCitationCluster[] {
  const coCitations = new Map<string, number>();

  // Count how often pairs are cited together
  for (const node of nodes.values()) {
    const refs = node.references;
    for (let i = 0; i < refs.length; i++) {
      for (let j = i + 1; j < refs.length; j++) {
        const key = [refs[i], refs[j]].sort().join('|');
        coCitations.set(key, (coCitations.get(key) || 0) + 1);
      }
    }
  }

  // Build adjacency for strong co-citations
  const adjacency = new Map<string, Map<string, number>>();
  for (const [key, count] of coCitations) {
    if (count >= minStrength) {
      const [id1, id2] = key.split('|');
      if (!adjacency.has(id1)) adjacency.set(id1, new Map());
      if (!adjacency.has(id2)) adjacency.set(id2, new Map());
      adjacency.get(id1)!.set(id2, count);
      adjacency.get(id2)!.set(id1, count);
    }
  }

  // Find connected components
  const visited = new Set<string>();
  const clusters: CoCitationCluster[] = [];
  let clusterIndex = 1;

  for (const startId of adjacency.keys()) {
    if (visited.has(startId)) continue;

    const members: string[] = [];
    const queue = [startId];

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);
      members.push(nodeId);

      const neighbors = adjacency.get(nodeId);
      if (neighbors) {
        for (const neighborId of neighbors.keys()) {
          if (!visited.has(neighborId)) {
            queue.push(neighborId);
          }
        }
      }
    }

    if (members.length >= 2) {
      // Calculate cluster strength
      let totalStrength = 0;
      let pairCount = 0;
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          const key = [members[i], members[j]].sort().join('|');
          totalStrength += coCitations.get(key) || 0;
          pairCount++;
        }
      }

      // Extract keywords
      const allKeywords = new Map<string, number>();
      for (const nodeId of members) {
        const node = nodes.get(nodeId);
        if (node) {
          for (const kw of node.keywords) {
            allKeywords.set(kw, (allKeywords.get(kw) || 0) + 1);
          }
        }
      }
      const keywords = Array.from(allKeywords.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([kw]) => kw);

      clusters.push({
        clusterId: `cocite-${clusterIndex++}`,
        members,
        strength: pairCount > 0 ? totalStrength / pairCount : 0,
        label: keywords.slice(0, 2).join(' & ') || `Cluster ${clusterIndex - 1}`,
        keywords,
        coherence: members.length > 1 ? totalStrength / (members.length * (members.length - 1) / 2) : 1,
      });
    }
  }

  return clusters.sort((a, b) => b.strength - a.strength);
}

// ============================================================================
// RESEARCH FRONT DETECTION
// ============================================================================

/**
 * Detect emerging research fronts
 */
export function detectResearchFronts(windowYears: number = 3): ResearchFront[] {
  const currentYear = new Date().getFullYear();
  const cutoffYear = currentYear - windowYears;

  // Find highly cited older papers (core documents)
  const coreDocuments = Array.from(nodes.values())
    .filter((n) => n.year < cutoffYear && n.citationCount >= 5)
    .sort((a, b) => b.citationCount - a.citationCount);

  // For each core document, find citing documents from recent years
  const fronts: ResearchFront[] = [];
  let frontIndex = 1;

  for (const core of coreDocuments.slice(0, 20)) {
    const recentCiters = core.citedBy
      .map((id) => nodes.get(id))
      .filter((n) => n && n.year >= cutoffYear) as CitationNode[];

    if (recentCiters.length < 3) continue;

    // Calculate growth rate
    const yearCounts = new Map<number, number>();
    for (const citer of recentCiters) {
      yearCounts.set(citer.year, (yearCounts.get(citer.year) || 0) + 1);
    }
    const years = Array.from(yearCounts.keys()).sort();
    let growthRate = 0;
    if (years.length >= 2) {
      const firstCount = yearCounts.get(years[0]) || 0;
      const lastCount = yearCounts.get(years[years.length - 1]) || 0;
      growthRate = firstCount > 0 ? (lastCount - firstCount) / firstCount : lastCount;
    }

    // Extract keywords from citing papers
    const keywordCounts = new Map<string, number>();
    for (const citer of recentCiters) {
      for (const kw of citer.keywords) {
        keywordCounts.set(kw, (keywordCounts.get(kw) || 0) + 1);
      }
    }
    const keywords = Array.from(keywordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([kw]) => kw);

    fronts.push({
      frontId: `front-${frontIndex++}`,
      name: keywords.slice(0, 2).join(' & ') || core.title.slice(0, 50),
      description: `Research building on "${core.title.slice(0, 100)}"`,
      coreDocuments: [core.nodeId],
      citingDocuments: recentCiters.map((c) => c.nodeId),
      emergenceScore: Math.min(1, recentCiters.length / 20),
      growthRate,
      keywords,
      yearStarted: Math.min(...years),
      isActive: yearCounts.has(currentYear) || yearCounts.has(currentYear - 1),
    });
  }

  return fronts.sort((a, b) => b.emergenceScore - a.emergenceScore);
}

// ============================================================================
// CITATION BURSTS
// ============================================================================

/**
 * Detect citation bursts (sudden increase in citations)
 */
export function detectCitationBursts(): CitationBurst[] {
  const bursts: CitationBurst[] = [];
  const currentYear = new Date().getFullYear();

  for (const node of nodes.values()) {
    // Group citations by year
    const yearCounts = new Map<number, number>();
    for (const citerId of node.citedBy) {
      const citer = nodes.get(citerId);
      if (citer) {
        yearCounts.set(citer.year, (yearCounts.get(citer.year) || 0) + 1);
      }
    }

    if (yearCounts.size < 2) continue;

    const years = Array.from(yearCounts.keys()).sort();
    const counts = years.map((y) => yearCounts.get(y) || 0);
    const avgCount = counts.reduce((a, b) => a + b, 0) / counts.length;

    // Find burst periods (years with > 2x average)
    let burstStart: number | null = null;
    let maxStrength = 0;

    for (let i = 0; i < years.length; i++) {
      const count = counts[i];
      if (count > avgCount * 2) {
        if (burstStart === null) {
          burstStart = years[i];
        }
        maxStrength = Math.max(maxStrength, count / avgCount);
      } else if (burstStart !== null) {
        bursts.push({
          nodeId: node.nodeId,
          burstStart,
          burstEnd: years[i - 1],
          burstStrength: maxStrength,
          isOngoing: false,
        });
        burstStart = null;
        maxStrength = 0;
      }
    }

    // Check if burst is ongoing
    if (burstStart !== null) {
      bursts.push({
        nodeId: node.nodeId,
        burstStart,
        burstEnd: years[years.length - 1],
        burstStrength: maxStrength,
        isOngoing: years[years.length - 1] >= currentYear - 1,
      });
    }
  }

  return bursts.sort((a, b) => b.burstStrength - a.burstStrength);
}

// ============================================================================
// EXPORT FORMATS
// ============================================================================

/**
 * Export citation to BibTeX format
 */
export function toBibTeX(node: CitationNode): string {
  const key = node.nodeId.replace(/[^a-zA-Z0-9]/g, '');
  const authors = node.authors.map((a) => a.name).join(' and ');
  const entryType = node.nodeType === 'paper' ? 'article' : 'misc';

  let bibtex = `@${entryType}{${key},\n`;
  bibtex += `  author = {${authors}},\n`;
  bibtex += `  title = {{${node.title}}},\n`;
  bibtex += `  year = {${node.year}},\n`;

  if (node.venue) bibtex += `  journal = {${node.venue}},\n`;
  if (node.doi) bibtex += `  doi = {${node.doi}},\n`;
  if (node.url) bibtex += `  url = {${node.url}},\n`;
  if (node.metadata.volume) bibtex += `  volume = {${node.metadata.volume}},\n`;
  if (node.metadata.issue) bibtex += `  number = {${node.metadata.issue}},\n`;
  if (node.metadata.pages) bibtex += `  pages = {${node.metadata.pages}},\n`;
  if (node.keywords.length > 0) {
    bibtex += `  keywords = {${node.keywords.join(', ')}},\n`;
  }

  bibtex += '}';
  return bibtex;
}

/**
 * Export citation to RIS format
 */
export function toRIS(node: CitationNode): string {
  let ris = '';
  ris += `TY  - ${node.nodeType === 'paper' ? 'JOUR' : 'GEN'}\n`;
  ris += `TI  - ${node.title}\n`;

  for (const author of node.authors) {
    ris += `AU  - ${author.name}\n`;
  }

  ris += `PY  - ${node.year}\n`;
  if (node.venue) ris += `JO  - ${node.venue}\n`;
  if (node.doi) ris += `DO  - ${node.doi}\n`;
  if (node.url) ris += `UR  - ${node.url}\n`;
  if (node.abstract) ris += `AB  - ${node.abstract}\n`;

  for (const kw of node.keywords) {
    ris += `KW  - ${kw}\n`;
  }

  ris += 'ER  - \n';
  return ris;
}

/**
 * Export citation to CSL-JSON format
 */
export function toCSLJSON(node: CitationNode): object {
  return {
    id: node.nodeId,
    type: node.nodeType === 'paper' ? 'article-journal' : 'webpage',
    title: node.title,
    author: node.authors.map((a) => {
      const parts = a.name.split(' ');
      return {
        family: parts.pop() || '',
        given: parts.join(' '),
      };
    }),
    issued: { 'date-parts': [[node.year]] },
    'container-title': node.venue,
    DOI: node.doi,
    URL: node.url,
    abstract: node.abstract,
  };
}

/**
 * Export multiple citations
 */
export function exportCitations(
  nodeIds: string[],
  format: ExportFormat['format']
): string {
  const selectedNodes = nodeIds
    .map((id) => nodes.get(id))
    .filter(Boolean) as CitationNode[];

  switch (format) {
    case 'bibtex':
      return selectedNodes.map(toBibTeX).join('\n\n');

    case 'ris':
      return selectedNodes.map(toRIS).join('\n');

    case 'csl-json':
      return JSON.stringify(selectedNodes.map(toCSLJSON), null, 2);

    case 'plain':
      return selectedNodes
        .map((n) => {
          const authors = n.authors.map((a) => a.name).join(', ');
          return `${authors} (${n.year}). ${n.title}. ${n.venue || ''} ${n.doi ? `DOI: ${n.doi}` : ''}`.trim();
        })
        .join('\n\n');

    default:
      return '';
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize our dataset as a citation node
 */
export function initializeOurDataset(): void {
  const ourDataset: CitationNode = {
    nodeId: OUR_DATASET_ID,
    nodeType: 'dataset',
    title: 'Free Crypto News API',
    authors: [
      {
        name: 'Free Crypto News Contributors',
        affiliations: ['Open Source Community'],
      },
    ],
    year: 2025,
    venue: 'GitHub',
    url: 'https://cryptocurrency.cv',
    abstract:
      'A comprehensive cryptocurrency news aggregation platform providing real-time news, market data, sentiment analysis, and research-ready datasets for academic and commercial use.',
    keywords: [
      'cryptocurrency',
      'news aggregation',
      'sentiment analysis',
      'market data',
      'blockchain',
      'dataset',
      'API',
    ],
    citationCount: 0,
    references: [],
    citedBy: [],
    metadata: {
      source: 'manual',
      openAccess: true,
      peerReviewed: false,
      language: 'en',
      fieldsOfStudy: [
        'Computer Science',
        'Finance',
        'Data Science',
        'Cryptocurrency',
      ],
      license: 'MIT',
    },
    addedAt: new Date(),
    updatedAt: new Date(),
  };

  graph.addNode(ourDataset);
}

/**
 * Get the citation graph instance
 */
export function getCitationGraph(): CitationGraph {
  return graph;
}

/**
 * Get our dataset node ID
 */
export function getOurDatasetId(): string {
  return OUR_DATASET_ID;
}

// Initialize on module load
initializeOurDataset();
