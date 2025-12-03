/**
 * useHaptics hook for consistent haptic feedback
 */

import haptics from '@/lib/haptics';

export function useHaptics() {
  const light = () => {
    haptics.light();
  };

  const medium = () => {
    haptics.medium();
  };

  const heavy = () => {
    haptics.heavy();
  };

  const success = () => {
    haptics.success();
  };

  const warning = () => {
    haptics.warning();
  };

  const error = () => {
    haptics.error();
  };

  const selection = () => {
    haptics.selection();
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
