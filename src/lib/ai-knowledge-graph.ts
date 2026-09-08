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
 * AI Knowledge Graph Engine
 *
 * Builds and maintains a dynamic knowledge graph of the crypto ecosystem
 * by extracting entities and relationships from news articles.
 *
 * Entities: People, Projects, Companies, Tokens, Exchanges, Regulators, Events
 * Relationships: "invested_in", "partnered_with", "regulates", "competes_with",
 *                "founded", "launched", "sued", "acquired", "listed_on", etc.
 *
 * The graph evolves over time as new articles are ingested, enabling:
 * - "How is entity X connected to entity Y?"
 * - "What's the network around this project?"
 * - "Which entities are most central right now?"
 * - Emerging cluster detection
 * - Narrative propagation tracking
 *
 * @module lib/ai-knowledge-graph
 */

import { aiComplete, getAIConfigOrNull } from './ai-provider';
import { getLatestNews } from './crypto-news';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EntityType =
  | 'person'
  | 'project'
  | 'company'
  | 'token'
  | 'exchange'
  | 'regulator'
  | 'event'
  | 'technology'
  | 'concept';

export type RelationshipType =
  | 'invested_in'
  | 'partnered_with'
  | 'competes_with'
  | 'regulates'
  | 'regulated_by'
  | 'founded'
  | 'leads'
  | 'launched'
  | 'acquired'
  | 'merged_with'
  | 'listed_on'
  | 'delisted_from'
  | 'sued'
  | 'sued_by'
  | 'built_on'
  | 'forked_from'
  | 'integrated'
  | 'endorses'
  | 'opposes'
  | 'uses'
  | 'related_to';

export interface GraphEntity {
  id: string;
  name: string;
  type: EntityType;
  aliases: string[];
  description: string;
  sentiment: number; // -1 to 1
  mentions: number;
  firstSeen: string;
  lastSeen: string;
  properties: Record<string, string | number | boolean>;
}

export interface GraphRelationship {
  id: string;
  source: string; // entity id
  target: string; // entity id
  type: RelationshipType;
  weight: number; // 0-1 strength
  sentiment: number; // -1 to 1
  evidence: string[]; // article titles/URLs
  firstSeen: string;
  lastSeen: string;
  occurrences: number;
}

export interface KnowledgeGraphData {
  entities: GraphEntity[];
  relationships: GraphRelationship[];
  clusters: GraphCluster[];
  stats: GraphStats;
  lastUpdated: string;
}

export interface GraphCluster {
  id: string;
  label: string;
  entities: string[]; // entity ids
  theme: string;
  sentiment: number;
  centrality: number; // how important is this cluster
}

export interface GraphStats {
  totalEntities: number;
  totalRelationships: number;
  totalClusters: number;
  topEntities: { name: string; mentions: number; type: EntityType }[];
  strongestRelationships: { source: string; target: string; type: string; weight: number }[];
  articlesProcessed: number;
  lastIngestion: string;
}

export interface GraphQuery {
  entity?: string;
  entityType?: EntityType;
  depth?: number; // hops from center entity
  minMentions?: number;
  minRelationshipWeight?: number;
  timeRange?: { start: string; end: string };
}

// ---------------------------------------------------------------------------
// Knowledge Graph Store
// ---------------------------------------------------------------------------

class KnowledgeGraph {
  private entities: Map<string, GraphEntity> = new Map();
  private relationships: Map<string, GraphRelationship> = new Map();
  private articlesProcessed = 0;
  private lastIngestion = '';

