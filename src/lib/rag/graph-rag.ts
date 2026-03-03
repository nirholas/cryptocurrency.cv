/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * Graph RAG — Knowledge Graph Enhanced Retrieval
 *
 * Integrates the existing KnowledgeGraph engine with the RAG pipeline
 * to provide entity-aware, relationship-traversal retrieval that
 * captures connections standard vector search misses.
 *
 * Capabilities:
 *   - Entity extraction from queries to anchor graph lookups
 *   - N-hop neighborhood expansion for broader context
 *   - Relationship-aware document boosting
 *   - Impact propagation scoring (how does entity A affect entity B?)
 *   - Combined vector + graph retrieval with configurable fusion
 *   - Entity-linked context injection for better LLM answers
 *
 * Architecture:
 *   Query → extract entities → graph traversal → entity-linked docs
 *         → merge with vector results (RRF/weighted) → rerank → answer
 *
 * Usage:
 *   import { graphRAG, GraphRAGService } from '@/lib/rag/graph-rag';
 *
 *   // Simple usage
 *   const results = await graphRAG.search("How are Bitcoin and Ethereum related?");
 *
 *   // Full pipeline usage
 *   const answer = await graphRAG.ask("What impact does SEC regulation have on Coinbase?", {
 *     maxHops: 2,
 *     combineWithVector: true,
 *     fusionWeight: 0.3,
 *   });
 *
 * @module graph-rag
 */

import {
  getKnowledgeGraph,
  type KnowledgeGraph,
  type Entity,
  type Relationship,
  type SubGraph,
  type ImpactResult,
  type RelationType,
} from "@/lib/knowledge-graph";
import { hybridSearch } from "./hybrid-search";
import { ragLogger } from "./observability";
import type { ScoredDocument, SearchFilter, SearchResult } from "./types";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface GraphRAGOptions {
  /** Maximum hops for neighborhood traversal (default: 2) */
  maxHops?: number;
  /** Merge graph results with vector search results (default: true) */
  combineWithVector?: boolean;
  /** Weight of graph results in fusion: 0 = vector only, 1 = graph only (default: 0.3) */
  fusionWeight?: number;
  /** Max entities to extract from query (default: 5) */
  maxEntities?: number;
  /** Minimum confidence for relationships to traverse (default: 0.2) */
  minRelationshipConfidence?: number;
  /** Maximum nodes to explore in graph traversal (default: 50) */
  maxNodes?: number;
  /** Include impact propagation analysis (default: false) */
  useImpactPropagation?: boolean;
  /** Include entity context in the assembled answer (default: true) */
  injectEntityContext?: boolean;
  /** Search filters (date, currencies, etc.) */
  filter?: SearchFilter;
  /** Number of results to return (default: 10) */
  limit?: number;
  /** Minimum similarity threshold (default: 0.4) */
  similarityThreshold?: number;
}

export interface GraphSearchResult {
  /** Merged + ranked documents */
  documents: ScoredDocument[];
  /** Entities extracted from the query */
  queryEntities: Entity[];
  /** Subgraph neighborhood explored */
  subgraph: SubGraph;
  /** Impact analysis (if enabled) */
  impactResults?: ImpactResult[];
  /** Entity context string for LLM injection */
  entityContext: string;
  /** Metadata about the search */
  metadata: {
    graphDocsFound: number;
    vectorDocsFound: number;
    mergedTotal: number;
    entitiesExtracted: number;
    relationshipsTraversed: number;
    hopsUsed: number;
    fusionWeight: number;
  };
}

export interface GraphEntityMatch {
  entity: Entity;
  /** How the entity was matched (exact, alias, fuzzy) */
  matchType: "exact" | "alias" | "fuzzy";
  /** Position in the query string */
  position: number;
  /** The matching text fragment */
  matchedText: string;
}

// ═══════════════════════════════════════════════════════════════
// GRAPH RAG SERVICE
// ═══════════════════════════════════════════════════════════════

