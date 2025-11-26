/**
 * GET /api/sessions/list
 * List all active sessions for the authenticated user
 *
 * Returns device information, IP addresses, and last activity times
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, authenticateRequest } from '../../_shared/auth.ts';
import { errorResponse, successResponse, handleError } from '../../_shared/errors.ts';
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

    // Authenticate user
    const user = await authenticateRequest(req);

    const supabase = getSupabaseClient();

    // Get active sessions
    const { data: sessions, error } = await supabase
      .from('user_sessions')
      .select('id, device_info, ip_address, user_agent, last_active_at, created_at')
      .eq('user_id', user.id)
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('last_active_at', { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
      return errorResponse('Failed to fetch sessions', 500);
    }

    // Parse device info and format response
    const formattedSessions = (sessions || []).map(session => {
      const deviceInfo = session.device_info || {};

      return {
        id: session.id,
        device: {
          type: deviceInfo.deviceType || 'Unknown',
          os: deviceInfo.os || 'Unknown',
          osVersion: deviceInfo.osVersion || 'Unknown',
          appVersion: deviceInfo.appVersion || 'Unknown',
          deviceName: deviceInfo.deviceName || 'Unknown Device',
        },
        location: {
          ipAddress: maskIpAddress(session.ip_address),
          // Could add geolocation here in the future
        },
        userAgent: session.user_agent || 'Unknown',
        lastActiveAt: session.last_active_at,
        createdAt: session.created_at,
      };
    });

    return successResponse({
      sessions: formattedSessions,
      total: formattedSessions.length,
    });
  } catch (error) {
    return handleError(error);
  }
});

/**
 * Mask IP address for privacy
 * Shows first 2 octets only (e.g., 192.168.x.x)
 */
function maskIpAddress(ip: string | null): string {
  if (!ip) return 'Unknown';

  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.x.x`;
  }

  // IPv6 - show first 4 groups
  const ipv6Parts = ip.split(':');
  if (ipv6Parts.length > 4) {
    return `${ipv6Parts.slice(0, 4).join(':')}:x:x:x:x`;
  }

  return ip;
}
