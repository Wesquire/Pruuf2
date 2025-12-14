/**
 * GET /api/contacts/me/members
 * Get all members for a contact with check-in status
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, authenticateRequest } from '../../_shared/auth.ts';
import { errorResponse, successResponse, handleError } from '../../_shared/errors.ts';
import { getContactMembers, getTodayCheckIn } from '../../_shared/db.ts';
import { maskPhoneNumber } from '../../_shared/email.ts';

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Only allow GET
    if (req.method !== 'GET') {
      return errorResponse('Method not allowed', 405);
    }

    // Authenticate user (Contact)
    const contactUser = await authenticateRequest(req);

    // Get all members for this contact
    const members = await getContactMembers(contactUser.id);

    // Enrich with check-in status
    const membersWithStatus = await Promise.all(
      members.map(async ({ user, member, relationship }) => {
        // Get today's check-in if it exists
        const todayCheckIn = member.check_in_time
          ? await getTodayCheckIn(user.id, member.timezone || 'America/New_York')
          : null;

        // Calculate status and time until deadline
        let status = 'pending'; // pending, checked_in, late, missed
        let minutesUntilDeadline = 0;
        let minutesLate = 0;

        if (member.check_in_time && member.timezone) {
          const now = new Date();
          const [hours, minutes] = member.check_in_time.split(':').map(Number);

          // Create deadline for today
          const deadline = new Date();
          deadline.setHours(hours, minutes, 0, 0);

          // Calculate minutes until deadline
          minutesUntilDeadline = Math.floor(
            (deadline.getTime() - now.getTime()) / 1000 / 60
          );

          if (todayCheckIn) {
            // Member has checked in
            const checkedInAt = new Date(todayCheckIn.checked_in_at);

            if (checkedInAt > deadline) {
              // Checked in after deadline (late)
              minutesLate = Math.floor(
                (checkedInAt.getTime() - deadline.getTime()) / 1000 / 60
              );
              status = 'late';
            } else {
              // Checked in on time
              status = 'checked_in';
            }
          } else {
            // Member has not checked in
            if (minutesUntilDeadline < 0) {
              // Deadline has passed
              status = 'missed';
              minutesLate = Math.abs(minutesUntilDeadline);
            } else {
              // Deadline hasn't passed yet
              status = 'pending';
            }
          }
        }

        return {
          relationship_id: relationship.id,
          member_id: user.id,
          member_name: member.name,
          member_phone: maskPhoneNumber(user.phone),
          check_in_time: member.check_in_time,
          timezone: member.timezone,
          status,
          checked_in_at: todayCheckIn?.checked_in_at || null,
          deadline:
            member.check_in_time && member.timezone
              ? `${member.check_in_time} ${member.timezone}`
              : null,
          minutes_until_deadline: minutesUntilDeadline,
          minutes_late: minutesLate,
          relationship_status: relationship.status,
          connected_at: relationship.connected_at,
        };
      })
    );

    // Return members with status
    return successResponse({
      members: membersWithStatus,
      total: membersWithStatus.length,
      summary: {
        checked_in: membersWithStatus.filter(m => m.status === 'checked_in').length,
        pending: membersWithStatus.filter(m => m.status === 'pending').length,
        late: membersWithStatus.filter(m => m.status === 'late').length,
        missed: membersWithStatus.filter(m => m.status === 'missed').length,
      },
    });
  } catch (error) {
    return handleError(error);
  }
});
