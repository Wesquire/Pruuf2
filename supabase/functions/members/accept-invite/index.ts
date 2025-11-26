/**
 * POST /api/members/accept-invite
 * Member accepts invitation from Contact
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, authenticateRequest } from '../../_shared/auth.ts';
import { ApiError, ErrorCodes, errorResponse, successResponse, handleError, validateRequiredFields, validateInviteCode } from '../../_shared/errors.ts';
import { getRelationshipByInviteCode, updateRelationship, updateUser, getMemberByUserId, createMember, requiresPayment } from '../../_shared/db.ts';
import { sendRelationshipAddedNotification } from '../../_shared/push.ts';
import { sendRelationshipRemovedSms } from '../../_shared/sms.ts';
import type { User, MemberContactRelationship } from '../../_shared/types.ts';

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Only allow POST
    if (req.method !== 'POST') {
      return errorResponse('Method not allowed', 405);
    }

    // Authenticate user (Member)
    const memberUser = await authenticateRequest(req);

    // Parse request body
    const body = await req.json();

    // Validate required fields
    validateRequiredFields(body, ['invite_code']);

    let { invite_code } = body;

    // Normalize invite code to uppercase
    invite_code = invite_code.toUpperCase();

    // Validate invite code format
    validateInviteCode(invite_code);

    // Get relationship by invite code
    const relationship = await getRelationshipByInviteCode(invite_code);

    if (!relationship) {
      throw new ApiError(
        'Invalid invite code',
        404,
        ErrorCodes.NOT_FOUND
      );
    }

    // Check if already accepted
    if (relationship.status === 'active') {
      throw new ApiError(
        'Invitation has already been accepted',
        400,
        ErrorCodes.ALREADY_EXISTS
      );
    }

    // Check if removed
    if (relationship.status === 'removed') {
      throw new ApiError(
        'Invitation is no longer valid',
        400,
        ErrorCodes.NOT_FOUND
      );
    }

    // Check if invite code is expired (30 days)
    const invitedAt = new Date(relationship.invited_at);
    const now = new Date();
    const daysSinceInvite = (now.getTime() - invitedAt.getTime()) / 1000 / 60 / 60 / 24;

    if (daysSinceInvite > 30) {
      throw new ApiError(
        'Invitation has expired',
        400,
        ErrorCodes.CODE_EXPIRED
      );
    }

    // Check if member trying to accept their own invite (should never happen, but check anyway)
    if (relationship.contact_id === memberUser.id) {
      throw new ApiError(
        'Cannot accept your own invitation',
        400,
        ErrorCodes.SELF_RELATIONSHIP
      );
    }

    // Update relationship with member_id and mark as active
    await updateRelationship(relationship.id, {
      member_id: memberUser.id,
      status: 'active',
      connected_at: new Date().toISOString(),
    } as Partial<MemberContactRelationship>);

    // Update member user to set is_member = true
    // This will trigger the database function to set grandfathered_free if applicable
    const wasAlreadyMember = memberUser.is_member;

    if (!wasAlreadyMember) {
      await updateUser(memberUser.id, {
        is_member: true,
      } as Partial<User>);
    }

    // Create or get member profile
    let memberProfile = await getMemberByUserId(memberUser.id);

    if (!memberProfile) {
      // Create member profile (name will be set during onboarding)
      memberProfile = await createMember(memberUser.id, 'Member');
    }

    // Check if Contact should get grandfathered free
    // This happens when Contact becomes a Member
    const updatedMemberUser = await updateUser(memberUser.id, {}) as User; // Refresh to get latest data
    const contactNeedsPayment = await requiresPayment(relationship.contact_id);

    // Send push notification to both parties
    await sendRelationshipAddedNotification(
      relationship.contact_id,
      'New Member', // We don't have member name yet
      false // Contact is monitoring
    );

    await sendRelationshipAddedNotification(
      memberUser.id,
      'Contact', // We don't have contact name
      true // Member is being monitored
    );

    // Return success
    return successResponse({
      relationship: {
        id: relationship.id,
        status: 'active',
        connected_at: relationship.connected_at,
      },
      member: {
        id: memberProfile.id,
        user_id: memberProfile.user_id,
        onboarding_completed: memberProfile.onboarding_completed,
      },
      message: 'Invitation accepted successfully',
    });
  } catch (error) {
    return handleError(error);
  }
});
