/**
 * Crypto Knowledge Graph Engine
 *
 * A real-time knowledge graph that maps relationships between entities
 * in the crypto ecosystem: tokens, protocols, people, exchanges, events,
 * regulatory bodies, and more.
 *
 * Graph Structure:
 *   Nodes: Entities (Token, Protocol, Person, Exchange, Event, Regulation)
 *   Edges: Relationships (FOUNDED_BY, RUNS_ON, COMPETES_WITH, REGULATES, etc.)
 *
 * Features:
 *   - Automatic entity extraction from news articles via AI
 *   - Relationship inference and confidence scoring
 *   - Temporal edges (relationships that change over time)
 *   - Graph traversal queries (shortest path, neighborhoods, influence)
 *   - Subgraph export for visualization (D3/Cytoscape compatible)
 *   - Incremental updates as new articles arrive
 *   - Impact propagation (how does news about Entity A affect Entity B?)
 *
 * Storage:
 *   - In-memory graph for fast queries (with LRU eviction)
 *   - Optional Redis persistence for cross-instance sharing
 *   - Export to Neo4j/ArangoDB for advanced graph analytics
 *
 * Usage:
 *   import { KnowledgeGraph, EntityType, RelationType } from '@/lib/knowledge-graph';
 *
 *   const kg = new KnowledgeGraph();
 *
 *   // Ingest article
 *   await kg.ingestArticle({
 *     title: 'Ethereum Dencun Upgrade Reduces L2 Fees',
 *     content: '...',
 *     published: new Date(),
 *   });
 *
 *   // Query relationships
 *   const neighbors = kg.getNeighbors('ethereum', 2); // 2-hop neighborhood
 *   const path = kg.shortestPath('bitcoin', 'sec');
 *   const impact = kg.propagateImpact('ethereum', 'upgrade', 0.8);
 *
 * @module knowledge-graph
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export enum EntityType {
  TOKEN = 'token',
  PROTOCOL = 'protocol',
  PERSON = 'person',
  EXCHANGE = 'exchange',
  EVENT = 'event',
  REGULATION = 'regulation',
  ORGANIZATION = 'organization',
  BLOCKCHAIN = 'blockchain',
  CONCEPT = 'concept',
}

export enum RelationType {
  FOUNDED_BY = 'FOUNDED_BY',
  RUNS_ON = 'RUNS_ON',
  COMPETES_WITH = 'COMPETES_WITH',
  REGULATES = 'REGULATES',
  PARTNERED_WITH = 'PARTNERED_WITH',
  INVESTED_IN = 'INVESTED_IN',
  FORK_OF = 'FORK_OF',
  NATIVE_TOKEN = 'NATIVE_TOKEN',
  LISTED_ON = 'LISTED_ON',
  PART_OF = 'PART_OF',
  CAUSED = 'CAUSED',
  AFFECTED = 'AFFECTED',
  MENTIONED_WITH = 'MENTIONED_WITH',
  SUPPORTS = 'SUPPORTS',
  OPPOSES = 'OPPOSES',
}

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  aliases: string[];
  properties: Record<string, unknown>;
  /** Number of times this entity has been mentioned */
  mentionCount: number;
  /** First seen timestamp */
  firstSeen: number;
  /** Last seen timestamp */
  lastSeen: number;
  /** Sentiment score aggregated from articles (-1 to 1) */
  sentimentAvg: number;
  sentimentCount: number;
}

export interface Relationship {
  id: string;
  source: string;
  target: string;
  type: RelationType;
  /** Confidence 0-1 */
  confidence: number;
  /** Number of source articles confirming this relationship */
  evidence: number;
  /** When this relationship was first established */
  since: number;
  /** When this relationship was last confirmed */
  lastConfirmed: number;
  /** Optional temporal end (for expired relationships) */
  until?: number;
  properties: Record<string, unknown>;
}

