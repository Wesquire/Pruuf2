/**
 * CRON JOB: Trial Expirations
 * Schedule: Daily at 00:00 UTC (0 0 * * *)
 *
 * Processes expired trials:
 * - For Contacts who require payment: freeze account, send notifications
 * - For Members/grandfathered users: convert to active_free status
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseClient, updateUser } from '../../_shared/db.ts';
import { sendAccountFrozenNotification } from '../../_shared/push.ts';
import { successResponse, handleError } from '../../_shared/errors.ts';
import type { User } from '../../_shared/types.ts';

serve(async (req: Request) => {
  try {
    console.log('Starting trial expiration scan...');

    const supabase = getSupabaseClient();
    const now = new Date();

    // Get all users whose trial has expired (trial_end_date < now)
    // AND who are still in 'trial' status
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, phone, trial_end_date, is_member, grandfathered_free, account_status')
      .eq('account_status', 'trial')
      .not('trial_end_date', 'is', null)
      .lt('trial_end_date', now.toISOString())
      .is('deleted_at', null);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    if (!users || users.length === 0) {
      console.log('No expired trials found');
      return successResponse({ checked: 0, processed: 0 });
    }

    console.log(`Found ${users.length} expired trials to process`);

    let processed = 0;
    let frozenCount = 0;
    let activeFreeCount = 0;

    for (const user of users) {
      try {
        // Check if user requires payment
        const { data: needsPayment, error: paymentError } = await supabase
          .rpc('requires_payment', { user_id: user.id });

        if (paymentError) {
          console.error(`Error checking payment requirement for user ${user.id}:`, paymentError);
          continue;
        }

        if (needsPayment) {
          // User is a Contact who needs to pay
          // Freeze their account
          console.log(`Freezing account for user ${user.id} (trial expired, payment required)`);

          await updateUser(user.id, {
            account_status: 'frozen',
          } as Partial<User>);

          // Send push notification
          await sendAccountFrozenNotification(user.id);

          frozenCount++;
        } else {
          // User is a Member or grandfathered free
          // Convert to active_free status
          console.log(`Converting user ${user.id} to active_free (Member or grandfathered)`);

          await updateUser(user.id, {
            account_status: 'active_free',
          } as Partial<User>);

          activeFreeCount++;
        }

        // Record the trial expiration processing
        await supabase
          .from('trial_expirations')
          .insert({
            user_id: user.id,
            trial_end_date: user.trial_end_date,
            processed_at: now.toISOString(),
            resulted_in_freeze: needsPayment,
          });

        processed++;
      } catch (userError) {
        console.error(`Error processing user ${user.id}:`, userError);
        // Continue with other users even if one fails
      }
    }

    console.log(`Trial expiration scan complete. Processed: ${processed}, Frozen: ${frozenCount}, Active Free: ${activeFreeCount}`);

    return successResponse({
      checked: users.length,
      processed,
      frozen: frozenCount,
      active_free: activeFreeCount,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return handleError(error);
  }
});
