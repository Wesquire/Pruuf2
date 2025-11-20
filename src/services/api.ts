/**
 * API Service
 * Handles all API communications
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { storage } from './storage';
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
      'SECURITY ERROR: HTTP requests are not allowed. Only HTTPS is permitted for API communication.'
    );
  }

  // Ensure HTTPS protocol is present
  if (!url.startsWith('https://') && !url.startsWith('/')) {
    throw new Error(
      'SECURITY ERROR: Invalid URL protocol. Only HTTPS URLs are allowed.'
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
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired, clear storage
      await storage.clearAll();
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  async sendVerificationCode(phone: string): Promise<VerificationCodeResponse> {
    const response = await api.post('/api/auth/send-verification-code', {
      phone: formatPhoneE164(phone),
      country_code: 'US',
    });
    return response.data;
  },

  async verifyCode(phone: string, code: string): Promise<VerifyCodeResponse> {
    const response = await api.post('/api/auth/verify-code', {
      phone: formatPhoneE164(phone),
      code,
    });
    return response.data;
  },

  async createAccount(
    phone: string,
    pin: string,
    sessionToken: string
  ): Promise<CreateAccountResponse> {
    const response = await api.post('/api/auth/create-account', {
      phone: formatPhoneE164(phone),
      pin,
      pin_confirmation: pin,
      session_token: sessionToken,
    });
    return response.data;
  },

  async login(phone: string, pin: string): Promise<LoginResponse> {
    const response = await api.post('/api/auth/login', {
      phone: formatPhoneE164(phone),
      pin,
    });
    return response.data;
  },

  async forgotPin(phone: string): Promise<APIResponse> {
    const response = await api.post('/api/auth/forgot-pin', {
      phone: formatPhoneE164(phone),
    });
    return response.data;
  },

  async resetPin(
    phone: string,
    code: string,
    newPin: string
  ): Promise<APIResponse> {
    const response = await api.post('/api/auth/reset-pin', {
      phone: formatPhoneE164(phone),
      verification_code: code,
      new_pin: newPin,
      new_pin_confirmation: newPin,
    });
    return response.data;
  },
};

// Members API
export const membersAPI = {
  async invite(name: string, phone: string): Promise<InviteMemberResponse> {
    const response = await api.post('/api/members/invite', {
      member_name: name,
      member_phone: formatPhoneE164(phone),
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
    timezone: string
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
    reminderEnabled: boolean
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
      `/api/contacts/relationship/${relationshipId}`
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

// Payments API
export const paymentsAPI = {
  async createSubscription(
    paymentMethodId: string
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
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
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
