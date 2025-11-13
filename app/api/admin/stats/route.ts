import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ApiResponse } from '@/types';

interface DatabaseStats {
  bills: number;
  sections: number;
  votes: number;
  perspectives: number;
  users: number;
  cacheEntries: number;
  auditLogs: number;
}

interface SystemHealth {
  supabase: 'healthy' | 'degraded' | 'down';
  ollama: 'healthy' | 'degraded' | 'down';
  cache: 'healthy' | 'degraded' | 'down';
}

interface AdminStats {
  database: DatabaseStats;
  health: SystemHealth;
  timestamp: string;
}

/**
 * GET /api/admin/stats
 * Get admin statistics (admin only)
 */
export async function GET(request: NextRequest) {
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

    // Fetch database statistics
    const [
      billsCount,
      sectionsCount,
      votesCount,
      perspectivesCount,
      usersCount,
      cacheCount,
      auditCount,
    ] = await Promise.all([
      supabase.from('bills').select('*', { count: 'exact', head: true }),
      supabase.from('bill_sections').select('*', { count: 'exact', head: true }),
      supabase.from('votes').select('*', { count: 'exact', head: true }),
      supabase.from('partisan_perspectives').select('*', { count: 'exact', head: true }),
      supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('content_cache').select('*', { count: 'exact', head: true }),
      supabase.from('audit_log').select('*', { count: 'exact', head: true }),
    ]);

    const databaseStats: DatabaseStats = {
      bills: billsCount.count || 0,
      sections: sectionsCount.count || 0,
      votes: votesCount.count || 0,
      perspectives: perspectivesCount.count || 0,
      users: usersCount.count || 0,
      cacheEntries: cacheCount.count || 0,
      auditLogs: auditCount.count || 0,
    };

    // Check system health
    const systemHealth: SystemHealth = {
      supabase: 'healthy', // If we got here, Supabase is working
      ollama: await checkOllamaHealth(),
      cache: 'healthy', // Cache is in Supabase, so if Supabase works, cache works
    };

    const stats: AdminStats = {
      database: databaseStats,
      health: systemHealth,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json<ApiResponse<AdminStats>>({
      success: true,
      data: stats,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch statistics',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Check Ollama service health
 */
async function checkOllamaHealth(): Promise<'healthy' | 'degraded' | 'down'> {
  try {
    const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const response = await fetch(`${baseUrl}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (response.ok) {
      return 'healthy';
    }
    return 'degraded';
  } catch (error) {
    return 'down';
  }
}