export class GraphRAGService {
  private graph: KnowledgeGraph;

  constructor(graph?: KnowledgeGraph) {
    this.graph = graph ?? getKnowledgeGraph();
  }

  // ─────────────────────────────────────────────────────────────
  // ENTITY EXTRACTION
  // ─────────────────────────────────────────────────────────────

  /**
   * Extract entity mentions from a query string.
   *
   * Uses the knowledge graph's entity registry (names + aliases) to
   * identify entities referenced in the user's question.
   */
  extractEntities(query: string, maxEntities = 5): GraphEntityMatch[] {
    const q = query.toLowerCase();
    const matches: GraphEntityMatch[] = [];

    // Get all entities from the graph
    const allEntities = this.graph.searchEntities("", 1000);

    for (const entity of allEntities) {
      // Try exact name match first
      const nameLower = entity.name.toLowerCase();
      let idx = q.indexOf(nameLower);
      if (idx !== -1) {
        matches.push({
          entity,
          matchType: "exact",
          position: idx,
          matchedText: entity.name,
        });
        continue;
      }

      // Try ID match
      idx = q.indexOf(entity.id);
      if (idx !== -1 && isWordBoundary(q, idx, entity.id.length)) {
        matches.push({
          entity,
          matchType: "exact",
          position: idx,
          matchedText: entity.id,
        });
        continue;
      }

      // Try aliases
      for (const alias of entity.aliases) {
        if (alias.length < 2) continue;
        const aliasLower = alias.toLowerCase();
        idx = q.indexOf(aliasLower);
        if (idx !== -1 && isWordBoundary(q, idx, aliasLower.length)) {
          matches.push({
            entity,
            matchType: "alias",
            position: idx,
            matchedText: alias,
          });
          break;
        }
      }
    }

    // Deduplicate by entity ID and sort by position
    const seen = new Set<string>();
    const deduped = matches.filter((m) => {
      if (seen.has(m.entity.id)) return false;
      seen.add(m.entity.id);
      return true;
    });

    // Prefer exact matches, then sort by position
    deduped.sort((a, b) => {
      if (a.matchType !== b.matchType) {
        const order = { exact: 0, alias: 1, fuzzy: 2 };
        return order[a.matchType] - order[b.matchType];
      }
      return a.position - b.position;
    });

    return deduped.slice(0, maxEntities);
  }

  // ─────────────────────────────────────────────────────────────
  // GRAPH TRAVERSAL
  // ─────────────────────────────────────────────────────────────

  /**
   * Explore the graph neighborhood around extracted entities.
   *
   * Returns a subgraph containing all entities and relationships
   * within N hops of the query entities.
   */
  exploreNeighborhood(
    entities: Entity[],
    maxHops = 2,
    maxNodes = 50,
    minConfidence = 0.2,
  ): SubGraph {
    const allNodes = new Map<string, Entity>();
    const allEdges = new Map<string, Relationship>();

    for (const entity of entities) {
      const sub = this.graph.getNeighbors(entity.id, maxHops, maxNodes);

      for (const node of sub.nodes) {
        allNodes.set(node.id, node);
      }

      for (const edge of sub.edges) {
        if (edge.confidence >= minConfidence) {
          allEdges.set(edge.id, edge);
        }
      }
    }

    return {
      nodes: [...allNodes.values()],
      edges: [...allEdges.values()],
    };
  }

