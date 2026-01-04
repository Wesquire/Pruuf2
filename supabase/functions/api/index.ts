/**
 * API Router - Supabase Edge Function
 * Simplified version that doesn't rely on shared modules with init-time validation
 */

import {serve} from 'https://deno.land/std@0.168.0/http/server.ts';
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
};

function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {headers: corsHeaders});
  }
  return null;
}

function successResponse(data: any, status = 200): Response {
  return new Response(
    JSON.stringify({success: true, ...data}),
    {
      status,
      headers: {...corsHeaders, 'Content-Type': 'application/json'},
    },
  );
}

function errorResponse(message: string, status = 400, code?: string): Response {
  return new Response(
    JSON.stringify({success: false, error: message, code}),
    {
      status,
      headers: {...corsHeaders, 'Content-Type': 'application/json'},
    },
  );
}

function getApiPath(url: string): string {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;
  if (pathname.startsWith('/functions/v1/api')) {
    return pathname.replace('/functions/v1/api', '') || '/';
  }
  if (pathname.startsWith('/api')) {
    return pathname.replace('/api', '') || '/';
  }
  return pathname || '/';
}

function getSupabase() {
  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(url, key);
}

serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const path = getApiPath(req.url);
  const method = req.method;

  console.log(`[API Router] ${method} ${path}`);

  try {
    // Health check
    if (path === '/health' || path === '/' || path === '') {
      return successResponse({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      });
    }

    // Send verification code
    if (path === '/auth/send-verification-code' && method === 'POST') {
      const body = await req.json();
      const email = body.email?.trim()?.toLowerCase();

      if (!email) {
        return errorResponse('Email is required', 400, 'VALIDATION_ERROR');
      }

      const supabase = getSupabase();

      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      const {data: existingUser} = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        await supabase
          .from('users')
          .update({
            email_verification_code: code,
            email_verification_expires_at: expiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq('email', email);
      } else {
        // Generate a placeholder phone (required by legacy schema) using email hash
        const emailHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(email));
        const hashArray = Array.from(new Uint8Array(emailHash)).slice(0, 10);
        const placeholderPhone = '+1' + hashArray.map(b => (b % 10).toString()).join('');

        // Use a placeholder pin_hash (user will set real PIN during registration)
        const placeholderPinHash = 'PENDING_REGISTRATION';

        await supabase.from('users').insert({
          email,
          phone: placeholderPhone,
          pin_hash: placeholderPinHash,
          account_status: 'pending_invitation',
          email_verified: false,
          email_verification_code: code,
          email_verification_expires_at: expiresAt,
          created_at: new Date().toISOString(),
        });
      }

      // Send email via Postmark
      const POSTMARK_TOKEN = Deno.env.get('POSTMARK_SERVER_TOKEN');
      const POSTMARK_FROM = Deno.env.get('POSTMARK_FROM_EMAIL') || 'noreply@pruuf.me';

      if (POSTMARK_TOKEN) {
        try {
          await fetch('https://api.postmarkapp.com/email', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'X-Postmark-Server-Token': POSTMARK_TOKEN,
            },
            body: JSON.stringify({
              From: POSTMARK_FROM,
              To: email,
              Subject: 'Your Pruuf Verification Code',
              TextBody: `Your verification code is: ${code}\n\nThis code expires in 10 minutes.`,
              HtmlBody: `<h2>Your Pruuf Verification Code</h2><p style="font-size: 24px; font-weight: bold;">${code}</p><p>This code expires in 10 minutes.</p>`,
              MessageStream: 'outbound',
            }),
          });
        } catch (e) {
          console.error('Email error:', e);
        }
      }

      return successResponse({
        message: 'Verification code sent to email',
        email,
        expires_at: expiresAt,
      });
    }

    // Verify code
    if (path === '/auth/verify-code' && method === 'POST') {
      const body = await req.json();
      const email = body.email?.trim()?.toLowerCase();
      const code = body.code?.trim()?.toUpperCase();

      if (!email || !code) {
        return errorResponse('Email and code are required', 400, 'VALIDATION_ERROR');
      }

      const supabase = getSupabase();

      const {data: user, error} = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !user) {
        return errorResponse('Email not found', 404, 'NOT_FOUND');
      }

      if (new Date(user.email_verification_expires_at) < new Date()) {
        return errorResponse('Verification code expired', 400, 'CODE_EXPIRED');
      }

      if (user.email_verification_code !== code) {
        return errorResponse('Invalid verification code', 400, 'INVALID_CODE');
      }

      const isExistingUser = !!user.pin_hash;
      const sessionToken = btoa(JSON.stringify({
        email,
        exp: Date.now() + 30 * 60 * 1000,
      }));

      await supabase
        .from('users')
        .update({
          email_verified: true,
          email_verified_at: new Date().toISOString(),
          email_verification_code: null,
          email_verification_expires_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      return successResponse({
        verified: true,
        is_existing_user: isExistingUser,
        session_token: sessionToken,
        user_id: user.id,
      });
    }

    // Create account
    if (path === '/auth/create-account' && method === 'POST') {
      const body = await req.json();
      const email = body.email?.trim()?.toLowerCase();
      const pin = body.pin;
      const pinConfirmation = body.pin_confirmation;
      const sessionToken = body.session_token;

      if (!email || !pin || !pinConfirmation || !sessionToken) {
        return errorResponse('Missing required fields', 400, 'VALIDATION_ERROR');
      }

      if (!/^\d{4}$/.test(pin)) {
        return errorResponse('PIN must be 4 digits', 400, 'INVALID_PIN');
      }

      if (pin !== pinConfirmation) {
        return errorResponse('PINs do not match', 400, 'VALIDATION_ERROR');
      }

      try {
        const decoded = JSON.parse(atob(sessionToken));
        if (decoded.email !== email || decoded.exp < Date.now()) {
          return errorResponse('Invalid or expired session', 401, 'INVALID_TOKEN');
        }
      } catch {
        return errorResponse('Invalid session token', 401, 'INVALID_TOKEN');
      }

      const supabase = getSupabase();

      const {data: existingUser} = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      // Check if user already has a real PIN (not placeholder)
      if (existingUser?.pin_hash && existingUser.pin_hash !== 'PENDING_REGISTRATION') {
        return errorResponse('Account already exists', 409, 'ALREADY_EXISTS');
      }

      // Simple hash for PIN
      const encoder = new TextEncoder();
      const data = encoder.encode(pin + email);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const pinHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const {data: user, error} = await supabase
        .from('users')
        .update({
          pin_hash: pinHash,
          account_status: 'active',
          font_size_preference: body.font_size_preference || 'standard',
          updated_at: new Date().toISOString(),
        })
        .eq('email', email)
        .select()
        .single();

      if (error || !user) {
        return errorResponse('Failed to create account', 500, 'DATABASE_ERROR');
      }

      const payload = {
        sub: user.id,
        user_id: user.id,
        email: user.email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60),
      };

      const accessToken = btoa(JSON.stringify(payload)) + '.header.signature';

      return successResponse({
        user: {
          id: user.id,
          email: user.email,
          account_status: user.account_status,
          font_size_preference: user.font_size_preference,
          is_member: user.is_member,
          created_at: user.created_at,
        },
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 90 * 24 * 60 * 60,
      }, 201);
    }

    // Login
    if (path === '/auth/login' && method === 'POST') {
      const body = await req.json();
      const email = body.email?.trim()?.toLowerCase();
      const pin = body.pin;

      if (!email || !pin) {
        return errorResponse('Email and PIN are required', 400, 'VALIDATION_ERROR');
      }

      const supabase = getSupabase();

      const {data: user, error} = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !user) {
        return errorResponse('Invalid email or PIN', 401, 'INVALID_CREDENTIALS');
      }

      if (user.deleted_at) {
        return errorResponse('Account has been deleted', 403, 'ACCOUNT_DELETED');
      }

      // Check if registration is complete
      if (user.pin_hash === 'PENDING_REGISTRATION') {
        return errorResponse('Please complete registration first', 403, 'REGISTRATION_INCOMPLETE');
      }

      const encoder = new TextEncoder();
      const data = encoder.encode(pin + email);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const pinHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      if (user.pin_hash !== pinHash) {
        return errorResponse('Invalid email or PIN', 401, 'INVALID_CREDENTIALS');
      }

      const payload = {
        sub: user.id,
        user_id: user.id,
        email: user.email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60),
      };

      const accessToken = btoa(JSON.stringify(payload)) + '.header.signature';

      return successResponse({
        user: {
          id: user.id,
          email: user.email,
          account_status: user.account_status,
          font_size_preference: user.font_size_preference,
          is_member: user.is_member,
          created_at: user.created_at,
        },
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 90 * 24 * 60 * 60,
      });
    }

    // Members invite
    if (path === '/members/invite' && method === 'POST') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return errorResponse('Authorization required', 401, 'UNAUTHORIZED');
      }

      const token = authHeader.replace('Bearer ', '');
      let userId: string;
      try {
        const payload = JSON.parse(atob(token.split('.')[0]));
        userId = payload.sub || payload.user_id;
      } catch {
        return errorResponse('Invalid token', 401, 'INVALID_TOKEN');
      }

      const body = await req.json();
      const memberName = body.member_name?.trim();
      const memberEmail = body.member_email?.trim()?.toLowerCase();

      if (!memberName || !memberEmail) {
        return errorResponse('Name and email are required', 400, 'VALIDATION_ERROR');
      }

      const supabase = getSupabase();

      const {data: user} = await supabase.from('users').select('*').eq('id', userId).single();
      if (!user) {
        return errorResponse('User not found', 404, 'NOT_FOUND');
      }

      if (memberEmail === user.email) {
        return errorResponse('Cannot invite yourself', 400, 'SELF_INVITE');
      }

      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let inviteCode = '';
      for (let i = 0; i < 6; i++) {
        inviteCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      let {data: memberUser} = await supabase
        .from('users')
        .select('id')
        .eq('email', memberEmail)
        .single();

      if (!memberUser) {
        // Generate placeholder phone for legacy schema compatibility
        const emailHashData = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(memberEmail));
        const emailHashArray = Array.from(new Uint8Array(emailHashData)).slice(0, 10);
        const memberPlaceholderPhone = '+1' + emailHashArray.map(b => (b % 10).toString()).join('');

        const {data: newMember} = await supabase
          .from('users')
          .insert({
            email: memberEmail,
            phone: memberPlaceholderPhone,
            pin_hash: 'PENDING_REGISTRATION',
            account_status: 'pending_invitation',
            email_verified: false,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();
        memberUser = newMember;
      }

      await supabase
        .from('members')
        .upsert({
          user_id: memberUser!.id,
          name: memberName,
          created_at: new Date().toISOString(),
        });

      const {error: relError} = await supabase
        .from('member_contact_relationships')
        .insert({
          member_id: memberUser!.id,
          contact_id: user.id,
          invite_code: inviteCode,
          status: 'pending',
          created_at: new Date().toISOString(),
        });

      if (relError?.message?.includes('duplicate')) {
        return errorResponse('Already invited this member', 409, 'DUPLICATE_RELATIONSHIP');
      }

      return successResponse({
        message: 'Invitation sent successfully',
        invite_code: inviteCode,
        member_email: memberEmail,
        member_name: memberName,
      }, 201);
    }

    // Accept invite
    if (path === '/members/accept-invite' && method === 'POST') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return errorResponse('Authorization required', 401, 'UNAUTHORIZED');
      }

      const token = authHeader.replace('Bearer ', '');
      let userId: string;
      try {
        const payload = JSON.parse(atob(token.split('.')[0]));
        userId = payload.sub || payload.user_id;
      } catch {
        return errorResponse('Invalid token', 401, 'INVALID_TOKEN');
      }

      const body = await req.json();
      const inviteCode = body.invite_code?.trim()?.toUpperCase();

      if (!inviteCode) {
        return errorResponse('Invite code is required', 400, 'VALIDATION_ERROR');
      }

      const supabase = getSupabase();

      const {data: relationship} = await supabase
        .from('member_contact_relationships')
        .select('*')
        .eq('invite_code', inviteCode)
        .eq('status', 'pending')
        .single();

      if (!relationship) {
        return errorResponse('Invalid or expired invite code', 400, 'INVALID_CODE');
      }

      if (relationship.member_id !== userId) {
        return errorResponse('This invite is not for you', 403, 'ACCESS_DENIED');
      }

      await supabase
        .from('member_contact_relationships')
        .update({
          status: 'active',
          connected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', relationship.id);

      await supabase
        .from('users')
        .update({
          is_member: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      return successResponse({message: 'Invitation accepted successfully'});
    }

    // Complete onboarding
    if (path === '/members/complete-onboarding' && method === 'POST') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return errorResponse('Authorization required', 401, 'UNAUTHORIZED');
      }

      const token = authHeader.replace('Bearer ', '');
      let userId: string;
      try {
        const payload = JSON.parse(atob(token.split('.')[0]));
        userId = payload.sub || payload.user_id;
      } catch {
        return errorResponse('Invalid token', 401, 'INVALID_TOKEN');
      }

      const body = await req.json();

      if (!body.check_in_time || !body.timezone) {
        return errorResponse('Check-in time and timezone are required', 400, 'VALIDATION_ERROR');
      }

      const supabase = getSupabase();

      await supabase
        .from('members')
        .update({
          check_in_time: body.check_in_time,
          timezone: body.timezone,
          reminder_enabled: body.reminder_enabled ?? true,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      return successResponse({message: 'Onboarding completed successfully'});
    }

    // Get members (for contacts)
    if (path === '/contacts/me/members' && method === 'GET') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return errorResponse('Authorization required', 401, 'UNAUTHORIZED');
      }

      const token = authHeader.replace('Bearer ', '');
      let userId: string;
      try {
        const payload = JSON.parse(atob(token.split('.')[0]));
        userId = payload.sub || payload.user_id;
      } catch {
        return errorResponse('Invalid token', 401, 'INVALID_TOKEN');
      }

      const supabase = getSupabase();

      const {data: relationships} = await supabase
        .from('member_contact_relationships')
        .select('*')
        .eq('contact_id', userId);

      const members = await Promise.all(
        (relationships || []).map(async (rel: any) => {
          const {data: memberUser} = await supabase
            .from('users')
            .select('id, email, is_member')
            .eq('id', rel.member_id)
            .single();

          const {data: member} = await supabase
            .from('members')
            .select('*')
            .eq('user_id', rel.member_id)
            .single();

          const today = new Date().toISOString().split('T')[0];
          const {data: checkIn} = await supabase
            .from('check_ins')
            .select('*')
            .eq('member_id', rel.member_id)
            .gte('checked_in_at', `${today}T00:00:00Z`)
            .order('checked_in_at', {ascending: false})
            .limit(1)
            .single();

          return {
            id: rel.id,
            status: rel.status,
            invite_code: rel.invite_code,
            created_at: rel.created_at,
            member: memberUser,
            member_details: member,
            last_check_in: checkIn || null,
            checked_in_today: !!checkIn,
          };
        }),
      );

      return successResponse({members});
    }

    // Member check-in
    const checkInMatch = path.match(/^\/members\/([^/]+)\/check-in$/);
    if (checkInMatch && method === 'POST') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return errorResponse('Authorization required', 401, 'UNAUTHORIZED');
      }

      const token = authHeader.replace('Bearer ', '');
      let userId: string;
      try {
        const payload = JSON.parse(atob(token.split('.')[0]));
        userId = payload.sub || payload.user_id;
      } catch {
        return errorResponse('Invalid token', 401, 'INVALID_TOKEN');
      }

      const body = await req.json();
      const memberId = checkInMatch[1] === 'me' ? userId : checkInMatch[1];

      const supabase = getSupabase();

      const today = new Date().toISOString().split('T')[0];
      const {data: existingCheckIn} = await supabase
        .from('check_ins')
        .select('id')
        .eq('member_id', memberId)
        .gte('checked_in_at', `${today}T00:00:00Z`)
        .single();

      if (existingCheckIn) {
        return errorResponse('Already checked in today', 409, 'ALREADY_CHECKED_IN');
      }

      const {data: checkIn, error} = await supabase
        .from('check_ins')
        .insert({
          member_id: memberId,
          checked_in_at: new Date().toISOString(),
          timezone: body.timezone || 'UTC',
        })
        .select()
        .single();

      if (error) {
        return errorResponse('Failed to check in', 500, 'DATABASE_ERROR');
      }

      return successResponse({
        message: 'Check-in successful',
        check_in: checkIn,
      });
    }

    return errorResponse(`Endpoint not found: ${path}`, 404, 'NOT_FOUND');
  } catch (error) {
    console.error('API Error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      500,
      'INTERNAL_ERROR',
    );
  }
});
