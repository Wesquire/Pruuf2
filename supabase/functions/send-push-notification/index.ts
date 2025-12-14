/**
 * Supabase Edge Function: Send Push Notification
 * POST /send-push-notification
 *
 * Purpose: Send push notification via Firebase Cloud Messaging (FCM)
 * Used by dual notification strategy for all push-based alerts
 */

import {serve} from 'https://deno.land/std@0.168.0/http/server.ts';
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
import {ApiError, ErrorCodes, handleError} from '../_shared/errors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const firebaseServerKey = Deno.env.get('FIREBASE_SERVER_KEY')!; // FCM Server Key

serve(async req => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers':
          'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Only allow POST
    if (req.method !== 'POST') {
      throw new ApiError(
        'Method not allowed',
        405,
        ErrorCodes.METHOD_NOT_ALLOWED,
      );
    }

    // Parse request body
    const {user_id, title, body, data, priority} = await req.json();

    // Validate inputs
    if (!user_id || typeof user_id !== 'string') {
      throw new ApiError(
        'User ID is required',
        400,
        ErrorCodes.VALIDATION_ERROR,
      );
    }

    if (!title || typeof title !== 'string') {
      throw new ApiError(
        'Notification title is required',
        400,
        ErrorCodes.VALIDATION_ERROR,
      );
    }

    if (!body || typeof body !== 'string') {
      throw new ApiError(
        'Notification body is required',
        400,
        ErrorCodes.VALIDATION_ERROR,
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's FCM tokens
    const {data: tokens, error: tokensError} = await supabase
      .from('push_notification_tokens')
      .select('token, platform')
      .eq('user_id', user_id);

    if (tokensError) {
      console.error('Error fetching FCM tokens:', tokensError);
      throw new ApiError(
        'Failed to fetch push tokens',
        500,
        ErrorCodes.DATABASE_ERROR,
      );
    }

    if (!tokens || tokens.length === 0) {
      // User has no registered push tokens
      return new Response(
        JSON.stringify({
          success: false,
          message: 'User has no registered push tokens',
          sent_count: 0,
        }),
        {
          status: 200, // Not an error, just no tokens
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        },
      );
    }

    // Build FCM payload
    const fcmPayload = {
      notification: {
        title,
        body,
      },
      data: data || {},
    };

    // Set priority based on notification type
    const fcmPriority = priority === 'critical' ? 'high' : 'normal';

    // Send to all user's tokens
    let successCount = 0;
    let failureCount = 0;
    const failedTokens: string[] = [];

    for (const tokenRecord of tokens) {
      try {
        // Send via FCM API
        const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `key=${firebaseServerKey}`,
          },
          body: JSON.stringify({
            to: tokenRecord.token,
            priority: fcmPriority,
            notification: fcmPayload.notification,
            data: fcmPayload.data,
          }),
        });

        const fcmResult = await fcmResponse.json();

        if (fcmResult.success === 1) {
          successCount++;
        } else {
          failureCount++;
          failedTokens.push(tokenRecord.token);

          // If token is invalid, remove it from database
          if (
            fcmResult.results?.[0]?.error === 'InvalidRegistration' ||
            fcmResult.results?.[0]?.error === 'NotRegistered'
          ) {
            await supabase
              .from('push_notification_tokens')
              .delete()
              .eq('token', tokenRecord.token);

            console.log(`Removed invalid FCM token: ${tokenRecord.token}`);
          }
        }
      } catch (error) {
        console.error(`Error sending to token ${tokenRecord.token}:`, error);
        failureCount++;
        failedTokens.push(tokenRecord.token);
      }
    }

    // Log push notification
    await supabase.from('push_notification_logs').insert({
      user_id,
      title,
      body,
      data: data || {},
      priority: priority || 'normal',
      sent_count: successCount,
      failed_count: failureCount,
      failed_tokens: failedTokens,
      sent_at: new Date().toISOString(),
    });

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Push notification sent',
        sent_count: successCount,
        failed_count: failureCount,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    );
  } catch (error) {
    return handleError(error);
  }
});
