/**
 * CompanionCard - Grok-style companion selection card
 *
 * Full-bleed artwork with name/description overlay at bottom
 * Matches Grok iOS design with large preview images
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Svg, Circle } from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

export const triggerHaptic = async () => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // ignore
  }
};

export interface CompanionCardProps {
  id: string;
  name: string;
  description?: string;
  cardImage: ImageSourcePropType;
  isAdult?: boolean;
  isActive?: boolean;
  isLoading?: boolean;
  loadingProgress?: number;
  layoutSize?: { width: number; height: number };
  onPress: () => void;
  onChatPress: () => void;
  onVoicePress: () => void;
}

export const CompanionCard: React.FC<CompanionCardProps> = ({
  id,
  name,
  description,
  cardImage,
  isAdult = false,
  isActive = false,
  isLoading = false,
  loadingProgress = 0,
  layoutSize,
  onPress,
  onChatPress,
  onVoicePress,
}) => {
  const { theme, colors } = useTheme();
  const scale = useSharedValue(isActive ? 1.02 : 1);
  const [imageError, setImageError] = useState(false);
  const isDark = theme === 'dark';

  React.useEffect(() => {
    scale.value = withSpring(isActive ? 1.02 : 1, {
      damping: 15,
      stiffness: 150,
    });
  }, [isActive, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    triggerHaptic();
    onPress();
  };

  const handleChatPress = (e: any) => {
    e.stopPropagation();
    triggerHaptic();
    onChatPress();
  };

  const handleVoicePress = (e: any) => {
    e.stopPropagation();
    triggerHaptic();
    onVoicePress();
  };

  const cardWidth = layoutSize?.width || CARD_WIDTH;
  const cardHeight = layoutSize?.height || CARD_HEIGHT;

  return (
    <Animated.View
      style={[
        styles.container,
        { width: cardWidth, height: cardHeight },
        animatedStyle,
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={handlePress}
        style={styles.touchable}
      >
        <View
          style={[
            styles.card,
            isActive && styles.cardActive,
            {
              backgroundColor: isDark
                ? 'rgba(30, 25, 40, 0.95)'
                : 'rgba(255, 245, 250, 0.95)',
            },
          ]}
        >
          {/* Full-bleed Image - Takes up most of the card */}
          <View style={styles.imageContainer}>
            <Image
              source={cardImage}
              style={styles.fullImage}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />

            {/* Loading overlay with progress ring */}
            {isLoading && (
              <View style={styles.loadingOverlay}>
                <Svg width={80} height={80} viewBox="0 0 80 80">
                  <Circle
                    cx={40}
                    cy={40}
                    r={36}
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth={4}
                    fill="none"
                  />
                  <Circle
                    cx={40}
                    cy={40}
                    r={36}
                    stroke="#fff"
                    strokeWidth={4}
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 36}`}
                    strokeDashoffset={
                      (1 - Math.min(100, loadingProgress) / 100) *
                      2 *
                      Math.PI *
                      36
                    }
                    rotation={-90}
                    origin="40, 40"
                  />
                </Svg>
                <Text style={styles.loadingText}>
                  {Math.round(loadingProgress)}%
                </Text>
              </View>
            )}

            {/* Error fallback */}
            {imageError && (
              <View style={styles.errorOverlay}>
                <Ionicons name="image-outline" size={40} color="#fff" />
                <Text style={styles.errorText}>Preview unavailable</Text>
              </View>
            )}

            {/* 18+ Badge (if applicable) */}
            {isAdult && (
              <BlurView intensity={60} tint="dark" style={styles.adultBadge}>
                <Text style={styles.adultBadgeText}>18+</Text>
              </BlurView>
            )}
          </View>

          {/* Bottom info section with glassmorphism */}
          <BlurView
            intensity={isDark ? 40 : 60}
            tint={isDark ? 'dark' : 'light'}
            style={styles.infoSection}
          >
            <View style={styles.infoContent}>
              <Text
                style={[styles.name, { color: isDark ? '#fff' : '#1a1a1a' }]}
                numberOfLines={1}
              >
                {name}
              </Text>
              {description && (
                <Text
                  style={[
                    styles.description,
                    {
                      color: isDark
                        ? 'rgba(255,255,255,0.7)'
                        : 'rgba(0,0,0,0.6)',
                    },
                  ]}
                  numberOfLines={2}
                >
                  {description}
                </Text>
              )}

              {/* Action buttons */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  onPress={handleChatPress}
                  activeOpacity={0.8}
                  style={[
                    styles.chatButton,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255,255,255,0.15)'
                        : 'rgba(0,0,0,0.1)',
                    },
                  ]}
                >
                  <Ionicons
                    name="chatbubble"
                    size={16}
                    color={isDark ? '#fff' : '#1a1a1a'}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleVoicePress}
                  activeOpacity={0.8}
                  style={styles.voiceButton}
                >
                  {isLoading ? (
                    <Text style={styles.voiceButtonText}>
                      {Math.round(loadingProgress)}%
                    </Text>
                  ) : (
                    <>
                      <Ionicons name="pulse" size={14} color="#000" />
                      <Text style={styles.voiceButtonText}>Speak</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>

          {/* Active glow border */}
          {isActive && <View style={styles.activeGlow} />}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  touchable: {
    flex: 1,
  },
  card: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardActive: {
    borderColor: 'rgba(255,255,255,0.4)',
    borderWidth: 2,
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    position: 'absolute',
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },
  adultBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  adultBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  infoSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  infoContent: {
    padding: 12,
    gap: 6,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  chatButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButton: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  voiceButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  activeGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    pointerEvents: 'none',
  },
});