  /**
   * Build entity context text for LLM injection.
   *
   * Produces a structured summary of the entities and their
   * relationships that can be prepended to the RAG context for
   * richer answers.
   */
  buildEntityContext(
    entities: Entity[],
    subgraph: SubGraph,
    impactResults?: ImpactResult[],
  ): string {
    if (entities.length === 0) return "";

    const lines: string[] = ["## Entity Context"];

    // Entity summaries
    for (const entity of entities) {
      const rels = this.graph.getRelationships(entity.id);
      const relSummaries = rels.slice(0, 5).map((r) => {
        const other = r.source === entity.id ? r.target : r.source;
        const otherEntity = this.graph.getEntity(other);
        const direction = r.source === entity.id ? "→" : "←";
        return `  ${direction} ${formatRelationType(r.type)} ${otherEntity?.name ?? other} (confidence: ${(r.confidence * 100).toFixed(0)}%)`;
      });

      lines.push(
        `\n### ${entity.name} (${entity.type})`,
        `Mentions: ${entity.mentionCount} | Sentiment: ${entity.sentimentAvg >= 0 ? "+" : ""}${entity.sentimentAvg.toFixed(2)}`,
      );

      if (relSummaries.length > 0) {
        lines.push("Relationships:", ...relSummaries);
      }
    }

    // Shortest paths between query entities
    if (entities.length >= 2) {
      lines.push("\n### Entity Connections");
      for (let i = 0; i < entities.length - 1; i++) {
        for (let j = i + 1; j < entities.length; j++) {
          const path = this.graph.shortestPath(entities[i].id, entities[j].id);
          if (path && path.length > 1) {
            const pathNames = path.map(
              (id) => this.graph.getEntity(id)?.name ?? id,
            );
            lines.push(
              `${entities[i].name} ↔ ${entities[j].name}: ${pathNames.join(" → ")}`,
            );
          }
        }
      }
    }

    // Impact propagation
    if (impactResults && impactResults.length > 0) {
      lines.push("\n### Impact Propagation");
      for (const ir of impactResults.slice(0, 8)) {
        if (ir.hops === 0) continue; // Skip the source entity
        const sign = ir.impact >= 0 ? "+" : "";
        lines.push(
          `  ${ir.entity.name}: ${sign}${(ir.impact * 100).toFixed(1)}% impact (${ir.hops} hops, path: ${ir.path.join(" → ")})`,
        );
      }
    }

    return lines.join("\n");
  }

  // ─────────────────────────────────────────────────────────────
  // GRAPH-ENHANCED SEARCH
  // ─────────────────────────────────────────────────────────────

