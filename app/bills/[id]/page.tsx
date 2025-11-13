import { notFound } from 'next/navigation';
import BillHeader from '@/components/BillHeader';
import BigPictureCard from '@/components/BigPictureCard';
import BillSection from '@/components/BillSection';
import PartisanTakes from '@/components/PartisanTakes';
import VoteMap from '@/components/VoteMap';
import { Bill } from '@/types';

// This would normally come from your database or API
async function getBill(id: string): Promise<Bill | null> {
  // TODO: Implement database query
  // For now, return null to demonstrate error handling
  return null;
}

export default async function BillPage({ params }: { params: { id: string } }) {
  const bill = await getBill(params.id);

  if (!bill) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <BillHeader bill={bill} />

      <BigPictureCard bigPicture={bill.bigPicture} />

      <div>
        <h2 className="text-xl md:text-2xl font-bold mb-4">Section Breakdown</h2>
        {bill.sections
          .sort((a, b) => a.order - b.order)
          .map((section) => (
            <BillSection key={section.id} section={section} />
          ))}
      </div>

      <PartisanTakes partisanTakes={bill.partisanTakes} />

      <VoteMap votes={bill.votes} />
    </div>
  );
}
