import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { BlurView } from 'expo-blur';
import { Colors, Typography, BorderRadius } from '@/constants/Theme';
import { useThinking } from '@/lib/ThinkingContext';

export function ThinkingDock() {
  const { running, currentStep } = useThinking();

  return (
    <AnimatePresence>
      {running && (
        <MotiView
          from={{ translateY: 100, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          exit={{ translateY: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          style={styles.container}
        >
          <BlurView intensity={80} tint="dark" style={styles.content}>
            <View style={styles.indicator}>
              <MotiView
                from={{ scale: 1 }}
                animate={{ scale: 1.2 }}
                transition={{ loop: true, type: 'timing', duration: 800 }}
                style={styles.dot}
              />
            </View>
            <Text style={styles.text}>
              {currentStep ? `${currentStep}...` : 'Thinking...'}
            </Text>
          </BlurView>
        </MotiView>
      )}
    </AnimatePresence>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 160, // Above input
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 100,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.5)',
    gap: 12,
    overflow: 'hidden',
  },
  indicator: {
    width: 8,
    height: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary[500],
  },
  text: {
    color: Colors.white,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
});
