/**
 * Bill Analysis API - Fetches bill with related data directly from Congress.gov
 * POST /api/bills/analyze
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchBillComplete } from '@/services/congress-api';

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

    const data = await fetchBillComplete(billId);

    // Build response in the shape the frontend expects
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
        timeline: [
          {
            date: data.bill.introducedDate,
            event: 'Introduced',
            document: data.bill.title,
          },
          ...(data.bill.statusDate ? [{
            date: data.bill.statusDate,
            event: data.bill.status,
            document: data.bill.title,
          }] : []),
        ],
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
