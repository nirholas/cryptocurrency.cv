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
 * Unit tests for Graph RAG — Knowledge Graph Enhanced Retrieval
 *
 * Tests entity extraction, graph traversal, entity context building,
 * RRF fusion, and the full graph-enhanced search pipeline.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GraphRAGService } from "@/lib/rag/graph-rag";
import { KnowledgeGraph } from "@/lib/knowledge-graph";

// ═══════════════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════════════

vi.mock("@/lib/rag/embedding-service", () => ({
  generateEmbedding: vi.fn().mockResolvedValue(new Array(384).fill(0.1)),
}));

vi.mock("@/lib/rag/hybrid-search", () => ({
  hybridSearch: vi.fn().mockResolvedValue([
    {
      document: {
        id: "doc-1",
        content: "Bitcoin ETF approved by SEC, market surges.",
        metadata: {
          title: "Bitcoin ETF Approved",
          pubDate: "2024-01-10",
          url: "https://example.com/btc-etf",
          source: "CoinDesk",
          voteScore: 42,
        },
      },
      score: 0.92,
    },
    {
      document: {
        id: "doc-2",
        content: "Ethereum Dencun upgrade reduces L2 fees significantly.",
        metadata: {
          title: "Ethereum Dencun Upgrade",
          pubDate: "2024-03-13",
          url: "https://example.com/eth-dencun",
          source: "The Block",
          voteScore: 38,
        },
      },
      score: 0.85,
    },
  ]),
}));

