/**
 * Supabase Edge Function: Send Member Invitation
 * POST /send-invitation
 *
 * Purpose: Send email invitation to potential Member with magic link + fallback code
 * Replaces: SMS-based invitation system
 */

import {serve} from 'https://deno.land/std@0.168.0/http/server.ts';
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
import {ApiError, ErrorCodes, handleError} from '../_shared/errors.ts';
import {
  sendMemberInvitationEmail,
  isValidEmail,
  normalizeEmail,
} from '../_shared/email.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const appScheme = Deno.env.get('APP_SCHEME') || 'pruuf'; // Deep link scheme: pruuf://

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
    const {contact_id, member_email, member_name} = await req.json();

    // Validate inputs
    if (!contact_id || typeof contact_id !== 'string') {
      throw new ApiError(
        'Contact ID is required',
        400,
        ErrorCodes.VALIDATION_ERROR,
      );
    }

    if (!member_email || typeof member_email !== 'string') {
      throw new ApiError(
        'Member email is required',
        400,
        ErrorCodes.VALIDATION_ERROR,
      );
    }

    if (!member_name || typeof member_name !== 'string') {
      throw new ApiError(
        'Member name is required',
        400,
        ErrorCodes.VALIDATION_ERROR,
      );
    }

    // Validate email format
    if (!isValidEmail(member_email)) {
      throw new ApiError(
        'Invalid email format',
        400,
        ErrorCodes.VALIDATION_ERROR,
      );
    }

    const normalizedEmail = normalizeEmail(member_email);

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify contact exists and is authorized
    const {data: contact, error: contactError} = await supabase
      .from('users')
      .select('id, email, account_status')
      .eq('id', contact_id)
      .single();

    if (contactError || !contact) {
      throw new ApiError('Contact not found', 404, ErrorCodes.NOT_FOUND);
    }

    // Check if Contact account is active (can send invitations)
    if (
      contact.account_status === 'frozen' ||
      contact.account_status === 'deleted'
    ) {
      throw new ApiError(
        'Cannot send invitations. Account is not active.',
        403,
        ErrorCodes.ACCESS_DENIED,
      );
    }

    // Generate unique 6-character invitation code (no confusing O,0,I,1)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let inviteCode = '';
    for (let i = 0; i < 6; i++) {
      inviteCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Check for existing user with this email
    const {data: existingMember} = await supabase
      .from('users')
      .select('id, email, email_verified')
      .eq('email', normalizedEmail)
      .single();

    let memberId: string;

    if (existingMember) {
      // User already exists - use existing ID
      memberId = existingMember.id;

      // Check if already connected to this Contact
      const {data: existingRelationship} = await supabase
        .from('member_contact_relationships')
        .select('id, status')
        .eq('member_id', memberId)
        .eq('contact_id', contact_id)
        .neq('status', 'removed')
        .single();

      if (existingRelationship) {
        if (existingRelationship.status === 'active') {
          throw new ApiError(
            'You are already monitoring this person',
            409,
            ErrorCodes.ALREADY_EXISTS,
          );
        } else if (existingRelationship.status === 'pending') {
          throw new ApiError(
            'Invitation already pending. Resend invitation instead.',
            409,
            ErrorCodes.ALREADY_EXISTS,
          );
        }
      }
    } else {
      // Create new pending user record
      const {data: newMember, error: createError} = await supabase
        .from('users')
        .insert({
          email: normalizedEmail,
          email_verified: false,
          account_status: 'pending_invitation',
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating pending member:', createError);
        throw new ApiError(
          'Failed to create invitation',
          500,
          ErrorCodes.DATABASE_ERROR,
        );
      }

      memberId = newMember.id;
    }

    // Set invitation expiration (7 days from now)
    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    ).toISOString();

    // Create member_contact_relationship with invitation
    const {error: relationshipError} = await supabase
      .from('member_contact_relationships')
      .insert({
        member_id: memberId,
        contact_id: contact_id,
        invite_code: inviteCode,
        status: 'pending',
        invited_at: new Date().toISOString(),
        invite_expires_at: expiresAt,
      });

    if (relationshipError) {
      console.error('Error creating relationship:', relationshipError);
      throw new ApiError(
        'Failed to create invitation',
        500,
        ErrorCodes.DATABASE_ERROR,
      );
    }

    // Generate magic link for one-click acceptance
    // Format: pruuf://invite/{inviteCode}
    // This will be handled by deep linking in the mobile app
    const magicLink = `${appScheme}://invite/${inviteCode}`;

    // Alternative web-based magic link (redirects to app store if app not installed)
    const webMagicLink = `https://pruuf.me/invite/${inviteCode}`;

    // Send invitation email via Postmark
    try {
      await sendMemberInvitationEmail(
        normalizedEmail,
        member_name,
        contact.email || 'your contact', // Contact name fallback
        inviteCode,
        webMagicLink, // Use web link that redirects to app
      );
    } catch (emailError) {
      console.error('Error sending invitation email:', emailError);

      // Don't fail the entire request if email fails - invitation is still created
      // Log the error and continue
      await supabase.from('audit_logs').insert({
        user_id: contact_id,
        action: 'invitation_email_failed',
        details: {
          member_email: normalizedEmail,
          member_name,
          error:
            emailError instanceof Error ? emailError.message : 'Unknown error',
        },
        created_at: new Date().toISOString(),
      });

      // Return success but indicate email issue
      return new Response(
        JSON.stringify({
          success: true,
          warning: 'Invitation created but email failed to send',
          member_id: memberId,
          member_email: normalizedEmail,
          member_name,
          invite_code: inviteCode,
          magic_link: webMagicLink,
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
    }

    // Log successful invitation
    await supabase.from('audit_logs').insert({
      user_id: contact_id,
      action: 'member_invited',
      details: {
        member_email: normalizedEmail,
        member_name,
        invite_code: inviteCode,
        expires_at: expiresAt,
      },
      created_at: new Date().toISOString(),
    });

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invitation sent successfully',
        member_id: memberId,
        member_email: normalizedEmail,
        member_name,
        invite_code: inviteCode,
        magic_link: webMagicLink,
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
