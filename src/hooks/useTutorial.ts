/**
 * useTutorial Hook
 * Item 30: Add In-App Tutorial (LOW)
 *
 * Manages tutorial state and completion
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TUTORIAL_COMPLETED_KEY = '@tutorial_completed';

interface UseTutorialReturn {
  showTutorial: boolean;
  completeTutorial: () => Promise<void>;
  resetTutorial: () => Promise<void>;
  skipTutorial: () => Promise<void>;
}

/**
 * Hook for managing tutorial state
 */
export function useTutorial(): UseTutorialReturn {
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    checkTutorialStatus();
  }, []);

  /**
   * Check if user has completed tutorial
   */
  const checkTutorialStatus = async () => {
    try {
      const completed = await AsyncStorage.getItem(TUTORIAL_COMPLETED_KEY);
      setShowTutorial(completed !== 'true');
    } catch (error) {
      console.error('Error checking tutorial status:', error);
      setShowTutorial(false);
    }
  };

  /**
   * Mark tutorial as completed
   */
  const completeTutorial = useCallback(async (): Promise<void> => {
    try {
      await AsyncStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
      setShowTutorial(false);
    } catch (error) {
      console.error('Error completing tutorial:', error);
      throw error;
    }
  }, []);

  /**
   * Reset tutorial (for testing or re-onboarding)
   */
  const resetTutorial = useCallback(async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(TUTORIAL_COMPLETED_KEY);
      setShowTutorial(true);
    } catch (error) {
      console.error('Error resetting tutorial:', error);
      throw error;
    }
  }, []);

  /**
   * Skip tutorial
   */
  const skipTutorial = useCallback(async (): Promise<void> => {
    await completeTutorial();
  }, [completeTutorial]);

  return {
    showTutorial,
    completeTutorial,
    resetTutorial,
    skipTutorial,
  };
}
