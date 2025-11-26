/**
 * useOfflineMode Hook
 * Item 28: Implement Offline Mode (LOW)
 *
 * Manages offline state and queue
 */

import { useState, useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PendingAction {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  retryCount: number;
}

interface UseOfflineModeReturn {
  isOnline: boolean;
  isConnected: boolean;
  queueAction: (type: string, payload: any) => Promise<void>;
  processPendingActions: () => Promise<void>;
  getPendingActionsCount: () => Promise<number>;
  clearQueue: () => Promise<void>;
}

const QUEUE_STORAGE_KEY = '@offline_queue';
const MAX_RETRY_COUNT = 3;

/**
 * Hook for managing offline mode
 */
export function useOfflineMode(): UseOfflineModeReturn {
  const [isOnline, setIsOnline] = useState(true);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected === true && state.isInternetReachable !== false;
      setIsOnline(online);
      setIsConnected(state.isConnected === true);

      // Automatically process queue when coming back online
      if (online && !isOnline) {
        processPendingActions();
      }
    });

    // Initial network state check
    NetInfo.fetch().then(state => {
      const online = state.isConnected === true && state.isInternetReachable !== false;
      setIsOnline(online);
      setIsConnected(state.isConnected === true);
    });

    return () => {
      unsubscribe();
    };
  }, [isOnline]);

  /**
   * Queue an action to be executed when online
   */
  const queueAction = useCallback(async (type: string, payload: any): Promise<void> => {
    try {
      const queueJson = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      const queue: PendingAction[] = queueJson ? JSON.parse(queueJson) : [];

      const action: PendingAction = {
        id: `${type}_${Date.now()}_${Math.random()}`,
        type,
        payload,
        timestamp: Date.now(),
        retryCount: 0,
      };

      queue.push(action);
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Error queuing action:', error);
      throw error;
    }
  }, []);

  /**
   * Process all pending actions in the queue
   */
  const processPendingActions = useCallback(async (): Promise<void> => {
    try {
      const queueJson = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (!queueJson) return;

      const queue: PendingAction[] = JSON.parse(queueJson);
      if (queue.length === 0) return;

      const failedActions: PendingAction[] = [];

      // Process each action
      for (const action of queue) {
        try {
          // Here you would dispatch the actual action
          // For now, we'll just log it
          console.log('Processing offline action:', action);

          // In a real implementation, you would:
          // await dispatch(action.type, action.payload);
        } catch (error) {
          // If action fails and hasn't exceeded retry limit, keep it
          if (action.retryCount < MAX_RETRY_COUNT) {
            failedActions.push({
              ...action,
              retryCount: action.retryCount + 1,
            });
          } else {
            console.error('Action exceeded retry limit:', action);
          }
        }
      }

      // Update queue with only failed actions
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(failedActions));
    } catch (error) {
      console.error('Error processing pending actions:', error);
    }
  }, []);

  /**
   * Get count of pending actions
   */
  const getPendingActionsCount = useCallback(async (): Promise<number> => {
    try {
      const queueJson = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (!queueJson) return 0;

      const queue: PendingAction[] = JSON.parse(queueJson);
      return queue.length;
    } catch (error) {
      console.error('Error getting pending actions count:', error);
      return 0;
    }
  }, []);

  /**
   * Clear the queue
   */
  const clearQueue = useCallback(async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing queue:', error);
      throw error;
    }
  }, []);

  return {
    isOnline,
    isConnected,
    queueAction,
    processPendingActions,
    getPendingActionsCount,
    clearQueue,
  };
}
