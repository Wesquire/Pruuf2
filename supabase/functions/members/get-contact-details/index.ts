/**
 * GET /api/members/contacts/:id
 * Get detailed information about a specific Contact (for Members)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, authenticateRequest } from '../../_shared/auth.ts';
import { ApiError, ErrorCodes, errorResponse, successResponse, handleError } from '../../_shared/errors.ts';
import { getSupabaseClient } from '../../_shared/db.ts';

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Only allow GET
    if (req.method !== 'GET') {
      return errorResponse('Method not allowed', 405);
    }

    // Authenticate user (Member)
    const memberUser = await authenticateRequest(req);

    // Extract contact ID from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const contactUserId = pathParts[pathParts.length - 1];

    if (!contactUserId) {
      throw new ApiError('Contact ID is required', 400, ErrorCodes.VALIDATION_ERROR);
    }

    const supabase = getSupabaseClient();

    // Get the relationship to verify Member has this Contact
    const { data: relationship, error: relationshipError } = await supabase
      .from('member_contact_relationships')
      .select('*')
      .eq('member_id', memberUser.id)
      .eq('contact_id', contactUserId)
      .is('deleted_at', null)
      .single();

    if (relationshipError || !relationship) {
      throw new ApiError('Contact not found or access denied', 404, ErrorCodes.NOT_FOUND);
    }

    // Get Contact user details
    const { data: contactUser, error: contactError } = await supabase
      .from('users')
      .select('id, phone')
      .eq('id', contactUserId)
      .is('deleted_at', null)
      .single();

    if (contactError || !contactUser) {
      throw new ApiError('Contact user not found', 404, ErrorCodes.NOT_FOUND);
    }

    // Return contact details
    return successResponse({
      contact: {
        id: relationship.id,
        user_id: contactUser.id,
        phone: contactUser.phone,
        relationship_status: relationship.status,
        invited_at: relationship.invited_at,
        connected_at: relationship.connected_at,
        last_invite_sent_at: relationship.last_invite_sent_at,
      },
    });
  } catch (error) {
    return handleError(error);
  }
});
