/**
 * Supabase Edge Function: Accept Member Invitation
 * POST /accept-invitation
 *
 * Purpose: Accept invitation via magic link or manual code entry
 * Creates Member record and activates relationship with Contact
 */

import {serve} from 'https://deno.land/std@0.168.0/http/server.ts';
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
import {ApiError, ErrorCodes, handleError} from '../_shared/errors.ts';
import {sendMemberConnectedNotification} from '../_shared/dualNotifications.ts';

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
    const {invite_code, user_id} = await req.json();

    // Validate inputs
    if (!invite_code || typeof invite_code !== 'string') {
      throw new ApiError(
        'Invitation code is required',
        400,
        ErrorCodes.VALIDATION_ERROR,
      );
    }

    if (!user_id || typeof user_id !== 'string') {
      throw new ApiError(
        'User ID is required',
        400,
        ErrorCodes.VALIDATION_ERROR,
      );
    }

    const normalizedCode = invite_code.trim().toUpperCase();

    // Validate code format (6 uppercase alphanumeric)
    if (!/^[A-Z0-9]{6}$/.test(normalizedCode)) {
      throw new ApiError(
        'Invalid invitation code format',
        400,
        ErrorCodes.VALIDATION_ERROR,
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find invitation by code
    const {data: relationship, error: relationshipError} = await supabase
      .from('member_contact_relationships')
      .select(
        `
        id,
        member_id,
        contact_id,
        invite_code,
        status,
        invited_at,
        invite_expires_at,
        contact:users!member_contact_relationships_contact_id_fkey(id, email),
        member:users!member_contact_relationships_member_id_fkey(id, email, email_verified)
      `,
      )
      .eq('invite_code', normalizedCode)
      .single();

    if (relationshipError || !relationship) {
      throw new ApiError(
        'Invitation code not found. Please check your code and try again.',
        404,
        ErrorCodes.NOT_FOUND,
      );
    }

    // Check if invitation is already accepted
    if (relationship.status === 'active') {
      throw new ApiError(
        'This invitation has already been accepted',
        409,
        ErrorCodes.ALREADY_EXISTS,
      );
    }

    // Check if invitation is removed/cancelled
    if (relationship.status === 'removed') {
      throw new ApiError(
        'This invitation has been cancelled',
        400,
        ErrorCodes.VALIDATION_ERROR,
      );
    }

    // Check if invitation is expired
    if (
      relationship.invite_expires_at &&
      new Date(relationship.invite_expires_at) < new Date()
    ) {
      throw new ApiError(
        'This invitation has expired. Please request a new invitation.',
        400,
        ErrorCodes.EXPIRED_CODE,
      );
    }

    // Verify the accepting user matches the invited member
    if (user_id !== relationship.member_id) {
      throw new ApiError(
        'This invitation was sent to a different email address',
        403,
        ErrorCodes.ACCESS_DENIED,
      );
    }

    // Get member's full user record
    const {data: member, error: memberError} = await supabase
      .from('users')
      .select('id, email, email_verified, account_status')
      .eq('id', relationship.member_id)
      .single();

    if (memberError || !member) {
      throw new ApiError('Member account not found', 404, ErrorCodes.NOT_FOUND);
    }

    // Activate the relationship
    const {error: updateError} = await supabase
      .from('member_contact_relationships')
      .update({
        status: 'active',
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', relationship.id);

    if (updateError) {
      console.error('Error activating relationship:', updateError);
      throw new ApiError(
        'Failed to accept invitation',
        500,
        ErrorCodes.DATABASE_ERROR,
      );
    }

    // Update member's account status
    let newAccountStatus = member.account_status;

    // If member was in pending state, activate them
    if (member.account_status === 'pending_invitation') {
      newAccountStatus = 'active_free'; // Members never pay
    }

    // Set grandfathered_free flag (Members get free Contact access forever)
    const {error: memberUpdateError} = await supabase
      .from('users')
      .update({
        account_status: newAccountStatus,
        grandfathered_free: true, // Members are grandfathered free as Contacts
        updated_at: new Date().toISOString(),
      })
      .eq('id', member.id);

    if (memberUpdateError) {
      console.error('Error updating member status:', memberUpdateError);
      // Don't fail the request - relationship is already activated
    }

    // Create member profile if doesn't exist
    const {data: existingMember} = await supabase
      .from('members')
      .select('id')
      .eq('user_id', member.id)
      .single();

    if (!existingMember) {
      // Create member profile
      await supabase.from('members').insert({
        user_id: member.id,
        name: member.email?.split('@')[0] || 'Member', // Default name from email
        onboarding_completed: false, // Member needs to complete onboarding
        created_at: new Date().toISOString(),
      });
    }

    // Check if Contact has active subscription or is grandfathered
    const {data: contact} = await supabase
      .from('users')
      .select(
        'id, email, account_status, revenuecat_app_user_id, grandfathered_free',
      )
      .eq('id', relationship.contact_id)
      .single();

    // If Contact is paying but now has a Member monitoring them, prepare for grandfathering
    // (This happens in webhook when billing period ends)
    if (
      contact &&
      contact.revenuecat_app_user_id &&
      !contact.grandfathered_free
    ) {
      // Contact will be grandfathered at end of billing period
      // For now, just log it
      await supabase.from('audit_logs').insert({
        user_id: contact.id,
        action: 'contact_will_be_grandfathered',
        details: {
          reason: 'became_member',
          member_email: member.email,
        },
        created_at: new Date().toISOString(),
      });
    }

    // Log successful acceptance
    await supabase.from('audit_logs').insert({
      user_id: member.id,
      action: 'invitation_accepted',
      details: {
        contact_id: relationship.contact_id,
        contact_email: relationship.contact?.email,
        invite_code: normalizedCode,
      },
      created_at: new Date().toISOString(),
    });

    // Also log for Contact
    await supabase.from('audit_logs').insert({
      user_id: relationship.contact_id,
      action: 'member_connected',
      details: {
        member_id: member.id,
        member_email: member.email,
      },
      created_at: new Date().toISOString(),
    });

    // Send member connected notification to Contact (HIGH priority: push + email fallback)
    try {
      const contactUser = relationship.contact;
      if (contactUser) {
        await sendMemberConnectedNotification(
          contactUser.id,
          contactUser.email,
          member.email?.split('@')[0] || 'Member', // Use email username as name
        );
      }
    } catch (notificationError) {
      console.error(
        'Failed to send member connected notification:',
        notificationError,
      );
      // Don't fail the request if notification fails
    }

    // Return success with relationship details
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invitation accepted successfully',
        relationship: {
          id: relationship.id,
          member_id: member.id,
          member_email: member.email,
          contact_id: relationship.contact_id,
          contact_email: relationship.contact?.email,
          status: 'active',
          connected_at: new Date().toISOString(),
        },
        member: {
          id: member.id,
          email: member.email,
          email_verified: member.email_verified,
          account_status: newAccountStatus,
          grandfathered_free: true,
          needs_onboarding: !existingMember, // True if this is first connection
        },
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
