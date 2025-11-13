import { BigPicture } from '@/types';
import PoliticalLeanBar from './PoliticalLeanBar';

interface BigPictureCardProps {
  bigPicture: BigPicture;
}

export default function BigPictureCard({ bigPicture }: BigPictureCardProps) {
  const sneakColors = [
    'bg-green-100 text-green-800',
    'bg-green-100 text-green-800',
    'bg-yellow-100 text-yellow-800',
    'bg-yellow-100 text-yellow-800',
    'bg-orange-100 text-orange-800',
    'bg-orange-100 text-orange-800',
    'bg-red-100 text-red-800',
    'bg-red-100 text-red-800',
    'bg-red-200 text-red-900',
    'bg-red-300 text-red-950',
    'bg-red-400 text-red-950',
  ];

  const sneakColor = sneakColors[Math.min(bigPicture.sneakIndex.score, 10)];

  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-bold">The Big Picture</h2>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${sneakColor}`}>
          Sneak Index: {bigPicture.sneakIndex.score}/10
        </div>
      </div>

      <div className="space-y-4">
        {/* Summary */}
        <div>
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-2">
            In Plain English
          </h3>
          <p className="text-text-primary leading-relaxed">{bigPicture.summary}</p>
        </div>

        {/* So What */}
        <div>
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-2">
            So What?
          </h3>
          <p className="text-text-primary leading-relaxed">{bigPicture.soWhat}</p>
        </div>

        {/* Winners and Losers */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-semibold text-green-700 mb-2">Who Wins</h3>
            <ul className="space-y-1">
              {bigPicture.winners.map((winner, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-text-primary">{winner}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-red-700 mb-2">Who Loses</h3>
            <ul className="space-y-1">
              {bigPicture.losers.map((loser, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-red-600 mt-1">✗</span>
                  <span className="text-text-primary">{loser}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sneak Index Details */}
        {bigPicture.sneakIndex.highlights.length > 0 && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-orange-700 mb-2">
              Hidden or High-Impact Items
            </h3>
            <ul className="space-y-1">
              {bigPicture.sneakIndex.highlights.map((highlight, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-orange-600 mt-1">⚠</span>
                  <span className="text-text-primary">{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Overall Political Lean */}
        <div>
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-2">
            Overall Political Lean
          </h3>
          <PoliticalLeanBar score={bigPicture.overallLean} showLabel />
        </div>
      </div>
    </div>
  );
}
