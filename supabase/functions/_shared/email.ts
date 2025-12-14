/**
 * Postmark Email Service for Supabase Edge Functions
 * Handles all email-based notifications via Postmark
 */

import {ApiError, ErrorCodes} from './errors.ts';
import {logEmail} from './db.ts';

// Postmark credentials
const POSTMARK_SERVER_TOKEN = Deno.env.get('POSTMARK_SERVER_TOKEN') || '';
const POSTMARK_FROM_EMAIL =
  Deno.env.get('POSTMARK_FROM_EMAIL') || 'noreply@pruuf.me';

/**
 * Send email via Postmark
 */
export async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string,
  textBody: string,
  type: string = 'generic',
): Promise<string> {
  if (!POSTMARK_SERVER_TOKEN) {
    throw new ApiError(
      'Postmark credentials not configured',
      500,
      ErrorCodes.EMAIL_ERROR,
    );
  }

  try {
    const url = 'https://api.postmarkapp.com/email';

    const payload = {
      From: POSTMARK_FROM_EMAIL,
      To: to,
      Subject: subject,
      HtmlBody: htmlBody,
      TextBody: textBody,
      MessageStream: 'outbound',
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': POSTMARK_SERVER_TOKEN,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Postmark API error:', data);

      // Log failed email
      await logEmail(
        to,
        POSTMARK_FROM_EMAIL,
        subject,
        htmlBody,
        type,
        'failed',
      );

      throw new ApiError(
        `Failed to send email: ${data.Message || 'Unknown error'}`,
        500,
        ErrorCodes.EMAIL_ERROR,
      );
    }

    // Log successful email
    await logEmail(
      to,
      POSTMARK_FROM_EMAIL,
      subject,
      htmlBody,
      type,
      'sent',
      data.MessageID,
    );

    return data.MessageID;
  } catch (error) {
    console.error('Email error:', error);

    // Log failed email
    await logEmail(to, POSTMARK_FROM_EMAIL, subject, htmlBody, type, 'failed');

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError('Failed to send email', 500, ErrorCodes.EMAIL_ERROR);
  }
}

/**
 * Send verification code email
 */
export async function sendVerificationCodeEmail(
  email: string,
  code: string,
): Promise<string> {
  const subject = 'Your Pruuf Verification Code';

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verification Code</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #212121; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #4CAF50; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Pruuf</h1>
      </div>
      <div style="background-color: #ffffff; padding: 40px; border: 1px solid #E0E0E0; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="color: #212121; margin-top: 0;">Verify Your Email</h2>
        <p style="font-size: 16px; color: #757575;">Enter this verification code in the Pruuf app:</p>
        <div style="background-color: #F5F5F5; border: 2px dashed #4CAF50; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #4CAF50;">${code}</span>
        </div>
        <p style="font-size: 14px; color: #757575;">This code expires in <strong>10 minutes</strong>.</p>
        <p style="font-size: 14px; color: #757575;">If you didn't request this code, you can safely ignore this email.</p>
      </div>
      <div style="text-align: center; padding: 20px; font-size: 12px; color: #9E9E9E;">
        <p>© 2025 Pruuf. All rights reserved.</p>
        <p><a href="https://pruuf.me" style="color: #4CAF50; text-decoration: none;">pruuf.me</a></p>
      </div>
    </body>
    </html>
  `;

  const textBody = `
Your Pruuf Verification Code

Enter this verification code in the Pruuf app:

${code}

This code expires in 10 minutes.

If you didn't request this code, you can safely ignore this email.

---
© 2025 Pruuf
https://pruuf.me
  `;

  return await sendEmail(
    email,
    subject,
    htmlBody,
    textBody,
    'verification_code',
  );
}

/**
 * Send member invitation email
 */
export async function sendMemberInvitationEmail(
  email: string,
  memberName: string,
  contactName: string,
  inviteCode: string,
  magicLink: string,
): Promise<string> {
  const subject = `${contactName} invited you to Pruuf`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pruuf Invitation</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #212121; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #4CAF50; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Pruuf</h1>
      </div>
      <div style="background-color: #ffffff; padding: 40px; border: 1px solid #E0E0E0; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="color: #212121; margin-top: 0;">You've been invited to Pruuf!</h2>
        <p style="font-size: 16px; color: #757575;"><strong>${contactName}</strong> invited you to Pruuf, a daily check-in app that lets you reassure family with one tap.</p>

        <div style="margin: 30px 0;">
          <a href="${magicLink}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: 600;">Accept Invitation</a>
        </div>

        <p style="font-size: 14px; color: #757575;">Or enter this code after downloading the app:</p>
        <div style="background-color: #F5F5F5; border: 2px dashed #4CAF50; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0;">
          <span style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #4CAF50;">${inviteCode}</span>
        </div>

        <div style="margin-top: 30px; padding: 20px; background-color: #F5F5F5; border-radius: 8px;">
          <h3 style="margin-top: 0; font-size: 16px; color: #212121;">How Pruuf works:</h3>
          <ol style="font-size: 14px; color: #757575; padding-left: 20px;">
            <li>Check in once per day with one tap</li>
            <li>Your contacts get notified you're okay</li>
            <li>If you miss a check-in, contacts receive an alert</li>
          </ol>
        </div>

        <p style="font-size: 12px; color: #9E9E9E; margin-top: 30px;">Questions? Reply to this email or contact ${contactName} directly.</p>
      </div>
      <div style="text-align: center; padding: 20px; font-size: 12px; color: #9E9E9E;">
        <p>© 2025 Pruuf. All rights reserved.</p>
        <p><a href="https://pruuf.me" style="color: #4CAF50; text-decoration: none;">pruuf.me</a></p>
      </div>
    </body>
    </html>
  `;

  const textBody = `
${contactName} invited you to Pruuf!

${contactName} invited you to Pruuf, a daily check-in app that lets you reassure family with one tap.

ACCEPT INVITATION:
${magicLink}

Or enter this code after downloading the app:
${inviteCode}

How Pruuf works:
1. Check in once per day with one tap
2. Your contacts get notified you're okay
3. If you miss a check-in, contacts receive an alert

Questions? Reply to this email or contact ${contactName} directly.

---
© 2025 Pruuf
https://pruuf.me
  `;

  return await sendEmail(
    email,
    subject,
    htmlBody,
    textBody,
    'member_invitation',
  );
}

