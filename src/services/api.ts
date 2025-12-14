/**
 * API Service
 * Handles all API communications
 */

import axios, {AxiosInstance, AxiosError} from 'axios';
import {storage} from './storage';
import {
  VerificationCodeResponse,
  VerifyCodeResponse,
  CreateAccountResponse,
  LoginResponse,
  InviteMemberResponse,
  CheckInResponse,
  GetContactsResponse,
  GetMembersResponse,
  CreateSubscriptionResponse,
  APIResponse,
} from '../types';

// Configuration
const API_BASE_URL = __DEV__
  ? 'http://localhost:3000'
  : 'https://api.pruuf.app';

/**
 * HTTPS-Only Enforcement
 * Validates that all API requests use HTTPS in production
 * Throws error if HTTP is used outside of development/localhost
 */
function validateHTTPS(url: string): void {
  // Skip validation for localhost in development
  if (__DEV__ && (url.includes('localhost') || url.includes('127.0.0.1'))) {
    return;
  }

  // Enforce HTTPS for all other requests
  if (url.startsWith('http://')) {
    throw new Error(
      'SECURITY ERROR: HTTP requests are not allowed. Only HTTPS is permitted for API communication.',
    );
  }

  // Ensure HTTPS protocol is present
  if (!url.startsWith('https://') && !url.startsWith('/')) {
    throw new Error(
      'SECURITY ERROR: Invalid URL protocol. Only HTTPS URLs are allowed.',
    );
  }
}

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and validate HTTPS
api.interceptors.request.use(
  async config => {
    // HTTPS-Only Enforcement: Validate URL before sending request
    const fullURL = config.baseURL
      ? `${config.baseURL}${config.url}`
      : config.url || '';

    validateHTTPS(fullURL);

    // Add authentication token
    const token = await storage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

/**
 * Token Refresh Logic
 * Track if a token refresh is currently in progress to avoid concurrent attempts
 */
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Token refresh already in progress, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({resolve, reject});
        })
          .then(token => {
            originalRequest.headers.Authorization = 'Bearer ' + token;
            return api(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Get refresh token from storage
        const refreshToken = await storage.getRefreshToken();

        if (!refreshToken) {
          // No refresh token available, logout
          throw new Error('No refresh token available');
        }

        // Attempt to refresh the token
        const response = await axios.post(
          `${API_BASE_URL}/api/auth/refresh-token`,
          {refresh_token: refreshToken},
        );

        const {access_token, refresh_token: newRefreshToken} = response.data;

        // Store new tokens
        await storage.setTokens(access_token, newRefreshToken);

        // Update the authorization header
        originalRequest.headers.Authorization = `Bearer ${access_token}`;

        // Process queued requests
        processQueue(null, access_token);

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Token refresh failed, logout user
        processQueue(refreshError, null);
        await storage.clearAll();
        console.error('Token refresh failed, logging out:', refreshError);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// Auth API
export const authAPI = {
  async sendVerificationCode(email: string): Promise<VerificationCodeResponse> {
    const response = await api.post('/api/auth/send-verification-code', {
      email: email.toLowerCase(),
    });
    return response.data;
  },

  async verifyCode(email: string, code: string): Promise<VerifyCodeResponse> {
    const response = await api.post('/api/auth/verify-code', {
      email: email.toLowerCase(),
      code,
    });
    return response.data;
  },

  async createAccount(
    email: string,
    pin: string,
    sessionToken: string,
  ): Promise<CreateAccountResponse> {
    const response = await api.post('/api/auth/create-account', {
      email: email.toLowerCase(),
      pin,
      pin_confirmation: pin,
      session_token: sessionToken,
    });
    return response.data;
  },

  async login(email: string, pin: string): Promise<LoginResponse> {
    const response = await api.post('/api/auth/login', {
      email: email.toLowerCase(),
      pin,
    });
    return response.data;
  },

  async forgotPin(email: string): Promise<APIResponse> {
    const response = await api.post('/api/auth/forgot-pin', {
      email: email.toLowerCase(),
    });
    return response.data;
  },

  async resetPin(
    email: string,
    code: string,
    newPin: string,
  ): Promise<APIResponse> {
    const response = await api.post('/api/auth/reset-pin', {
      email: email.toLowerCase(),
      verification_code: code,
      new_pin: newPin,
      new_pin_confirmation: newPin,
    });
    return response.data;
  },

  async refreshToken(
    refreshToken: string,
  ): Promise<{access_token: string; refresh_token: string}> {
    const response = await api.post('/api/auth/refresh-token', {
      refresh_token: refreshToken,
    });
    return response.data;
  },

  async checkVerificationStatus(
    email: string,
  ): Promise<{success: boolean; verified: boolean; session_token?: string}> {
    const response = await api.post(
      '/api/auth/check-email-verification-status',
      {
        email: email.toLowerCase(),
      },
    );
    return response.data;
  },
};

// Members API
export const membersAPI = {
  async invite(name: string, email: string): Promise<InviteMemberResponse> {
    const response = await api.post('/api/members/invite', {
      member_name: name,
      member_email: email.toLowerCase(),
    });
    return response.data;
  },

  async acceptInvite(inviteCode: string): Promise<APIResponse> {
    const response = await api.post('/api/members/accept-invite', {
      invite_code: inviteCode.toUpperCase(),
    });
    return response.data;
  },

  async checkIn(memberId: string, timezone: string): Promise<CheckInResponse> {
    const response = await api.post(`/api/members/${memberId}/check-in`, {
      timezone,
    });
    return response.data;
  },

  async updateCheckInTime(
    memberId: string,
    checkInTime: string,
    timezone: string,
  ): Promise<APIResponse> {
    const response = await api.patch(`/api/members/${memberId}/check-in-time`, {
      check_in_time: checkInTime,
      timezone,
    });
    return response.data;
  },

  async getContacts(memberId: string): Promise<GetContactsResponse> {
    const response = await api.get(`/api/members/${memberId}/contacts`);
    return response.data;
  },

  async completeOnboarding(
    memberId: string,
    checkInTime: string,
    timezone: string,
    reminderEnabled: boolean,
  ): Promise<APIResponse> {
    const response = await api.post('/api/members/complete-onboarding', {
      member_id: memberId,
      check_in_time: checkInTime,
      timezone,
      reminder_enabled: reminderEnabled,
    });
    return response.data;
  },
};

// Contacts API
export const contactsAPI = {
  async getMembers(): Promise<GetMembersResponse> {
    const response = await api.get('/api/contacts/me/members');
    return response.data;
  },

  async resendInvite(relationshipId: string): Promise<APIResponse> {
    const response = await api.post('/api/contacts/resend-invite', {
      relationship_id: relationshipId,
    });
    return response.data;
  },

  async removeRelationship(relationshipId: string): Promise<APIResponse> {
    const response = await api.delete(
      `/api/contacts/relationship/${relationshipId}`,
    );
    return response.data;
  },
};

// Users API
export const usersAPI = {
  async updateFontSize(fontSize: string): Promise<APIResponse> {
    const response = await api.patch('/api/users/me', {
      font_size_preference: fontSize,
    });
    return response.data;
  },

  async deleteAccount(): Promise<APIResponse> {
    const response = await api.delete('/api/users/me/account');
    return response.data;
  },
};

// Settings API
export const settingsAPI = {
  async updateNotificationSettings(settings: {
    push_enabled?: boolean;
    email_enabled?: boolean;
    reminder_enabled?: boolean;
    reminder_minutes?: number;
  }): Promise<APIResponse> {
    const response = await api.patch('/api/users/me/notifications', settings);
    return response.data;
  },

  async getNotificationSettings(): Promise<APIResponse> {
    const response = await api.get('/api/users/me/notifications');
    return response.data;
  },
};

// Payments API
export const paymentsAPI = {
  async createSubscription(
    paymentMethodId: string,
  ): Promise<CreateSubscriptionResponse> {
    const response = await api.post('/api/payments/create-subscription', {
      payment_method_id: paymentMethodId,
    });
    return response.data;
  },

  async cancelSubscription(): Promise<APIResponse> {
    const response = await api.post('/api/payments/cancel-subscription');
    return response.data;
  },

  async getPaymentMethods(): Promise<APIResponse> {
    const response = await api.get('/api/payments/payment-methods');
    return response.data;
  },

  async getSubscription(): Promise<APIResponse> {
    const response = await api.get('/api/payments/subscription');
    return response.data;
  },

  async createSetupIntent(): Promise<APIResponse> {
    const response = await api.post('/api/payments/setup-intent');
    return response.data;
  },

  async attachPaymentMethod(paymentMethodId: string): Promise<APIResponse> {
    const response = await api.post('/api/payments/attach-payment-method', {
      payment_method_id: paymentMethodId,
    });
    return response.data;
  },

  async detachPaymentMethod(paymentMethodId: string): Promise<APIResponse> {
    const response = await api.post('/api/payments/detach-payment-method', {
      payment_method_id: paymentMethodId,
    });
    return response.data;
  },

  async setDefaultPaymentMethod(paymentMethodId: string): Promise<APIResponse> {
    const response = await api.post(
      '/api/payments/set-default-payment-method',
      {
        payment_method_id: paymentMethodId,
      },
    );
    return response.data;
  },

  async reactivateSubscription(): Promise<APIResponse> {
    const response = await api.post('/api/payments/reactivate-subscription');
    return response.data;
  },
};

// Push Notifications API
export const pushAPI = {
  async registerToken(token: string, platform: string): Promise<APIResponse> {
    const response = await api.post('/api/push-notifications/register-token', {
      token,
      platform,
    });
    return response.data;
  },

  async getNotifications(): Promise<APIResponse> {
    const response = await api.get('/api/notifications');
    return response.data;
  },

  async markAsRead(notificationId: string): Promise<APIResponse> {
    const response = await api.post(
      `/api/notifications/${notificationId}/read`,
    );
    return response.data;
  },

  async markAllAsRead(): Promise<APIResponse> {
    const response = await api.post('/api/notifications/read-all');
    return response.data;
  },

  async deleteNotification(notificationId: string): Promise<APIResponse> {
    const response = await api.delete(`/api/notifications/${notificationId}`);
    return response.data;
  },
};

// Helper function to format phone to E.164
function formatPhoneE164(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  return phone;
}

// Export format helper for UI
export function formatPhoneDisplay(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
      6,
    )}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(
      7,
    )}`;
  }
  return phone;
}

export function maskPhone(phone: string): string {
  const formatted = formatPhoneDisplay(phone);
  if (formatted.length >= 4) {
    return `(***) ***-${formatted.slice(-4)}`;
  }
  return formatted;
}

// Default export for screens that import api directly
export default api;
