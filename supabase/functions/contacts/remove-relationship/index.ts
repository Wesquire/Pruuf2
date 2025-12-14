/**
 * DELETE /api/contacts/relationship/:relationshipId
 * Remove member-contact relationship (soft delete)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, authenticateRequest } from '../../_shared/auth.ts';
import { ApiError, ErrorCodes, errorResponse, successResponse, handleError } from '../../_shared/errors.ts';
import { getSupabaseClient, updateRelationship } from '../../_shared/db.ts';
import { sendRelationshipRemovedNotification } from '../../_shared/push.ts';
import type { MemberContactRelationship } from '../../_shared/types.ts';

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Only allow DELETE
    if (req.method !== 'DELETE') {
      return errorResponse('Method not allowed', 405);
    }

    // Authenticate user (Contact)
    const contactUser = await authenticateRequest(req);

    // Get relationship_id from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const relationshipId = pathParts[pathParts.length - 1]; // /api/contacts/relationship/:id

    // Get relationship
    const supabase = getSupabaseClient();

    const { data: relationship, error } = await supabase
      .from('member_contact_relationships')
      .select(`
        *,
        member:users!member_contact_relationships_member_id_fkey(*),
        member_data:members!inner(*)
      `)
      .eq('id', relationshipId)
      .single();

    if (error || !relationship) {
      throw new ApiError(
        'Relationship not found',
        404,
        ErrorCodes.NOT_FOUND
      );
    }

    // Verify relationship belongs to contact
    if (relationship.contact_id !== contactUser.id) {
      throw new ApiError(
        'Unauthorized',
        403,
        ErrorCodes.UNAUTHORIZED
      );
    }

    // Check if already removed
    if (relationship.status === 'removed') {
      // Idempotent - just return success
      return successResponse({
        message: 'Relationship already removed',
      });
    }

    // Soft delete: Update status to 'removed'
    await updateRelationship(relationshipId, {
      status: 'removed',
      removed_at: new Date().toISOString(),
    } as Partial<MemberContactRelationship>);

    // Get member data
    const memberData = Array.isArray(relationship.member_data)
      ? relationship.member_data[0]
      : relationship.member_data;
    const memberUser = relationship.member;

    // Notify member via push notification
    if (relationship.status === 'active') {
      // Only notify if relationship was active (not pending)
      await sendRelationshipRemovedNotification(
        memberUser.id,
        'Contact', // We don't have contact name in this context
        true // Member is being notified
      );
    }

    // Return success
    return successResponse({
      message: 'Relationship removed successfully',
    });
  } catch (error) {
    return handleError(error);
  }
});