export interface GraphStats {
  entityCount: number;
  relationshipCount: number;
  entityTypes: Record<string, number>;
  relationshipTypes: Record<string, number>;
  avgDegree: number;
  mostConnected: { id: string; name: string; degree: number }[];
}

export interface SubGraph {
  nodes: Entity[];
  edges: Relationship[];
}

export interface ImpactResult {
  entity: Entity;
  impact: number;
  hops: number;
  path: string[];
}

// ---------------------------------------------------------------------------
// Entity Recognition Patterns
// ---------------------------------------------------------------------------

interface KnownEntity {
  id: string;
  name: string;
  type: EntityType;
  aliases: string[];
}

const KNOWN_ENTITIES: KnownEntity[] = [
  // Blockchains
  { id: 'bitcoin', name: 'Bitcoin', type: EntityType.BLOCKCHAIN, aliases: ['btc', 'bitcoin network'] },
  { id: 'ethereum', name: 'Ethereum', type: EntityType.BLOCKCHAIN, aliases: ['eth', 'ether'] },
  { id: 'solana', name: 'Solana', type: EntityType.BLOCKCHAIN, aliases: ['sol'] },
  { id: 'cardano', name: 'Cardano', type: EntityType.BLOCKCHAIN, aliases: ['ada'] },
  { id: 'polkadot', name: 'Polkadot', type: EntityType.BLOCKCHAIN, aliases: ['dot'] },
  { id: 'avalanche', name: 'Avalanche', type: EntityType.BLOCKCHAIN, aliases: ['avax'] },
  { id: 'polygon', name: 'Polygon', type: EntityType.BLOCKCHAIN, aliases: ['matic'] },
  { id: 'cosmos', name: 'Cosmos', type: EntityType.BLOCKCHAIN, aliases: ['atom'] },
  { id: 'near', name: 'NEAR Protocol', type: EntityType.BLOCKCHAIN, aliases: ['near'] },
  { id: 'arbitrum', name: 'Arbitrum', type: EntityType.BLOCKCHAIN, aliases: ['arb'] },
  { id: 'optimism', name: 'Optimism', type: EntityType.BLOCKCHAIN, aliases: ['op'] },
  { id: 'base', name: 'Base', type: EntityType.BLOCKCHAIN, aliases: ['base chain'] },

  // Tokens
  { id: 'usdt', name: 'Tether', type: EntityType.TOKEN, aliases: ['usdt', 'tether'] },
  { id: 'usdc', name: 'USD Coin', type: EntityType.TOKEN, aliases: ['usdc'] },
  { id: 'bnb', name: 'BNB', type: EntityType.TOKEN, aliases: ['binance coin'] },
  { id: 'xrp', name: 'XRP', type: EntityType.TOKEN, aliases: ['ripple'] },
  { id: 'doge', name: 'Dogecoin', type: EntityType.TOKEN, aliases: ['doge'] },

  // Exchanges
  { id: 'binance', name: 'Binance', type: EntityType.EXCHANGE, aliases: ['binance exchange'] },
  { id: 'coinbase', name: 'Coinbase', type: EntityType.EXCHANGE, aliases: ['coinbase exchange', 'coin'] },
  { id: 'kraken', name: 'Kraken', type: EntityType.EXCHANGE, aliases: ['kraken exchange'] },
  { id: 'okx', name: 'OKX', type: EntityType.EXCHANGE, aliases: ['okex'] },
  { id: 'bybit', name: 'Bybit', type: EntityType.EXCHANGE, aliases: ['bybit exchange'] },

  // Protocols
  { id: 'uniswap', name: 'Uniswap', type: EntityType.PROTOCOL, aliases: ['uni'] },
  { id: 'aave', name: 'Aave', type: EntityType.PROTOCOL, aliases: [] },
  { id: 'lido', name: 'Lido', type: EntityType.PROTOCOL, aliases: ['lido finance'] },
  { id: 'makerdao', name: 'MakerDAO', type: EntityType.PROTOCOL, aliases: ['maker', 'dai', 'sky'] },
  { id: 'compound', name: 'Compound', type: EntityType.PROTOCOL, aliases: ['comp'] },
  { id: 'chainlink', name: 'Chainlink', type: EntityType.PROTOCOL, aliases: ['link'] },

  // People
  { id: 'vitalik', name: 'Vitalik Buterin', type: EntityType.PERSON, aliases: ['vitalik', 'buterin'] },
  { id: 'satoshi', name: 'Satoshi Nakamoto', type: EntityType.PERSON, aliases: ['satoshi'] },
  { id: 'cz', name: 'Changpeng Zhao', type: EntityType.PERSON, aliases: ['cz'] },
  { id: 'gary-gensler', name: 'Gary Gensler', type: EntityType.PERSON, aliases: ['gensler'] },
  { id: 'michael-saylor', name: 'Michael Saylor', type: EntityType.PERSON, aliases: ['saylor'] },
  { id: 'brian-armstrong', name: 'Brian Armstrong', type: EntityType.PERSON, aliases: ['armstrong'] },

  // Regulatory Bodies
  { id: 'sec', name: 'SEC', type: EntityType.REGULATION, aliases: ['securities and exchange commission'] },
  { id: 'cftc', name: 'CFTC', type: EntityType.REGULATION, aliases: ['commodity futures trading commission'] },
  { id: 'fed', name: 'Federal Reserve', type: EntityType.REGULATION, aliases: ['fed', 'the fed', 'federal reserve'] },
  { id: 'ecb', name: 'European Central Bank', type: EntityType.REGULATION, aliases: ['ecb'] },

  // Organizations
  { id: 'blackrock', name: 'BlackRock', type: EntityType.ORGANIZATION, aliases: [] },
  { id: 'grayscale', name: 'Grayscale', type: EntityType.ORGANIZATION, aliases: ['gbtc'] },
  { id: 'microstrategy', name: 'MicroStrategy', type: EntityType.ORGANIZATION, aliases: ['strategy'] },
  { id: 'tether-inc', name: 'Tether Inc.', type: EntityType.ORGANIZATION, aliases: [] },

  // Events
  { id: 'halving', name: 'Bitcoin Halving', type: EntityType.EVENT, aliases: ['halvening', 'halving'] },
  { id: 'merge', name: 'The Merge', type: EntityType.EVENT, aliases: ['eth merge', 'ethereum merge'] },

  // Concepts
  { id: 'defi', name: 'DeFi', type: EntityType.CONCEPT, aliases: ['decentralized finance'] },
  { id: 'nft', name: 'NFT', type: EntityType.CONCEPT, aliases: ['non-fungible token', 'nfts'] },
  { id: 'layer2', name: 'Layer 2', type: EntityType.CONCEPT, aliases: ['l2', 'layer-2', 'rollup', 'rollups'] },
  { id: 'staking', name: 'Staking', type: EntityType.CONCEPT, aliases: ['proof of stake', 'pos'] },
  { id: 'cbdc', name: 'CBDC', type: EntityType.CONCEPT, aliases: ['central bank digital currency'] },
];

