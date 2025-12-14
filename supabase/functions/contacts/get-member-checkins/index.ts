/**
 * GET /api/contacts/members/:id/check-ins
 * Get check-in history for a specific Member with statistics
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
    // Only allow GET
    if (req.method !== 'GET') {
      return errorResponse('Method not allowed', 405);
    }

    // Authenticate user (Contact)
    const contactUser = await authenticateRequest(req);

    // Extract member ID from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const memberUserId = pathParts[pathParts.indexOf('members') + 1];

    if (!memberUserId) {
      throw new ApiError(
        'Member ID is required',
        400,
        ErrorCodes.VALIDATION_ERROR,
      );
    }

    // Get filter parameter (7days, 30days, all)
    const filter = url.searchParams.get('filter') || '30days';

    const supabase = getSupabaseClient();

    // Verify Contact has access to this Member
    const {data: relationship, error: relationshipError} = await supabase
      .from('member_contact_relationships')
      .select('*')
      .eq('member_id', memberUserId)
      .eq('contact_id', contactUser.id)
      .is('deleted_at', null)
      .single();

    if (relationshipError || !relationship) {
      throw new ApiError(
        'Member not found or access denied',
        404,
        ErrorCodes.NOT_FOUND,
      );
    }

    // Get Member profile
    const {data: member, error: memberError} = await supabase
      .from('members')
      .select('*')
      .eq('user_id', memberUserId)
      .single();

    if (memberError || !member) {
      throw new ApiError('Member profile not found', 404, ErrorCodes.NOT_FOUND);
    }

    // Calculate date range based on filter
    const now = new Date();
    let startDate: Date;

    switch (filter) {
      case '7days':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30days':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        break;
      case 'all':
        startDate = new Date(0); // Epoch
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
    }

    // Get check-ins for the date range
    let query = supabase
      .from('check_ins')
      .select('*')
      .eq('member_id', member.id)
      .order('checked_in_at', {ascending: false});

    if (filter !== 'all') {
      query = query.gte('checked_in_at', startDate.toISOString());
    }

    const {data: checkIns, error: checkInsError} = await query;

    if (checkInsError) {
      console.error('Error fetching check-ins:', checkInsError);
      throw checkInsError;
    }

    // Calculate statistics
    const stats = calculateStats(
      checkIns || [],
      member.check_in_time,
      member.timezone,
    );

    // Enhance check-ins with late status
    const enhancedCheckIns = (checkIns || []).map(checkIn => {
      const {was_late, minutes_late} = calculateLateStatus(
        checkIn.checked_in_at,
        member.check_in_time,
        member.timezone,
      );

      return {
        id: checkIn.id,
        checked_in_at: checkIn.checked_in_at,
        timezone: checkIn.timezone,
        was_late,
        minutes_late,
      };
    });

    return successResponse({
      check_ins: enhancedCheckIns,
      stats,
    });
  } catch (error) {
    return handleError(error);
  }
});

/**
 * Calculate statistics for check-ins
 */
function calculateStats(
  checkIns: any[],
  checkInTime: string,
  timezone: string,
): any {
  const totalCheckIns = checkIns.length;
  let onTimeCheckIns = 0;
  let lateCheckIns = 0;

  checkIns.forEach(checkIn => {
    const {was_late} = calculateLateStatus(
      checkIn.checked_in_at,
      checkInTime,
      timezone,
    );

    if (was_late) {
      lateCheckIns++;
    } else {
      onTimeCheckIns++;
    }
  });

  // Calculate missed check-ins (days without check-ins in the range)
  // This is a simplified calculation
  const missedCheckIns = 0; // Would need more complex logic to calculate actual missed days

  const onTimePercentage =
    totalCheckIns > 0 ? (onTimeCheckIns / totalCheckIns) * 100 : 0;

  return {
    total_check_ins: totalCheckIns,
    on_time_check_ins: onTimeCheckIns,
    late_check_ins: lateCheckIns,
    missed_check_ins: missedCheckIns,
    on_time_percentage: onTimePercentage,
  };
}

/**
 * Determine if a check-in was late
 */
function calculateLateStatus(
  checkedInAt: string,
  checkInTime: string,
  timezone: string,
): {was_late: boolean; minutes_late: number | null} {
  if (!checkInTime) {
    return {was_late: false, minutes_late: null};
  }

  const checkInDate = new Date(checkedInAt);

  // Calculate deadline for that day
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(checkInDate);
  const year = parseInt(parts.find(p => p.type === 'year')!.value);
  const month = parseInt(parts.find(p => p.type === 'month')!.value) - 1;
  const day = parseInt(parts.find(p => p.type === 'day')!.value);

  // Parse check-in time
  const [hours, minutes] = checkInTime.split(':').map(Number);

  // Create deadline date
  const deadlineLocal = new Date(year, month, day, hours, minutes, 0, 0);
  const offsetMs = getTimezoneOffset(timezone) * 60 * 60 * 1000;
  const deadlineUTC = new Date(deadlineLocal.getTime() - offsetMs);

  // Check if check-in was after deadline
  if (checkInDate > deadlineUTC) {
    const minutesLate = Math.floor(
      (checkInDate.getTime() - deadlineUTC.getTime()) / 1000 / 60,
    );
    return {was_late: true, minutes_late: minutesLate};
  }

  return {was_late: false, minutes_late: null};
}

/**
 * Get timezone offset in hours (simplified)
 */
function getTimezoneOffset(timezone: string): number {
  const offsets: Record<string, number> = {
    'America/New_York': -5,
    'America/Chicago': -6,
    'America/Denver': -7,
    'America/Los_Angeles': -8,
    'America/Phoenix': -7,
    'America/Anchorage': -9,
    'Pacific/Honolulu': -10,
    UTC: 0,
  };

  return offsets[timezone] || 0;
}
