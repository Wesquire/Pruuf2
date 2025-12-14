/**
 * Supabase Edge Function: Verify Email
 * POST /verify-email
 *
 * Purpose: Verify email address using 6-digit code
 * Replaces: SMS-based phone verification
 */

import {serve} from 'https://deno.land/std@0.168.0/http/server.ts';
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
import {ApiError, ErrorCodes, handleError} from '../_shared/errors.ts';

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
    const {email, code} = await req.json();

    // Validate inputs
    if (!email || typeof email !== 'string') {
      throw new ApiError('Email is required', 400, ErrorCodes.VALIDATION_ERROR);
    }

    if (!code || typeof code !== 'string') {
      throw new ApiError(
        'Verification code is required',
        400,
        ErrorCodes.VALIDATION_ERROR,
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.trim().toUpperCase();

    // Validate code format (6 characters, alphanumeric)
    if (!/^[A-Z0-9]{6}$/.test(normalizedCode)) {
      throw new ApiError(
        'Invalid verification code format',
        400,
        ErrorCodes.VALIDATION_ERROR,
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find user with matching email and code
    const {data: user, error: userError} = await supabase
      .from('users')
      .select(
        'id, email, email_verified, email_verification_code, email_verification_expires_at',
      )
      .eq('email', normalizedEmail)
      .single();

    if (userError || !user) {
      throw new ApiError(
        'Email not found. Please request a new verification code.',
        404,
        ErrorCodes.NOT_FOUND,
      );
    }

    // Check if already verified
    if (user.email_verified) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email already verified',
          already_verified: true,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        },
      );
    }

    // Check if code exists
    if (!user.email_verification_code) {
      throw new ApiError(
        'No verification code found. Please request a new code.',
        400,
        ErrorCodes.VALIDATION_ERROR,
      );
    }

    // Check if code is expired
    if (new Date(user.email_verification_expires_at) < new Date()) {
      throw new ApiError(
        'Verification code expired. Please request a new code.',
        400,
        ErrorCodes.EXPIRED_CODE,
      );
    }

    // Check if code matches
    if (user.email_verification_code !== normalizedCode) {
      // Log failed attempt
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'email_verification_failed',
        details: {
          email: normalizedEmail,
          reason: 'incorrect_code',
        },
        created_at: new Date().toISOString(),
      });

      throw new ApiError(
        'Incorrect verification code. Please try again.',
        400,
        ErrorCodes.INVALID_CODE,
      );
    }

    // Code is valid! Mark email as verified
    const {error: updateError} = await supabase
      .from('users')
      .update({
        email_verified: true,
        email_verified_at: new Date().toISOString(),
        email_verification_code: null,
        email_verification_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating user verification status:', updateError);
      throw new ApiError(
        'Failed to verify email',
        500,
        ErrorCodes.DATABASE_ERROR,
      );
    }

    // Log successful verification
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'email_verified',
      details: {
        email: normalizedEmail,
        verified_at: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    });

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email verified successfully',
        user_id: user.id,
        email: normalizedEmail,
        verified_at: new Date().toISOString(),
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
