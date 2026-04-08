'use client';

import { useEffect, useRef, useState } from 'react';

interface Member {
  name: string;
  party: string;
  state: string;
  vote: 'Yea' | 'Nay' | 'Not Voting' | 'Present';
}

interface VoteHemicycleProps {
  title: string;
  members: Member[];
  totalSeats: number;
}

export default function VoteHemicycle({ title, members, totalSeats }: VoteHemicycleProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; member: Member } | null>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 350 });

  useEffect(() => {
    function handleResize() {
      const container = svgRef.current?.parentElement;
      if (container) {
        const w = Math.min(container.clientWidth, 800);
        setDimensions({ width: w, height: w * 0.55 });
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { width, height } = dimensions;
  const centerX = width / 2;
  const centerY = height - 20;
  const maxRadius = Math.min(width / 2 - 20, height - 40);
  const minRadius = maxRadius * 0.35;

  // Sort members: Dems on left, Reps on right, others in middle
  const sorted = [...members].sort((a, b) => {
    const order = (p: string) => p === 'D' ? 0 : p === 'R' ? 2 : 1;
    return order(a.party) - order(b.party);
  });

  // Calculate positions in a hemicycle
  const rows = Math.ceil(Math.sqrt(sorted.length / 3));
  const dots: Array<{ x: number; y: number; member: Member; radius: number }> = [];

  let memberIdx = 0;
  for (let row = 0; row < rows && memberIdx < sorted.length; row++) {
    const rowRadius = minRadius + (maxRadius - minRadius) * (row / (rows - 1 || 1));
    const circumference = Math.PI * rowRadius;
    const dotsInRow = Math.min(
      Math.floor(circumference / 8),
      sorted.length - memberIdx
    );
    const dotRadius = Math.max(2, Math.min(5, (width / totalSeats) * 1.5));

    for (let i = 0; i < dotsInRow && memberIdx < sorted.length; i++) {
      const angle = Math.PI - (Math.PI * (i + 0.5)) / dotsInRow;
      const x = centerX + rowRadius * Math.cos(angle);
      const y = centerY - rowRadius * Math.sin(angle);
      dots.push({ x, y, member: sorted[memberIdx], radius: dotRadius });
      memberIdx++;
    }
  }

  // Vote counts
  const yea = members.filter(m => m.vote === 'Yea').length;
  const nay = members.filter(m => m.vote === 'Nay').length;
  const notVoting = members.filter(m => m.vote === 'Not Voting' || m.vote === 'Present').length;
  const demYea = members.filter(m => m.party === 'D' && m.vote === 'Yea').length;
  const demNay = members.filter(m => m.party === 'D' && m.vote === 'Nay').length;
  const repYea = members.filter(m => m.party === 'R' && m.vote === 'Yea').length;
  const repNay = members.filter(m => m.party === 'R' && m.vote === 'Nay').length;

  function getDotColor(member: Member): string {
    if (member.vote === 'Not Voting' || member.vote === 'Present') return '#d1d5db';
    if (member.party === 'D') return member.vote === 'Yea' ? '#2563eb' : '#93c5fd';
    if (member.party === 'R') return member.vote === 'Yea' ? '#dc2626' : '#fca5a5';
    return member.vote === 'Yea' ? '#6b7280' : '#e5e7eb';
  }

  function getDotStroke(member: Member): string {
    if (member.vote === 'Nay') return member.party === 'D' ? '#2563eb' : member.party === 'R' ? '#dc2626' : '#6b7280';
    return 'none';
  }

  return (
    <div className="w-full">
      <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">{title}</h3>

      {/* Vote Summary Bar */}
      <div className="flex items-center justify-center gap-6 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-700">{yea}</div>
          <div className="text-xs text-gray-500 uppercase">Yea</div>
        </div>
        <div className="flex-1 max-w-xs h-4 bg-gray-200 rounded-full overflow-hidden flex">
          <div className="bg-green-600 h-full" style={{ width: `${(yea / (yea + nay + notVoting)) * 100}%` }} />
          <div className="bg-red-500 h-full" style={{ width: `${(nay / (yea + nay + notVoting)) * 100}%` }} />
          <div className="bg-gray-300 h-full" style={{ width: `${(notVoting / (yea + nay + notVoting)) * 100}%` }} />
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{nay}</div>
          <div className="text-xs text-gray-500 uppercase">Nay</div>
        </div>
        {notVoting > 0 && (
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400">{notVoting}</div>
            <div className="text-xs text-gray-500 uppercase">Not Voting</div>
          </div>
        )}
      </div>

      {/* Hemicycle SVG */}
      <div className="relative w-full flex justify-center">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="max-w-full"
        >
          {dots.map((dot, i) => (
            <circle
              key={i}
              cx={dot.x}
              cy={dot.y}
              r={dot.radius}
              fill={getDotColor(dot.member)}
              stroke={getDotStroke(dot.member)}
              strokeWidth={dot.member.vote === 'Nay' ? 1.5 : 0}
              className="cursor-pointer transition-all hover:r-[8]"
              onMouseEnter={(e) => {
                const rect = svgRef.current?.getBoundingClientRect();
                if (rect) {
                  setTooltip({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top - 10,
                    member: dot.member,
                  });
                }
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          ))}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute pointer-events-none bg-gray-900 text-white px-3 py-2 rounded-lg text-sm shadow-lg z-50 whitespace-nowrap"
            style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)' }}
          >
            <div className="font-bold">{tooltip.member.name}</div>
            <div className="text-gray-300">
              {tooltip.member.party === 'D' ? 'Democrat' : tooltip.member.party === 'R' ? 'Republican' : tooltip.member.party} — {tooltip.member.state}
            </div>
            <div className={tooltip.member.vote === 'Yea' ? 'text-green-400' : tooltip.member.vote === 'Nay' ? 'text-red-400' : 'text-gray-400'}>
              Voted: {tooltip.member.vote}
            </div>
          </div>
        )}
      </div>

      {/* Party Breakdown */}
      <div className="flex justify-center gap-8 mt-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-600" />
            <span className="text-sm text-gray-700">Dem Yea: {demYea}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-300" />
            <span className="text-sm text-gray-700">Dem Nay: {demNay}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600" />
            <span className="text-sm text-gray-700">Rep Yea: {repYea}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-300" />
            <span className="text-sm text-gray-700">Rep Nay: {repNay}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