  // Ingest entities and relationships from AI extraction
  ingestEntities(extracted: ExtractedGraphData, articleTitle: string) {
    const now = new Date().toISOString();

    // Upsert entities
    for (const entity of extracted.entities) {
      const id = this.normalizeId(entity.name);
      const existing = this.entities.get(id);

      if (existing) {
        existing.mentions++;
        existing.lastSeen = now;
        existing.sentiment = (existing.sentiment * (existing.mentions - 1) + entity.sentiment) / existing.mentions;
        if (!existing.aliases.includes(entity.name) && entity.name !== existing.name) {
          existing.aliases.push(entity.name);
        }
      } else {
        this.entities.set(id, {
          id,
          name: entity.name,
          type: entity.type,
          aliases: [],
          description: entity.description || '',
          sentiment: entity.sentiment || 0,
          mentions: 1,
          firstSeen: now,
          lastSeen: now,
          properties: entity.properties || {},
        });
      }
    }

    // Upsert relationships
    for (const rel of extracted.relationships) {
      const sourceId = this.normalizeId(rel.source);
      const targetId = this.normalizeId(rel.target);
      const relId = `${sourceId}-${rel.type}-${targetId}`;

      const existing = this.relationships.get(relId);

      if (existing) {
        existing.occurrences++;
        existing.weight = Math.min(1, existing.weight + 0.1);
        existing.lastSeen = now;
        if (!existing.evidence.includes(articleTitle)) {
          existing.evidence.push(articleTitle);
          existing.evidence = existing.evidence.slice(-10); // keep last 10
        }
      } else {
        // Only add if both entities exist
        if (this.entities.has(sourceId) && this.entities.has(targetId)) {
          this.relationships.set(relId, {
            id: relId,
            source: sourceId,
            target: targetId,
            type: rel.type,
            weight: rel.weight || 0.5,
            sentiment: rel.sentiment || 0,
            evidence: [articleTitle],
            firstSeen: now,
            lastSeen: now,
            occurrences: 1,
          });
        }
      }
    }

    this.articlesProcessed++;
    this.lastIngestion = now;
  }

  // Query the graph around a specific entity
  query(params: GraphQuery): KnowledgeGraphData {
    let filteredEntities = Array.from(this.entities.values());
    let filteredRelationships = Array.from(this.relationships.values());

    // Filter by entity
    if (params.entity) {
      const centerId = this.normalizeId(params.entity);
      const depth = params.depth || 2;
      const connectedIds = this.bfs(centerId, depth);
      filteredEntities = filteredEntities.filter(e => connectedIds.has(e.id));
      filteredRelationships = filteredRelationships.filter(
        r => connectedIds.has(r.source) && connectedIds.has(r.target)
      );
    }

    // Filter by type
    if (params.entityType) {
      filteredEntities = filteredEntities.filter(e => e.type === params.entityType);
      const entityIds = new Set(filteredEntities.map(e => e.id));
      filteredRelationships = filteredRelationships.filter(
        r => entityIds.has(r.source) || entityIds.has(r.target)
      );
    }

    // Filter by minimum mentions
    if (params.minMentions) {
      filteredEntities = filteredEntities.filter(e => e.mentions >= params.minMentions!);
    }

    // Filter by relationship weight
    if (params.minRelationshipWeight) {
      filteredRelationships = filteredRelationships.filter(
        r => r.weight >= params.minRelationshipWeight!
      );
    }

    // Time range filter
    if (params.timeRange) {
      filteredEntities = filteredEntities.filter(
        e => e.lastSeen >= params.timeRange!.start && e.firstSeen <= params.timeRange!.end
      );
    }

    const clusters = this.detectClusters(filteredEntities, filteredRelationships);

    return {
      entities: filteredEntities,
      relationships: filteredRelationships,
      clusters,
      stats: this.computeStats(filteredEntities, filteredRelationships),
      lastUpdated: this.lastIngestion,
    };
  }

  // BFS to find connected entities within N hops
  private bfs(startId: string, maxDepth: number): Set<string> {
    const visited = new Set<string>();
    const queue: { id: string; depth: number }[] = [{ id: startId, depth: 0 }];

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      if (visited.has(id) || depth > maxDepth) continue;
      visited.add(id);

      // Find all connected entities
      for (const rel of this.relationships.values()) {
        if (rel.source === id && !visited.has(rel.target)) {
          queue.push({ id: rel.target, depth: depth + 1 });
        }
        if (rel.target === id && !visited.has(rel.source)) {
          queue.push({ id: rel.source, depth: depth + 1 });
        }
      }
    }

