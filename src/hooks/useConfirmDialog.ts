/**
 * useConfirmDialog Hook
 * Item 40: Add Confirmation Dialogs (MEDIUM)
 *
 * Hook for managing confirmation dialog state
 */

import {useState, useCallback} from 'react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  confirmButtonColor?: string;
}

interface UseConfirmDialogReturn {
  isVisible: boolean;
  dialogProps: ConfirmOptions & {
    visible: boolean;
    onConfirm: () => void;
    onCancel: () => void;
  };
  showConfirm: (options: ConfirmOptions, onConfirm: () => void) => void;
  hideConfirm: () => void;
}

export function useConfirmDialog(): UseConfirmDialogReturn {
  const [isVisible, setIsVisible] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    title: '',
    message: '',
  });
  const [onConfirmCallback, setOnConfirmCallback] = useState<() => void>(
    () => () => {},
  );

  const showConfirm = useCallback(
    (opts: ConfirmOptions, onConfirm: () => void) => {
      setOptions(opts);
      setOnConfirmCallback(() => onConfirm);
      setIsVisible(true);
    },
    [],
  );

  const hideConfirm = useCallback(() => {
    setIsVisible(false);
  }, []);

  const handleConfirm = useCallback(() => {
    onConfirmCallback();
    hideConfirm();
  }, [onConfirmCallback, hideConfirm]);

  const handleCancel = useCallback(() => {
    hideConfirm();
  }, [hideConfirm]);

  return {
    isVisible,
    dialogProps: {
      visible: isVisible,
      ...options,
      onConfirm: handleConfirm,
      onCancel: handleCancel,
    },
    showConfirm,
    hideConfirm,
  };
}
