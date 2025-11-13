import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ApiResponse, Bill } from '@/types';

/**
 * GET /api/bills
 * Fetch all bills with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status');
    const congress = searchParams.get('congress');

    // Validate pagination parameters
    if (page < 1 || pageSize < 1 || pageSize > 100) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: {
            code: 'INVALID_PARAMETERS',
            message: 'Invalid pagination parameters',
          },
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Build query
    let query = supabase
      .from('bills')
      .select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (congress) {
      const congressNum = parseInt(congress);
      if (isNaN(congressNum)) {
        return NextResponse.json<ApiResponse<never>>(
          {
            success: false,
            error: {
              code: 'INVALID_PARAMETERS',
              message: 'Invalid congress number',
            },
          },
          { status: 400 }
        );
      }
      query = query.eq('congress', congressNum);
    }

    // Apply pagination and ordering
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order('last_action_date', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch bills',
          },
        },
        { status: 500 }
      );
    }

    // Transform data to match Bill type
    const bills: Bill[] = data.map((row: any) => ({
      id: row.id,
      number: row.number,
      title: row.title,
      sponsor: row.sponsor,
      status: row.status,
      congress: row.congress,
      chamber: row.chamber,
      introducedDate: row.introduced_date,
      lastActionDate: row.last_action_date,
      summary: row.summary,
      bigPicture: row.big_picture,
      sections: [], // Sections loaded separately
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json<ApiResponse<Bill[]>>({
      success: true,
      data: bills,
      meta: {
        page,
        pageSize,
        total: count || 0,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching bills:', error);
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch bills',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bills
 * Create a new bill (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Admin access required',
          },
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    // TODO: Validate request body with billSchema

    // Insert bill
    const { data, error } = await supabase
      .from('bills')
      .insert({
        number: body.number,
        title: body.title,
        sponsor: body.sponsor,
        status: body.status,
        congress: body.congress,
        chamber: body.chamber,
        introduced_date: body.introducedDate,
        last_action_date: body.lastActionDate,
        summary: body.summary,
        big_picture: body.bigPicture,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to create bill',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<typeof data>>({
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating bill:', error);
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create bill',
        },
      },
      { status: 500 }
    );
  }
}
