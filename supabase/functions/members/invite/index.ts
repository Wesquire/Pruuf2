/**
 * POST /api/members/invite
 * Contact invites a Member to monitor
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, authenticateRequest } from '../../_shared/auth.ts';
import { ApiError, ErrorCodes, errorResponse, successResponse, handleError, validateRequiredFields, validatePhone } from '../../_shared/errors.ts';
import { getUserByPhone, createRelationship, generateUniqueInviteCode } from '../../_shared/db.ts';
import { sendMemberInvitationSms, maskPhoneNumber } from '../../_shared/sms.ts';

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
    validateRequiredFields(body, ['member_name', 'member_phone']);

    let { member_name, member_phone } = body;

    // Validate phone number format
    validatePhone(member_phone);

    // Check if trying to invite yourself
    if (member_phone === contactUser.phone) {
      throw new ApiError(
        'Cannot invite yourself',
        400,
        ErrorCodes.SELF_RELATIONSHIP
      );
    }

    // Check if member phone already has an account
    let memberUser = await getUserByPhone(member_phone);

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

    // Send invitation SMS
    await sendMemberInvitationSms(
      member_phone,
      member_name,
      contactUser.phone.slice(-4), // Just show last 4 digits of contact's phone
      inviteCode
    );

    // Return relationship data
    return successResponse({
      relationship: {
        id: relationship.id,
        member_name,
        member_phone: maskPhoneNumber(member_phone),
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
