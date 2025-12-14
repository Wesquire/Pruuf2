/**
 * Secure Storage Service
 * Uses encrypted storage for sensitive data
 */

import EncryptedStorage from 'react-native-encrypted-storage';
import {UserProfile} from '../types';

const KEYS = {
  ACCESS_TOKEN: 'pruuf_access_token',
  REFRESH_TOKEN: 'pruuf_refresh_token',
  USER: 'pruuf_user',
  FONT_SIZE: 'pruuf_font_size',
};

export const storage = {
  // Access Token
  async setAccessToken(token: string): Promise<void> {
    await EncryptedStorage.setItem(KEYS.ACCESS_TOKEN, token);
  },

  async getAccessToken(): Promise<string | null> {
    return await EncryptedStorage.getItem(KEYS.ACCESS_TOKEN);
  },

  async removeAccessToken(): Promise<void> {
    await EncryptedStorage.removeItem(KEYS.ACCESS_TOKEN);
  },

  // Refresh Token
  async setRefreshToken(token: string): Promise<void> {
    await EncryptedStorage.setItem(KEYS.REFRESH_TOKEN, token);
  },

  async getRefreshToken(): Promise<string | null> {
    return await EncryptedStorage.getItem(KEYS.REFRESH_TOKEN);
  },

  async removeRefreshToken(): Promise<void> {
    await EncryptedStorage.removeItem(KEYS.REFRESH_TOKEN);
  },

  // Set both tokens at once
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      EncryptedStorage.setItem(KEYS.ACCESS_TOKEN, accessToken),
      EncryptedStorage.setItem(KEYS.REFRESH_TOKEN, refreshToken),
    ]);
  },

  // User Profile
  async setUser(user: UserProfile): Promise<void> {
    await EncryptedStorage.setItem(KEYS.USER, JSON.stringify(user));
  },

  async getUser(): Promise<UserProfile | null> {
    const data = await EncryptedStorage.getItem(KEYS.USER);
    return data ? JSON.parse(data) : null;
  },

  async removeUser(): Promise<void> {
    await EncryptedStorage.removeItem(KEYS.USER);
  },

  // Font Size Preference
  async setFontSize(size: string): Promise<void> {
    await EncryptedStorage.setItem(KEYS.FONT_SIZE, size);
  },

  async getFontSize(): Promise<string | null> {
    return await EncryptedStorage.getItem(KEYS.FONT_SIZE);
  },

  // Clear all
  async clearAll(): Promise<void> {
    await EncryptedStorage.clear();
  },
};
