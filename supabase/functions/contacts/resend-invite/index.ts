/**
 * POST /api/contacts/resend-invite
 * Resend invitation to a member via email
 */

import {serve} from 'https://deno.land/std@0.168.0/http/server.ts';
import {handleCors, authenticateRequest} from '../../_shared/auth.ts';
import {
  ApiError,
  ErrorCodes,
  errorResponse,
  successResponse,
  handleError,
  validateRequiredFields,
} from '../../_shared/errors.ts';
import {getSupabaseClient, updateRelationship} from '../../_shared/db.ts';
import {sendMemberInvitationEmail, maskEmail} from '../../_shared/email.ts';
import type {MemberContactRelationship} from '../../_shared/types.ts';

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    // Only allow POST
    if (req.method !== 'POST') {
      return errorResponse('Method not allowed', 405);
    }

    // Authenticate user (Contact)
    const contactUser = await authenticateRequest(req);

    // Parse request body
    const body = await req.json();

    // Validate required fields
    validateRequiredFields(body, ['relationship_id']);

    const {relationship_id} = body;

    // Get relationship
    const supabase = getSupabaseClient();

    const {data: relationship, error} = await supabase
      .from('member_contact_relationships')
      .select(
        `
        *,
        member:users!member_contact_relationships_member_id_fkey(*),
        member_data:members!inner(*)
      `,
      )
      .eq('id', relationship_id)
      .single();

    if (error || !relationship) {
      throw new ApiError('Relationship not found', 404, ErrorCodes.NOT_FOUND);
    }

    // Verify relationship belongs to contact
    if (relationship.contact_id !== contactUser.id) {
      throw new ApiError('Unauthorized', 403, ErrorCodes.UNAUTHORIZED);
    }

    // Check if relationship is pending
    if (relationship.status !== 'pending') {
      throw new ApiError(
        'Invitation has already been accepted or removed',
        400,
        ErrorCodes.ALREADY_EXISTS,
      );
    }

    // Rate limiting: Check when last invite was sent
    const lastInviteSent = new Date(relationship.last_invite_sent_at);
    const now = new Date();
    const hoursSinceLastInvite =
      (now.getTime() - lastInviteSent.getTime()) / 1000 / 60 / 60;

    if (hoursSinceLastInvite < 1) {
      throw new ApiError(
        'Please wait at least 1 hour before resending an invitation',
        429,
        ErrorCodes.RATE_LIMIT_EXCEEDED,
      );
    }

    // Get member data
    const memberData = Array.isArray(relationship.member_data)
      ? relationship.member_data[0]
      : relationship.member_data;
    const memberUser = relationship.member;

    // Check member has email address
    if (!memberUser?.email) {
      throw new ApiError(
        'Member email address not found',
        400,
        ErrorCodes.VALIDATION_ERROR,
      );
    }

    // Update last_invite_sent_at
    await updateRelationship(relationship_id, {
      last_invite_sent_at: now.toISOString(),
    } as Partial<MemberContactRelationship>);

    // Resend invitation email
    await sendMemberInvitationEmail(
      memberUser.email,
      memberData.name,
      contactUser.email || 'Your contact',
      relationship.invite_code,
      `https://pruuf.me/invite/${relationship.invite_code}`,
    );

    // Return success
    return successResponse({
      message: 'Invitation resent successfully',
      relationship: {
        id: relationship.id,
        member_email: maskEmail(memberUser.email),
        invite_code: relationship.invite_code,
        last_invite_sent_at: now.toISOString(),
      },
    });
  } catch (error) {
    return handleError(error);
  }
});