/**
 * Send missed check-in alert email
 */
export async function sendMissedCheckInEmail(
  contactEmail: string,
  memberName: string,
  memberPhone: string,
  checkInTime: string,
  timezone: string,
  lastCheckIn: string,
): Promise<string> {
  const subject = `🚨 ${memberName} missed their check-in`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Missed Check-in Alert</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #212121; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #F44336; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ Missed Check-in Alert</h1>
      </div>
      <div style="background-color: #ffffff; padding: 40px; border: 1px solid #E0E0E0; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="color: #F44336; margin-top: 0;">${memberName} hasn't checked in</h2>
        <p style="font-size: 16px; color: #757575;"><strong>${memberName}</strong> didn't check in by their ${checkInTime} ${timezone} deadline.</p>

        <div style="background-color: #FFEBEE; border-left: 4px solid #F44336; padding: 20px; margin: 30px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px; color: #757575;"><strong>Last check-in:</strong> ${lastCheckIn}</p>
        </div>

        <p style="font-size: 16px; color: #212121; font-weight: 600;">What to do:</p>
        <ol style="font-size: 14px; color: #757575; padding-left: 20px;">
          <li>Call or text ${memberName} to make sure they're okay</li>
          <li>They may have simply forgotten to check in</li>
          <li>If you can't reach them, consider checking on them in person</li>
        </ol>

        <div style="margin: 30px 0;">
          <a href="tel:${memberPhone}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: 600; margin-right: 10px;">Call ${memberName}</a>
          <a href="sms:${memberPhone}" style="display: inline-block; background-color: #2196F3; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: 600;">Send Text</a>
        </div>

        <p style="font-size: 12px; color: #9E9E9E; margin-top: 30px;">Phone: ${memberPhone}</p>
      </div>
      <div style="text-align: center; padding: 20px; font-size: 12px; color: #9E9E9E;">
        <p>© 2025 Pruuf. All rights reserved.</p>
        <p><a href="https://pruuf.me" style="color: #4CAF50; text-decoration: none;">pruuf.me</a></p>
      </div>
    </body>
    </html>
  `;

  const textBody = `
⚠️ MISSED CHECK-IN ALERT

${memberName} hasn't checked in

${memberName} didn't check in by their ${checkInTime} ${timezone} deadline.

Last check-in: ${lastCheckIn}

What to do:
1. Call or text ${memberName} to make sure they're okay
2. They may have simply forgotten to check in
3. If you can't reach them, consider checking on them in person

Phone: ${memberPhone}

---
© 2025 Pruuf
https://pruuf.me
  `;

  return await sendEmail(
    contactEmail,
    subject,
    htmlBody,
    textBody,
    'missed_check_in',
  );
}

/**
 * Send check-in confirmation email
 */
export async function sendCheckInConfirmationEmail(
  contactEmail: string,
  memberName: string,
  checkInTime: string,
  timezone: string,
): Promise<string> {
  const subject = `✅ ${memberName} checked in`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Check-in Confirmation</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #212121; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #4CAF50; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">✅ Check-in Successful</h1>
      </div>
      <div style="background-color: #ffffff; padding: 40px; border: 1px solid #E0E0E0; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="color: #4CAF50; margin-top: 0;">${memberName} checked in!</h2>
        <p style="font-size: 16px; color: #757575;"><strong>${memberName}</strong> checked in at ${checkInTime} ${timezone}.</p>

        <div style="background-color: #E8F5E9; border-left: 4px solid #4CAF50; padding: 20px; margin: 30px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 16px; color: #212121; font-weight: 600;">All is well! 👍</p>
        </div>

        <p style="font-size: 14px; color: #9E9E9E;">You'll receive another notification tomorrow if ${memberName} misses their check-in.</p>
      </div>
      <div style="text-align: center; padding: 20px; font-size: 12px; color: #9E9E9E;">
        <p>© 2025 Pruuf. All rights reserved.</p>
        <p><a href="https://pruuf.me" style="color: #4CAF50; text-decoration: none;">pruuf.me</a></p>
      </div>
    </body>
    </html>
  `;

  const textBody = `
✅ CHECK-IN SUCCESSFUL

${memberName} checked in!

${memberName} checked in at ${checkInTime} ${timezone}.

All is well! 👍

You'll receive another notification tomorrow if ${memberName} misses their check-in.

---
© 2025 Pruuf
https://pruuf.me
  `;

  return await sendEmail(
    contactEmail,
    subject,
    htmlBody,
    textBody,
    'check_in_confirmation',
  );
}