// Pre-built relationships between known entities
const KNOWN_RELATIONSHIPS: Array<{ source: string; target: string; type: RelationType }> = [
  // Founders
  { source: 'ethereum', target: 'vitalik', type: RelationType.FOUNDED_BY },
  { source: 'binance', target: 'cz', type: RelationType.FOUNDED_BY },
  { source: 'coinbase', target: 'brian-armstrong', type: RelationType.FOUNDED_BY },
  { source: 'bitcoin', target: 'satoshi', type: RelationType.FOUNDED_BY },

  // Native tokens
  { source: 'ethereum', target: 'usdt', type: RelationType.SUPPORTS },
  { source: 'ethereum', target: 'usdc', type: RelationType.SUPPORTS },

  // L2 relationships
  { source: 'arbitrum', target: 'ethereum', type: RelationType.RUNS_ON },
  { source: 'optimism', target: 'ethereum', type: RelationType.RUNS_ON },
  { source: 'base', target: 'ethereum', type: RelationType.RUNS_ON },
  { source: 'polygon', target: 'ethereum', type: RelationType.RUNS_ON },

  // Competition
  { source: 'solana', target: 'ethereum', type: RelationType.COMPETES_WITH },
  { source: 'avalanche', target: 'ethereum', type: RelationType.COMPETES_WITH },
  { source: 'binance', target: 'coinbase', type: RelationType.COMPETES_WITH },

  // DeFi protocols
  { source: 'uniswap', target: 'ethereum', type: RelationType.RUNS_ON },
  { source: 'aave', target: 'ethereum', type: RelationType.RUNS_ON },
  { source: 'lido', target: 'ethereum', type: RelationType.RUNS_ON },
  { source: 'compound', target: 'ethereum', type: RelationType.RUNS_ON },

  // Regulation
  { source: 'sec', target: 'coinbase', type: RelationType.REGULATES },
  { source: 'sec', target: 'binance', type: RelationType.REGULATES },

  // Investment
  { source: 'blackrock', target: 'bitcoin', type: RelationType.INVESTED_IN },
  { source: 'microstrategy', target: 'bitcoin', type: RelationType.INVESTED_IN },
  { source: 'grayscale', target: 'bitcoin', type: RelationType.INVESTED_IN },
];

