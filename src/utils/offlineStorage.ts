/**
 * Offline Storage Utilities
 * Item 28: Implement Offline Mode (LOW)
 *
 * Manages offline data persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const OFFLINE_DATA_PREFIX = '@offline_data_';

export interface CachedData<T> {
  data: T;
  timestamp: number;
  expiresAt?: number;
}

/**
 * Save data for offline access
 */
export async function saveOfflineData<T>(
  key: string,
  data: T,
  ttl?: number,
): Promise<void> {
  try {
    const cachedData: CachedData<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: ttl ? Date.now() + ttl : undefined,
    };

    await AsyncStorage.setItem(
      `${OFFLINE_DATA_PREFIX}${key}`,
      JSON.stringify(cachedData),
    );
  } catch (error) {
    console.error('Error saving offline data:', error);
    throw error;
  }
}

/**
 * Get offline data
 */
export async function getOfflineData<T>(key: string): Promise<T | null> {
  try {
    const json = await AsyncStorage.getItem(`${OFFLINE_DATA_PREFIX}${key}`);
    if (!json) return null;

    const cachedData: CachedData<T> = JSON.parse(json);

    // Check if data has expired
    if (cachedData.expiresAt && Date.now() > cachedData.expiresAt) {
      await removeOfflineData(key);
      return null;
    }

    return cachedData.data;
  } catch (error) {
    console.error('Error getting offline data:', error);
    return null;
  }
}

/**
 * Remove offline data
 */
export async function removeOfflineData(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${OFFLINE_DATA_PREFIX}${key}`);
  } catch (error) {
    console.error('Error removing offline data:', error);
    throw error;
  }
}

/**
 * Clear all offline data
 */
export async function clearAllOfflineData(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const offlineKeys = keys.filter(k => k.startsWith(OFFLINE_DATA_PREFIX));
    await AsyncStorage.multiRemove(offlineKeys);
  } catch (error) {
    console.error('Error clearing offline data:', error);
    throw error;
  }
}

/**
 * Get all offline data keys
 */
export async function getAllOfflineDataKeys(): Promise<string[]> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    return keys
      .filter(k => k.startsWith(OFFLINE_DATA_PREFIX))
      .map(k => k.replace(OFFLINE_DATA_PREFIX, ''));
  } catch (error) {
    console.error('Error getting offline data keys:', error);
    return [];
  }
}
