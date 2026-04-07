/**
 * Member Profile API — aggregates Congress.gov + FEC data
 * GET /api/members/D000191
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchMember, fetchMemberBills } from '@/services/congress-members-api';
import { resolveMemberIds } from '@/lib/member-ids';
import { fetchFullDonorProfile } from '@/services/fec-api';

export async function GET(
  request: NextRequest,
  { params }: { params: { bioguideId: string } }
) {
  const startTime = Date.now();

  try {
    const { bioguideId } = params;

    if (!bioguideId || !/^[A-Z]\d{6}$/.test(bioguideId)) {
      return NextResponse.json({ error: 'Invalid bioguide ID format' }, { status: 400 });
    }

    // Fetch member details and ID crosswalk in parallel
    const [member, memberIds] = await Promise.all([
      fetchMember(bioguideId),
      resolveMemberIds(bioguideId),
    ]);

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Fetch donor data and sponsored bills in parallel
    const fecId = memberIds?.fecIds?.[0] || null;

    const [donorProfile, sponsoredBills] = await Promise.all([
      fecId ? fetchFullDonorProfile(fecId).catch(() => null) : Promise.resolve(null),
      fetchMemberBills(bioguideId, 10).catch(() => []),
    ]);

    return NextResponse.json({
      member,
      donorProfile,
      sponsoredBills,
      ids: memberIds,
      metadata: {
        fetchTimeMs: Date.now() - startTime,
        hasDonorData: !!donorProfile?.financials,
      },
    });
  } catch (error) {
    console.error('Member API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch member data' },
      { status: 500 }
    );
  }
}
