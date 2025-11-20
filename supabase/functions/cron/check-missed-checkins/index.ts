/**
 * CRON JOB: Check Missed Check-ins
 * Schedule: Every 5 minutes (*/5 * * * *)
 *
 * Checks all Members whose check-in deadline has passed
 * and sends alerts to their Contacts if they haven't checked in.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseClient } from '../../_shared/db.ts';
import { sendMissedCheckInSms } from '../../_shared/sms.ts';
import { sendMissedCheckInNotification } from '../../_shared/push.ts';
import { successResponse, handleError } from '../../_shared/errors.ts';

serve(async (req: Request) => {
  try {
    console.log('Starting missed check-in scan...');

    const supabase = getSupabaseClient();
    const now = new Date();

    // Get all members who:
    // 1. Have completed onboarding
    // 2. Have a check-in time set
    // 3. Have active contacts
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select(`
        id,
        user_id,
        name,
        check_in_time,
        timezone,
        onboarding_completed,
        users!inner(id, phone)
      `)
      .eq('onboarding_completed', true)
      .not('check_in_time', 'is', null);

    if (membersError) {
      console.error('Error fetching members:', membersError);
      throw membersError;
    }

    if (!members || members.length === 0) {
      console.log('No members with check-in times found');
      return successResponse({ checked: 0, alerts_sent: 0 });
    }

    console.log(`Checking ${members.length} members for missed check-ins...`);

    let alertsSent = 0;

    for (const member of members) {
      try {
        // Calculate deadline in member's timezone
        const checkInDeadline = calculateDeadlineInTimezone(
          member.check_in_time,
          member.timezone
        );

        // Check if deadline has passed
        if (now < checkInDeadline) {
          // Deadline hasn't passed yet, skip this member
          continue;
        }

        // Check if member has checked in today (in their timezone)
        const todayStart = getTodayStartInTimezone(member.timezone);
        const todayEnd = getTodayEndInTimezone(member.timezone);

        const { data: todayCheckIn } = await supabase
          .from('check_ins')
          .select('id')
          .eq('member_id', member.id)
          .gte('checked_in_at', todayStart)
          .lte('checked_in_at', todayEnd)
          .single();

        if (todayCheckIn) {
          // Member has already checked in today, skip
          continue;
        }

        // Check if we already sent an alert today for this member
        const { data: existingAlert } = await supabase
          .from('missed_check_in_alerts')
          .select('id')
          .eq('member_id', member.id)
          .gte('sent_at', todayStart)
          .lte('sent_at', todayEnd)
          .single();

        if (existingAlert) {
          // Alert already sent today, skip
          continue;
        }

        console.log(`Member ${member.name} (ID: ${member.id}) missed check-in. Sending alerts...`);

        // Get all active contacts for this member
        const { data: relationships, error: relationshipsError } = await supabase
          .from('member_contact_relationships')
          .select(`
            id,
            contact_id,
            users!member_contact_relationships_contact_id_fkey(id, phone)
          `)
          .eq('member_id', member.user_id)
          .eq('status', 'active')
          .is('deleted_at', null);

        if (relationshipsError) {
          console.error(`Error fetching contacts for member ${member.id}:`, relationshipsError);
          continue;
        }

        if (!relationships || relationships.length === 0) {
          console.log(`No active contacts found for member ${member.name}`);
          continue;
        }

        // Send alerts to all contacts
        for (const relationship of relationships) {
          try {
            const contactUser = relationship.users;

            // Send SMS
            await sendMissedCheckInSms(contactUser.phone, member.name);

            // Send push notification
            await sendMissedCheckInNotification(contactUser.id, member.name);

            console.log(`Alert sent to contact ${contactUser.id} for member ${member.name}`);
          } catch (contactError) {
            console.error(`Error sending alert to contact:`, contactError);
            // Continue with other contacts even if one fails
          }
        }

        // Record that we sent the alert
        await supabase
          .from('missed_check_in_alerts')
          .insert({
            member_id: member.id,
            sent_at: now.toISOString(),
            contacts_notified: relationships.length,
          });

        alertsSent++;
      } catch (memberError) {
        console.error(`Error processing member ${member.id}:`, memberError);
        // Continue with other members even if one fails
      }
    }

    console.log(`Missed check-in scan complete. Alerts sent: ${alertsSent}`);

    return successResponse({
      checked: members.length,
      alerts_sent: alertsSent,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Cron job error:', error);
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
  const month = parseInt(parts.find(p => p.type === 'month')!.value) - 1; // 0-indexed
  const day = parseInt(parts.find(p => p.type === 'day')!.value);

  // Parse check-in time
  const [hours, minutes] = checkInTime.split(':').map(Number);

  // Create deadline date in member's timezone
  // This is a simplified approach - for production, use a proper timezone library
  const deadlineLocal = new Date(year, month, day, hours, minutes, 0, 0);

  // Convert to UTC (approximate - doesn't account for DST properly)
  // For production, use moment-timezone or similar
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
 * For production, use a proper timezone library
 */
function getTimezoneOffset(timezone: string): number {
  // Simplified timezone offsets (UTC offset in hours)
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
