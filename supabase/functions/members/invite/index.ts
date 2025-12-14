/**
 * POST /api/members/invite
 * Contact invites a Member to monitor via email
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, authenticateRequest } from '../../_shared/auth.ts';
import { ApiError, ErrorCodes, errorResponse, successResponse, handleError, validateRequiredFields } from '../../_shared/errors.ts';
import { getUserByEmail, createRelationship, generateUniqueInviteCode } from '../../_shared/db.ts';
import { sendMemberInvitationEmail, maskEmail } from '../../_shared/email.ts';
import { validateEmail, validateText } from '../../_shared/inputValidation.ts';

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

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
    validateRequiredFields(body, ['member_name', 'member_email']);

    // Validate and normalize inputs
    const member_name = validateText(body.member_name, 255);
    const member_email = validateEmail(body.member_email);

    // Check if trying to invite yourself
    if (member_email.toLowerCase() === contactUser.email?.toLowerCase()) {
      throw new ApiError(
        'Cannot invite yourself',
        400,
        ErrorCodes.SELF_RELATIONSHIP
      );
    }

    // Check if member email already has an account
    let memberUser = await getUserByEmail(member_email);

    // If member doesn't have an account yet, we'll create a placeholder
    // The actual account will be created when they accept the invitation
    const memberId = memberUser ? memberUser.id : null;

    // Generate unique invite code
    const inviteCode = await generateUniqueInviteCode();

    // Create pending relationship
    // Note: If member doesn't exist yet, we'll use contactUser.id as a temporary member_id
    // This will be updated when the member accepts the invite
    const relationship = await createRelationship(
      memberId || contactUser.id, // Temporary - will be updated on accept
      contactUser.id,
      inviteCode
    );

    // Send invitation email
    await sendMemberInvitationEmail(
      member_email,
      member_name,
      contactUser.email || 'Your contact',
      inviteCode,
      `https://pruuf.me/invite/${inviteCode}`
    );

    // Return relationship data
    return successResponse({
      relationship: {
        id: relationship.id,
        member_name,
        member_email: maskEmail(member_email),
        invite_code: inviteCode,
        status: 'pending',
        invited_at: relationship.invited_at,
      },
      message: 'Invitation sent successfully',
    }, 201);
  } catch (error) {
    return handleError(error);
  }
});