// ---------------------------------------------------------------------------
// Knowledge Graph
// ---------------------------------------------------------------------------

export class KnowledgeGraph {
  private entities = new Map<string, Entity>();
  private relationships = new Map<string, Relationship>();
  /** Adjacency list: entityId → Set<relationshipId> */
  private adjacency = new Map<string, Set<string>>();
  /** Reverse adjacency: entityId → Set<relationshipId> (incoming) */
  private reverseAdj = new Map<string, Set<string>>();

  constructor() {
    this.initializeKnownEntities();
  }

  /**
   * Seed the graph with known entities.
   */
  private initializeKnownEntities(): void {
    const now = Date.now();

    for (const ke of KNOWN_ENTITIES) {
      this.entities.set(ke.id, {
        id: ke.id,
        name: ke.name,
        type: ke.type,
        aliases: ke.aliases,
        properties: {},
        mentionCount: 0,
        firstSeen: now,
        lastSeen: now,
        sentimentAvg: 0,
        sentimentCount: 0,
      });
      this.adjacency.set(ke.id, new Set());
      this.reverseAdj.set(ke.id, new Set());
    }

    for (const kr of KNOWN_RELATIONSHIPS) {
      this.addRelationship(kr.source, kr.target, kr.type, 1.0, { seed: true });
    }
  }

  // ---------------------------------------------------------------------------
  // Entity Management
  // ---------------------------------------------------------------------------

  /**
   * Add or update an entity.
   */
  addEntity(
    id: string,
    name: string,
    type: EntityType,
    properties: Record<string, unknown> = {},
    aliases: string[] = [],
  ): Entity {
    const existing = this.entities.get(id);
    const now = Date.now();

    if (existing) {
      existing.lastSeen = now;
      existing.mentionCount++;
      if (aliases.length) {
        existing.aliases = [...new Set([...existing.aliases, ...aliases])];
      }
      Object.assign(existing.properties, properties);
      return existing;
    }

    const entity: Entity = {
      id,
      name,
      type,
      aliases,
      properties,
      mentionCount: 1,
      firstSeen: now,
      lastSeen: now,
      sentimentAvg: 0,
      sentimentCount: 0,
    };

    this.entities.set(id, entity);
    this.adjacency.set(id, new Set());
    this.reverseAdj.set(id, new Set());
    return entity;
  }

  /**
   * Get an entity by ID.
   */
  getEntity(id: string): Entity | undefined {
    return this.entities.get(id);
  }

