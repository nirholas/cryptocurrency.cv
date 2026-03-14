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
 * Knowledge Graph API
 *
 * GET /api/v1/knowledge-graph — Get graph data (D3 or Cytoscape format)
 * GET /api/v1/knowledge-graph?entity=bitcoin — Get entity neighborhood
 * GET /api/v1/knowledge-graph?from=bitcoin&to=sec — Find shortest path
 * GET /api/v1/knowledge-graph?entity=ethereum&impact=upgrade — Impact propagation
 * GET /api/v1/knowledge-graph?stats=true — Get graph statistics
 *
 * POST /api/v1/knowledge-graph/ingest — Ingest an article
 */

export const revalidate = 600; // ISR: knowledge graph refreshes every 10 min
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getKnowledgeGraph } from '@/lib/knowledge-graph';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const kg = getKnowledgeGraph();

  // Stats
  if (url.searchParams.get('stats') === 'true') {
    return NextResponse.json(kg.getStats());
  }

  // Shortest path
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  if (from && to) {
    const path = kg.shortestPath(from, to);
    if (!path) {
      return NextResponse.json({ error: 'No path found', from, to }, { status: 404 });
    }
    return NextResponse.json({
      from,
      to,
      path,
      length: path.length - 1,
      entities: path.map((id) => kg.getEntity(id)).filter(Boolean),
    });
  }

  // Entity neighborhood
  const entityId = url.searchParams.get('entity');
  if (entityId) {
    const entity = kg.getEntity(entityId);
    if (!entity) {
      return NextResponse.json({ error: 'Entity not found', entityId }, { status: 404 });
    }

    // Impact propagation
    const impact = url.searchParams.get('impact');
    if (impact) {
      const results = kg.propagateImpact(entityId, impact, 0.8);
      return NextResponse.json({
        entity: entity.name,
        eventType: impact,
        impactedEntities: results.map((r) => ({
          id: r.entity.id,
          name: r.entity.name,
          type: r.entity.type,
          impact: Math.round(r.impact * 100) / 100,
          hops: r.hops,
          path: r.path,
        })),
      });
    }

    const hops = parseInt(url.searchParams.get('hops') ?? '2', 10);
    const subgraph = kg.getNeighbors(entityId, hops);
    return NextResponse.json({
      entity,
      subgraph,
      relationships: kg.getRelationships(entityId),
    });
  }

  // Search
  const query = url.searchParams.get('q') || url.searchParams.get('search');
  if (query) {
    const results = kg.searchEntities(query, 20);
    return NextResponse.json({ query, results });
  }

  // Full graph (D3 format)
  const format = url.searchParams.get('format') ?? 'd3';
  if (format === 'cytoscape') {
    return NextResponse.json(kg.toCytoscape());
  }

  return NextResponse.json(kg.toD3());
}
