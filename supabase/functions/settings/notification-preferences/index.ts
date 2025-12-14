/**
 * GET/PATCH /api/settings/notification-preferences
 * Manage user notification preferences (push and email toggles)
 *
 * IMPORTANT: Critical notifications always sent via at least one channel (safety override)
 */

import {serve} from 'https://deno.land/std@0.168.0/http/server.ts';
import {handleCors, authenticateRequest} from '../../_shared/auth.ts';
import {
  errorResponse,
  successResponse,
  handleError,
  validateRequiredFields,
} from '../../_shared/errors.ts';
import {getSupabaseClient, updateUser} from '../../_shared/db.ts';

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    // Authenticate user
    const user = await authenticateRequest(req);

    if (req.method === 'GET') {
      // GET: Return current notification preferences
      const supabase = getSupabaseClient();

      const {data: userData, error: userError} = await supabase
        .from('users')
        .select('push_notifications_enabled, email_notifications_enabled')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Error fetching notification preferences:', userError);
        throw userError;
      }

      return successResponse({
        preferences: {
          push_notifications_enabled:
            userData.push_notifications_enabled ?? true,
          email_notifications_enabled:
            userData.email_notifications_enabled ?? true,
        },
      });
    }

    if (req.method === 'PATCH') {
      // PATCH: Update notification preferences
      const body = await req.json();

      // Validate required fields
      validateRequiredFields(body, [
        'push_notifications_enabled',
        'email_notifications_enabled',
      ]);

      const {push_notifications_enabled, email_notifications_enabled} = body;

      // Validate types
      if (
        typeof push_notifications_enabled !== 'boolean' ||
        typeof email_notifications_enabled !== 'boolean'
      ) {
        return errorResponse(
          'Invalid preferences. Both must be boolean values.',
          400,
        );
      }

      // SAFETY RULE: At least one channel must be enabled for critical notifications
      // This prevents users from accidentally disabling all notification methods
      if (!push_notifications_enabled && !email_notifications_enabled) {
        return errorResponse(
          'At least one notification method must be enabled for critical safety alerts.',
          400,
        );
      }

      // Update user preferences
      await updateUser(user.id, {
        push_notifications_enabled,
        email_notifications_enabled,
      } as any);

      console.log(
        `Notification preferences updated for user ${user.id}: push=${push_notifications_enabled}, email=${email_notifications_enabled}`,
      );

      return successResponse({
        message: 'Notification preferences updated successfully',
        preferences: {
          push_notifications_enabled,
          email_notifications_enabled,
        },
      });
    }

    // Method not allowed
    return errorResponse('Method not allowed', 405);
  } catch (error) {
    return handleError(error);
  }
});
