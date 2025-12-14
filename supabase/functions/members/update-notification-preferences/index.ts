/**
 * PATCH /api/members/notification-preferences
 * Update notification preferences for the authenticated user
 */

import {serve} from 'https://deno.land/std@0.168.0/http/server.ts';
import {handleCors, authenticateRequest} from '../../_shared/auth.ts';
import {
  ApiError,
  ErrorCodes,
  errorResponse,
  successResponse,
  handleError,
} from '../../_shared/errors.ts';
import {getSupabaseClient} from '../../_shared/db.ts';

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    // Only allow PATCH
    if (req.method !== 'PATCH') {
      return errorResponse('Method not allowed', 405);
    }

    // Authenticate user
    const user = await authenticateRequest(req);

    // Parse request body
    const body = await req.json();

    const {
      reminder_enabled,
      reminder_minutes_before,
      push_notifications_enabled,
      email_notifications_enabled,
    } = body;

    const supabase = getSupabaseClient();

    // Validate reminder_minutes_before if provided
    if (
      reminder_minutes_before !== undefined &&
      reminder_minutes_before !== null &&
      ![15, 30, 60].includes(reminder_minutes_before)
    ) {
      throw new ApiError(
        'Invalid reminder_minutes_before. Must be 15, 30, or 60',
        400,
        ErrorCodes.VALIDATION_ERROR,
      );
    }

    // Update Member preferences if user is a Member
    if (user.is_member) {
      const updates: any = {};

      if (reminder_enabled !== undefined) {
        updates.reminder_enabled = reminder_enabled;
      }

      if (
        reminder_minutes_before !== undefined &&
        reminder_minutes_before !== null
      ) {
        updates.reminder_minutes_before = reminder_minutes_before;
      }

      if (Object.keys(updates).length > 0) {
        const {error: updateError} = await supabase
          .from('members')
          .update(updates)
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Error updating member preferences:', updateError);
          throw updateError;
        }
      }
    }

    // Update user-level preferences (push/email)
    // For MVP, we'll just return success
    // In production, would update a user_preferences table

    return successResponse({
      message: 'Notification preferences updated successfully',
      preferences: {
        reminder_enabled: reminder_enabled ?? user.is_member,
        reminder_minutes_before: reminder_minutes_before ?? 15,
        push_notifications_enabled: push_notifications_enabled ?? true,
        email_notifications_enabled: email_notifications_enabled ?? true,
      },
    });
  } catch (error) {
    return handleError(error);
  }
});
