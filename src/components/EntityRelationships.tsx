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
 * Knowledge Graph — Interactive Force-Directed Entity Visualization
 *
 * Pure SVG + requestAnimationFrame physics simulation (no external library).
 * Renders entities as nodes, relationships as edges.
 * Supports zoom, pan, hover highlighting, click details, search centering,
 * and topic/tag filtering.
 */

'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { cn } from '@/lib/utils';
import { Search, X, ZoomIn, ZoomOut, Maximize2, Info } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ForceNode {
  id: string;
  label: string;
  type: string;
  group: number;
  val: number;
  sentiment: number;
  color: string;
  /* simulation state */
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number | null;
  fy?: number | null;
}

export interface ForceLink {
  source: string;
  target: string;
  type: string;
  weight: number;
  sentiment: number;
}

export interface GraphData {
  nodes: ForceNode[];
  links: ForceLink[];
}

export interface TrendingConnection {
  source: string;
  sourceLabel: string;
  target: string;
  targetLabel: string;
  strength: number;
}

export interface TopicTag {
  name: string;
  count: number;
  relatedEntities: string[];
}

interface EntityRelationshipsProps {
  className?: string;
  /** externally set search term – graph will center on matching node */
  searchEntity?: string;
  /** filter to only entities related to this tag */
  activeTag?: string | null;
  /** callback when user clicks a node */
  onNodeSelect?: (nodeId: string | null) => void;
  /** callback when hovering a node */
  onNodeHover?: (nodeId: string | null) => void;
  /** highlight a pair of node ids (from trending sidebar) */
  highlightPair?: [string, string] | null;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TYPE_COLORS: Record<string, string> = {
  token: '#3B82F6',    // blue
  person: '#22C55E',   // green
  company: '#A855F7',  // purple
  project: '#22C55E',  // green
  protocol: '#F97316', // orange
  exchange: '#8B5CF6', // violet
  regulator: '#EF4444',// red
  event: '#EC4899',    // pink
  technology: '#06B6D4',// cyan
  concept: '#6B7280',  // gray
};

const TYPE_LABELS: Record<string, string> = {
  token: 'Coins & Tokens',
  person: 'People',
  company: 'Companies',
  project: 'Projects',
  protocol: 'Protocols',
  exchange: 'Exchanges',
  regulator: 'Regulators',
  event: 'Events',
  technology: 'Technology',
  concept: 'Concepts',
};

/* ------------------------------------------------------------------ */
/*  Force Simulation (pure JS)                                         */
/* ------------------------------------------------------------------ */

function initPositions(nodes: ForceNode[], width: number, height: number) {
  for (const n of nodes) {
    if (!n.x && !n.y) {
      n.x = width / 2 + (Math.random() - 0.5) * width * 0.6;
      n.y = height / 2 + (Math.random() - 0.5) * height * 0.6;
    }
    n.vx = 0;
    n.vy = 0;
  }
}

function simulationTick(
  nodes: ForceNode[],
  links: ForceLink[],
  width: number,
  height: number,
  alpha: number,
) {
  const cx = width / 2;
  const cy = height / 2;

  // Centering force
  for (const n of nodes) {
    n.vx += (cx - n.x) * 0.0005 * alpha;
    n.vy += (cy - n.y) * 0.0005 * alpha;
  }

  // Repulsion (all pairs)
  const repulsionStrength = 800;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1) dist = 1;
      const force = (repulsionStrength * alpha) / (dist * dist);
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      a.vx -= fx;
      a.vy -= fy;
      b.vx += fx;
      b.vy += fy;
    }
  }

  // Attraction along edges
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const springLength = 120;
  const springStrength = 0.03;
  for (const link of links) {
    const a = nodeMap.get(link.source);
    const b = nodeMap.get(link.target);
    if (!a || !b) continue;
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) dist = 1;
    const displacement = dist - springLength;
    const force = displacement * springStrength * alpha;
    const fx = (dx / dist) * force;
    const fy = (dy / dist) * force;
    a.vx += fx;
    a.vy += fy;
    b.vx -= fx;
    b.vy -= fy;
  }

  // Velocity damping + position update
  const damping = 0.6;
  const maxV = 15;
  for (const n of nodes) {
    if (n.fx != null) {
      n.x = n.fx;
      n.y = n.fy!;
      n.vx = 0;
      n.vy = 0;
      continue;
    }
    n.vx *= damping;
    n.vy *= damping;
    const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
    if (speed > maxV) {
      n.vx = (n.vx / speed) * maxV;
      n.vy = (n.vy / speed) * maxV;
    }
    n.x += n.vx;
    n.y += n.vy;
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function EntityRelationships({
  className,
  searchEntity,
  activeTag,
  onNodeSelect,
  onNodeHover,
  highlightPair,
}: EntityRelationshipsProps) {
  /* Raw data */
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* Interaction state */
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  /* View transform: zoom/pan */
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  /* Drag */
  const dragTarget = useRef<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  /* SVG ref */
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  /* Simulation */
  const nodesRef = useRef<ForceNode[]>([]);
  const linksRef = useRef<ForceLink[]>([]);
  const alphaRef = useRef(1);
  const rafRef = useRef<number>(0);
  const [tick, setTick] = useState(0);

  /* ---- Fetch data ------------------------------------------------ */
  useEffect(() => {
    const controller = new AbortController();
    const fetchGraph = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = activeTag
          ? `/api/knowledge-graph?entity=${encodeURIComponent(activeTag)}&depth=3`
          : '/api/knowledge-graph';
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        const fg = json.forceGraph as GraphData | undefined;
        if (fg && fg.nodes.length > 0) {
          setGraphData(fg);
        } else {
          const nodes: ForceNode[] = (json.entities || []).map((e: Record<string, unknown>) => ({
            id: e.id as string,
            label: e.name as string,
            type: e.type as string,
            group: 0,
            val: Math.max(1, Math.log2((e.mentions as number || 1) + 1) * 3),
            sentiment: (e.sentiment as number) || 0,
            color: TYPE_COLORS[(e.type as string)] || '#6B7280',
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
          }));
          const links: ForceLink[] = (json.relationships || []).map((r: Record<string, unknown>) => ({
            source: r.source as string,
            target: r.target as string,
            type: (r.type as string) || 'related',
            weight: (r.weight as number) || 1,
            sentiment: (r.sentiment as number) || 0,
          }));
          if (nodes.length) setGraphData({ nodes, links });
          else setError('No graph data available');
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError('Failed to load knowledge graph');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchGraph();
    return () => controller.abort();
  }, [activeTag]);

  /* ---- Init simulation when data changes ------------------------- */
  useEffect(() => {
    if (!graphData) return;

    const nodes: ForceNode[] = graphData.nodes.map(n => ({
      ...n,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      color: TYPE_COLORS[n.type] || n.color || '#6B7280',
    }));
    const links = [...graphData.links];

    initPositions(nodes, dimensions.width, dimensions.height);
    nodesRef.current = nodes;
    linksRef.current = links;
    alphaRef.current = 1;

    let running = true;
    const loop = () => {
      if (!running) return;
      if (alphaRef.current > 0.001) {
        simulationTick(nodesRef.current, linksRef.current, dimensions.width, dimensions.height, alphaRef.current);
        alphaRef.current *= 0.99;
        setTick(t => t + 1);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [graphData, dimensions]);

  /* ---- Observe container size ------------------------------------ */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setDimensions({ width, height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ---- Center on search entity ----------------------------------- */
  useEffect(() => {
    if (!searchEntity) return;
    const node = nodesRef.current.find(
      n => n.label.toLowerCase() === searchEntity.toLowerCase() ||
           n.id.toLowerCase() === searchEntity.toLowerCase(),
    );
    if (node) {
      setTransform({
        x: dimensions.width / 2 - node.x * 1.5,
        y: dimensions.height / 2 - node.y * 1.5,
        k: 1.5,
      });
      setSelectedNode(node.id);
      onNodeSelect?.(node.id);
    }
  }, [searchEntity, dimensions, onNodeSelect]);

  /* ---- Derived data ---------------------------------------------- */
  const nodeMap = useMemo(() => {
    const m = new Map<string, ForceNode>();
    for (const n of nodesRef.current) m.set(n.id, n);
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const connectedIds = useMemo(() => {
    const active = hoveredNode || selectedNode;
    if (!active) return new Set<string>();
    const ids = new Set<string>([active]);
    for (const l of linksRef.current) {
      if (l.source === active) ids.add(l.target);
      if (l.target === active) ids.add(l.source);
    }
    return ids;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoveredNode, selectedNode, tick]);

  const highlightIds = useMemo(() => {
    if (!highlightPair) return new Set<string>();
    return new Set(highlightPair);
  }, [highlightPair]);

  const selectedNodeData = useMemo(() => {
    if (!selectedNode) return null;
    return nodeMap.get(selectedNode) || null;
  }, [selectedNode, nodeMap]);

  const selectedConnections = useMemo(() => {
    if (!selectedNode) return [];
    return linksRef.current
      .filter(l => l.source === selectedNode || l.target === selectedNode)
      .map(l => ({
        ...l,
        otherNode: nodeMap.get(l.source === selectedNode ? l.target : l.source),
      }))
      .filter(l => l.otherNode)
      .sort((a, b) => b.weight - a.weight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNode, tick, nodeMap]);

  /* ---- Interaction handlers -------------------------------------- */
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const scaleBy = e.deltaY < 0 ? 1.1 : 0.9;
    setTransform(prev => {
      const newK = Math.max(0.1, Math.min(5, prev.k * scaleBy));
      const newX = mx - (mx - prev.x) * (newK / prev.k);
      const newY = my - (my - prev.y) * (newK / prev.k);
      return { x: newX, y: newY, k: newK };
    });
  }, []);

  const handleMouseDown = useCallback((e: ReactMouseEvent<SVGSVGElement>) => {
    const target = (e.target as HTMLElement).closest('[data-node-id]');
    if (target) {
      const nodeId = target.getAttribute('data-node-id')!;
      const node = nodesRef.current.find(n => n.id === nodeId);
      if (node) {
        dragTarget.current = nodeId;
        const rect = svgRef.current?.getBoundingClientRect();
        if (rect) {
          dragOffset.current = {
            x: (e.clientX - rect.left - transform.x) / transform.k - node.x,
            y: (e.clientY - rect.top - transform.y) / transform.k - node.y,
          };
        }
        node.fx = node.x;
        node.fy = node.y;
        alphaRef.current = Math.max(alphaRef.current, 0.3);
        return;
      }
    }
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y };
  }, [transform]);

  const handleMouseMove = useCallback((e: ReactMouseEvent<SVGSVGElement>) => {
    if (dragTarget.current) {
      const node = nodesRef.current.find(n => n.id === dragTarget.current);
      if (node) {
        const rect = svgRef.current?.getBoundingClientRect();
        if (rect) {
          node.fx = (e.clientX - rect.left - transform.x) / transform.k - dragOffset.current.x;
          node.fy = (e.clientY - rect.top - transform.y) / transform.k - dragOffset.current.y;
          node.x = node.fx;
          node.y = node.fy;
          alphaRef.current = Math.max(alphaRef.current, 0.1);
          setTick(t => t + 1);
        }
      }
      return;
    }
    if (isPanning.current) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setTransform(prev => ({
        ...prev,
        x: panStart.current.tx + dx,
        y: panStart.current.ty + dy,
      }));
    }
  }, [transform]);

  const handleMouseUp = useCallback(() => {
    if (dragTarget.current) {
      const node = nodesRef.current.find(n => n.id === dragTarget.current);
      if (node) {
        node.fx = null;
        node.fy = null;
      }
      dragTarget.current = null;
      return;
    }
    isPanning.current = false;
  }, []);

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNode(prev => {
      const next = prev === nodeId ? null : nodeId;
      onNodeSelect?.(next);
      return next;
    });
  }, [onNodeSelect]);

  const handleNodeEnter = useCallback((nodeId: string) => {
    setHoveredNode(nodeId);
    onNodeHover?.(nodeId);
  }, [onNodeHover]);

  const handleNodeLeave = useCallback(() => {
    setHoveredNode(null);
    onNodeHover?.(null);
  }, [onNodeHover]);

  /* ---- Zoom controls --------------------------------------------- */
  const zoomIn = () => setTransform(p => ({ ...p, k: Math.min(5, p.k * 1.3) }));
  const zoomOut = () => setTransform(p => ({ ...p, k: Math.max(0.1, p.k / 1.3) }));
  const resetView = () => setTransform({ x: 0, y: 0, k: 1 });

  /* ---- Render ---------------------------------------------------- */
  if (loading) {
    return (
      <div className={cn('flex items-center justify-center min-h-[400px] bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)]', className)}>
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-3 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--color-text-secondary)]">Loading knowledge graph…</p>
        </div>
      </div>
    );
  }

  if (error || !nodesRef.current.length) {
    return (
      <div className={cn('flex items-center justify-center min-h-[400px] bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)]', className)}>
        <div className="flex flex-col items-center gap-2 text-center px-6">
          <Info className="h-8 w-8 text-[var(--color-text-tertiary)]" />
          <p className="text-[var(--color-text-secondary)]">{error || 'No entities found in the knowledge graph yet.'}</p>
          <p className="text-sm text-[var(--color-text-tertiary)]">Graph data will appear as news is ingested and analyzed.</p>
        </div>
      </div>
    );
  }

  const activeNodeId = hoveredNode || selectedNode;
  const hasHighlight = !!activeNodeId || highlightIds.size > 0;

  return (
    <div className={cn('relative', className)}>
      {/* SVG Graph */}
      <div
        ref={containerRef}
        className="w-full h-[500px] md:h-[600px] bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden relative"
      >
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="w-full h-full cursor-grab active:cursor-grabbing select-none"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
            {/* Edges */}
            {linksRef.current.map((link, i) => {
              const src = nodeMap.get(link.source);
              const tgt = nodeMap.get(link.target);
              if (!src || !tgt) return null;

              const isHighlighted =
                highlightIds.has(link.source) && highlightIds.has(link.target);
              const isConnected =
                connectedIds.has(link.source) && connectedIds.has(link.target);
              const dimmed = hasHighlight && !isHighlighted && !isConnected;

              return (
                <line
                  key={`${link.source}-${link.target}-${i}`}
                  x1={src.x}
                  y1={src.y}
                  x2={tgt.x}
                  y2={tgt.y}
                  stroke={isHighlighted ? '#F59E0B' : 'var(--color-border)'}
                  strokeWidth={Math.max(0.5, Math.min(3, link.weight / 3))}
                  opacity={dimmed ? 0.08 : isHighlighted || isConnected ? 0.8 : 0.25}
                />
              );
            })}

            {/* Nodes */}
            {nodesRef.current.map(node => {
              const radius = Math.max(4, Math.min(24, node.val * 2.5));
              const isActive = node.id === activeNodeId;
              const isConnected = connectedIds.has(node.id);
              const isHighlighted = highlightIds.has(node.id);
              const dimmed = hasHighlight && !isActive && !isConnected && !isHighlighted;

              return (
                <g
                  key={node.id}
                  data-node-id={node.id}
                  className="cursor-pointer"
                  onClick={() => handleNodeClick(node.id)}
                  onMouseEnter={() => handleNodeEnter(node.id)}
                  onMouseLeave={handleNodeLeave}
                >
                  {(isActive || isHighlighted) && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={radius + 5}
                      fill="none"
                      stroke={isHighlighted ? '#F59E0B' : node.color}
                      strokeWidth={2}
                      opacity={0.5}
                    />
                  )}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={radius}
                    fill={node.color}
                    opacity={dimmed ? 0.15 : 1}
                    stroke={isActive ? '#fff' : 'transparent'}
                    strokeWidth={isActive ? 2 : 0}
                  />
                  {(transform.k > 0.6 || isActive || isConnected || isHighlighted) && (
                    <text
                      x={node.x}
                      y={node.y + radius + 12}
                      textAnchor="middle"
                      fontSize={Math.max(9, 11 / transform.k)}
                      fill={dimmed ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)'}
                      opacity={dimmed ? 0.3 : 1}
                      className="pointer-events-none"
                      fontWeight={isActive ? 600 : 400}
                    >
                      {node.label}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Zoom controls */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-1">
          <button
            onClick={zoomIn}
            className="p-1.5 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-border)] transition-colors"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4 text-[var(--color-text-secondary)]" />
          </button>
          <button
            onClick={zoomOut}
            className="p-1.5 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-border)] transition-colors"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4 text-[var(--color-text-secondary)]" />
          </button>
          <button
            onClick={resetView}
            className="p-1.5 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-border)] transition-colors"
            aria-label="Reset view"
          >
            <Maximize2 className="h-4 w-4 text-[var(--color-text-secondary)]" />
          </button>
        </div>

        {/* Legend */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2 max-w-[280px]">
          {Object.entries(TYPE_COLORS).slice(0, 6).map(([type, color]) => (
            <span key={type} className="inline-flex items-center gap-1 text-[10px] text-[var(--color-text-tertiary)]">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              {TYPE_LABELS[type] || type}
            </span>
          ))}
        </div>
      </div>

      {/* Details panel (selected node) */}
      {selectedNodeData && (
        <div className="absolute top-3 right-14 w-72 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-lg p-4 z-10 max-h-[calc(100%-24px)] overflow-y-auto">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full" style={{ background: selectedNodeData.color }} />
              <h4 className="font-semibold text-[var(--color-text-primary)] leading-tight">{selectedNodeData.label}</h4>
            </div>
            <button
              onClick={() => { setSelectedNode(null); onNodeSelect?.(null); }}
              className="p-0.5 hover:bg-[var(--color-surface-secondary)] rounded"
            >
              <X className="h-4 w-4 text-[var(--color-text-tertiary)]" />
            </button>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-tertiary)]">Type</span>
              <span className="text-[var(--color-text-secondary)] capitalize">{selectedNodeData.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-tertiary)]">Sentiment</span>
              <span className={cn(
                'font-medium',
                selectedNodeData.sentiment > 0.2 ? 'text-green-500' :
                selectedNodeData.sentiment < -0.2 ? 'text-red-500' :
                'text-[var(--color-text-secondary)]',
              )}>
                {selectedNodeData.sentiment > 0 ? '+' : ''}{selectedNodeData.sentiment.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-tertiary)]">Connections</span>
              <span className="text-[var(--color-text-secondary)]">{selectedConnections.length}</span>
            </div>
          </div>

          {selectedConnections.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
              <p className="text-xs font-medium text-[var(--color-text-tertiary)] mb-2">Connected Entities</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {selectedConnections.slice(0, 15).map((conn, i) => (
                  <button
                    key={i}
                    className="w-full flex items-center justify-between text-left px-2 py-1 rounded hover:bg-[var(--color-surface-secondary)] transition-colors"
                    onClick={() => {
                      if (conn.otherNode) {
                        setSelectedNode(conn.otherNode.id);
                        onNodeSelect?.(conn.otherNode.id);
                      }
                    }}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ background: conn.otherNode?.color }} />
                      <span className="text-sm text-[var(--color-text-primary)] truncate">{conn.otherNode?.label}</span>
                    </div>
                    <span className="text-xs text-[var(--color-text-tertiary)] flex-shrink-0 ml-2 capitalize">{conn.type}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
