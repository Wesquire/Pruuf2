/**
 * CRON JOB: Trial Expiration Warnings
 * Schedule: Daily at 9:00 AM UTC (0 9 * * *)
 *
 * Sends warnings to users whose trial will expire in 3 days.
 * Only sends to Contacts (users who require payment).
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseClient } from '../../_shared/db.ts';
import { sendTrialExpirationWarningSms } from '../../_shared/sms.ts';
import { sendTrialExpiringNotification } from '../../_shared/push.ts';
import { successResponse, handleError } from '../../_shared/errors.ts';

serve(async (req: Request) => {
  try {
    console.log('Starting trial expiration warning scan...');

    const supabase = getSupabaseClient();
    const now = new Date();

    // Calculate the date 3 days from now
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    threeDaysFromNow.setHours(0, 0, 0, 0);

    const threeDaysFromNowEnd = new Date(threeDaysFromNow);
    threeDaysFromNowEnd.setHours(23, 59, 59, 999);

    console.log(`Looking for trials expiring on: ${threeDaysFromNow.toISOString().split('T')[0]}`);

    // Get all users whose trial ends in 3 days
    // AND who require payment (are Contacts, not grandfathered Members)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, phone, trial_end_date, is_member, grandfathered_free')
      .eq('account_status', 'trial')
      .not('trial_end_date', 'is', null)
      .gte('trial_end_date', threeDaysFromNow.toISOString())
      .lte('trial_end_date', threeDaysFromNowEnd.toISOString())
      .is('deleted_at', null);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    if (!users || users.length === 0) {
      console.log('No users with trials expiring in 3 days');
      return successResponse({ checked: 0, warnings_sent: 0 });
    }

    console.log(`Found ${users.length} users with trials expiring in 3 days`);

    let warningsSent = 0;

    for (const user of users) {
      try {
        // Check if user requires payment
        // Use the requiresPayment RPC function
        const { data: needsPayment, error: paymentError } = await supabase
          .rpc('requires_payment', { user_id: user.id });

        if (paymentError) {
          console.error(`Error checking payment requirement for user ${user.id}:`, paymentError);
          continue;
        }

        if (!needsPayment) {
          // User is a Member or grandfathered free, skip warning
          console.log(`User ${user.id} does not require payment, skipping warning`);
          continue;
        }

        // Check if we already sent a warning for this trial expiration
        // (to avoid duplicate warnings if job runs multiple times on same day)
        const { data: existingWarning } = await supabase
          .from('trial_expiration_warnings')
          .select('id')
          .eq('user_id', user.id)
          .eq('trial_end_date', user.trial_end_date)
          .single();

        if (existingWarning) {
          console.log(`Warning already sent for user ${user.id}, skipping`);
          continue;
        }

        console.log(`Sending trial expiration warning to user ${user.id}...`);

        const daysRemaining = 3;

        // Send SMS warning
        await sendTrialExpirationWarningSms(user.phone, daysRemaining);

        // Send push notification
        await sendTrialExpiringNotification(user.id, daysRemaining);

        // Record that we sent the warning
        await supabase
          .from('trial_expiration_warnings')
          .insert({
            user_id: user.id,
            trial_end_date: user.trial_end_date,
            days_before_expiration: daysRemaining,
            sent_at: now.toISOString(),
          });

        warningsSent++;
        console.log(`Trial expiration warning sent to user ${user.id}`);
      } catch (userError) {
        console.error(`Error processing user ${user.id}:`, userError);
        // Continue with other users even if one fails
      }
    }

    console.log(`Trial expiration warning scan complete. Warnings sent: ${warningsSent}`);

    return successResponse({
      checked: users.length,
      warnings_sent: warningsSent,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return handleError(error);
  }
});
