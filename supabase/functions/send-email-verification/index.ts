/**
 * Supabase Edge Function: Send Email Verification
 * POST /send-email-verification
 *
 * Purpose: Send email verification code to user's email address
 * Replaces: SMS-based phone verification
 */

import {serve} from 'https://deno.land/std@0.168.0/http/server.ts';
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
import {ApiError, ErrorCodes, handleError} from '../_shared/errors.ts';
import {sendVerificationCodeEmail} from '../_shared/email.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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
    const {email} = await req.json();

    // Validate email
    if (!email || typeof email !== 'string') {
      throw new ApiError('Email is required', 400, ErrorCodes.VALIDATION_ERROR);
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Basic email format validation
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(normalizedEmail)) {
      throw new ApiError(
        'Invalid email format',
        400,
        ErrorCodes.VALIDATION_ERROR,
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limiting: Check if code was sent recently (within last 60 seconds)
    const {data: recentCodes, error: recentError} = await supabase
      .from('users')
      .select('email_verification_expires_at')
      .eq('email', normalizedEmail)
      .gte(
        'email_verification_expires_at',
        new Date(Date.now() - 60000).toISOString(),
      )
      .single();

    if (recentCodes && !recentError) {
      throw new ApiError(
        'Verification code already sent. Please wait 60 seconds before requesting another.',
        429,
        ErrorCodes.RATE_LIMITED,
      );
    }

    // Generate 6-character verification code (uppercase alphanumeric, no confusing chars)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No O,0,I,1
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Set expiration (10 minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Check if user exists with this email
    const {data: existingUser, error: userError} = await supabase
      .from('users')
      .select('id, email, email_verified')
      .eq('email', normalizedEmail)
      .single();

    if (existingUser) {
      // User exists, update their verification code
      const {error: updateError} = await supabase
        .from('users')
        .update({
          email_verification_code: code,
          email_verification_expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('email', normalizedEmail);

      if (updateError) {
        console.error('Error updating verification code:', updateError);
        throw new ApiError(
          'Failed to update verification code',
          500,
          ErrorCodes.DATABASE_ERROR,
        );
      }
    } else {
      // New email, create pending user record (will be completed after verification)
      const {error: insertError} = await supabase.from('users').insert({
        email: normalizedEmail,
        email_verified: false,
        email_verification_code: code,
        email_verification_expires_at: expiresAt,
        created_at: new Date().toISOString(),
      });

      if (insertError) {
        console.error('Error creating pending user:', insertError);
        throw new ApiError(
          'Failed to create verification request',
          500,
          ErrorCodes.DATABASE_ERROR,
        );
      }
    }

    // Send verification email via Postmark
    try {
      await sendVerificationCodeEmail(normalizedEmail, code);
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      throw new ApiError(
        'Failed to send verification email',
        500,
        ErrorCodes.EMAIL_ERROR,
      );
    }

    // Log action
    await supabase.from('audit_logs').insert({
      user_id: existingUser?.id || null,
      action: 'email_verification_sent',
      details: {
        email: normalizedEmail,
        code_expires_at: expiresAt,
      },
      created_at: new Date().toISOString(),
    });

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Verification code sent to email',
        email: normalizedEmail,
        expires_at: expiresAt,
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