    return visited;
  }

  // Simple community detection via connected components
  private detectClusters(
    entities: GraphEntity[],
    relationships: GraphRelationship[]
  ): GraphCluster[] {
    const entityIds = new Set(entities.map(e => e.id));
    const parent = new Map<string, string>();

    for (const id of entityIds) parent.set(id, id);

    const find = (x: string): string => {
      while (parent.get(x) !== x) {
        parent.set(x, parent.get(parent.get(x)!)!);
        x = parent.get(x)!;
      }
      return x;
    };

    const union = (a: string, b: string) => {
      const ra = find(a);
      const rb = find(b);
      if (ra !== rb) parent.set(ra, rb);
    };

    for (const rel of relationships) {
      if (entityIds.has(rel.source) && entityIds.has(rel.target)) {
        union(rel.source, rel.target);
      }
    }

    // Group by root
    const groups = new Map<string, string[]>();
    for (const id of entityIds) {
      const root = find(id);
      if (!groups.has(root)) groups.set(root, []);
      groups.get(root)!.push(id);
    }

    // Convert to clusters (only clusters with 2+ entities)
    return Array.from(groups.entries())
      .filter(([, members]) => members.length >= 2)
      .map(([_root, members], i) => {
        const clusterEntities = members
          .map(id => entities.find(e => e.id === id))
          .filter(Boolean) as GraphEntity[];

        const avgSentiment = clusterEntities.reduce((s, e) => s + e.sentiment, 0) / clusterEntities.length;
        const totalMentions = clusterEntities.reduce((s, e) => s + e.mentions, 0);

        // Theme = most common entity type in cluster
        const typeCounts = new Map<EntityType, number>();
        clusterEntities.forEach(e => typeCounts.set(e.type, (typeCounts.get(e.type) || 0) + 1));
        const dominantType = [...typeCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'concept';

        return {
          id: `cluster-${i}`,
          label: clusterEntities[0]?.name || `Cluster ${i + 1}`,
          entities: members,
          theme: dominantType,
          sentiment: avgSentiment,
          centrality: totalMentions,
        };
      })
      .sort((a, b) => b.centrality - a.centrality);
  }

  private computeStats(
    entities: GraphEntity[],
    relationships: GraphRelationship[]
  ): GraphStats {
    return {
      totalEntities: entities.length,
      totalRelationships: relationships.length,
      totalClusters: 0, // computed above
      topEntities: [...entities]
        .sort((a, b) => b.mentions - a.mentions)
        .slice(0, 10)
        .map(e => ({ name: e.name, mentions: e.mentions, type: e.type })),
      strongestRelationships: [...relationships]
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 10)
        .map(r => ({
          source: this.entities.get(r.source)?.name || r.source,
          target: this.entities.get(r.target)?.name || r.target,
          type: r.type,
          weight: r.weight,
        })),
      articlesProcessed: this.articlesProcessed,
      lastIngestion: this.lastIngestion,
    };
  }

  private normalizeId(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  getFullGraph(): KnowledgeGraphData {
    return this.query({});
  }
}

// ---------------------------------------------------------------------------
// AI Entity Extraction
// ---------------------------------------------------------------------------

interface ExtractedEntity {
  name: string;
  type: EntityType;
  description?: string;
  sentiment: number;
  properties?: Record<string, string | number | boolean>;
}

interface ExtractedRelationship {
  source: string;
  target: string;
  type: RelationshipType;
  weight: number;
  sentiment: number;
}

interface ExtractedGraphData {
  entities: ExtractedEntity[];
  relationships: ExtractedRelationship[];
}

