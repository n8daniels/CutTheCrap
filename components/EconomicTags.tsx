import { EconomicTag } from '@/types';

interface EconomicTagsProps {
  tags: EconomicTag[];
}

const tagColors: Record<EconomicTag, string> = {
  [EconomicTag.CAPITALIST]: 'bg-blue-100 text-blue-800',
  [EconomicTag.CORPORATIST]: 'bg-purple-100 text-purple-800',
  [EconomicTag.SOCIALIST]: 'bg-red-100 text-red-800',
  [EconomicTag.LIBERTARIAN]: 'bg-yellow-100 text-yellow-800',
  [EconomicTag.AUTHORITARIAN]: 'bg-gray-700 text-white',
  [EconomicTag.KEYNESIAN]: 'bg-indigo-100 text-indigo-800',
  [EconomicTag.FREE_MARKET]: 'bg-green-100 text-green-800',
  [EconomicTag.REGULATED]: 'bg-orange-100 text-orange-800',
  [EconomicTag.REDISTRIBUTIVE]: 'bg-pink-100 text-pink-800',
};

const tagLabels: Record<EconomicTag, string> = {
  [EconomicTag.CAPITALIST]: 'Capitalist',
  [EconomicTag.CORPORATIST]: 'Corporatist',
  [EconomicTag.SOCIALIST]: 'Socialist',
  [EconomicTag.LIBERTARIAN]: 'Libertarian',
  [EconomicTag.AUTHORITARIAN]: 'Authoritarian',
  [EconomicTag.KEYNESIAN]: 'Keynesian',
  [EconomicTag.FREE_MARKET]: 'Free Market',
  [EconomicTag.REGULATED]: 'Regulated',
  [EconomicTag.REDISTRIBUTIVE]: 'Redistributive',
};

export default function EconomicTags({ tags }: EconomicTagsProps) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className={`px-2 py-1 rounded text-xs font-medium ${tagColors[tag]}`}
        >
          {tagLabels[tag]}
        </span>
      ))}
    </div>
  );
}
