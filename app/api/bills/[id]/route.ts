import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ApiResponse, Bill, BillSection, VoteData, PartisanTakes } from '@/types';

/**
 * GET /api/bills/[id]
 * Fetch a single bill with all related data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = await createClient();

    // Fetch bill
    const { data: billData, error: billError } = await supabase
      .from('bills')
      .select('*')
      .eq('id', id)
      .single();

    if (billError || !billData) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Bill not found',
          },
        },
        { status: 404 }
      );
    }

    // Fetch sections
    const { data: sectionsData, error: sectionsError } = await supabase
      .from('bill_sections')
      .select('*')
      .eq('bill_id', id)
      .order('section_order', { ascending: true });

    if (sectionsError) {
      console.error('Error fetching sections:', sectionsError);
    }

    // Fetch votes
    const { data: votesData, error: votesError } = await supabase
      .from('votes')
      .select('*')
      .eq('bill_id', id);

    if (votesError) {
      console.error('Error fetching votes:', votesError);
    }

    // Fetch partisan perspectives
    const { data: perspectivesData, error: perspectivesError } = await supabase
      .from('partisan_perspectives')
      .select(`
        *,
        author:user_profiles(name, title)
      `)
      .eq('bill_id', id)
      .eq('verified', true);

    if (perspectivesError) {
      console.error('Error fetching perspectives:', perspectivesError);
    }

    // Transform data to Bill type
    const sections: BillSection[] = (sectionsData || []).map((row: any) => ({
      id: row.id,
      billId: row.bill_id,
      sectionNumber: row.section_number,
      title: row.title,
      preview: row.preview,
      simplifiedSummary: row.simplified_summary,
      deepDive: row.deep_dive,
      ideologyScore: row.ideology_score,
      politicalLean: row.political_lean,
      economicTags: row.economic_tags || [],
      riskNotes: row.risk_notes || [],
      rawText: row.raw_text,
      contentHash: row.content_hash,
      order: row.section_order,
    }));

    // Transform votes
    const votes: VoteData | undefined = votesData && votesData.length > 0
      ? {
          house: votesData.find((v: any) => v.chamber === 'house')
            ? {
                date: votesData.find((v: any) => v.chamber === 'house').vote_date,
                result: votesData.find((v: any) => v.chamber === 'house').result,
                yeas: votesData.find((v: any) => v.chamber === 'house').yeas,
                nays: votesData.find((v: any) => v.chamber === 'house').nays,
                present: votesData.find((v: any) => v.chamber === 'house').present,
                notVoting: votesData.find((v: any) => v.chamber === 'house').not_voting,
                breakdown: votesData.find((v: any) => v.chamber === 'house').breakdown,
              }
            : undefined,
          senate: votesData.find((v: any) => v.chamber === 'senate')
            ? {
                date: votesData.find((v: any) => v.chamber === 'senate').vote_date,
                result: votesData.find((v: any) => v.chamber === 'senate').result,
                yeas: votesData.find((v: any) => v.chamber === 'senate').yeas,
                nays: votesData.find((v: any) => v.chamber === 'senate').nays,
                present: votesData.find((v: any) => v.chamber === 'senate').present,
                notVoting: votesData.find((v: any) => v.chamber === 'senate').not_voting,
                breakdown: votesData.find((v: any) => v.chamber === 'senate').breakdown,
              }
            : undefined,
        }
      : undefined;

    // Transform partisan perspectives
    const partisanTakes: PartisanTakes | undefined = perspectivesData && perspectivesData.length > 0
      ? {
          democratic: perspectivesData.find((p: any) => p.party === 'democratic')
            ? {
                authorId: perspectivesData.find((p: any) => p.party === 'democratic').author_id,
                authorName: perspectivesData.find((p: any) => p.party === 'democratic').author.name,
                authorTitle: perspectivesData.find((p: any) => p.party === 'democratic').author.title,
                perspective: perspectivesData.find((p: any) => p.party === 'democratic').perspective,
                keyPoints: perspectivesData.find((p: any) => p.party === 'democratic').key_points || [],
                concerns: perspectivesData.find((p: any) => p.party === 'democratic').concerns,
                supports: perspectivesData.find((p: any) => p.party === 'democratic').supports,
                createdAt: perspectivesData.find((p: any) => p.party === 'democratic').created_at,
                verified: perspectivesData.find((p: any) => p.party === 'democratic').verified,
              }
            : undefined,
          republican: perspectivesData.find((p: any) => p.party === 'republican')
            ? {
                authorId: perspectivesData.find((p: any) => p.party === 'republican').author_id,
                authorName: perspectivesData.find((p: any) => p.party === 'republican').author.name,
                authorTitle: perspectivesData.find((p: any) => p.party === 'republican').author.title,
                perspective: perspectivesData.find((p: any) => p.party === 'republican').perspective,
                keyPoints: perspectivesData.find((p: any) => p.party === 'republican').key_points || [],
                concerns: perspectivesData.find((p: any) => p.party === 'republican').concerns,
                supports: perspectivesData.find((p: any) => p.party === 'republican').supports,
                createdAt: perspectivesData.find((p: any) => p.party === 'republican').created_at,
                verified: perspectivesData.find((p: any) => p.party === 'republican').verified,
              }
            : undefined,
        }
      : undefined;

    const bill: Bill = {
      id: billData.id,
      number: billData.number,
      title: billData.title,
      sponsor: billData.sponsor,
      status: billData.status,
      congress: billData.congress,
      chamber: billData.chamber,
      introducedDate: billData.introduced_date,
      lastActionDate: billData.last_action_date,
      summary: billData.summary,
      bigPicture: billData.big_picture,
      sections,
      votes,
      partisanTakes,
      createdAt: billData.created_at,
      updatedAt: billData.updated_at,
    };

    return NextResponse.json<ApiResponse<Bill>>({
      success: true,
      data: bill,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching bill:', error);
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch bill',
        },
      },
      { status: 500 }
    );
  }
}
