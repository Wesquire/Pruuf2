/**
 * CRON JOB: Reminder Notifications
 * Schedule: Every 15 minutes (*/15 * * * *)
 *
 * Sends reminder notifications to Members approaching their check-in deadline.
 * Supports reminders: 15 min, 30 min, 1 hour before check-in time.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseClient } from '../../_shared/db.ts';
import { sendCheckInReminderNotification } from '../../_shared/push.ts';
import { successResponse, handleError } from '../../_shared/errors.ts';
import {
  calculateReminderTime,
  getTodayStartInTimezone,
  getTodayEndInTimezone,
} from '../../_shared/timezone.ts';

serve(async (req: Request) => {
  try {
    console.log('Starting reminder notifications scan...');

    const supabase = getSupabaseClient();
    const now = new Date();

    // Get all members who have reminders enabled and haven't checked in today
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select(`
        id,
        user_id,
        name,
        check_in_time,
        timezone,
        reminder_enabled,
        reminder_minutes_before,
        onboarding_completed,
        users!inner(id, phone)
      `)
      .eq('onboarding_completed', true)
      .eq('reminder_enabled', true)
      .not('check_in_time', 'is', null)
      .not('reminder_minutes_before', 'is', null);

    if (membersError) {
      console.error('Error fetching members:', membersError);
      throw membersError;
    }

    if (!members || members.length === 0) {
      console.log('No members with reminders enabled');
      return successResponse({ checked: 0, reminders_sent: 0 });
    }

    console.log(`Checking ${members.length} members for reminder notifications...`);

    let remindersSent = 0;

    for (const member of members) {
      try {
        // Check if member has already checked in today
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
          // Member already checked in today, skip reminder
          continue;
        }

        // Calculate the reminder time (check-in time minus reminder_minutes_before)
        const reminderTime = calculateReminderTime(
          member.check_in_time,
          member.timezone,
          member.reminder_minutes_before
        );

        // Check if it's time to send the reminder
        // We send if current time is within 15 minutes of reminder time
        // (since this cron runs every 15 minutes)
        const timeDiff = Math.abs(now.getTime() - reminderTime.getTime());
        const minutesDiff = Math.floor(timeDiff / (1000 * 60));

        if (minutesDiff > 15) {
          // Not time for this reminder yet (or already passed)
          continue;
        }

        // Check if we already sent a reminder today for this member
        const { data: existingReminder } = await supabase
          .from('reminder_notifications')
          .select('id')
          .eq('member_id', member.id)
          .gte('sent_at', todayStart)
          .lte('sent_at', todayEnd)
          .single();

        if (existingReminder) {
          // Reminder already sent today, skip
          continue;
        }

        console.log(`Sending reminder to member ${member.name} (ID: ${member.id})`);

        // Send push notification
        await sendCheckInReminderNotification(
          member.user_id,
          member.reminder_minutes_before
        );

        // Record that we sent the reminder
        await supabase
          .from('reminder_notifications')
          .insert({
            member_id: member.id,
            reminder_minutes_before: member.reminder_minutes_before,
            check_in_time: member.check_in_time,
            sent_at: now.toISOString(),
          });

        remindersSent++;
        console.log(`Reminder sent to member ${member.name}`);
      } catch (memberError) {
        console.error(`Error processing member ${member.id}:`, memberError);
        // Continue with other members even if one fails
      }
    }

    console.log(`Reminder notifications scan complete. Reminders sent: ${remindersSent}`);

    return successResponse({
      checked: members.length,
      reminders_sent: remindersSent,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return handleError(error);
  }
});
