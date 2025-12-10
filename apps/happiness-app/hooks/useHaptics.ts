/**
 * useHaptics hook for consistent haptic feedback
 */

import {
  light as hapticLight,
  medium as hapticMedium,
  heavy as hapticHeavy,
  success as hapticSuccess,
  warning as hapticWarning,
  error as hapticError,
  selection as hapticSelection,
} from '@/lib/haptics';

export function useHaptics() {
  const light = () => {
    hapticLight();
  };

  const medium = () => {
    hapticMedium();
  };

  const heavy = () => {
    hapticHeavy();
  };

  const success = () => {
    hapticSuccess();
  };

  const warning = () => {
    hapticWarning();
  };

  const error = () => {
    hapticError();
  };

  const selection = () => {
    hapticSelection();
  };

  return {
    light,
    medium,
    heavy,
    success,
    warning,
    error,
    selection,
  };
}
