/**
 * POST /api/members/complete-onboarding
 * Complete member onboarding
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, authenticateRequest } from '../../_shared/auth.ts';
import { ApiError, ErrorCodes, errorResponse, successResponse, handleError, validateRequiredFields, validateTimeFormat, validateTimezone } from '../../_shared/errors.ts';
import { getMemberByUserId, updateMember } from '../../_shared/db.ts';
import { sendWelcomeNotification } from '../../_shared/push.ts';
import { sendWelcomeSms } from '../../_shared/sms.ts';
import type { Member } from '../../_shared/types.ts';

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Only allow POST
    if (req.method !== 'POST') {
      return errorResponse('Method not allowed', 405);
    }

    // Authenticate user (Member)
    const memberUser = await authenticateRequest(req);

    // Parse request body
    const body = await req.json();

    // Validate required fields
    validateRequiredFields(body, ['member_id', 'check_in_time', 'timezone']);

    const { member_id, check_in_time, timezone, reminder_enabled } = body;

    // Validate time format (HH:MM)
    validateTimeFormat(check_in_time);

    // Validate timezone
    validateTimezone(timezone);

    // Get member profile
    const memberProfile = await getMemberByUserId(memberUser.id);

    if (!memberProfile) {
      throw new ApiError(
        'Member profile not found',
        404,
        ErrorCodes.NOT_FOUND
      );
    }

    // Verify member_id matches
    if (memberProfile.id !== member_id) {
      throw new ApiError(
        'Unauthorized',
        403,
        ErrorCodes.UNAUTHORIZED
      );
    }

    // Check if already completed
    if (memberProfile.onboarding_completed) {
      // Idempotent - just return success
      return successResponse({
        member: {
          id: memberProfile.id,
          user_id: memberProfile.user_id,
          name: memberProfile.name,
          check_in_time: memberProfile.check_in_time,
          timezone: memberProfile.timezone,
          reminder_enabled: memberProfile.reminder_enabled,
          onboarding_completed: true,
          onboarding_completed_at: memberProfile.onboarding_completed_at,
        },
        message: 'Onboarding already completed',
      });
    }

    // Update member profile
    const updatedMember = await updateMember(memberProfile.id, {
      check_in_time,
      timezone,
      reminder_enabled: reminder_enabled !== undefined ? reminder_enabled : true,
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
    } as Partial<Member>);

    // Send welcome notification
    await sendWelcomeNotification(memberUser.id, memberProfile.name);

    // Send welcome SMS
    await sendWelcomeSms(memberUser.phone, memberProfile.name);

    // Return updated member data
    return successResponse({
      member: {
        id: updatedMember.id,
        user_id: updatedMember.user_id,
        name: updatedMember.name,
        check_in_time: updatedMember.check_in_time,
        timezone: updatedMember.timezone,
        reminder_enabled: updatedMember.reminder_enabled,
        onboarding_completed: updatedMember.onboarding_completed,
        onboarding_completed_at: updatedMember.onboarding_completed_at,
      },
      message: 'Onboarding completed successfully!',
    });
  } catch (error) {
    return handleError(error);
  }
});