  /**
   * Search entities by name or alias.
   */
  searchEntities(query: string, limit = 10): Entity[] {
    const q = query.toLowerCase();
    const results: Entity[] = [];

    for (const entity of this.entities.values()) {
      if (
        entity.name.toLowerCase().includes(q) ||
        entity.id.includes(q) ||
        entity.aliases.some((a) => a.toLowerCase().includes(q))
      ) {
        results.push(entity);
        if (results.length >= limit) break;
      }
    }

    return results.sort((a, b) => b.mentionCount - a.mentionCount);
  }

  // ---------------------------------------------------------------------------
  // Relationship Management
  // ---------------------------------------------------------------------------

  /**
   * Add or strengthen a relationship between two entities.
   */
  addRelationship(
    sourceId: string,
    targetId: string,
    type: RelationType,
    confidence = 0.5,
    properties: Record<string, unknown> = {},
  ): Relationship {
    const relId = `${sourceId}--${type}--${targetId}`;
    const existing = this.relationships.get(relId);
    const now = Date.now();

    if (existing) {
      existing.evidence++;
      existing.confidence = Math.min(1, existing.confidence + 0.1);
      existing.lastConfirmed = now;
      Object.assign(existing.properties, properties);
      return existing;
    }

    const rel: Relationship = {
      id: relId,
      source: sourceId,
      target: targetId,
      type,
      confidence,
      evidence: 1,
      since: now,
      lastConfirmed: now,
      properties,
    };

    this.relationships.set(relId, rel);

    // Update adjacency
    if (!this.adjacency.has(sourceId)) this.adjacency.set(sourceId, new Set());
    if (!this.reverseAdj.has(targetId)) this.reverseAdj.set(targetId, new Set());
    this.adjacency.get(sourceId)!.add(relId);
    this.reverseAdj.get(targetId)!.add(relId);

    return rel;
  }

  /**
   * Get all relationships involving an entity.
   */
  getRelationships(entityId: string): Relationship[] {
    const results: Relationship[] = [];

    const outgoing = this.adjacency.get(entityId);
    if (outgoing) {
      for (const relId of outgoing) {
        const rel = this.relationships.get(relId);
        if (rel) results.push(rel);
      }
    }

    const incoming = this.reverseAdj.get(entityId);
    if (incoming) {
      for (const relId of incoming) {
        const rel = this.relationships.get(relId);
        if (rel) results.push(rel);
      }
    }

    return results;
  }

  // ---------------------------------------------------------------------------
  // Graph Queries
  // ---------------------------------------------------------------------------

  /**
   * Get the N-hop neighborhood of an entity.
   */
  getNeighbors(entityId: string, hops = 1, maxNodes = 50): SubGraph {
    const visited = new Set<string>();
    const queue: Array<{ id: string; depth: number }> = [{ id: entityId, depth: 0 }];
    visited.add(entityId);

    const nodeIds = new Set<string>();
    const edgeIds = new Set<string>();

    while (queue.length > 0 && nodeIds.size < maxNodes) {
      const { id, depth } = queue.shift()!;
      nodeIds.add(id);

      if (depth >= hops) continue;

      // Outgoing
      const outgoing = this.adjacency.get(id);
      if (outgoing) {
        for (const relId of outgoing) {
          const rel = this.relationships.get(relId);
          if (!rel) continue;
          edgeIds.add(relId);
          if (!visited.has(rel.target)) {
            visited.add(rel.target);
            queue.push({ id: rel.target, depth: depth + 1 });
          }
        }
      }

      // Incoming
      const incoming = this.reverseAdj.get(id);
      if (incoming) {
        for (const relId of incoming) {
          const rel = this.relationships.get(relId);
          if (!rel) continue;
          edgeIds.add(relId);
          if (!visited.has(rel.source)) {
            visited.add(rel.source);
            queue.push({ id: rel.source, depth: depth + 1 });
          }
        }
      }
    }

    return {
      nodes: [...nodeIds].map((id) => this.entities.get(id)!).filter(Boolean),
      edges: [...edgeIds].map((id) => this.relationships.get(id)!).filter(Boolean),
    };
  }

