/**
 * GET /api/contacts/members/:id
 * Get detailed information about a specific Member
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, authenticateRequest } from '../../_shared/auth.ts';
import { ApiError, ErrorCodes, errorResponse, successResponse, handleError } from '../../_shared/errors.ts';
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

    // Authenticate user (Contact)
    const contactUser = await authenticateRequest(req);

    // Extract member ID from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const memberId = pathParts[pathParts.length - 1];

    if (!memberId) {
      throw new ApiError('Member ID is required', 400, ErrorCodes.VALIDATION_ERROR);
    }

    const supabase = getSupabaseClient();

    // Get the relationship to verify Contact has access to this Member
    const { data: relationship, error: relationshipError } = await supabase
      .from('member_contact_relationships')
      .select('*')
      .eq('member_id', memberId)
      .eq('contact_id', contactUser.id)
      .is('deleted_at', null)
      .single();

    if (relationshipError || !relationship) {
      throw new ApiError('Member not found or access denied', 404, ErrorCodes.NOT_FOUND);
    }

    // Get Member details
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select(`
        *,
        users!inner(id, phone)
      `)
      .eq('user_id', memberId)
      .single();

    if (memberError || !member) {
      throw new ApiError('Member profile not found', 404, ErrorCodes.NOT_FOUND);
    }

    // Check if Member checked in today (in their timezone)
    const todayStart = getTodayStartInTimezone(member.timezone);
    const todayEnd = getTodayEndInTimezone(member.timezone);

    const { data: todayCheckIn } = await supabase
      .from('check_ins')
      .select('*')
      .eq('member_id', member.id)
      .gte('checked_in_at', todayStart)
      .lte('checked_in_at', todayEnd)
      .order('checked_in_at', { ascending: false })
      .limit(1)
      .single();

    // Calculate minutes since deadline if missed
    let minutesSinceDeadline: number | null = null;
    if (!todayCheckIn && member.check_in_time) {
      const now = new Date();
      const deadline = calculateDeadlineInTimezone(member.check_in_time, member.timezone);

      if (now > deadline) {
        minutesSinceDeadline = Math.floor((now.getTime() - deadline.getTime()) / 1000 / 60);
      }
    }

    // Return member details
    return successResponse({
      member: {
        id: member.id,
        user_id: member.user_id,
        name: member.name,
        check_in_time: member.check_in_time,
        timezone: member.timezone,
        onboarding_completed: member.onboarding_completed,
        relationship_status: relationship.status,
        invited_at: relationship.invited_at,
        connected_at: relationship.connected_at,
        last_check_in: todayCheckIn,
        checked_in_today: !!todayCheckIn,
        minutes_since_deadline: minutesSinceDeadline,
      },
    });
  } catch (error) {
    return handleError(error);
  }
});

/**
 * Calculate the check-in deadline for today in the member's timezone
 */
function calculateDeadlineInTimezone(checkInTime: string, timezone: string): Date {
  const now = new Date();

  // Get current date in member's timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find(p => p.type === 'year')!.value);
  const month = parseInt(parts.find(p => p.type === 'month')!.value) - 1;
  const day = parseInt(parts.find(p => p.type === 'day')!.value);

  // Parse check-in time
  const [hours, minutes] = checkInTime.split(':').map(Number);

  // Create deadline date in member's timezone
  const deadlineLocal = new Date(year, month, day, hours, minutes, 0, 0);

  // Convert to UTC (approximate)
  const offsetMs = getTimezoneOffset(timezone) * 60 * 60 * 1000;
  const deadlineUTC = new Date(deadlineLocal.getTime() - offsetMs);

  return deadlineUTC;
}

/**
 * Get the start of today in the member's timezone (midnight)
 */
function getTodayStartInTimezone(timezone: string): string {
  const now = new Date();

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find(p => p.type === 'year')!.value);
  const month = parseInt(parts.find(p => p.type === 'month')!.value) - 1;
  const day = parseInt(parts.find(p => p.type === 'day')!.value);

  const startLocal = new Date(year, month, day, 0, 0, 0, 0);
  const offsetMs = getTimezoneOffset(timezone) * 60 * 60 * 1000;
  const startUTC = new Date(startLocal.getTime() - offsetMs);

  return startUTC.toISOString();
}

/**
 * Get the end of today in the member's timezone (23:59:59)
 */
function getTodayEndInTimezone(timezone: string): string {
  const now = new Date();

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find(p => p.type === 'year')!.value);
  const month = parseInt(parts.find(p => p.type === 'month')!.value) - 1;
  const day = parseInt(parts.find(p => p.type === 'day')!.value);

  const endLocal = new Date(year, month, day, 23, 59, 59, 999);
  const offsetMs = getTimezoneOffset(timezone) * 60 * 60 * 1000;
  const endUTC = new Date(endLocal.getTime() - offsetMs);

  return endUTC.toISOString();
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
    'UTC': 0,
  };

  return offsets[timezone] || 0;
}
