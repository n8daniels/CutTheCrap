'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { buildBillGraph, GraphData, GraphNode, GraphLink } from '@/lib/graph-builder';

interface BillGraphProps {
  data: any;
}

export default function BillGraph({ data }: BillGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [focusNode, setFocusNode] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: GraphNode } | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  const positionsRef = useRef<Map<string, { x: number; y: number; vx: number; vy: number }>>(new Map());
  const lastClickRef = useRef<{ id: string; time: number } | null>(null);

  // Build graph data
  useEffect(() => {
    const graph = buildBillGraph(data);
    setGraphData(graph);
  }, [data]);

  // Get visible nodes/links based on focus
  const getVisibleGraph = useCallback((): GraphData => {
    if (!graphData) return { nodes: [], links: [] };
    if (!focusNode) return graphData;

    // Show focused node + its direct connections
    const connectedIds = new Set<string>();
    connectedIds.add(focusNode);

    graphData.links.forEach(link => {
      if (link.source === focusNode) connectedIds.add(link.target);
      if (link.target === focusNode) connectedIds.add(link.source);
    });

    return {
      nodes: graphData.nodes.filter(n => connectedIds.has(n.id)),
      links: graphData.links.filter(l => connectedIds.has(l.source) && connectedIds.has(l.target)),
    };
  }, [graphData, focusNode]);

  // Resize handler
  useEffect(() => {
    function handleResize() {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        setDimensions({ width: w, height: Math.max(400, Math.min(550, w * 0.55)) });
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize positions when graph or focus changes
  useEffect(() => {
    const visible = getVisibleGraph();
    if (visible.nodes.length === 0) return;

    const positions = new Map<string, { x: number; y: number; vx: number; vy: number }>();
    const cx = dimensions.width / 2;
    const cy = dimensions.height / 2;

    // Center node is either the focused node or the bill
    const centerId = focusNode || visible.nodes.find(n => n.type === 'bill')?.id;

    visible.nodes.forEach((node, i) => {
      if (node.id === centerId) {
        positions.set(node.id, { x: cx, y: cy, vx: 0, vy: 0 });
      } else {
        const angle = (2 * Math.PI * i) / visible.nodes.length;
        const radius = 130 + Math.random() * 80;
        positions.set(node.id, {
          x: cx + Math.cos(angle) * radius,
          y: cy + Math.sin(angle) * radius,
          vx: 0,
          vy: 0,
        });
      }
    });
    positionsRef.current = positions;
  }, [getVisibleGraph, focusNode, dimensions]);

  // Force simulation + rendering
  useEffect(() => {
    const visible = getVisibleGraph();
    if (visible.nodes.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let frame = 0;
    const maxFrames = 180;
    const centerId = focusNode || visible.nodes.find(n => n.type === 'bill')?.id;

    function simulate() {
      if (!ctx) return;
      const positions = positionsRef.current;
      const { width, height } = dimensions;
      const cx = width / 2;
      const cy = height / 2;

      // Forces
      visible.nodes.forEach(node => {
        const pos = positions.get(node.id);
        if (!pos) return;

        // Center gravity
        pos.vx += (cx - pos.x) * 0.001;
        pos.vy += (cy - pos.y) * 0.001;

        // Repulsion
        visible.nodes.forEach(other => {
          if (other.id === node.id) return;
          const op = positions.get(other.id);
          if (!op) return;
          const dx = pos.x - op.x;
          const dy = pos.y - op.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = Math.min(800 / (dist * dist), 3);
          pos.vx += (dx / dist) * force;
          pos.vy += (dy / dist) * force;
        });
      });

      // Link attraction
      visible.links.forEach(link => {
        const sp = positions.get(link.source);
        const tp = positions.get(link.target);
        if (!sp || !tp) return;
        const dx = tp.x - sp.x;
        const dy = tp.y - sp.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - 140) * 0.004;
        sp.vx += (dx / dist) * force;
        sp.vy += (dy / dist) * force;
        tp.vx -= (dx / dist) * force;
        tp.vy -= (dy / dist) * force;
      });

      // Update positions
      visible.nodes.forEach(node => {
        const pos = positions.get(node.id);
        if (!pos) return;
        if (node.id === centerId) {
          pos.x = cx; pos.y = cy; pos.vx = 0; pos.vy = 0;
          return;
        }
        pos.vx *= 0.82;
        pos.vy *= 0.82;
        pos.x += pos.vx;
        pos.y += pos.vy;
        pos.x = Math.max(50, Math.min(width - 50, pos.x));
        pos.y = Math.max(50, Math.min(height - 50, pos.y));
      });

      // Draw
      ctx.clearRect(0, 0, width, height);

      // Links
      visible.links.forEach(link => {
        const sp = positions.get(link.source);
        const tp = positions.get(link.target);
        if (!sp || !tp) return;

        ctx.beginPath();
        ctx.moveTo(sp.x, sp.y);
        ctx.lineTo(tp.x, tp.y);
        ctx.strokeStyle = link.color || '#d1d5db';
        ctx.lineWidth = link.color === '#eab308' ? 2.5 : 1.5;
        ctx.globalAlpha = 0.6;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Link label at midpoint
        if (link.label) {
          const mx = (sp.x + tp.x) / 2;
          const my = (sp.y + tp.y) / 2;
          ctx.font = '8px sans-serif';
          ctx.fillStyle = '#9ca3af';
          ctx.textAlign = 'center';
          ctx.fillText(link.label, mx, my - 4);
        }
      });

      // Nodes
      visible.nodes.forEach(node => {
        const pos = positions.get(node.id);
        if (!pos) return;

        // Glow for center node
        if (node.id === centerId) {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, node.size + 6, 0, 2 * Math.PI);
          ctx.fillStyle = node.color + '22';
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, node.size, 0, 2 * Math.PI);
        ctx.fillStyle = node.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = node.id === centerId ? 3 : 1.5;
        ctx.stroke();

        // Label
        ctx.font = node.id === centerId ? 'bold 11px sans-serif' : '9px sans-serif';
        ctx.fillStyle = '#374151';
        ctx.textAlign = 'center';
        const label = node.label.length > 28 ? node.label.substring(0, 28) + '...' : node.label;
        ctx.fillText(label, pos.x, pos.y + node.size + 14);
      });

      frame++;
      if (frame < maxFrames) {
        animationId = requestAnimationFrame(simulate);
      }
    }

    simulate();
    return () => { if (animationId) cancelAnimationFrame(animationId); };
  }, [getVisibleGraph, focusNode, dimensions]);

  // Click / double-click handler
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!graphData || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const positions = positionsRef.current;
    const visible = getVisibleGraph();
    let clicked: GraphNode | null = null;

    for (const node of visible.nodes) {
      const pos = positions.get(node.id);
      if (!pos) continue;
      const dist = Math.sqrt((mx - pos.x) ** 2 + (my - pos.y) ** 2);
      if (dist < node.size + 8) {
        clicked = node;
        break;
      }
    }

    if (!clicked) return;

    const now = Date.now();
    const last = lastClickRef.current;

    // Double-click detection (within 400ms on same node)
    if (last && last.id === clicked.id && now - last.time < 400) {
      // Double click → open in new tab
      lastClickRef.current = null;
      let url = '';
      if (clicked.type === 'bill' || clicked.type === 'related-bill') {
        const billId = clicked.id.replace('bill:', '').replace('related:', '');
        url = `/bills?id=${billId}`;
      } else if (clicked.type === 'sponsor' || clicked.type === 'cosponsor') {
        const memberId = clicked.id.replace('sponsor:', '').replace('cosponsor:', '');
        url = `/members/${memberId}`;
      }
      if (url) window.open(url, '_blank');
      return;
    }

    // Single click → drill down (focus on this node)
    lastClickRef.current = { id: clicked.id, time: now };

    setTimeout(() => {
      // Only fire single click if no double click happened
      if (lastClickRef.current?.id === clicked!.id && Date.now() - lastClickRef.current!.time >= 380) {
        if (focusNode === clicked!.id) return; // Already focused
        setHistory(prev => focusNode ? [...prev, focusNode] : prev);
        setFocusNode(clicked!.id);
      }
    }, 410);
  }, [graphData, getVisibleGraph, focusNode]);

  // Mouse move for tooltip
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!graphData || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const positions = positionsRef.current;
    const visible = getVisibleGraph();
    let found: GraphNode | null = null;

    for (const node of visible.nodes) {
      const pos = positions.get(node.id);
      if (!pos) continue;
      if (Math.sqrt((mx - pos.x) ** 2 + (my - pos.y) ** 2) < node.size + 5) {
        found = node;
        break;
      }
    }

    if (found) {
      setTooltip({ x: mx, y: my, node: found });
      canvasRef.current.style.cursor = 'pointer';
    } else {
      setTooltip(null);
      canvasRef.current.style.cursor = 'default';
    }
  }, [graphData, getVisibleGraph]);

  // Back handler
  const handleBack = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory(h => h.slice(0, -1));
      setFocusNode(prev);
    } else {
      setFocusNode(null);
    }
  };

  if (!graphData || graphData.nodes.length === 0) return null;

  const visible = getVisibleGraph();

  return (
    <div className="w-full">
      {/* Controls */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {(focusNode || history.length > 0) && (
            <button
              onClick={handleBack}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          )}
          {focusNode && (
            <button
              onClick={() => { setFocusNode(null); setHistory([]); }}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
            >
              Show All
            </button>
          )}
        </div>
        <span className="text-xs text-gray-400">
          {visible.nodes.length} nodes — click to drill down, double-click to open
        </span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-3 text-xs">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Bill</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-600 inline-block" /> Democrat</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-600 inline-block" /> Republican</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" /> Donor</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Super PAC</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500 inline-block" /> Amendment</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-purple-500 inline-block" /> Related Bill</span>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="relative w-full">
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setTooltip(null)}
          className="w-full border border-gray-100 rounded-lg bg-gray-50"
        />

        {tooltip && (
          <div
            className="absolute pointer-events-none bg-gray-900 text-white px-3 py-2 rounded-lg text-sm shadow-lg z-50 max-w-xs"
            style={{ left: Math.min(tooltip.x + 15, dimensions.width - 200), top: tooltip.y - 10 }}
          >
            <div className="font-bold">{tooltip.node.label}</div>
            <div className="text-gray-300 text-xs capitalize">{tooltip.node.type.replace('-', ' ')}</div>
            {tooltip.node.party && (
              <div className="text-gray-300 text-xs">
                {tooltip.node.party === 'D' ? 'Democrat' : tooltip.node.party === 'R' ? 'Republican' : tooltip.node.party}
              </div>
            )}
            {tooltip.node.amount && (
              <div className="text-yellow-400 text-xs">${tooltip.node.amount.toLocaleString()}</div>
            )}
            <div className="text-gray-500 text-[10px] mt-1">Click to focus — Double-click to open</div>
          </div>
        )}
      </div>
    </div>
  );
}
