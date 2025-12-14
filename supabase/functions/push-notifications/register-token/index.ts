/**
 * POST /api/push-notifications/register-token
 * Register FCM token for push notifications
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
import {registerFcmToken} from '../../_shared/push.ts';

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

    // Authenticate user
    const user = await authenticateRequest(req);

    // Parse request body
    const body = await req.json();

    // Validate required fields
    validateRequiredFields(body, ['token', 'platform']);

    const {token, platform} = body;

    // Validate platform
    if (platform !== 'ios' && platform !== 'android') {
      throw new ApiError(
        'Invalid platform. Must be "ios" or "android"',
        400,
        ErrorCodes.VALIDATION_ERROR,
      );
    }

    // Register token
    await registerFcmToken(user.id, token, platform);

    // Return success
    return successResponse({
      message: 'Push notification token registered successfully',
      token: {
        platform,
        registered: true,
      },
    });
  } catch (error) {
    return handleError(error);
  }
});
