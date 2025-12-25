/**
 * CRON JOB: Grace Period Expirations
 * Schedule: Daily at 00:00 UTC (0 0 * * *)
 *
 * Processes accounts in past_due status whose 7-day grace period has expired.
 * Freezes the account and sends notifications.
 */

import {serve} from 'https://deno.land/std@0.168.0/http/server.ts';
import {getSupabaseClient, updateUser} from '../../_shared/db.ts';
import {sendAccountFrozenAlert} from '../../_shared/dualNotifications.ts';
import {successResponse, handleError} from '../../_shared/errors.ts';
import type {User} from '../../_shared/types.ts';

// Grace period in days
const GRACE_PERIOD_DAYS = 7;

serve(async (req: Request) => {
  try {
    console.log('Starting grace period expiration scan...');

    const supabase = getSupabaseClient();
    const now = new Date();

    // Calculate the cutoff date (7 days ago)
    const gracePeriodCutoff = new Date(now);
    gracePeriodCutoff.setDate(gracePeriodCutoff.getDate() - GRACE_PERIOD_DAYS);

    console.log(
      `Looking for past_due accounts older than: ${gracePeriodCutoff.toISOString()}`,
    );

    // Get all users in past_due status whose last_payment_date is more than 7 days ago
    // OR who have been in past_due status for more than 7 days (based on updated_at)
    const {data: users, error: usersError} = await supabase
      .from('users')
      .select('id, email, phone, last_payment_date, updated_at, account_status')
      .eq('account_status', 'past_due')
      .is('deleted_at', null);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    if (!users || users.length === 0) {
      console.log('No past_due accounts found');
      return successResponse({checked: 0, frozen: 0});
    }

    console.log(`Found ${users.length} past_due accounts to check`);

    let frozenCount = 0;

    for (const user of users) {
      try {
        // Determine when the grace period started
        // It starts from the most recent of: last_payment_date or when status changed to past_due

        // To determine when status changed to past_due, we need to check audit logs
        // For now, use last_payment_date or updated_at as proxy
        const gracePeriodStartDate = user.last_payment_date
          ? new Date(user.last_payment_date)
          : new Date(user.updated_at);

        // Check if grace period has expired
        if (gracePeriodStartDate > gracePeriodCutoff) {
          // Grace period not expired yet
          continue;
        }

        const daysInGracePeriod = Math.floor(
          (now.getTime() - gracePeriodStartDate.getTime()) /
            (1000 * 60 * 60 * 24),
        );

        console.log(
          `User ${user.id} has been in past_due for ${daysInGracePeriod} days. Freezing account...`,
        );

        // Freeze the account
        await updateUser(user.id, {
          account_status: 'frozen',
        } as Partial<User>);

        // Send account frozen alert via dual notification service (CRITICAL priority)
        await sendAccountFrozenAlert(user.id, user.email);

        // Record the grace period expiration
        await supabase.from('grace_period_expirations').insert({
          user_id: user.id,
          grace_period_start: gracePeriodStartDate.toISOString(),
          grace_period_end: now.toISOString(),
          days_in_grace_period: daysInGracePeriod,
          processed_at: now.toISOString(),
        });

        frozenCount++;
        console.log(`Account frozen for user ${user.id}`);
      } catch (userError) {
        console.error(`Error processing user ${user.id}:`, userError);
        // Continue with other users even if one fails
      }
    }

    console.log(
      `Grace period expiration scan complete. Frozen: ${frozenCount}`,
    );

    return successResponse({
      checked: users.length,
      frozen: frozenCount,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return handleError(error);
  }
});