  /**
   * Search using graph-enhanced retrieval.
   *
   * 1. Extract entities from the query
   * 2. Explore graph neighborhood
   * 3. Build entity-expanded search query
   * 4. Perform vector search with expanded query
   * 5. Boost documents that mention graph-relevant entities
   * 6. Optionally merge with standard vector search via RRF
   */
  async search(
    query: string,
    options: GraphRAGOptions = {},
  ): Promise<GraphSearchResult> {
    const {
      maxHops = 2,
      combineWithVector = true,
      fusionWeight = 0.3,
      maxEntities = 5,
      minRelationshipConfidence = 0.2,
      maxNodes = 50,
      useImpactPropagation = false,
      injectEntityContext = true,
      filter,
      limit = 10,
      similarityThreshold = 0.4,
    } = options;

    ragLogger.debug("GraphRAG search started", undefined, {
      query,
      maxHops,
      fusionWeight,
    });

    // Step 1: Extract entities
    const entityMatches = this.extractEntities(query, maxEntities);
    const queryEntities = entityMatches.map((m) => m.entity);

    ragLogger.debug("Entities extracted", undefined, {
      count: queryEntities.length,
      entities: queryEntities.map((e) => e.name),
    });

    // If no entities found, fall back to pure vector search
    if (queryEntities.length === 0) {
      const vectorResults = await hybridSearch(query, {
        topK: limit,
        filter,
        similarityThreshold,
      });

      return {
        documents: toScoredDocuments(vectorResults),
        queryEntities: [],
        subgraph: { nodes: [], edges: [] },
        entityContext: "",
        metadata: {
          graphDocsFound: 0,
          vectorDocsFound: vectorResults.length,
          mergedTotal: vectorResults.length,
          entitiesExtracted: 0,
          relationshipsTraversed: 0,
          hopsUsed: 0,
          fusionWeight: 0,
        },
      };
    }

    // Step 2: Explore graph neighborhood
    const subgraph = this.exploreNeighborhood(
      queryEntities,
      maxHops,
      maxNodes,
      minRelationshipConfidence,
    );

    // Step 3: Impact propagation (optional)
    let impactResults: ImpactResult[] | undefined;
    if (useImpactPropagation && queryEntities.length > 0) {
      impactResults = this.graph.propagateImpact(
        queryEntities[0].id,
        inferEventType(query),
        0.8,
        0.5,
        maxHops,
      );
    }

    // Step 4: Build expanded query using related entity names
    const relatedEntityNames = subgraph.nodes
      .filter((n) => !queryEntities.some((qe) => qe.id === n.id))
      .sort((a, b) => b.mentionCount - a.mentionCount)
      .slice(0, 5)
      .map((n) => n.name);

    const expandedQuery =
      relatedEntityNames.length > 0
        ? `${query} (related: ${relatedEntityNames.join(", ")})`
        : query;

    // Step 5: Graph-enhanced vector search
    const graphSearchResults = await hybridSearch(expandedQuery, {
      topK: limit * 2,
      filter,
      similarityThreshold: similarityThreshold * 0.8, // Slightly lower threshold for expanded query
    });

    // Step 6: Boost documents mentioning graph entities
    const _graphEntityIds = new Set(subgraph.nodes.map((n) => n.id));
    const graphEntityNames = new Set(
      subgraph.nodes.flatMap((n) => [
        n.name.toLowerCase(),
        n.id,
        ...n.aliases.map((a) => a.toLowerCase()),
      ]),
    );

    const boostedGraphResults = graphSearchResults.map((r) => {
      const text =
        `${r.document.metadata.title} ${r.document.content}`.toLowerCase();
      let boost = 0;

      for (const name of graphEntityNames) {
        if (name.length >= 2 && text.includes(name)) {
          boost += 0.05;
        }
      }

      // Cap the boost
      const finalScore = Math.min(1, r.score + Math.min(boost, 0.2));
      return { ...r, score: finalScore };
    });

    // Step 7: Merge with standard vector search if requested
    let mergedResults: SearchResult[];
    let vectorDocsFound = 0;

    if (combineWithVector) {
      const pureVectorResults = await hybridSearch(query, {
        topK: limit * 2,
        filter,
        similarityThreshold,
      });
      vectorDocsFound = pureVectorResults.length;

      mergedResults = reciprocalRankFusion(
        boostedGraphResults,
        pureVectorResults,
        fusionWeight,
      );
    } else {
      mergedResults = boostedGraphResults;
    }

    // Step 8: Deduplicate and trim
    const seen = new Set<string>();
    const dedupedResults = mergedResults.filter((r) => {
      if (seen.has(r.document.id)) return false;
      seen.add(r.document.id);
      return true;
    });

    const finalDocs = toScoredDocuments(dedupedResults.slice(0, limit));

    // Step 9: Build entity context
    const entityContext = injectEntityContext
      ? this.buildEntityContext(queryEntities, subgraph, impactResults)
      : "";

    ragLogger.debug("GraphRAG search completed", undefined, {
      graphDocs: boostedGraphResults.length,
      vectorDocs: vectorDocsFound,
      merged: finalDocs.length,
    });

    return {
      documents: finalDocs,
      queryEntities,
      subgraph,
      impactResults,
      entityContext,
      metadata: {
        graphDocsFound: boostedGraphResults.length,
        vectorDocsFound,
        mergedTotal: finalDocs.length,
        entitiesExtracted: queryEntities.length,
        relationshipsTraversed: subgraph.edges.length,
        hopsUsed: maxHops,
        fusionWeight,
      },
    };
  }

