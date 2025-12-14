/**
 * Supabase Edge Function: Send Email Notification
 * POST /send-email-notification
 *
 * Purpose: Send email notification via Postmark
 * Used by dual notification strategy as fallback or for critical alerts
 */

import {serve} from 'https://deno.land/std@0.168.0/http/server.ts';
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
import {ApiError, ErrorCodes, handleError} from '../_shared/errors.ts';
import {sendEmail, isValidEmail, normalizeEmail} from '../_shared/email.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const postmarkFromEmail = Deno.env.get('POSTMARK_FROM_EMAIL')!;

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
    const {user_email, title, body, type, data} = await req.json();

    // Validate inputs
    if (!user_email || typeof user_email !== 'string') {
      throw new ApiError(
        'User email is required',
        400,
        ErrorCodes.VALIDATION_ERROR,
      );
    }

    if (!isValidEmail(user_email)) {
      throw new ApiError(
        'Invalid email format',
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

    const normalizedEmail = normalizeEmail(user_email);

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Build HTML email body
    const htmlBody = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #212121; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #4CAF50; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Pruuf</h1>
  </div>
  <div style="background-color: #ffffff; padding: 40px; border: 1px solid #E0E0E0; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #212121; margin-top: 0;">${title}</h2>
    <div style="font-size: 16px; color: #757575; line-height: 1.8;">
      ${body
        .split('\n')
        .map(line => `<p style="margin: 10px 0;">${line}</p>`)
        .join('')}
    </div>
    ${
      data?.actionUrl
        ? `
    <div style="margin: 30px 0; text-align: center;">
      <a href="${data.actionUrl}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: 600;">Open Pruuf</a>
    </div>
    `
        : ''
    }
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E0E0E0;">
      <p style="font-size: 12px; color: #9E9E9E; margin: 5px 0;">
        You received this notification because you have an active Pruuf account.
      </p>
      <p style="font-size: 12px; color: #9E9E9E; margin: 5px 0;">
        <a href="https://pruuf.me/settings/notifications" style="color: #2196F3; text-decoration: none;">Manage notification preferences</a>
      </p>
    </div>
  </div>
</body>
</html>
    `;

    // Plain text version
    const textBody = `
${title}

${body}

${data?.actionUrl ? `Open Pruuf: ${data.actionUrl}\n` : ''}

---
You received this notification because you have an active Pruuf account.
Manage notification preferences: https://pruuf.me/settings/notifications
    `;

    // Determine email type
    const emailType = type || 'notification';

    // Send email via Postmark
    try {
      const messageId = await sendEmail(
        normalizedEmail,
        title,
        htmlBody,
        textBody,
        emailType,
      );

      // Log email notification
      await supabase.from('email_notification_logs').insert({
        user_email: normalizedEmail,
        title,
        body,
        type: emailType,
        data: data || {},
        postmark_message_id: messageId,
        sent_at: new Date().toISOString(),
      });

      // Return success
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email notification sent',
          message_id: messageId,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        },
      );
    } catch (emailError) {
      console.error('Error sending email notification:', emailError);

      // Log failed email
      await supabase.from('email_notification_logs').insert({
        user_email: normalizedEmail,
        title,
        body,
        type: emailType,
        data: data || {},
        error_message:
          emailError instanceof Error ? emailError.message : 'Unknown error',
        sent_at: new Date().toISOString(),
      });

      throw new ApiError(
        'Failed to send email notification',
        500,
        ErrorCodes.EMAIL_ERROR,
      );
    }
  } catch (error) {
    return handleError(error);
  }
});
