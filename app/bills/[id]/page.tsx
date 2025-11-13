import { notFound } from 'next/navigation';
import BillHeader from '@/components/BillHeader';
import BigPictureCard from '@/components/BigPictureCard';
import BillSection from '@/components/BillSection';
import PartisanTakes from '@/components/PartisanTakes';
import VoteMap from '@/components/VoteMap';
import { Bill, ApiResponse } from '@/types';

async function getBill(id: string): Promise<Bill | null> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/bills/${id}`,
      {
        cache: 'no-store', // Always fetch fresh data
      }
    );

    if (!response.ok) {
      return null;
    }

    const result: ApiResponse<Bill> = await response.json();

    if (!result.success || !result.data) {
      return null;
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching bill:', error);
    return null;
  }
}

export default async function BillPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const bill = await getBill(id);

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
