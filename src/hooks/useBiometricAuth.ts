/**
 * useBiometricAuth Hook
 * Item 29: Add Biometric Authentication (MEDIUM)
 *
 * Manages biometric authentication state and operations
 */

import { useState, useEffect, useCallback } from 'react';
import { storage } from '../services/storage';
import {
  checkBiometricAvailability,
  authenticateWithBiometrics,
  enrollBiometrics,
  disableBiometrics,
  isBiometricsEnrolled,
  getBiometricTypeName,
  BiometricType,
} from '../utils/biometrics';

export interface BiometricAuthState {
  isAvailable: boolean;
  isEnrolled: boolean;
  isEnabled: boolean;
  biometryType: BiometricType;
  isLoading: boolean;
  error: string | null;
}

export interface UseBiometricAuthReturn {
  state: BiometricAuthState;
  authenticate: (promptMessage?: string) => Promise<boolean>;
  enroll: () => Promise<boolean>;
  disable: () => Promise<boolean>;
  toggleEnabled: (enabled: boolean) => Promise<void>;
  refresh: () => Promise<void>;
  getBiometricName: () => string;
}

const STORAGE_KEY_BIOMETRIC_ENABLED = 'biometric_auth_enabled';

/**
 * Hook for managing biometric authentication
 */
export function useBiometricAuth(): UseBiometricAuthReturn {
  const [state, setState] = useState<BiometricAuthState>({
    isAvailable: false,
    isEnrolled: false,
    isEnabled: false,
    biometryType: null,
    isLoading: true,
    error: null,
  });

  /**
   * Check and update biometric status
   */
  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check availability
      const availability = await checkBiometricAvailability();

      if (!availability.available) {
        setState({
          isAvailable: false,
          isEnrolled: false,
          isEnabled: false,
          biometryType: null,
          isLoading: false,
          error: availability.error || null,
        });
        return;
      }

      // Check if enrolled
      const enrolled = await isBiometricsEnrolled();

      // Check if enabled in settings
      const enabledStr = await storage.getItem(STORAGE_KEY_BIOMETRIC_ENABLED);
      const enabled = enabledStr === 'true' && enrolled;

      setState({
        isAvailable: true,
        isEnrolled: enrolled,
        isEnabled: enabled,
        biometryType: availability.biometryType,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, []);

  /**
   * Authenticate with biometrics
   */
  const authenticate = useCallback(
    async (promptMessage?: string): Promise<boolean> => {
      if (!state.isAvailable || !state.isEnrolled) {
        return false;
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const result = await authenticateWithBiometrics(promptMessage);

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: result.error || null,
      }));

      return result.success;
    },
    [state.isAvailable, state.isEnrolled]
  );

  /**
   * Enroll biometric authentication
   */
  const enroll = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    const result = await enrollBiometrics();

    if (result.success) {
      // Enable biometrics in settings
      await storage.setItem(STORAGE_KEY_BIOMETRIC_ENABLED, 'true');

      setState(prev => ({
        ...prev,
        isEnrolled: true,
        isEnabled: true,
        biometryType: result.biometryType,
        isLoading: false,
        error: null,
      }));

      return true;
    } else {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: result.error || 'Enrollment failed',
      }));

      return false;
    }
  }, []);

  /**
   * Disable biometric authentication
   */
  const disable = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    const result = await disableBiometrics();

    if (result.success) {
      // Disable in settings
      await storage.setItem(STORAGE_KEY_BIOMETRIC_ENABLED, 'false');

      setState(prev => ({
        ...prev,
        isEnrolled: false,
        isEnabled: false,
        isLoading: false,
        error: null,
      }));

      return true;
    } else {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: result.error || 'Failed to disable',
      }));

      return false;
    }
  }, []);

  /**
   * Toggle biometric authentication enabled state
   */
  const toggleEnabled = useCallback(
    async (enabled: boolean): Promise<void> => {
      if (enabled && !state.isEnrolled) {
        // Need to enroll first
        await enroll();
        return;
      }

      await storage.setItem(STORAGE_KEY_BIOMETRIC_ENABLED, enabled ? 'true' : 'false');

      setState(prev => ({
        ...prev,
        isEnabled: enabled && prev.isEnrolled,
      }));
    },
    [state.isEnrolled, enroll]
  );

  /**
   * Get user-friendly biometric type name
   */
  const getBiometricName = useCallback((): string => {
    return getBiometricTypeName(state.biometryType);
  }, [state.biometryType]);

  /**
   * Initialize on mount
   */
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    state,
    authenticate,
    enroll,
    disable,
    toggleEnabled,
    refresh,
    getBiometricName,
  };
}
