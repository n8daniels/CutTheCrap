import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ApiResponse, Bill } from '@/types';

/**
 * GET /api/bills
 * Fetch all bills with pagination
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

    // Build query
    let whereClause = '';
    const params: unknown[] = [];

    if (status) {
      params.push(status);
      whereClause += `WHERE status = $${params.length}`;
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
      params.push(congressNum);
      whereClause += whereClause
        ? ` AND congress = $${params.length}`
        : `WHERE congress = $${params.length}`;
    }

    // Get total count
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM bills ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get bills
    params.push(pageSize, (page - 1) * pageSize);
    const result = await query<Bill>(
      `SELECT id, number, title, sponsor, status, congress, chamber,
              introduced_date as "introducedDate",
              last_action_date as "lastActionDate",
              summary, big_picture as "bigPicture",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM bills
       ${whereClause}
       ORDER BY last_action_date DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return NextResponse.json<ApiResponse<Bill[]>>({
      success: true,
      data: result.rows,
      meta: {
        page,
        pageSize,
        total,
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
 * Create a new bill (admin only - authentication required)
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication middleware
    // For now, return 401 Unauthorized
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

    // Implementation will be:
    // 1. Verify JWT token
    // 2. Check user has admin role
    // 3. Validate request body with billSchema
    // 4. Insert into database
    // 5. Return created bill
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
