/**
 * POST /api/members/:memberId/check-in
 * Member performs daily check-in
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
  validateTimezone,
} from '../../_shared/errors.ts';
import {
  getMemberByUserId,
  getTodayCheckIn,
  createCheckIn,
  getMemberContacts,
} from '../../_shared/db.ts';
import {sendLateCheckInAlert} from '../../_shared/dualNotifications.ts';

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

    // Authenticate user (Member)
    const memberUser = await authenticateRequest(req);

    // Get member_id from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const memberIdFromUrl = pathParts[pathParts.length - 2]; // /api/members/:id/check-in

    // Parse request body
    const body = await req.json();

    // Validate required fields
    validateRequiredFields(body, ['timezone']);

    const {timezone} = body;

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

    // Check if onboarding completed
    if (!memberProfile.onboarding_completed) {
      throw new ApiError(
        'Please complete onboarding first',
        400,
        ErrorCodes.ONBOARDING_INCOMPLETE,
      );
    }

    // Check if check_in_time is set
    if (!memberProfile.check_in_time) {
      throw new ApiError(
        'Check-in time not set. Please set your check-in time in settings',
        400,
        ErrorCodes.CHECK_IN_TIME_NOT_SET,
      );
    }

    // Check if already checked in today
    const existingCheckIn = await getTodayCheckIn(memberUser.id, timezone);

    if (existingCheckIn) {
      // Already checked in today - return existing check-in
      return successResponse({
        check_in: {
          id: existingCheckIn.id,
          checked_in_at: existingCheckIn.checked_in_at,
          timezone: existingCheckIn.timezone,
          is_late: false,
          minutes_late: 0,
        },
        message: 'You have already checked in today',
      });
    }

    // Create check-in record
    const checkIn = await createCheckIn(memberUser.id, timezone);

    // Calculate if check-in is late
    const now = new Date();
    const [hours, minutes] = memberProfile.check_in_time.split(':').map(Number);

    // Create deadline in member's timezone
    const deadline = new Date();
    deadline.setHours(hours, minutes, 0, 0);

    const minutesLate = Math.floor(
      (now.getTime() - deadline.getTime()) / 1000 / 60,
    );
    const isLate = minutesLate > 0;

    // If late, notify all contacts
    if (isLate && minutesLate > 5) {
      // Only notify if more than 5 minutes late
      const contacts = await getMemberContacts(memberUser.id);

      // Format check-in time for notification
      const checkInTimeStr = new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      // Send notifications to all contacts via dual notification service (push + email)
      for (const contact of contacts) {
        await sendLateCheckInAlert(
          contact.user.id,
          contact.user.email,
          memberProfile.name,
          minutesLate,
          checkInTimeStr,
        );
      }
    }

    // Return check-in data
    return successResponse(
      {
        check_in: {
          id: checkIn.id,
          checked_in_at: checkIn.checked_in_at,
          timezone: checkIn.timezone,
          is_late: isLate,
          minutes_late: isLate ? minutesLate : 0,
        },
        message: isLate
          ? `Check-in recorded (${minutesLate} minutes late). Your contacts have been notified.`
          : 'Check-in recorded successfully!',
      },
      201,
    );
  } catch (error) {
    return handleError(error);
  }
});
