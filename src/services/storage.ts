/**
 * Secure Storage Service
 * Uses Expo SecureStore for sensitive data (replaces react-native-encrypted-storage)
 *
 * Note: expo-secure-store has a 2048 byte value limit per key
 */

import * as SecureStore from 'expo-secure-store';
import {UserProfile} from '../types';

const KEYS = {
  ACCESS_TOKEN: 'pruuf_access_token',
  REFRESH_TOKEN: 'pruuf_refresh_token',
  USER: 'pruuf_user',
  FONT_SIZE: 'pruuf_font_size',
};

// All known keys for clearAll functionality
const ALL_KEYS = Object.values(KEYS);

export const storage = {
  // Access Token
  async setAccessToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, token);
  },

  async getAccessToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
  },

  async removeAccessToken(): Promise<void> {
    await SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN);
  },

  // Refresh Token
  async setRefreshToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, token);
  },

  async getRefreshToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
  },

  async removeRefreshToken(): Promise<void> {
    await SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN);
  },

  // Set both tokens at once
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, accessToken),
      SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refreshToken),
    ]);
  },

  // User Profile
  async setUser(user: UserProfile): Promise<void> {
    await SecureStore.setItemAsync(KEYS.USER, JSON.stringify(user));
  },

  async getUser(): Promise<UserProfile | null> {
    const data = await SecureStore.getItemAsync(KEYS.USER);
    return data ? JSON.parse(data) : null;
  },

  async removeUser(): Promise<void> {
    await SecureStore.deleteItemAsync(KEYS.USER);
  },

  // Font Size Preference
  async setFontSize(size: string): Promise<void> {
    await SecureStore.setItemAsync(KEYS.FONT_SIZE, size);
  },

  async getFontSize(): Promise<string | null> {
    return await SecureStore.getItemAsync(KEYS.FONT_SIZE);
  },

  // Clear all known keys
  // Note: expo-secure-store doesn't have a clear() method, so we delete each key individually
  async clearAll(): Promise<void> {
    await Promise.all(ALL_KEYS.map(key => SecureStore.deleteItemAsync(key)));
  },

  // Generic methods for arbitrary key-value storage
  async getItem(key: string): Promise<string | null> {
    return await SecureStore.getItemAsync(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },

  async removeItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },
};