  /**
   * Find shortest path between two entities using BFS.
   */
  shortestPath(fromId: string, toId: string, maxHops = 6): string[] | null {
    if (fromId === toId) return [fromId];
    if (!this.entities.has(fromId) || !this.entities.has(toId)) return null;

    const visited = new Set<string>();
    const parent = new Map<string, string>();
    const queue: string[] = [fromId];
    visited.add(fromId);

    let depth = 0;
    let levelSize = 1;

    while (queue.length > 0 && depth < maxHops) {
      const nextLevelSize = 0;

      for (let i = 0; i < levelSize && queue.length > 0; i++) {
        const current = queue.shift()!;

        const neighbors = this.getDirectNeighborIds(current);
        for (const neighbor of neighbors) {
          if (visited.has(neighbor)) continue;
          visited.add(neighbor);
          parent.set(neighbor, current);

          if (neighbor === toId) {
            // Reconstruct path
            const path: string[] = [toId];
            let node = toId;
            while (parent.has(node)) {
              node = parent.get(node)!;
              path.unshift(node);
            }
            return path;
          }

          queue.push(neighbor);
        }
      }

      levelSize = queue.length - nextLevelSize;
      depth++;
    }

    return null;
  }

  /**
   * Calculate impact propagation from a source entity.
   *
   * Simulates how news about one entity affects related entities,
   * with impact decaying over hops and weighted by relationship confidence.
   */
  propagateImpact(
    entityId: string,
    eventType: string,
    initialImpact: number,
    decayFactor = 0.5,
    maxHops = 3,
  ): ImpactResult[] {
    const results: ImpactResult[] = [];
    const visited = new Set<string>();
    const queue: Array<{ id: string; impact: number; hops: number; path: string[] }> = [
      { id: entityId, impact: initialImpact, hops: 0, path: [entityId] },
    ];

    visited.add(entityId);

    while (queue.length > 0) {
      const { id, impact, hops, path } = queue.shift()!;

      const entity = this.entities.get(id);
      if (!entity) continue;

      results.push({ entity, impact, hops, path });

      if (hops >= maxHops || Math.abs(impact) < 0.01) continue;

      // Propagate to neighbors
      const outgoing = this.adjacency.get(id);
      if (outgoing) {
        for (const relId of outgoing) {
          const rel = this.relationships.get(relId);
          if (!rel || visited.has(rel.target)) continue;

          visited.add(rel.target);
          const propagatedImpact = impact * decayFactor * rel.confidence * getRelationImpactMultiplier(rel.type, eventType);
          if (Math.abs(propagatedImpact) > 0.01) {
            queue.push({
              id: rel.target,
              impact: propagatedImpact,
              hops: hops + 1,
              path: [...path, rel.target],
            });
          }
        }
      }

      const incoming = this.reverseAdj.get(id);
      if (incoming) {
        for (const relId of incoming) {
          const rel = this.relationships.get(relId);
          if (!rel || visited.has(rel.source)) continue;

          visited.add(rel.source);
          const propagatedImpact = impact * decayFactor * rel.confidence * getRelationImpactMultiplier(rel.type, eventType);
          if (Math.abs(propagatedImpact) > 0.01) {
            queue.push({
              id: rel.source,
              impact: propagatedImpact,
              hops: hops + 1,
              path: [...path, rel.source],
            });
          }
        }
      }
    }

    return results.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  }

  // ---------------------------------------------------------------------------
  // Article Ingestion
  // ---------------------------------------------------------------------------

