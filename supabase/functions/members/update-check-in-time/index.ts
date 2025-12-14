/**
 * PATCH /api/members/:memberId/check-in-time
 * Update member's check-in time
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
  validateTimeFormat,
  validateTimezone,
} from '../../_shared/errors.ts';
import {
  getMemberByUserId,
  updateMember,
  getMemberContacts,
} from '../../_shared/db.ts';
import {sendCheckInTimeChangedNotification} from '../../_shared/push.ts';
import type {Member} from '../../_shared/types.ts';

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

    // Authenticate user (Member)
    const memberUser = await authenticateRequest(req);

    // Get member_id from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const memberIdFromUrl = pathParts[pathParts.length - 2]; // /api/members/:id/check-in-time

    // Parse request body
    const body = await req.json();

    // Validate required fields
    validateRequiredFields(body, ['check_in_time', 'timezone']);

    const {check_in_time, timezone, reminder_enabled} = body;

    // Validate time format (HH:MM)
    validateTimeFormat(check_in_time);

    // Validate timezone
    validateTimezone(timezone);

    // Get member profile
    const memberProfile = await getMemberByUserId(memberUser.id);

    if (!memberProfile) {
      throw new ApiError('Member profile not found', 404, ErrorCodes.NOT_FOUND);
    }

    // Verify member_id matches authenticated user
    if (memberProfile.id !== memberIdFromUrl) {
      throw new ApiError('Unauthorized', 403, ErrorCodes.UNAUTHORIZED);
    }

    // Update member's check-in time
    const updatedMember = await updateMember(memberProfile.id, {
      check_in_time,
      timezone,
      ...(reminder_enabled !== undefined && {reminder_enabled}),
    } as Partial<Member>);

    // Notify all contacts about the change
    const contacts = await getMemberContacts(memberUser.id);

    for (const contact of contacts) {
      // Send push notification
      await sendCheckInTimeChangedNotification(
        contact.user.id,
        memberProfile.name,
        check_in_time,
      );
    }

    // Return updated member data
    return successResponse({
      member: {
        id: updatedMember.id,
        check_in_time: updatedMember.check_in_time,
        timezone: updatedMember.timezone,
        reminder_enabled: updatedMember.reminder_enabled,
      },
      message: 'Check-in time updated successfully',
    });
  } catch (error) {
    return handleError(error);
  }
});