  /**
   * Ingest a document into the knowledge graph.
   *
   * Extracts entities and relationships from the document content
   * and adds them to the graph. Should be called when new documents
   * are indexed into the vector store.
   */
  ingestDocument(doc: ScoredDocument): {
    entities: Entity[];
    relationships: Relationship[];
  } {
    return this.graph.ingestArticle({
      title: doc.title,
      content: doc.content,
      published: doc.publishedAt,
      source: doc.source,
    });
  }

  /**
   * Get graph stats for monitoring/metrics.
   */
  getStats() {
    return this.graph.getStats();
  }

  /**
   * Get the underlying knowledge graph instance.
   */
  getGraph(): KnowledgeGraph {
    return this.graph;
  }
}

// ═══════════════════════════════════════════════════════════════
// FUSION & HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Reciprocal Rank Fusion to merge two ranked result lists.
 *
 * @param graphResults  Results from graph-enhanced search
 * @param vectorResults Results from standard vector search
 * @param graphWeight   Weight of graph results (0–1)
 * @param k             RRF constant (default: 60)
 */
function reciprocalRankFusion(
  graphResults: SearchResult[],
  vectorResults: SearchResult[],
  graphWeight: number,
  k = 60,
): SearchResult[] {
  const vectorWeight = 1 - graphWeight;
  const scoreMap = new Map<string, { result: SearchResult; score: number }>();

  // Score graph results
  graphResults.forEach((r, rank) => {
    const rrfScore = graphWeight / (k + rank + 1);
    const entry = scoreMap.get(r.document.id);
    if (entry) {
      entry.score += rrfScore;
    } else {
      scoreMap.set(r.document.id, { result: r, score: rrfScore });
    }
  });

  // Score vector results
  vectorResults.forEach((r, rank) => {
    const rrfScore = vectorWeight / (k + rank + 1);
    const entry = scoreMap.get(r.document.id);
    if (entry) {
      entry.score += rrfScore;
    } else {
      scoreMap.set(r.document.id, { result: r, score: rrfScore });
    }
  });

  return [...scoreMap.values()]
    .sort((a, b) => b.score - a.score)
    .map((entry) => ({
      ...entry.result,
      score: entry.score,
    }));
}

/**
 * Check if a match at the given position is on a word boundary.
 */
function isWordBoundary(text: string, start: number, length: number): boolean {
  const before = start > 0 ? text[start - 1] : " ";
  const after = start + length < text.length ? text[start + length] : " ";
  return /\W/.test(before) && /\W/.test(after);
}

/**
 * Infer the event type from a query for impact propagation.
 */
function inferEventType(query: string): string {
  const q = query.toLowerCase();
  if (/regulat|sec |cftc|ban|law|compli/i.test(q)) return "regulation";
  if (/hack|exploit|breach|attack|drain/i.test(q)) return "hack";
  if (/partner|collab|integrat|alliance/i.test(q)) return "partnership";
  if (/upgrad|fork|update|v2|dencun|pectra/i.test(q)) return "upgrade";
  return "general";
}

/**
 * Format a RelationType enum into readable text.
 */
function formatRelationType(type: RelationType): string {
  return type.replace(/_/g, " ").toLowerCase();
}

/**
 * Convert SearchResult[] to ScoredDocument[].
 */
function toScoredDocuments(results: SearchResult[]): ScoredDocument[] {
  return results.map((r) => ({
    id: r.document.id,
    title: r.document.metadata.title,
    content: r.document.content,
    publishedAt: new Date(r.document.metadata.pubDate),
    source: r.document.metadata.source,
    url: r.document.metadata.url,
    voteScore: r.document.metadata.voteScore,
    score: r.score,
  }));
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON
// ═══════════════════════════════════════════════════════════════

let _graphRAGService: GraphRAGService | null = null;

export function getGraphRAGService(): GraphRAGService {
  if (!_graphRAGService) {
    _graphRAGService = new GraphRAGService();
  }
  return _graphRAGService;
}

export const graphRAG = getGraphRAGService();