/**
 * Send late check-in notification email
 */
export async function sendLateCheckInEmail(
  contactEmail: string,
  memberName: string,
  checkInTime: string,
  timezone: string,
  minutesLate: number,
): Promise<string> {
  const subject = `ℹ️ Update: ${memberName} checked in (late)`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Late Check-in Update</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #212121; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #FF9800; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">ℹ️ Late Check-in</h1>
      </div>
      <div style="background-color: #ffffff; padding: 40px; border: 1px solid #E0E0E0; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="color: #FF9800; margin-top: 0;">Update: ${memberName} checked in</h2>
        <p style="font-size: 16px; color: #757575;"><strong>${memberName}</strong> checked in at ${checkInTime} ${timezone} (${minutesLate} minutes late).</p>

        <div style="background-color: #FFF3E0; border-left: 4px solid #FF9800; padding: 20px; margin: 30px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 16px; color: #212121; font-weight: 600;">All is well! 👍</p>
          <p style="margin: 10px 0 0 0; font-size: 14px; color: #757575;">They're safe, just checked in a bit late.</p>
        </div>
      </div>
      <div style="text-align: center; padding: 20px; font-size: 12px; color: #9E9E9E;">
        <p>© 2025 Pruuf. All rights reserved.</p>
        <p><a href="https://pruuf.me" style="color: #4CAF50; text-decoration: none;">pruuf.me</a></p>
      </div>
    </body>
    </html>
  `;

  const textBody = `
ℹ️ UPDATE: LATE CHECK-IN

Update: ${memberName} checked in

${memberName} checked in at ${checkInTime} ${timezone} (${minutesLate} minutes late).

All is well! 👍
They're safe, just checked in a bit late.

---
© 2025 Pruuf
https://pruuf.me
  `;

  return await sendEmail(
    contactEmail,
    subject,
    htmlBody,
    textBody,
    'late_check_in',
  );
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Normalize email (lowercase, trim)
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Mask email for display (show first 2 chars + domain)
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');

  if (!domain) {
    return email;
  }

  if (local.length <= 2) {
    return `${local}***@${domain}`;
  }

  return `${local.substring(0, 2)}***@${domain}`;
}

/**
 * Format phone for display/links (keep E.164 format)
 */
export function formatPhoneE164(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // If already 11 digits starting with 1, add +
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }

  // If 10 digits, add +1
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }

  // If already has +, return as is
  if (phone.startsWith('+')) {
    return phone;
  }

  return phone;
}

/**
 * Mask phone number for display (show last 4 digits only)
 */
export function maskPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length >= 10) {
    const last4 = cleaned.slice(-4);
    return `(***) ***-${last4}`;
  }

  return phone;
}
