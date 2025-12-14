/**
 * DELETE /api/sessions/revoke
 * Revoke (logout) a specific session
 *
 * Request Body:
 * - session_id: UUID of session to revoke
 * - revoke_all: boolean (optional) - revoke all sessions except current
 */

import {serve} from 'https://deno.land/std@0.168.0/http/server.ts';
import {handleCors, authenticateRequest} from '../../_shared/auth.ts';
import {
  ApiError,
  ErrorCodes,
  errorResponse,
  successResponse,
  handleError,
  validateRequiredFields,
} from '../../_shared/errors.ts';
import {getSupabaseClient} from '../../_shared/db.ts';
import {logAuditEvent} from '../../_shared/auditLogger.ts';

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    // Only allow DELETE
    if (req.method !== 'DELETE') {
      return errorResponse('Method not allowed', 405);
    }

    // Authenticate user
    const user = await authenticateRequest(req);

    // Parse request body
    const body = await req.json();

    const supabase = getSupabaseClient();

    // Option 1: Revoke all sessions (logout from all devices)
    if (body.revoke_all === true) {
      const {data, error} = await supabase.rpc('revoke_all_user_sessions', {
        p_user_id: user.id,
        p_except_session_id: body.except_current
          ? body.current_session_id
          : null,
        p_revoked_by: 'user',
        p_reason: 'User initiated logout from all devices',
      });

      if (error) {
        console.error('Error revoking all sessions:', error);
        return errorResponse('Failed to revoke sessions', 500);
      }

      // Log audit event
      await logAuditEvent(
        req,
        user,
        'session_logout_all',
        'security',
        'success',
        {
          sessions_revoked: data,
          kept_current: body.except_current || false,
        },
      );

      return successResponse({
        message: 'All sessions revoked successfully',
        sessions_revoked: data || 0,
      });
    }

    // Option 2: Revoke specific session
    validateRequiredFields(body, ['session_id']);

    const {session_id} = body;

    // Revoke the specific session
    const {data, error} = await supabase.rpc('revoke_session', {
      p_session_id: session_id,
      p_user_id: user.id,
      p_revoked_by: 'user',
      p_reason: 'User initiated remote logout',
    });

    if (error) {
      console.error('Error revoking session:', error);
      return errorResponse('Failed to revoke session', 500);
    }

    if (!data) {
      throw new ApiError(
        'Session not found or already revoked',
        404,
        ErrorCodes.NOT_FOUND,
      );
    }

    // Log audit event
    await logAuditEvent(
      req,
      user,
      'session_logout_remote',
      'security',
      'success',
      {
        session_id,
      },
    );

    return successResponse({
      message: 'Session revoked successfully',
    });
  } catch (error) {
    return handleError(error);
  }
});