async function extractGraphData(
  articles: { title: string; source: string; description?: string }[]
): Promise<ExtractedGraphData> {
  const config = getAIConfigOrNull();
  if (!config) {
    return { entities: [], relationships: [] };
  }

  const system = `You are a knowledge graph extraction engine for the cryptocurrency domain.

From the provided news articles, extract:
1. ENTITIES: People, projects, companies, tokens, exchanges, regulators, events, technologies
2. RELATIONSHIPS: How these entities relate to each other

OUTPUT JSON:
{
  "entities": [
    {
      "name": "Exact entity name",
      "type": "person"|"project"|"company"|"token"|"exchange"|"regulator"|"event"|"technology"|"concept",
      "description": "One-sentence description",
      "sentiment": -1 to 1 (how this entity is portrayed),
      "properties": { "ticker": "BTC", "market_cap": "1.5T", ... }
    }
  ],
  "relationships": [
    {
      "source": "Entity A name",
      "target": "Entity B name",
      "type": "invested_in"|"partnered_with"|"competes_with"|"regulates"|"regulated_by"|"founded"|"leads"|"launched"|"acquired"|"merged_with"|"listed_on"|"delisted_from"|"sued"|"sued_by"|"built_on"|"forked_from"|"integrated"|"endorses"|"opposes"|"uses"|"related_to",
      "weight": 0.0 to 1.0 (strength/confidence),
      "sentiment": -1 to 1
    }
  ]
}

RULES:
- Extract ALL entities and relationships visible in the articles
- Use consistent entity names (e.g., always "Bitcoin" not "BTC" for the project)
- Tokens get their own entity; the project gets a separate entity
- Be specific with relationship types
- Weight = how strong/clear the relationship is (0.3 = implied, 0.7 = stated, 1.0 = confirmed)
- Maximum 30 entities and 40 relationships per batch
- Respond ONLY with valid JSON`;

  const articlesText = articles
    .map((a, i) => `[${i + 1}] [${a.source}] ${a.title}${a.description ? '\n    ' + a.description : ''}`)
    .join('\n');

  try {
    const raw = await aiComplete(
      system,
      `Extract entities and relationships from these ${articles.length} articles:\n\n${articlesText}`,
      { maxTokens: 4000, temperature: 0.2, jsonMode: true }
    );

    const parsed = JSON.parse(raw);
    return {
      entities: parsed.entities || [],
      relationships: parsed.relationships || [],
    };
  } catch (error) {
    console.error('[Knowledge Graph] Extraction failed:', error);
    return { entities: [], relationships: [] };
  }
}

// ---------------------------------------------------------------------------
// Graph Instance + Management
// ---------------------------------------------------------------------------

let graphInstance: KnowledgeGraph | null = null;

export function getKnowledgeGraph(): KnowledgeGraph {
  if (!graphInstance) {
    graphInstance = new KnowledgeGraph();
  }
  return graphInstance;
}

/**
 * Ingest latest news into the knowledge graph.
 * Call this periodically (e.g., every 5 minutes) to keep the graph fresh.
 */
export async function ingestLatestNews(count = 20): Promise<{ articlesProcessed: number; entitiesFound: number; relationshipsFound: number }> {
  const graph = getKnowledgeGraph();
  const news = await getLatestNews(count);

  if (news.articles.length === 0) {
    return { articlesProcessed: 0, entitiesFound: 0, relationshipsFound: 0 };
  }

  const articles = news.articles.map(a => ({
    title: a.title,
    source: a.source,
    description: a.description,
  }));

  const extracted = await extractGraphData(articles);

  // Ingest each article's data
  for (const article of articles) {
    graph.ingestEntities(extracted, article.title);
  }

  return {
    articlesProcessed: articles.length,
    entitiesFound: extracted.entities.length,
    relationshipsFound: extracted.relationships.length,
  };
}

/**
 * Query the knowledge graph.
 */
export function queryKnowledgeGraph(params: GraphQuery): KnowledgeGraphData {
  return getKnowledgeGraph().query(params);
}

/**
 * Get the full knowledge graph for visualization.
 */
export function getFullKnowledgeGraph(): KnowledgeGraphData {
  return getKnowledgeGraph().getFullGraph();
}
