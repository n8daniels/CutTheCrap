interface PoliticalLeanBarProps {
  score: number; // -5 to +5
  showLabel?: boolean;
}

export default function PoliticalLeanBar({ score, showLabel = false }: PoliticalLeanBarProps) {
  // Normalize score to 0-100 range for positioning
  const normalizedScore = ((score + 5) / 10) * 100;

  // Clamp between 0 and 100
  const position = Math.max(0, Math.min(100, normalizedScore));

  // Determine label text
  const getLabel = (score: number): string => {
    if (score <= -4) return 'Strongly Left';
    if (score <= -2) return 'Left';
    if (score < -0.5) return 'Lean Left';
    if (score <= 0.5) return 'Neutral';
    if (score < 2) return 'Lean Right';
    if (score < 4) return 'Right';
    return 'Strongly Right';
  };

  return (
    <div className="space-y-2">
      <div className="relative h-3 rounded-full bg-gradient-to-r from-dem-blue via-neutral-gray to-rep-red">
        {/* Indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-text-primary rounded-full shadow-md transition-all"
          style={{ left: `calc(${position}% - 0.5rem)` }}
        />
      </div>

      {showLabel && (
        <div className="flex justify-between text-xs text-text-muted">
          <span>Left</span>
          <span className="font-medium text-text-primary">{getLabel(score)}</span>
          <span>Right</span>
        </div>
      )}
    </div>
  );
}
