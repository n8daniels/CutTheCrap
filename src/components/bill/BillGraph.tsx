'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { buildBillGraph, GraphData, GraphNode } from '@/lib/graph-builder';

interface BillGraphProps {
  data: any;
}

export default function BillGraph({ data }: BillGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: GraphNode } | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  // Node positions for force simulation
  const positionsRef = useRef<Map<string, { x: number; y: number; vx: number; vy: number }>>(new Map());

  useEffect(() => {
    const graph = buildBillGraph(data);
    setGraphData(graph);

    // Initialize positions
    const positions = new Map<string, { x: number; y: number; vx: number; vy: number }>();
    const cx = dimensions.width / 2;
    const cy = dimensions.height / 2;

    graph.nodes.forEach((node, i) => {
      if (node.type === 'bill') {
        positions.set(node.id, { x: cx, y: cy, vx: 0, vy: 0 });
      } else {
        const angle = (2 * Math.PI * i) / graph.nodes.length;
        const radius = 150 + Math.random() * 100;
        positions.set(node.id, {
          x: cx + Math.cos(angle) * radius,
          y: cy + Math.sin(angle) * radius,
          vx: 0,
          vy: 0,
        });
      }
    });
    positionsRef.current = positions;
  }, [data, dimensions]);

  useEffect(() => {
    function handleResize() {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        setDimensions({ width: w, height: Math.max(400, Math.min(600, w * 0.6)) });
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Simple force simulation
  useEffect(() => {
    if (!graphData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let frame = 0;
    const maxFrames = 200;

    function simulate() {
      if (!graphData || !ctx) return;
      const positions = positionsRef.current;
      const { width, height } = dimensions;
      const cx = width / 2;
      const cy = height / 2;

      // Apply forces
      graphData.nodes.forEach(node => {
        const pos = positions.get(node.id);
        if (!pos) return;

        // Center gravity
        const dx = cx - pos.x;
        const dy = cy - pos.y;
        pos.vx += dx * 0.001;
        pos.vy += dy * 0.001;

        // Repulsion from other nodes
        graphData.nodes.forEach(other => {
          if (other.id === node.id) return;
          const otherPos = positions.get(other.id);
          if (!otherPos) return;
          const ddx = pos.x - otherPos.x;
          const ddy = pos.y - otherPos.y;
          const dist = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
          const force = Math.min(500 / (dist * dist), 2);
          pos.vx += (ddx / dist) * force;
          pos.vy += (ddy / dist) * force;
        });
      });

      // Apply link forces (attraction)
      graphData.links.forEach(link => {
        const sourcePos = positions.get(link.source);
        const targetPos = positions.get(link.target);
        if (!sourcePos || !targetPos) return;
        const dx = targetPos.x - sourcePos.x;
        const dy = targetPos.y - sourcePos.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - 120) * 0.005;
        sourcePos.vx += (dx / dist) * force;
        sourcePos.vy += (dy / dist) * force;
        targetPos.vx -= (dx / dist) * force;
        targetPos.vy -= (dy / dist) * force;
      });

      // Update positions with damping
      const damping = 0.85;
      graphData.nodes.forEach(node => {
        const pos = positions.get(node.id);
        if (!pos) return;
        // Pin the bill node to center
        if (node.type === 'bill') {
          pos.x = cx;
          pos.y = cy;
          pos.vx = 0;
          pos.vy = 0;
          return;
        }
        pos.vx *= damping;
        pos.vy *= damping;
        pos.x += pos.vx;
        pos.y += pos.vy;
        // Keep in bounds
        pos.x = Math.max(40, Math.min(width - 40, pos.x));
        pos.y = Math.max(40, Math.min(height - 40, pos.y));
      });

      // Draw
      ctx.clearRect(0, 0, width, height);

      // Draw links
      graphData.links.forEach(link => {
        const sourcePos = positions.get(link.source);
        const targetPos = positions.get(link.target);
        if (!sourcePos || !targetPos) return;

        ctx.beginPath();
        ctx.moveTo(sourcePos.x, sourcePos.y);
        ctx.lineTo(targetPos.x, targetPos.y);
        ctx.strokeStyle = link.color || '#d1d5db';
        ctx.lineWidth = link.color === '#eab308' ? 2 : 1;
        ctx.globalAlpha = 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
      });

      // Draw nodes
      graphData.nodes.forEach(node => {
        const pos = positions.get(node.id);
        if (!pos) return;

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, node.size, 0, 2 * Math.PI);
        ctx.fillStyle = node.color;
        ctx.fill();

        if (node.type === 'bill') {
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        // Label
        ctx.font = node.type === 'bill' ? 'bold 11px sans-serif' : '9px sans-serif';
        ctx.fillStyle = '#374151';
        ctx.textAlign = 'center';
        const labelY = pos.y + node.size + 12;
        const label = node.label.length > 25 ? node.label.substring(0, 25) + '...' : node.label;
        ctx.fillText(label, pos.x, labelY);
      });

      frame++;
      if (frame < maxFrames) {
        animationId = requestAnimationFrame(simulate);
      }
    }

    simulate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [graphData, dimensions]);

  // Mouse interaction
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!graphData || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const positions = positionsRef.current;
    let found: GraphNode | null = null;

    for (const node of graphData.nodes) {
      const pos = positions.get(node.id);
      if (!pos) continue;
      const dist = Math.sqrt((mx - pos.x) ** 2 + (my - pos.y) ** 2);
      if (dist < node.size + 5) {
        found = node;
        break;
      }
    }

    if (found) {
      setTooltip({ x: mx, y: my, node: found });
      if (canvasRef.current) canvasRef.current.style.cursor = 'pointer';
    } else {
      setTooltip(null);
      if (canvasRef.current) canvasRef.current.style.cursor = 'default';
    }
  }, [graphData]);

  if (!graphData || graphData.nodes.length === 0) return null;

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Connection Map</h2>
      <p className="text-sm text-gray-500 mb-4">
        {graphData.nodes.length} entities connected — bill, sponsors, donors, amendments, related bills
      </p>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 text-xs">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Bill</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-600 inline-block" /> Democrat</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-600 inline-block" /> Republican</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" /> Donor</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Super PAC</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500 inline-block" /> Amendment</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-purple-500 inline-block" /> Related Bill</span>
      </div>

      <div ref={containerRef} className="relative w-full">
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setTooltip(null)}
          className="w-full border border-gray-100 rounded-lg bg-gray-50"
        />

        {tooltip && (
          <div
            className="absolute pointer-events-none bg-gray-900 text-white px-3 py-2 rounded-lg text-sm shadow-lg z-50 max-w-xs"
            style={{ left: tooltip.x + 15, top: tooltip.y - 10 }}
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
          </div>
        )}
      </div>
    </div>
  );
}
