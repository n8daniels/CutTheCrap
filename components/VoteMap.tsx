import { VoteData, ChamberVote } from '@/types';

interface VoteMapProps {
  votes?: VoteData;
}

function ChamberVoteDisplay({ chamber, vote }: { chamber: string; vote: ChamberVote }) {
  const totalVotes = vote.yeas + vote.nays + vote.present + vote.notVoting;
  const yeaPercent = (vote.yeas / totalVotes) * 100;
  const nayPercent = (vote.nays / totalVotes) * 100;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold capitalize">{chamber}</h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            vote.result === 'passed'
              ? 'bg-green-100 text-green-800'
              : vote.result === 'failed'
              ? 'bg-red-100 text-red-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {vote.result.toUpperCase()}
        </span>
      </div>

      <div className="text-sm text-text-muted mb-4">
        {new Date(vote.date).toLocaleDateString()}
      </div>

      {/* Vote Bar */}
      <div className="h-8 rounded-lg overflow-hidden flex mb-4">
        <div
          className="bg-green-500 flex items-center justify-center text-white text-xs font-medium"
          style={{ width: `${yeaPercent}%` }}
        >
          {yeaPercent > 15 ? `${vote.yeas} Yea` : ''}
        </div>
        <div
          className="bg-red-500 flex items-center justify-center text-white text-xs font-medium"
          style={{ width: `${nayPercent}%` }}
        >
          {nayPercent > 15 ? `${vote.nays} Nay` : ''}
        </div>
      </div>

      {/* Vote Totals */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <div className="text-2xl font-bold text-green-600">{vote.yeas}</div>
          <div className="text-xs text-text-muted">Yea</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-red-600">{vote.nays}</div>
          <div className="text-xs text-text-muted">Nay</div>
        </div>
        {vote.present > 0 && (
          <div>
            <div className="text-lg font-semibold text-text-secondary">{vote.present}</div>
            <div className="text-xs text-text-muted">Present</div>
          </div>
        )}
        {vote.notVoting > 0 && (
          <div>
            <div className="text-lg font-semibold text-text-secondary">{vote.notVoting}</div>
            <div className="text-xs text-text-muted">Not Voting</div>
          </div>
        )}
      </div>

      {/* Party Breakdown */}
      <div className="border-t pt-4 space-y-3">
        <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wide">
          By Party
        </h4>

        {/* Democrats */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-dem-blue">Democrats</span>
            <span className="text-xs text-text-muted">
              {vote.breakdown.democratic.yeas + vote.breakdown.democratic.nays} votes
            </span>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="text-green-700">
              ✓ {vote.breakdown.democratic.yeas}
            </span>
            <span className="text-red-700">
              ✗ {vote.breakdown.democratic.nays}
            </span>
            {vote.breakdown.democratic.present > 0 && (
              <span className="text-text-muted">
                Present: {vote.breakdown.democratic.present}
              </span>
            )}
          </div>
        </div>

        {/* Republicans */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-rep-red">Republicans</span>
            <span className="text-xs text-text-muted">
              {vote.breakdown.republican.yeas + vote.breakdown.republican.nays} votes
            </span>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="text-green-700">
              ✓ {vote.breakdown.republican.yeas}
            </span>
            <span className="text-red-700">
              ✗ {vote.breakdown.republican.nays}
            </span>
            {vote.breakdown.republican.present > 0 && (
              <span className="text-text-muted">
                Present: {vote.breakdown.republican.present}
              </span>
            )}
          </div>
        </div>

        {/* Independents */}
        {(vote.breakdown.independent.yeas > 0 || vote.breakdown.independent.nays > 0) && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-neutral-gray">Independents</span>
              <span className="text-xs text-text-muted">
                {vote.breakdown.independent.yeas + vote.breakdown.independent.nays} votes
              </span>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="text-green-700">
                ✓ {vote.breakdown.independent.yeas}
              </span>
              <span className="text-red-700">
                ✗ {vote.breakdown.independent.nays}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VoteMap({ votes }: VoteMapProps) {
  if (!votes || (!votes.house && !votes.senate)) return null;

  return (
    <div className="mb-6">
      <h2 className="text-xl md:text-2xl font-bold mb-4">Vote Breakdown</h2>

      <div className="grid md:grid-cols-2 gap-4">
        {votes.house && <ChamberVoteDisplay chamber="house" vote={votes.house} />}
        {votes.senate && <ChamberVoteDisplay chamber="senate" vote={votes.senate} />}
      </div>
    </div>
  );
}
