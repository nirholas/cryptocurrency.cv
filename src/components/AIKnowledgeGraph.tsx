'use client';

/**
 * AI Knowledge Graph Visualizer
 *
 * Interactive force-directed graph of the crypto knowledge network.
 * Entities are nodes (sized by mentions, colored by type).
 * Relationships are edges (thickness by weight).
 * Supports pan, zoom, click-to-focus, type filtering, and live ingestion.
 *
 * Uses Canvas 2D for rendering (zero external dependencies).
 *
 * @component AIKnowledgeGraph
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ForceNode {
  id: string;
  label: string;
  type: string;
  group: number;
  val: number;
  sentiment: number;
  color: string;
  // simulation state
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface ForceLink {
  source: string;
  target: string;
  type: string;
  weight: number;
  sentiment: number;
}

interface GraphStats {
  totalEntities: number;
  totalRelationships: number;
  totalClusters: number;
  topEntities: { name: string; mentions: number; type: string }[];
  strongestRelationships: { source: string; target: string; type: string; weight: number }[];
  articlesProcessed: number;
  lastIngestion: string;
}

interface GraphResponse {
  forceGraph: { nodes: ForceNode[]; links: ForceLink[] };
  stats: GraphStats;
  clusters: { id: string; label: string; theme: string; sentiment: number; centrality: number }[];
}

// ---------------------------------------------------------------------------
// Colors & Config
// ---------------------------------------------------------------------------

const TYPE_COLORS: Record<string, string> = {
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

const TYPE_LABELS: Record<string, string> = {
  person: 'People',
  project: 'Projects',
  company: 'Companies',
  token: 'Tokens',
  exchange: 'Exchanges',
  regulator: 'Regulators',
  event: 'Events',
  technology: 'Technology',
  concept: 'Concepts',
};

// ---------------------------------------------------------------------------
// Simple Force Simulation
// ---------------------------------------------------------------------------

function runSimulation(
  nodes: ForceNode[],
  links: ForceLink[],
  width: number,
  height: number,
  iterations = 120
): void {
  // Initialize positions
  nodes.forEach((n, i) => {
    const angle = (2 * Math.PI * i) / nodes.length;
    const radius = Math.min(width, height) * 0.3;
    n.x = width / 2 + Math.cos(angle) * radius * (0.5 + Math.random() * 0.5);
    n.y = height / 2 + Math.sin(angle) * radius * (0.5 + Math.random() * 0.5);
    n.vx = 0;
    n.vy = 0;
  });

  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  for (let iter = 0; iter < iterations; iter++) {
    const alpha = 1 - iter / iterations;
    const k = Math.sqrt((width * height) / Math.max(nodes.length, 1));

    // Repulsion between all node pairs
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (k * k) / dist * alpha * 0.4;
        dx = (dx / dist) * force;
        dy = (dy / dist) * force;
        a.vx -= dx;
        a.vy -= dy;
        b.vx += dx;
        b.vy += dy;
      }
    }

    // Attraction along edges
    for (const link of links) {
      const a = nodeMap.get(link.source);
      const b = nodeMap.get(link.target);
      if (!a || !b) continue;
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (dist * dist) / k * alpha * 0.05 * (link.weight || 0.5);
      dx = (dx / dist) * force;
      dy = (dy / dist) * force;
      a.vx += dx;
      a.vy += dy;
      b.vx -= dx;
      b.vy -= dy;
    }

    // Center gravity
    for (const node of nodes) {
      node.vx += (width / 2 - node.x) * 0.001 * alpha;
      node.vy += (height / 2 - node.y) * 0.001 * alpha;
    }

    // Apply velocities with damping
    const damping = 0.9;
    for (const node of nodes) {
      node.vx *= damping;
      node.vy *= damping;
      node.x += node.vx;
      node.y += node.vy;
      // Bounds
      node.x = Math.max(40, Math.min(width - 40, node.x));
      node.y = Math.max(40, Math.min(height - 40, node.y));
    }
  }
}

// ---------------------------------------------------------------------------
// Canvas Renderer
// ---------------------------------------------------------------------------

function renderGraph(
  ctx: CanvasRenderingContext2D,
  nodes: ForceNode[],
  links: ForceLink[],
  width: number,
  height: number,
  selectedNode: string | null,
  hiddenTypes: Set<string>,
  zoom: number,
  panX: number,
  panY: number
) {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  ctx.clearRect(0, 0, width * dpr, height * dpr);
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.translate(panX, panY);
  ctx.scale(zoom, zoom);

  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const visibleNodes = new Set(
    nodes.filter(n => !hiddenTypes.has(n.type)).map(n => n.id)
  );

  // Edges
  for (const link of links) {
    const a = nodeMap.get(link.source);
    const b = nodeMap.get(link.target);
    if (!a || !b) continue;
    if (!visibleNodes.has(a.id) || !visibleNodes.has(b.id)) continue;

    const isHighlighted =
      selectedNode && (link.source === selectedNode || link.target === selectedNode);

    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = isHighlighted
      ? 'rgba(255,255,255,0.6)'
      : 'rgba(255,255,255,0.08)';
    ctx.lineWidth = Math.max(0.5, link.weight * 3) * (isHighlighted ? 2 : 1);
    ctx.stroke();

    // Relationship label on highlighted edges
    if (isHighlighted) {
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      ctx.font = '9px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.textAlign = 'center';
      ctx.fillText(link.type.replace(/_/g, ' '), mx, my - 4);
    }
  }

  // Nodes
  for (const node of nodes) {
    if (!visibleNodes.has(node.id)) continue;

    const isSelected = node.id === selectedNode;
    const r = node.val * (isSelected ? 1.5 : 1);

    // Glow for selected
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 6, 0, 2 * Math.PI);
      ctx.fillStyle = `${node.color}33`;
      ctx.fill();
    }

    // Node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
    ctx.fillStyle = isSelected ? '#fff' : node.color;
    ctx.fill();

    // Label
    ctx.font = `${isSelected ? 'bold ' : ''}${10 + (isSelected ? 2 : 0)}px system-ui, sans-serif`;
    ctx.fillStyle = isSelected ? '#fff' : 'rgba(255,255,255,0.7)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(node.label, node.x, node.y + r + 3);
  }

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AIKnowledgeGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [error, setError] = useState('');
  const [nodes, setNodes] = useState<ForceNode[]>([]);
  const [links, setLinks] = useState<ForceLink[]>([]);
  const [stats, setStats] = useState<GraphStats | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [searchEntity, setSearchEntity] = useState('');
  const [dimensions, setDimensions] = useState({ w: 800, h: 500 });

  // Fetch graph data
  const fetchGraph = useCallback(async (entity?: string) => {
    setLoading(true);
    setError('');
    try {
      const url = entity
        ? `/api/knowledge-graph?entity=${encodeURIComponent(entity)}&depth=2`
        : '/api/knowledge-graph';
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: GraphResponse = await res.json();

      const graphNodes = data.forceGraph.nodes;
      const graphLinks = data.forceGraph.links;

      // Run force simulation
      runSimulation(graphNodes, graphLinks, dimensions.w, dimensions.h);

      setNodes(graphNodes);
      setLinks(graphLinks);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load graph');
    } finally {
      setLoading(false);
    }
  }, [dimensions]);

  // Ingest news
  const handleIngest = async () => {
    setIngesting(true);
    try {
      const res = await fetch('/api/knowledge-graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ingest', count: 25 }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchGraph();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ingestion failed');
    } finally {
      setIngesting(false);
    }
  };

  // Responsive canvas sizing
  useEffect(() => {
    const container = canvasRef.current?.parentElement;
    if (!container) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = Math.max(400, Math.min(700, w * 0.6));
        setDimensions({ w, h });
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.w * dpr;
    canvas.height = dimensions.h * dpr;
    canvas.style.width = `${dimensions.w}px`;
    canvas.style.height = `${dimensions.h}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    renderGraph(ctx, nodes, links, dimensions.w, dimensions.h, selectedNode, hiddenTypes, zoom, pan.x, pan.y);
  }, [nodes, links, dimensions, selectedNode, hiddenTypes, zoom, pan]);

  // Click on node
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left - pan.x) / zoom;
    const my = (e.clientY - rect.top - pan.y) / zoom;

    const clicked = nodes.find(n => {
      const dx = n.x - mx;
      const dy = n.y - my;
      return dx * dx + dy * dy < (n.val + 5) * (n.val + 5);
    });

    setSelectedNode(clicked ? (clicked.id === selectedNode ? null : clicked.id) : null);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.max(0.3, Math.min(5, z * delta)));
  };

  // Mouse drag for panning
  const dragRef = useRef<{ dragging: boolean; startX: number; startY: number }>({
    dragging: false,
    startX: 0,
    startY: 0,
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      dragRef.current = { dragging: true, startX: e.clientX - pan.x, startY: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragRef.current.dragging) {
      setPan({
        x: e.clientX - dragRef.current.startX,
        y: e.clientY - dragRef.current.startY,
      });
    }
  };

  const handleMouseUp = () => {
    dragRef.current.dragging = false;
  };

  // Toggle entity type visibility
  const toggleType = (type: string) => {
    setHiddenTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  // Load graph on mount
   
  useEffect(() => {
    fetchGraph();
  }, []);

  const selectedEntity = nodes.find(n => n.id === selectedNode);

  return (
    <div className="rounded-xl border border-white/10 bg-black/50 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500">
            <svg className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6zM15.657 5.404a.75.75 0 10-1.06-1.06l-1.061 1.06a.75.75 0 001.06 1.06l1.06-1.06zM6.464 14.596a.75.75 0 10-1.06-1.06l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06zM18 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0118 10zM5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 015 10zM14.596 15.657a.75.75 0 001.06-1.06l-1.06-1.061a.75.75 0 10-1.06 1.06l1.06 1.06zM5.404 6.464a.75.75 0 001.06-1.06l-1.06-1.06a.75.75 0 10-1.06 1.06l1.06 1.06z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">AI Knowledge Graph</h2>
            <p className="text-xs text-white/40">
              {stats
                ? `${stats.totalEntities} entities · ${stats.totalRelationships} relationships · ${stats.articlesProcessed} articles`
                : 'Loading...'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleIngest}
            disabled={ingesting}
            className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
          >
            {ingesting ? 'Ingesting...' : '⚡ Ingest News'}
          </button>
          <button
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/10"
          >
            Reset View
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-4 py-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchEntity}
            onChange={e => setSearchEntity(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchGraph(searchEntity || undefined)}
            placeholder="Search entity..."
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-white placeholder:text-white/30 focus:border-violet-500 focus:outline-none"
          />
          <button
            onClick={() => fetchGraph(searchEntity || undefined)}
            className="rounded-lg bg-white/10 px-2 py-1 text-xs text-white/60 hover:bg-white/20"
          >
            🔍
          </button>
        </div>
        <div className="flex flex-wrap gap-1">
          {Object.entries(TYPE_LABELS).map(([type, label]) => (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition ${
                hiddenTypes.has(type)
                  ? 'bg-white/5 text-white/30 line-through'
                  : 'bg-white/10 text-white/70'
              }`}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: hiddenTypes.has(type) ? '#555' : TYPE_COLORS[type] }}
              />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
            <div className="flex items-center gap-2 text-sm text-white/60">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
              Loading graph...
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-x-0 top-0 z-10 bg-red-900/60 px-4 py-2 text-xs text-red-200">
            {error}
          </div>
        )}
        {nodes.length === 0 && !loading && (
          <div className="flex h-[400px] flex-col items-center justify-center gap-3 text-white/40">
            <svg className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="3" />
              <circle cx="4" cy="8" r="2" />
              <circle cx="20" cy="8" r="2" />
              <circle cx="4" cy="16" r="2" />
              <circle cx="20" cy="16" r="2" />
              <line x1="9.5" y1="10.5" x2="5.5" y2="8.5" />
              <line x1="14.5" y1="10.5" x2="18.5" y2="8.5" />
              <line x1="9.5" y1="13.5" x2="5.5" y2="15.5" />
              <line x1="14.5" y1="13.5" x2="18.5" y2="15.5" />
            </svg>
            <p className="text-sm">No entities yet. Click &quot;Ingest News&quot; to build the graph.</p>
          </div>
        )}
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="cursor-grab active:cursor-grabbing"
          style={{ width: dimensions.w, height: dimensions.h }}
        />
      </div>

      {/* Selected Entity Detail */}
      {selectedEntity && (
        <div className="border-t border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: selectedEntity.color }}
            />
            <span className="text-sm font-semibold text-white">{selectedEntity.label}</span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/50">
              {selectedEntity.type}
            </span>
            <span className="text-[10px] text-white/30">
              sentiment: {selectedEntity.sentiment > 0 ? '+' : ''}{selectedEntity.sentiment.toFixed(2)}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {links
              .filter(l => l.source === selectedNode || l.target === selectedNode)
              .slice(0, 12)
              .map((l, i) => {
                const otherId = l.source === selectedNode ? l.target : l.source;
                const other = nodes.find(n => n.id === otherId);
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedNode(otherId)}
                    className="flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/50 transition hover:bg-white/10 hover:text-white"
                  >
                    <span className="text-white/30">{l.type.replace(/_/g, ' ')}</span>
                    <span className="text-white/70">{other?.label || otherId}</span>
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* Stats Bar */}
      {stats && stats.topEntities.length > 0 && (
        <div className="border-t border-white/10 px-4 py-2">
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-white/30">Top Entities</p>
          <div className="flex flex-wrap gap-1">
            {stats.topEntities.slice(0, 8).map((e, i) => (
              <button
                key={i}
                onClick={() => {
                  setSearchEntity(e.name);
                  fetchGraph(e.name);
                }}
                className="flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/60 transition hover:bg-white/10"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: TYPE_COLORS[e.type] || '#94A3B8' }}
                />
                {e.name}
                <span className="text-white/30">×{e.mentions}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
