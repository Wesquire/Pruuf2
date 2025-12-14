/**
 * GET /api/members/:memberId/contacts
 * Get all contacts for a member
 */

import {serve} from 'https://deno.land/std@0.168.0/http/server.ts';
import {handleCors, authenticateRequest} from '../../_shared/auth.ts';
import {
  ApiError,
  ErrorCodes,
  errorResponse,
  successResponse,
  handleError,
} from '../../_shared/errors.ts';
import {getMemberByUserId, getMemberContacts} from '../../_shared/db.ts';
import {maskPhoneNumber} from '../../_shared/email.ts';

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    // Only allow GET
    if (req.method !== 'GET') {
      return errorResponse('Method not allowed', 405);
    }

    // Authenticate user (Member)
    const memberUser = await authenticateRequest(req);

    // Get member_id from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const memberIdFromUrl = pathParts[pathParts.length - 2]; // /api/members/:id/contacts

    // Get member profile
    const memberProfile = await getMemberByUserId(memberUser.id);

    if (!memberProfile) {
      throw new ApiError('Member profile not found', 404, ErrorCodes.NOT_FOUND);
    }

    // Verify member_id matches authenticated user
    if (memberProfile.id !== memberIdFromUrl) {
      throw new ApiError('Unauthorized', 403, ErrorCodes.UNAUTHORIZED);
    }

    // Get all contacts
    const contacts = await getMemberContacts(memberUser.id);

    // Format contact data
    const contactsData = contacts.map(({user, relationship}) => ({
      relationship_id: relationship.id,
      contact_id: user.id,
      contact_phone: maskPhoneNumber(user.phone),
      status: relationship.status,
      connected_at: relationship.connected_at,
    }));

    // Return contacts
    return successResponse({
      contacts: contactsData,
      total: contactsData.length,
    });
  } catch (error) {
    return handleError(error);
  }
});
