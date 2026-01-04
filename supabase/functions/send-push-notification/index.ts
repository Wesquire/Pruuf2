/**
 * Supabase Edge Function: Send Push Notification
 * POST /send-push-notification
 *
 * Purpose: Send push notification via Expo Push Notification API
 * Used by dual notification strategy for all push-based alerts
 */

import {serve} from 'https://deno.land/std@0.168.0/http/server.ts';
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
import {ApiError, ErrorCodes, handleError} from '../_shared/errors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Expo Push API endpoint
const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send';

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

    // Get user's Expo push tokens
    const {data: tokens, error: tokensError} = await supabase
      .from('push_notification_tokens')
      .select('token, platform')
      .eq('user_id', user_id)
      .eq('active', true);

    if (tokensError) {
      console.error('Error fetching Expo push tokens:', tokensError);
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

    // Set priority based on notification type
    const expoPriority = priority === 'critical' ? 'high' : 'default';

    // Build Expo push messages
    const messages = tokens.map(tokenRecord => ({
      to: tokenRecord.token,
      sound: 'default',
      title,
      body,
      data: data || {},
      priority: expoPriority,
      channelId: 'default',
    }));

    // Send to Expo Push API
    let successCount = 0;
    let failureCount = 0;
    const failedTokens: string[] = [];

    try {
      const expoResponse = await fetch(EXPO_PUSH_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify(messages),
      });

      if (!expoResponse.ok) {
        console.error('Expo Push API error:', expoResponse.status, expoResponse.statusText);
        failureCount = tokens.length;
      } else {
        const result = await expoResponse.json();
        const tickets = result.data || [];

        // Process tickets
        for (let i = 0; i < tickets.length; i++) {
          const ticket = tickets[i];
          if (ticket.status === 'ok') {
            successCount++;
          } else {
            failureCount++;
            failedTokens.push(tokens[i].token);

            // If token is invalid, deactivate it in database
            if (ticket.details?.error === 'DeviceNotRegistered') {
              await supabase
                .from('push_notification_tokens')
                .update({active: false})
                .eq('token', tokens[i].token);

              console.log(`Deactivated invalid Expo push token: ${tokens[i].token.substring(0, 30)}...`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending to Expo Push API:', error);
      failureCount = tokens.length;
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
