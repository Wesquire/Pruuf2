/**
 * Offline Storage Tests
 */

import {
  saveOfflineData,
  getOfflineData,
  removeOfflineData,
  clearAllOfflineData,
  getAllOfflineDataKeys,
} from '../utils/offlineStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage');

describe('offlineStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveOfflineData', () => {
    it('should save data with timestamp', async () => {
      const data = { name: 'John', age: 30 };

      await saveOfflineData('user', data);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@offline_data_user',
        expect.stringContaining('"name":"John"')
      );
    });

    it('should save data with TTL', async () => {
      const data = { value: 'test' };
      const ttl = 60000; // 1 minute

      await saveOfflineData('cache', data, ttl);

      const savedData = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];
      const parsed = JSON.parse(savedData);

      expect(parsed.expiresAt).toBeGreaterThan(Date.now());
    });
  });

  describe('getOfflineData', () => {
    it('should get saved data', async () => {
      const data = { name: 'Jane', age: 25 };
      const cachedData = {
        data,
        timestamp: Date.now(),
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(cachedData));

      const result = await getOfflineData('user');

      expect(result).toEqual(data);
    });

    it('should return null for non-existent data', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await getOfflineData('nonexistent');

      expect(result).toBeNull();
    });

    it('should return null and remove expired data', async () => {
      const data = { value: 'expired' };
      const cachedData = {
        data,
        timestamp: Date.now() - 120000, // 2 minutes ago
        expiresAt: Date.now() - 60000, // expired 1 minute ago
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(cachedData));

      const result = await getOfflineData('cache');

      expect(result).toBeNull();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@offline_data_cache');
    });

    it('should handle corrupted data gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid json');

      const result = await getOfflineData('corrupted');

      expect(result).toBeNull();
    });
  });

  describe('removeOfflineData', () => {
    it('should remove data', async () => {
      await removeOfflineData('user');

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@offline_data_user');
    });
  });

  describe('clearAllOfflineData', () => {
    it('should clear all offline data', async () => {
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([
        '@offline_data_user',
        '@offline_data_cache',
        '@other_key',
      ]);

      await clearAllOfflineData();

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        '@offline_data_user',
        '@offline_data_cache',
      ]);
    });

    it('should handle empty storage', async () => {
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([]);

      await clearAllOfflineData();

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([]);
    });
  });

  describe('getAllOfflineDataKeys', () => {
    it('should return all offline data keys', async () => {
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([
        '@offline_data_user',
        '@offline_data_cache',
        '@offline_data_settings',
        '@other_key',
      ]);

      const keys = await getAllOfflineDataKeys();

      expect(keys).toEqual(['user', 'cache', 'settings']);
    });

    it('should return empty array when no keys exist', async () => {
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([]);

      const keys = await getAllOfflineDataKeys();

      expect(keys).toEqual([]);
    });
  });
});
