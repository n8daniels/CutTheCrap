import { PartisanTakes as PartisanTakesType } from '@/types';

interface PartisanTakesProps {
  partisanTakes?: PartisanTakesType;
}

export default function PartisanTakes({ partisanTakes }: PartisanTakesProps) {
  if (!partisanTakes) return null;

  return (
    <div className="space-y-4 mb-6">
      <h2 className="text-xl md:text-2xl font-bold">Partisan Perspectives</h2>
      <p className="text-sm text-text-muted">
        Verified perspectives from both sides of the aisle
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Democratic Perspective */}
        {partisanTakes.democratic && (
          <div className="card border-l-4 border-dem-blue">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-dem-blue">
                Democratic View
              </h3>
              {partisanTakes.democratic.verified && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  ✓ Verified
                </span>
              )}
            </div>

            <div className="mb-3">
              <div className="text-sm font-medium text-text-primary">
                {partisanTakes.democratic.authorName}
              </div>
              <div className="text-xs text-text-muted">
                {partisanTakes.democratic.authorTitle}
              </div>
            </div>

            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              {partisanTakes.democratic.perspective}
            </p>

            {partisanTakes.democratic.keyPoints.length > 0 && (
              <div className="mb-3">
                <h4 className="text-sm font-semibold text-text-primary mb-2">
                  Key Points
                </h4>
                <ul className="space-y-1">
                  {partisanTakes.democratic.keyPoints.map((point, idx) => (
                    <li key={idx} className="text-sm text-text-secondary">
                      • {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {partisanTakes.democratic.supports && partisanTakes.democratic.supports.length > 0 && (
              <div className="mb-3">
                <h4 className="text-sm font-semibold text-green-700 mb-2">Supports</h4>
                <ul className="space-y-1">
                  {partisanTakes.democratic.supports.map((item, idx) => (
                    <li key={idx} className="text-sm text-text-secondary">
                      ✓ {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {partisanTakes.democratic.concerns && partisanTakes.democratic.concerns.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-orange-700 mb-2">Concerns</h4>
                <ul className="space-y-1">
                  {partisanTakes.democratic.concerns.map((item, idx) => (
                    <li key={idx} className="text-sm text-text-secondary">
                      ⚠ {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Republican Perspective */}
        {partisanTakes.republican && (
          <div className="card border-l-4 border-rep-red">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-rep-red">
                Republican View
              </h3>
              {partisanTakes.republican.verified && (
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                  ✓ Verified
                </span>
              )}
            </div>

            <div className="mb-3">
              <div className="text-sm font-medium text-text-primary">
                {partisanTakes.republican.authorName}
              </div>
              <div className="text-xs text-text-muted">
                {partisanTakes.republican.authorTitle}
              </div>
            </div>

            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              {partisanTakes.republican.perspective}
            </p>

            {partisanTakes.republican.keyPoints.length > 0 && (
              <div className="mb-3">
                <h4 className="text-sm font-semibold text-text-primary mb-2">
                  Key Points
                </h4>
                <ul className="space-y-1">
                  {partisanTakes.republican.keyPoints.map((point, idx) => (
                    <li key={idx} className="text-sm text-text-secondary">
                      • {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {partisanTakes.republican.supports && partisanTakes.republican.supports.length > 0 && (
              <div className="mb-3">
                <h4 className="text-sm font-semibold text-green-700 mb-2">Supports</h4>
                <ul className="space-y-1">
                  {partisanTakes.republican.supports.map((item, idx) => (
                    <li key={idx} className="text-sm text-text-secondary">
                      ✓ {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {partisanTakes.republican.concerns && partisanTakes.republican.concerns.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-orange-700 mb-2">Concerns</h4>
                <ul className="space-y-1">
                  {partisanTakes.republican.concerns.map((item, idx) => (
                    <li key={idx} className="text-sm text-text-secondary">
                      ⚠ {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
