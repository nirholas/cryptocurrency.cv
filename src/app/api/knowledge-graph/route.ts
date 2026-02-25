/**
 * Knowledge Graph API
 *
 * GET /api/knowledge-graph
 *   - No params:      full graph
 *   - ?entity=Bitcoin  graph centred on entity (depth=2)
 *   - ?type=exchange    filter by entity type
 *   - ?depth=3          subgraph hops
 *   - ?minMentions=3    entity prominence filter
 *
 * POST /api/knowledge-graph   { action: 'ingest', count?: number }
 *   Trigger ingestion of latest news into the graph
 *
 * @module api/knowledge-graph
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  queryKnowledgeGraph,
  getFullKnowledgeGraph,
  ingestLatestNews,
  type GraphQuery,
  type EntityType,
} from '@/lib/ai-knowledge-graph';

export const runtime = 'nodejs';
export const maxDuration = 60;

// ---- GET ----------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const entity = searchParams.get('entity') || undefined;
    const entityType = searchParams.get('type') as EntityType | undefined;
    const depth = searchParams.has('depth') ? Number(searchParams.get('depth')) : undefined;
    const minMentions = searchParams.has('minMentions') ? Number(searchParams.get('minMentions')) : undefined;
    const minWeight = searchParams.has('minWeight') ? Number(searchParams.get('minWeight')) : undefined;

    const params: GraphQuery = {};
    if (entity) params.entity = entity;
    if (entityType) params.entityType = entityType;
    if (depth) params.depth = depth;
    if (minMentions) params.minMentions = minMentions;
    if (minWeight) params.minRelationshipWeight = minWeight;

    const hasFilters = entity || entityType || depth || minMentions || minWeight;
    const data = hasFilters ? queryKnowledgeGraph(params) : getFullKnowledgeGraph();

    // Also return force-directed layout hints
    const forceGraph = toForceGraph(data);

    return NextResponse.json(
      {
        ...data,
        stats: {
          ...data.stats,
          totalClusters: data.clusters.length,
        },
        forceGraph,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('[Knowledge Graph API] GET error:', error);
    return NextResponse.json({ error: 'Failed to query knowledge graph' }, { status: 500 });
  }
}

// ---- POST ---------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action || 'ingest';

    if (action === 'ingest') {
      const count = body.count || 20;
      const result = await ingestLatestNews(count);
      return NextResponse.json({
        success: true,
        ...result,
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[Knowledge Graph API] POST error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

// ---- OPTIONS ------------------------------------------------------------

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// ---- Force-Directed Layout Helper ----------------------------------------

interface ForceNode {
  id: string;
  label: string;
  type: string;
  group: number;
  val: number;
  sentiment: number;
  color: string;
}

interface ForceLink {
  source: string;
  target: string;
  type: string;
  weight: number;
  sentiment: number;
}

function toForceGraph(data: {
  entities: { id: string; name: string; type: string; mentions: number; sentiment: number }[];
  relationships: { source: string; target: string; type: string; weight: number; sentiment: number }[];
  clusters: { entities: string[] }[];
}): { nodes: ForceNode[]; links: ForceLink[] } {
  const typeColors: Record<string, string> = {
    person: '#60A5FA',
    project: '#34D399',
    company: '#FBBF24',
    token: '#F87171',
    exchange: '#A78BFA',
    regulator: '#FB923C',
    event: '#E879F9',
    technology: '#22D3EE',
    concept: '#94A3B8',
  };

  const entityCluster = new Map<string, number>();
  data.clusters.forEach((c, i) => {
    c.entities.forEach(eid => entityCluster.set(eid, i));
  });

  const nodes: ForceNode[] = data.entities.map(e => ({
    id: e.id,
    label: e.name,
    type: e.type,
    group: entityCluster.get(e.id) || 0,
    val: Math.max(1, Math.log2(e.mentions + 1) * 3),
    sentiment: e.sentiment,
    color: typeColors[e.type] || '#94A3B8',
  }));

  const nodeIds = new Set(nodes.map(n => n.id));
  const links: ForceLink[] = data.relationships
    .filter(r => nodeIds.has(r.source) && nodeIds.has(r.target))
    .map(r => ({
      source: r.source,
      target: r.target,
      type: r.type,
      weight: r.weight,
      sentiment: r.sentiment,
    }));

  return { nodes, links };
}