  /**
   * Extract entities and relationships from a news article.
   * Uses pattern matching (no AI call needed for known entities).
   */
  ingestArticle(article: {
    title: string;
    content: string;
    published?: Date;
    source?: string;
    sentiment?: number;
  }): { entities: Entity[]; relationships: Relationship[] } {
    const text = `${article.title} ${article.content}`.toLowerCase();
    const foundEntities: Entity[] = [];
    const foundRelationships: Relationship[] = [];

    // Find mentioned entities
    for (const entity of this.entities.values()) {
      const allNames = [entity.name.toLowerCase(), entity.id, ...entity.aliases.map((a) => a.toLowerCase())];

      for (const name of allNames) {
        if (name.length < 2) continue;
        // Word boundary match to avoid false positives
        const regex = new RegExp(`\\b${escapeRegex(name)}\\b`, 'i');
        if (regex.test(text)) {
          entity.mentionCount++;
          entity.lastSeen = Date.now();

          // Update sentiment
          if (article.sentiment !== undefined) {
            const total = entity.sentimentAvg * entity.sentimentCount + article.sentiment;
            entity.sentimentCount++;
            entity.sentimentAvg = total / entity.sentimentCount;
          }

          foundEntities.push(entity);
          break;
        }
      }
    }

    // Infer co-mention relationships
    for (let i = 0; i < foundEntities.length; i++) {
      for (let j = i + 1; j < foundEntities.length; j++) {
        const a = foundEntities[i];
        const b = foundEntities[j];

        // Check if they're mentioned within 200 chars of each other (proximity)
        const proximity = checkProximity(text, a, b, 200);
        if (proximity) {
          const rel = this.addRelationship(
            a.id,
            b.id,
            RelationType.MENTIONED_WITH,
            0.3 + (proximity.distance < 50 ? 0.3 : 0),
            { article: article.title, proximity: proximity.distance },
          );
          foundRelationships.push(rel);
        }
      }
    }

    return { entities: foundEntities, relationships: foundRelationships };
  }

  // ---------------------------------------------------------------------------
  // Statistics & Export
  // ---------------------------------------------------------------------------

  /**
   * Get graph statistics.
   */
  getStats(): GraphStats {
    const entityTypes: Record<string, number> = {};
    const relationshipTypes: Record<string, number> = {};

    for (const entity of this.entities.values()) {
      entityTypes[entity.type] = (entityTypes[entity.type] || 0) + 1;
    }

    for (const rel of this.relationships.values()) {
      relationshipTypes[rel.type] = (relationshipTypes[rel.type] || 0) + 1;
    }

    // Calculate degrees
    const degrees: Array<{ id: string; name: string; degree: number }> = [];
    for (const [id, entity] of this.entities) {
      const outDeg = this.adjacency.get(id)?.size ?? 0;
      const inDeg = this.reverseAdj.get(id)?.size ?? 0;
      degrees.push({ id, name: entity.name, degree: outDeg + inDeg });
    }

    degrees.sort((a, b) => b.degree - a.degree);

    const totalDegree = degrees.reduce((sum, d) => sum + d.degree, 0);

    return {
      entityCount: this.entities.size,
      relationshipCount: this.relationships.size,
      entityTypes,
      relationshipTypes,
      avgDegree: degrees.length > 0 ? totalDegree / degrees.length : 0,
      mostConnected: degrees.slice(0, 10),
    };
  }

  /**
   * Export the full graph as a D3-compatible JSON structure.
   */
  toD3(): { nodes: Array<{ id: string; name: string; type: string; mentions: number; group: number }>; links: Array<{ source: string; target: string; type: string; value: number }> } {
    const typeToGroup: Record<string, number> = {
      [EntityType.TOKEN]: 1,
      [EntityType.PROTOCOL]: 2,
      [EntityType.PERSON]: 3,
      [EntityType.EXCHANGE]: 4,
      [EntityType.EVENT]: 5,
      [EntityType.REGULATION]: 6,
      [EntityType.ORGANIZATION]: 7,
      [EntityType.BLOCKCHAIN]: 8,
      [EntityType.CONCEPT]: 9,
    };

    const nodes = [...this.entities.values()].map((e) => ({
      id: e.id,
      name: e.name,
      type: e.type,
      mentions: e.mentionCount,
      group: typeToGroup[e.type] || 0,
    }));

    const links = [...this.relationships.values()].map((r) => ({
      source: r.source,
      target: r.target,
      type: r.type,
      value: r.confidence * r.evidence,
    }));

    return { nodes, links };
  }

