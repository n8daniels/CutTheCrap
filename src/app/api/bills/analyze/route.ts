/**
 * Bill Analysis API - Fetches bill with related data, AI summary, and donor connections
 * POST /api/bills/analyze
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchBillComplete } from '@/services/congress-api';
import { fetchBillActions } from '@/services/congress-members-api';
import { generateBillSummary } from '@/services/gemini-api';
import { generateBillSummaryHF } from '@/services/huggingface-api';
import { resolveMemberIds } from '@/lib/member-ids';
import { fetchFullDonorProfile } from '@/services/fec-api';

const requestSchema = z.object({
  billId: z.string().regex(/^\d+\/[a-z]+\/\d+$/, 'Invalid bill ID format'),
  includeDependencies: z.boolean().default(true),
  maxDepth: z.number().min(0).max(3).default(2),
  forceRefresh: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { billId } = requestSchema.parse(body);

    console.log(`Analyzing bill ${billId}...`);

    const [congress, type, number] = billId.split('/');

    // Fetch bill data and full actions timeline in parallel
    const [data, actions] = await Promise.all([
      fetchBillComplete(billId),
      fetchBillActions(parseInt(congress), type, parseInt(number)).catch(() => []),
    ]);

    // Generate AI summary — try Gemini first, fall back to HuggingFace
    const summaryInput = {
      id: billId,
      title: data.bill.title,
      summary: data.summary,
      sponsors: data.bill.sponsors,
      policyArea: data.bill.policyArea,
      introducedDate: data.bill.introducedDate,
    };

    const aiSummaryPromise = (async () => {
      // Try Gemini first
      const geminiResult = await generateBillSummary(summaryInput).catch(() => null);
      if (geminiResult) return geminiResult;

      // Fall back to HuggingFace
      console.log('Gemini unavailable, falling back to HuggingFace...');
      return generateBillSummaryHF(summaryInput).catch(() => null);
    })();

    // Resolve sponsor IDs and fetch donor data (non-blocking)
    const sponsorDonorPromise = (async () => {
      try {
        const sponsors = data.bill.sponsors || [];
        if (sponsors.length === 0) return [];

        const donorResults = await Promise.all(
          sponsors.slice(0, 3).map(async (sponsor: any) => {
            const ids = await resolveMemberIds(sponsor.bioguideId);
            if (!ids?.fecIds?.[0]) return { sponsor, donorProfile: null };

            const donorProfile = await fetchFullDonorProfile(ids.fecIds[0]).catch(() => null);
            return { sponsor, donorProfile, memberIds: ids };
          })
        );

        return donorResults;
      } catch {
        return [];
      }
    })();

    // Wait for AI summary and donor data
    const [aiSummary, sponsorDonors] = await Promise.all([
      aiSummaryPromise,
      sponsorDonorPromise,
    ]);

    // Build full timeline from actions
    const fullTimeline = actions.length > 0
      ? actions.map((a: any) => ({
          date: a.date,
          event: a.text,
          type: a.type,
          chamber: a.chamber,
          rollCallNumber: a.rollCallNumber,
        }))
      : [
          { date: data.bill.introducedDate, event: 'Introduced', type: 'IntroReferral' },
          ...(data.bill.statusDate ? [{ date: data.bill.statusDate, event: data.bill.status, type: 'Action' }] : []),
        ];

    const response = {
      bill: {
        id: data.bill.id,
        type: 'bill',
        title: data.bill.title,
        content: data.summary || 'No summary available. Check Congress.gov for full text.',
        metadata: {
          status: data.bill.status,
          last_action: data.bill.status,
          last_action_date: data.bill.statusDate,
          congress: data.bill.congress,
          chamber: data.bill.originChamber,
          introduced: data.bill.introducedDate,
          policyArea: data.bill.policyArea,
          becameLaw: data.bill.becameLaw,
          sponsors: data.bill.sponsors,
        },
      },
      aiSummary: aiSummary || null,
      sponsorDonors: sponsorDonors || [],
      documentGraph: {
        totalNodes: 1 + data.amendments.length + data.relatedBills.length,
      },
      aiContext: {
        dependencies: [
          ...data.amendments.map(a => ({
            id: `amendment-${a.number}`,
            title: `Amendment ${a.number}`,
            type: 'amendment',
            relationship: 'Amends this bill',
            summary: a.purpose,
            relevantSections: [],
          })),
          ...data.relatedBills.map(rb => ({
            id: rb.id,
            title: rb.title,
            type: 'bill',
            relationship: rb.relationship,
            summary: rb.status,
            relevantSections: [],
          })),
        ],
        timeline: fullTimeline,
        metadata: {
          cacheHits: 0,
          totalDocuments: 1 + data.amendments.length + data.relatedBills.length,
          sponsors: data.bill.sponsors,
          cosponsors: data.cosponsors,
          amendmentCount: data.metadata.amendmentCount,
          relatedBillCount: data.metadata.relatedBillCount,
          cosponsorCount: data.metadata.cosponsorCount,
        },
      },
      metadata: {
        cached: false,
        fetchTimeMs: Date.now() - startTime,
        documentsIncluded: 1 + data.amendments.length + data.relatedBills.length,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error analyzing bill:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred while analyzing the bill' },
      { status: 500 }
    );
  }
}