vi.mock("@/lib/rag/observability", () => ({
  ragLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// ═══════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════

describe("GraphRAGService", () => {
  let service: GraphRAGService;
  let graph: KnowledgeGraph;

  beforeEach(() => {
    graph = new KnowledgeGraph();
    service = new GraphRAGService(graph);
  });

  // ─────────────────────────────────────────────────────────────
  // Entity Extraction
  // ─────────────────────────────────────────────────────────────

  describe("extractEntities", () => {
    it("extracts known entities by name", () => {
      const matches = service.extractEntities(
        "What is happening with Bitcoin?",
      );
      expect(matches.length).toBeGreaterThan(0);
      expect(matches.some((m) => m.entity.id === "bitcoin")).toBe(true);
    });

    it("extracts entities by alias", () => {
      const matches = service.extractEntities("How is ETH performing?");
      expect(matches.some((m) => m.entity.id === "ethereum")).toBe(true);
    });

    it("extracts multiple entities", () => {
      const matches = service.extractEntities("Bitcoin vs Ethereum comparison");
      const ids = matches.map((m) => m.entity.id);
      expect(ids).toContain("bitcoin");
      expect(ids).toContain("ethereum");
    });

    it("respects maxEntities limit", () => {
      const matches = service.extractEntities(
        "Bitcoin Ethereum Solana Cardano Polkadot Avalanche Polygon",
        3,
      );
      expect(matches.length).toBeLessThanOrEqual(3);
    });

    it("returns empty array for no matches", () => {
      const matches = service.extractEntities("What is quantum computing?");
      expect(matches.length).toBe(0);
    });

    it("prefers exact matches over alias matches", () => {
      const matches = service.extractEntities("Ethereum is better than eth");
      const ethMatch = matches.find((m) => m.entity.id === "ethereum");
      expect(ethMatch).toBeDefined();
      expect(ethMatch?.matchType).toBe("exact");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Neighborhood Exploration
  // ─────────────────────────────────────────────────────────────

  describe("exploreNeighborhood", () => {
    it("returns subgraph around an entity", () => {
      const eth = graph.getEntity("ethereum");
      if (!eth) throw new Error("Expected entity");
      const subgraph = service.exploreNeighborhood([eth], 1, 50);

      expect(subgraph.nodes.length).toBeGreaterThan(0);
      expect(subgraph.nodes.some((n) => n.id === "ethereum")).toBe(true);
    });

    it("finds related entities within hops", () => {
      const eth = graph.getEntity("ethereum");
      if (!eth) throw new Error("Expected entity");
      const subgraph = service.exploreNeighborhood([eth], 2, 100);

      // Ethereum should connect to Vitalik (via FOUNDED_BY), L2s, etc.
      const nodeIds = subgraph.nodes.map((n) => n.id);
      expect(nodeIds).toContain("vitalik");
    });

    it("filters by confidence threshold", () => {
      const btc = graph.getEntity("bitcoin");
      if (!btc) throw new Error("Expected entity");

      const lowConf = service.exploreNeighborhood([btc], 1, 50, 0.0);
      const highConf = service.exploreNeighborhood([btc], 1, 50, 0.99);

      expect(highConf.edges.length).toBeLessThanOrEqual(lowConf.edges.length);
    });

    it("combines neighborhoods for multiple entities", () => {
      const btc = graph.getEntity("bitcoin");
      const eth = graph.getEntity("ethereum");
      if (!btc || !eth) throw new Error("Expected entities");
      const combined = service.exploreNeighborhood([btc, eth], 1, 100);

      expect(combined.nodes.some((n) => n.id === "bitcoin")).toBe(true);
      expect(combined.nodes.some((n) => n.id === "ethereum")).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Entity Context Building
  // ─────────────────────────────────────────────────────────────

  describe("buildEntityContext", () => {
    it("builds context string with entity information", () => {
      const eth = graph.getEntity("ethereum");
      if (!eth) throw new Error("Expected entity");
      const subgraph = service.exploreNeighborhood([eth], 1);
      const context = service.buildEntityContext([eth], subgraph);

      expect(context).toContain("Entity Context");
      expect(context).toContain("Ethereum");
    });

    it("includes shortest paths between multiple entities", () => {
      const btc = graph.getEntity("bitcoin");
      const sec = graph.getEntity("sec");
      if (!btc || !sec) throw new Error("Expected entities");
      const subgraph = service.exploreNeighborhood([btc, sec], 2);
      const context = service.buildEntityContext([btc, sec], subgraph);

      expect(context).toContain("Entity Connections");
    });

    it("returns empty string for no entities", () => {
      const context = service.buildEntityContext([], { nodes: [], edges: [] });
      expect(context).toBe("");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Full Search Pipeline
  // ─────────────────────────────────────────────────────────────

  describe("search", () => {
    it("returns results with entity metadata", async () => {
      const result = await service.search("What is happening with Bitcoin?");

      expect(result.documents.length).toBeGreaterThan(0);
      expect(result.queryEntities.length).toBeGreaterThan(0);
      expect(result.metadata.entitiesExtracted).toBeGreaterThan(0);
    });

    it("falls back to vector search when no entities found", async () => {
      const result = await service.search("What is quantum computing?");

      expect(result.documents.length).toBeGreaterThan(0);
      expect(result.queryEntities.length).toBe(0);
      expect(result.metadata.graphDocsFound).toBe(0);
    });

    it("merges graph and vector results when combineWithVector is true", async () => {
      const result = await service.search("Bitcoin regulation", {
        combineWithVector: true,
      });

      expect(result.metadata.vectorDocsFound).toBeGreaterThan(0);
    });

    it("respects fusionWeight option", async () => {
      const result = await service.search("Ethereum DeFi", {
        fusionWeight: 0.8,
      });

      expect(result.metadata.fusionWeight).toBe(0.8);
    });

    it("generates entity context", async () => {
      const result = await service.search("Bitcoin and SEC", {
        injectEntityContext: true,
      });

      if (result.queryEntities.length > 0) {
        expect(result.entityContext).toContain("Entity Context");
      }
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Document Ingestion
  // ─────────────────────────────────────────────────────────────

  describe("ingestDocument", () => {
    it("extracts entities from a document", () => {
      const result = service.ingestDocument({
        id: "test-doc",
        title: "Bitcoin Surges After BlackRock ETF Filing",
        content: "BlackRock filed for a spot Bitcoin ETF with the SEC today.",
        publishedAt: new Date(),
        source: "CoinDesk",
        score: 0.9,
      });

      expect(result.entities.length).toBeGreaterThan(0);
      expect(result.entities.some((e) => e.id === "bitcoin")).toBe(true);
    });

    it("creates co-mention relationships", () => {
      const result = service.ingestDocument({
        id: "test-doc",
        title: "SEC Investigates Binance Exchange",
        content:
          "The SEC has launched an investigation into Binance for compliance.",
        publishedAt: new Date(),
        source: "The Block",
        score: 0.85,
      });

      expect(result.relationships.length).toBeGreaterThan(0);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Stats
  // ─────────────────────────────────────────────────────────────

  describe("getStats", () => {
    it("returns graph statistics", () => {
      const stats = service.getStats();
      expect(stats.entityCount).toBeGreaterThan(0);
      expect(stats.relationshipCount).toBeGreaterThan(0);
    });
  });
});