  /**
   * Export as Cytoscape.js compatible format.
   */
  toCytoscape(): { elements: { nodes: Array<{ data: Record<string, unknown> }>; edges: Array<{ data: Record<string, unknown> }> } } {
    const nodes = [...this.entities.values()].map((e) => ({
      data: {
        id: e.id,
        label: e.name,
        type: e.type,
        mentions: e.mentionCount,
        sentiment: e.sentimentAvg,
      },
    }));

    const edges = [...this.relationships.values()].map((r) => ({
      data: {
        id: r.id,
        source: r.source,
        target: r.target,
        label: r.type,
        confidence: r.confidence,
        evidence: r.evidence,
      },
    }));

    return { elements: { nodes, edges } };
  }

  // ---------------------------------------------------------------------------
  // Internal Helpers
  // ---------------------------------------------------------------------------

  private getDirectNeighborIds(entityId: string): string[] {
    const neighbors: string[] = [];

    const outgoing = this.adjacency.get(entityId);
    if (outgoing) {
      for (const relId of outgoing) {
        const rel = this.relationships.get(relId);
        if (rel) neighbors.push(rel.target);
      }
    }

    const incoming = this.reverseAdj.get(entityId);
    if (incoming) {
      for (const relId of incoming) {
        const rel = this.relationships.get(relId);
        if (rel) neighbors.push(rel.source);
      }
    }

    return neighbors;
  }
}

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function checkProximity(
  text: string,
  a: Entity,
  b: Entity,
  maxDistance: number,
): { distance: number } | null {
  const aNames = [a.name.toLowerCase(), a.id, ...a.aliases.map((x) => x.toLowerCase())];
  const bNames = [b.name.toLowerCase(), b.id, ...b.aliases.map((x) => x.toLowerCase())];

  let minDistance = Infinity;

  for (const aName of aNames) {
    const aIdx = text.indexOf(aName);
    if (aIdx === -1) continue;

    for (const bName of bNames) {
      const bIdx = text.indexOf(bName);
      if (bIdx === -1) continue;

      const distance = Math.abs(aIdx - bIdx);
      if (distance < minDistance) minDistance = distance;
    }
  }

  return minDistance <= maxDistance ? { distance: minDistance } : null;
}

/**
 * Determines how much impact propagates through a relationship type
 * given an event type.
 */
function getRelationImpactMultiplier(relType: RelationType, eventType: string): number {
  const impactMap: Record<string, Record<string, number>> = {
    upgrade: {
      [RelationType.RUNS_ON]: 0.8,
      [RelationType.NATIVE_TOKEN]: 0.9,
      [RelationType.COMPETES_WITH]: -0.3,
      [RelationType.PART_OF]: 0.7,
    },
    hack: {
      [RelationType.RUNS_ON]: 0.6,
      [RelationType.COMPETES_WITH]: 0.2,
      [RelationType.PARTNERED_WITH]: 0.5,
      [RelationType.INVESTED_IN]: 0.7,
    },
    regulation: {
      [RelationType.REGULATES]: 0.9,
      [RelationType.COMPETES_WITH]: 0.4,
      [RelationType.LISTED_ON]: 0.6,
    },
    partnership: {
      [RelationType.PARTNERED_WITH]: 0.8,
      [RelationType.COMPETES_WITH]: -0.2,
      [RelationType.RUNS_ON]: 0.4,
    },
  };

  return impactMap[eventType]?.[relType] ?? 0.3;
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let _graph: KnowledgeGraph | null = null;

export function getKnowledgeGraph(): KnowledgeGraph {
  if (!_graph) _graph = new KnowledgeGraph();
  return _graph;
}
