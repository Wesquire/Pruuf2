/**
 * GET /api/members/notification-preferences
 * Get notification preferences for the authenticated user
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, authenticateRequest } from '../../_shared/auth.ts';
import { errorResponse, successResponse, handleError } from '../../_shared/errors.ts';
import { getSupabaseClient } from '../../_shared/db.ts';

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Only allow GET
    if (req.method !== 'GET') {
      return errorResponse('Method not allowed', 405);
    }

    // Authenticate user
    const user = await authenticateRequest(req);

    const supabase = getSupabaseClient();

    // Get Member profile if user is a Member
    if (user.is_member) {
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('reminder_enabled, reminder_minutes_before')
        .eq('user_id', user.id)
        .single();

      if (memberError) {
        console.error('Error fetching member preferences:', memberError);
      }

      return successResponse({
        preferences: {
          reminder_enabled: member?.reminder_enabled ?? true,
          reminder_minutes_before: member?.reminder_minutes_before ?? 15,
          push_notifications_enabled: true, // Would come from user preferences table
          sms_notifications_enabled: true, // Would come from user preferences table
        },
      });
    }

    // For Contacts (non-Members), return basic notification preferences
    return successResponse({
      preferences: {
        reminder_enabled: false, // Contacts don't get check-in reminders
        reminder_minutes_before: null,
        push_notifications_enabled: true,
        sms_notifications_enabled: true,
      },
    });
  } catch (error) {
    return handleError(error);
  }
});
