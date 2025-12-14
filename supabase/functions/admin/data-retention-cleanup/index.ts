/**
 * POST /api/admin/data-retention-cleanup
 * Runs data retention cleanup tasks
 *
 * This endpoint should be called by a scheduled cron job (e.g., daily at 2 AM)
 * Requires admin authorization via X-Admin-Secret header
 *
 * Environment Variables:
 * - ADMIN_SECRET: Secret key for admin operations
 */

import {serve} from 'https://deno.land/std@0.168.0/http/server.ts';
import {handleCors} from '../../_shared/auth.ts';
import {
  errorResponse,
  successResponse,
  handleError,
} from '../../_shared/errors.ts';
import {getSupabaseClient} from '../../_shared/db.ts';

// Admin secret for authorized access
const ADMIN_SECRET = Deno.env.get('ADMIN_SECRET') || 'change-me-in-production';

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    // Only allow POST
    if (req.method !== 'POST') {
      return errorResponse('Method not allowed', 405);
    }

    // Verify admin secret
    const adminSecret = req.headers.get('X-Admin-Secret');

    if (!adminSecret || adminSecret !== ADMIN_SECRET) {
      console.warn('Unauthorized cleanup attempt:', {
        ip: req.headers.get('X-Forwarded-For'),
        userAgent: req.headers.get('User-Agent'),
      });
      return errorResponse('Unauthorized', 401);
    }

    console.log('Starting data retention cleanup...');

    const startTime = Date.now();
    const supabase = getSupabaseClient();

    // Run the master cleanup function
    const {data: cleanupResults, error} = await supabase.rpc(
      'run_data_retention_cleanup',
    );

    if (error) {
      console.error('Cleanup execution error:', error);
      return errorResponse('Cleanup execution failed', 500, 'CLEANUP_ERROR');
    }

    const executionTimeMs = Date.now() - startTime;

    // Log each cleanup task result
    for (const result of cleanupResults || []) {
      await supabase.rpc('log_cleanup_execution', {
        p_task: result.task,
        p_records_processed: result.records_processed,
        p_execution_time_ms: executionTimeMs,
        p_success: true,
        p_error_message: null,
      });

      console.log(
        `Cleanup task completed: ${result.task} - ${result.records_processed} records processed`,
      );
    }

    // Calculate total records processed
    const totalRecords = (cleanupResults || []).reduce(
      (sum, result) => sum + result.records_processed,
      0,
    );

    console.log(`Data retention cleanup completed in ${executionTimeMs}ms`);
    console.log(`Total records processed: ${totalRecords}`);

    // Return summary
    return successResponse({
      message: 'Data retention cleanup completed successfully',
      execution_time_ms: executionTimeMs,
      total_records_processed: totalRecords,
      tasks: cleanupResults || [],
    });
  } catch (error) {
    console.error('Data retention cleanup error:', error);
    return handleError(error);
  }
});
