import { Easing } from 'react-native-reanimated';

export const TRANSITIONS = {
  // Ease in/out for smooth UI
  smooth: {
    duration: 300,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  },
  
  // Quick interactions
  quick: {
    duration: 200,
    easing: Easing.out(Easing.cubic),
  },
  
  // Spring for natural feel
  spring: {
    damping: 15,
    stiffness: 100,
  },
  
  // Voice wave pulse
  pulse: {
    duration: 800,
    easing: Easing.inOut(Easing.sin),
  },
} as const;
