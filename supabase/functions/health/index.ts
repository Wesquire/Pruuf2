/**
 * GET /api/health
 * Health check endpoint for monitoring and load balancers
 *
 * Returns service status, version, and database connectivity
 */

import {serve} from 'https://deno.land/std@0.168.0/http/server.ts';
import {handleCors} from '../_shared/auth.ts';
import {getSupabaseClient} from '../_shared/db.ts';
import {successResponse, errorResponse} from '../_shared/errors.ts';

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    // Only allow GET
    if (req.method !== 'GET') {
      return errorResponse('Method not allowed', 405);
    }

    const startTime = Date.now();

    // Check database connectivity
    let dbStatus = 'healthy';
    let dbLatency = 0;

    try {
      const dbStart = Date.now();
      const supabase = getSupabaseClient();

      // Simple query to check connectivity
      const {error} = await supabase
        .from('users')
        .select('id')
        .limit(1)
        .single();

      dbLatency = Date.now() - dbStart;

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows, which is fine for health check
        dbStatus = 'unhealthy';
      }
    } catch (error) {
      dbStatus = 'unhealthy';
    }

    const totalLatency = Date.now() - startTime;

    // Build health check response
    const health = {
      status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime ? Math.floor(process.uptime()) : null,
      checks: {
        database: {
          status: dbStatus,
          latency_ms: dbLatency,
        },
      },
      latency_ms: totalLatency,
    };

    // Return 503 if unhealthy, 200 if healthy
    const statusCode = health.status === 'healthy' ? 200 : 503;

    return successResponse(health, statusCode);
  } catch (error) {
    return errorResponse('Health check failed', 503, 'HEALTH_CHECK_ERROR');
  }
});
