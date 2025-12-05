// components/home/CardDetailModal.tsx
// Full-screen modal for expanded card details - Grok-style design

import React, { useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  ScrollView,
  Image,
  Linking,
  Share,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  FadeIn,
  SlideInUp,
  SlideOutDown,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Video, ResizeMode } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import type { FeedCard as FeedCardType } from '@/lib/homeFeed';

const { width, height } = Dimensions.get('window');

interface CardDetailModalProps {
  visible: boolean;
  card: FeedCardType | null;
  onClose: () => void;
  onLike?: (liked: boolean) => void;
  onBookmark?: (bookmarked: boolean) => void;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

export function CardDetailModal({
  visible,
  card,
  onClose,
  onLike,
  onBookmark,
  isLiked = false,
  isBookmarked = false,
}: CardDetailModalProps) {
  const { colors, isDark } = useTheme();
  const translateY = useSharedValue(0);
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    if (!visible) {
      translateY.value = 0;
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  }, [onClose]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 150) {
        translateY.value = withTiming(height, { duration: 200 });
        runOnJS(handleClose)();
      } else {
        translateY.value = withSpring(0, { damping: 15 });
      }
    });

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!card) return;

    try {
      await Share.share({
        title: card.title || 'Check this out',
        message: card.content,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleOpenLink = (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(url).catch((err) =>
      console.error('Failed to open URL:', err)
    );
  };

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onLike?.(!isLiked);
  };

  const handleBookmark = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onBookmark?.(!isBookmarked);
  };

  if (!visible || !card) return null;

  // Get gradient colors based on card type
  const getCardGradient = (): string[] => {
    switch (card.type) {
      case 'finance':
        return ['rgba(16, 185, 129, 0.1)', 'rgba(0, 0, 0, 0.95)'];
      case 'fitness':
        return ['rgba(239, 68, 68, 0.1)', 'rgba(0, 0, 0, 0.95)'];
      case 'reflection':
        return ['rgba(139, 92, 246, 0.15)', 'rgba(0, 0, 0, 0.95)'];
      case 'wellness':
        return ['rgba(244, 114, 182, 0.1)', 'rgba(0, 0, 0, 0.95)'];
      case 'quote':
        return ['rgba(59, 130, 246, 0.1)', 'rgba(0, 0, 0, 0.95)'];
      default:
        return ['rgba(100, 80, 255, 0.1)', 'rgba(0, 0, 0, 0.95)'];
    }
  };

  const getTypeIcon = (): string => {
    switch (card.type) {
      case 'finance':
        return 'trending-up';
      case 'fitness':
        return 'fitness';
      case 'reflection':
        return 'leaf';
      case 'wellness':
        return 'heart';
      case 'quote':
        return 'chatbubble-ellipses';
      case 'task':
        return 'checkbox';
      case 'insight':
        return 'bulb';
      default:
        return 'sparkles';
    }
  };

  const getAccentColor = (): string => {
    switch (card.type) {
      case 'finance':
        return '#10B981';
      case 'fitness':
        return '#EF4444';
      case 'reflection':
        return '#8B5CF6';
      case 'wellness':
        return '#F472B6';
      case 'quote':
        return '#3B82F6';
      default:
        return colors.primary;
    }
  };

  return (
    <Animated.View style={[styles.overlay]} entering={FadeIn.duration(200)}>
      <Pressable style={styles.backdrop} onPress={handleClose} />

      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[styles.modalContainer, animatedContainerStyle]}
          entering={SlideInUp.springify().damping(15)}
        >
          <LinearGradient
            colors={getCardGradient() as [string, string, ...string[]]}
            style={styles.gradient}
          >
            {/* Handle bar */}
            <View style={styles.handleBar}>
              <View
                style={[styles.handle, { backgroundColor: colors.textMuted }]}
              />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <View
                style={[
                  styles.typeTag,
                  { backgroundColor: `${getAccentColor()}20` },
                ]}
              >
                <Ionicons
                  name={getTypeIcon() as any}
                  size={14}
                  color={getAccentColor()}
                />
                <Text style={[styles.typeText, { color: getAccentColor() }]}>
                  {card.agent?.toUpperCase() || card.type.toUpperCase()}
                </Text>
              </View>

              <Pressable
                style={[
                  styles.closeButton,
                  { backgroundColor: colors.glassBackground },
                ]}
                onPress={handleClose}
              >
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.scrollContent}
              contentContainerStyle={styles.scrollContentInner}
              showsVerticalScrollIndicator={false}
            >
              {/* Hero Image */}
              {card.image && (
                <View style={styles.heroImageContainer}>
                  <Image
                    source={{ uri: card.image }}
                    style={styles.heroImage}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.imageOverlay}
                  />
                </View>
              )}

              {/* Title */}
              {card.title && card.type !== 'quote' && (
                <Text style={[styles.title, { color: colors.text }]}>
                  {card.title}
                </Text>
              )}

              {/* Main Content */}
              <Text
                style={[
                  styles.content,
                  { color: colors.textSecondary },
                  card.type === 'quote' && styles.quoteContent,
                ]}
              >
                {card.type === 'quote' ? `"${card.content}"` : card.content}
              </Text>

              {/* Time */}
              <Text style={[styles.timeText, { color: colors.textMuted }]}>
                {card.time}
              </Text>

              {/* Card-specific expanded details */}
              {card.type === 'finance' && card.details && (
                <View style={styles.detailsSection}>
                  {/* Market Graph */}
                  {card.details.graphImage && (
                    <View style={styles.graphContainer}>
                      <Image
                        source={{ uri: card.details.graphImage }}
                        style={styles.graphImage}
                        resizeMode="cover"
                      />
                      <View
                        style={[
                          styles.graphBadge,
                          { backgroundColor: getAccentColor() },
                        ]}
                      >
                        <Text style={styles.graphBadgeText}>LIVE DATA</Text>
                      </View>
                    </View>
                  )}

                  {/* Must Know */}
                  {card.details.mustKnow && (
                    <View style={styles.infoBox}>
                      <Text
                        style={[styles.infoLabel, { color: getAccentColor() }]}
                      >
                        💡 WHAT YOU MUST KNOW
                      </Text>
                      <Text style={[styles.infoText, { color: colors.text }]}>
                        {card.details.mustKnow}
                      </Text>
                    </View>
                  )}

                  {/* Trending */}
                  {card.details.trending && (
                    <View style={styles.trendingSection}>
                      <Text
                        style={[
                          styles.sectionLabel,
                          { color: colors.textMuted },
                        ]}
                      >
                        TRENDING TODAY
                      </Text>
                      <View style={styles.trendingGrid}>
                        {card.details.trending.map((item, idx) => (
                          <View
                            key={idx}
                            style={[
                              styles.trendingCard,
                              { backgroundColor: colors.glassBackground },
                            ]}
                          >
                            <Text
                              style={[
                                styles.trendingSymbol,
                                { color: colors.text },
                              ]}
                            >
                              {item.topic}
                            </Text>
                            <Text
                              style={[
                                styles.trendingChange,
                                { color: item.color },
                              ]}
                            >
                              {item.change}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Expert Advice */}
                  {card.details.expertAdvice && (
                    <View
                      style={[
                        styles.expertBox,
                        { borderColor: getAccentColor() + '40' },
                      ]}
                    >
                      <Ionicons
                        name="analytics"
                        size={18}
                        color={getAccentColor()}
                      />
                      <Text
                        style={[
                          styles.expertText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {card.details.expertAdvice}
                      </Text>
                    </View>
                  )}

                  {/* External Links */}
                  {card.details.links && (
                    <View style={styles.linksSection}>
                      <Text
                        style={[
                          styles.sectionLabel,
                          { color: colors.textMuted },
                        ]}
                      >
                        LEARN MORE
                      </Text>
                      <View style={styles.linksRow}>
                        {card.details.links.map((link, idx) => (
                          <Pressable
                            key={idx}
                            style={[
                              styles.linkButton,
                              { backgroundColor: colors.glassBackground },
                            ]}
                            onPress={() => handleOpenLink(link.url)}
                          >
                            <Text
                              style={[
                                styles.linkText,
                                { color: getAccentColor() },
                              ]}
                            >
                              {link.label}
                            </Text>
                            <Ionicons
                              name="open-outline"
                              size={14}
                              color={getAccentColor()}
                            />
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Fitness Details */}
              {card.type === 'fitness' && card.details && (
                <View style={styles.detailsSection}>
                  {/* Why You Started */}
                  {card.details.whyStarted && (
                    <View
                      style={[
                        styles.infoBox,
                        { borderColor: getAccentColor() + '30' },
                      ]}
                    >
                      <Text
                        style={[styles.infoLabel, { color: getAccentColor() }]}
                      >
                        🔥 REMEMBER WHY YOU STARTED
                      </Text>
                      <Text
                        style={[styles.motivationQuote, { color: colors.text }]}
                      >
                        &quot;{card.details.whyStarted}&quot;
                      </Text>
                    </View>
                  )}

                  {/* Comparison */}
                  {card.details.comparison && (
                    <View style={styles.comparisonSection}>
                      <Text
                        style={[
                          styles.sectionLabel,
                          { color: colors.textMuted },
                        ]}
                      >
                        YOUR JOURNEY
                      </Text>
                      <View style={styles.comparisonRow}>
                        <View style={styles.comparisonCard}>
                          <Image
                            source={{ uri: card.details.comparison.before }}
                            style={styles.comparisonImage}
                          />
                          <Text style={styles.comparisonLabel}>Day 1</Text>
                        </View>
                        <View style={styles.comparisonArrow}>
                          <Ionicons
                            name="arrow-forward"
                            size={24}
                            color={colors.textMuted}
                          />
                        </View>
                        <View style={styles.comparisonCard}>
                          <Image
                            source={{ uri: card.details.comparison.goal }}
                            style={styles.comparisonImage}
                          />
                          <View
                            style={[
                              styles.aiBadge,
                              { backgroundColor: getAccentColor() },
                            ]}
                          >
                            <Text style={styles.aiBadgeText}>AI GOAL</Text>
                          </View>
                          <Text style={styles.comparisonLabel}>Target</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Video */}
                  {card.details.videoSnippet && card.details.videoId && (
                    <Pressable
                      style={styles.videoContainer}
                      onPress={() =>
                        handleOpenLink(
                          `https://youtube.com/watch?v=${card.details!.videoId}`
                        )
                      }
                    >
                      <Image
                        source={{ uri: card.details.videoSnippet }}
                        style={styles.videoThumbnail}
                      />
                      <View style={styles.playButton}>
                        <Ionicons name="play" size={28} color="white" />
                      </View>
                      <View style={styles.videoInfo}>
                        <Ionicons
                          name="logo-youtube"
                          size={18}
                          color="#FF0000"
                        />
                        <Text style={styles.videoTitle}>
                          {card.details.videoTitle}
                        </Text>
                      </View>
                    </Pressable>
                  )}

                  {/* Today's Routine */}
                  {card.details.todayRoutine && (
                    <View style={styles.routineSection}>
                      <Text
                        style={[
                          styles.sectionLabel,
                          { color: colors.textMuted },
                        ]}
                      >
                        TODAY&apos;S ROUTINE
                      </Text>
                      {card.details.todayRoutine.map((item, idx) => (
                        <View key={idx} style={styles.routineItem}>
                          <View
                            style={[
                              styles.routineCheckbox,
                              { borderColor: getAccentColor() },
                            ]}
                          />
                          <Text
                            style={[styles.routineText, { color: colors.text }]}
                          >
                            {item}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* Reflection Details */}
              {card.type === 'reflection' && card.details && (
                <View style={styles.detailsSection}>
                  {/* Deep Question */}
                  {card.details.deepQuestion && (
                    <View
                      style={[
                        styles.questionBox,
                        { backgroundColor: `${getAccentColor()}15` },
                      ]}
                    >
                      <Ionicons
                        name="help-circle"
                        size={24}
                        color={getAccentColor()}
                      />
                      <Text
                        style={[styles.questionText, { color: colors.text }]}
                      >
                        {card.details.deepQuestion}
                      </Text>
                    </View>
                  )}

                  {/* Suggested Actions */}
                  {card.details.suggestedActions && (
                    <View style={styles.actionsSection}>
                      <Text
                        style={[
                          styles.sectionLabel,
                          { color: colors.textMuted },
                        ]}
                      >
                        SUGGESTED ACTIONS
                      </Text>
                      {card.details.suggestedActions.map((action, idx) => (
                        <Pressable
                          key={idx}
                          style={[
                            styles.actionItem,
                            { backgroundColor: colors.glassBackground },
                          ]}
                          onPress={() => Haptics.selectionAsync()}
                        >
                          <Ionicons
                            name="arrow-forward-circle"
                            size={20}
                            color={getAccentColor()}
                          />
                          <Text
                            style={[styles.actionText, { color: colors.text }]}
                          >
                            {action}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}

                  {/* Related Goals */}
                  {card.details.relatedGoals &&
                    card.details.relatedGoals.length > 0 && (
                      <View style={styles.goalsSection}>
                        <Text
                          style={[
                            styles.sectionLabel,
                            { color: colors.textMuted },
                          ]}
                        >
                          RELATED TO YOUR GOALS
                        </Text>
                        <View style={styles.goalsRow}>
                          {card.details.relatedGoals.map((goal, idx) => (
                            <View
                              key={idx}
                              style={[
                                styles.goalChip,
                                { backgroundColor: `${getAccentColor()}20` },
                              ]}
                            >
                              <Ionicons
                                name="flag"
                                size={14}
                                color={getAccentColor()}
                              />
                              <Text
                                style={[
                                  styles.goalText,
                                  { color: getAccentColor() },
                                ]}
                              >
                                {goal}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                  {/* Write Button */}
                  <Pressable
                    style={[
                      styles.ctaButton,
                      { backgroundColor: getAccentColor() },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      // Would open journal/reflection screen
                    }}
                  >
                    <Ionicons name="pencil" size={18} color="white" />
                    <Text style={styles.ctaButtonText}>
                      Write Your Thoughts
                    </Text>
                  </Pressable>
                </View>
              )}

              {/* Wellness Details */}
              {card.type === 'wellness' && card.details?.suggestedActions && (
                <View style={styles.detailsSection}>
                  <Text
                    style={[styles.sectionLabel, { color: colors.textMuted }]}
                  >
                    QUICK WELLNESS ACTIONS
                  </Text>
                  <View style={styles.wellnessGrid}>
                    {card.details.suggestedActions.map((action, idx) => (
                      <Pressable
                        key={idx}
                        style={[
                          styles.wellnessCard,
                          { backgroundColor: `${getAccentColor()}15` },
                        ]}
                        onPress={() => Haptics.selectionAsync()}
                      >
                        <Ionicons
                          name={
                            idx === 0
                              ? 'leaf'
                              : idx === 1
                              ? 'body'
                              : idx === 2
                              ? 'water'
                              : 'sunny'
                          }
                          size={24}
                          color={getAccentColor()}
                        />
                        <Text
                          style={[styles.wellnessText, { color: colors.text }]}
                        >
                          {action}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              <View style={{ height: 120 }} />
            </ScrollView>

            {/* Fixed Footer Actions */}
            <BlurView
              intensity={isDark ? 80 : 60}
              tint={isDark ? 'dark' : 'light'}
              style={styles.footerActions}
            >
              <Pressable style={styles.footerButton} onPress={handleLike}>
                <Ionicons
                  name={isLiked ? 'heart' : 'heart-outline'}
                  size={24}
                  color={isLiked ? '#FF4757' : colors.text}
                />
                <Text style={[styles.footerButtonText, { color: colors.text }]}>
                  Like
                </Text>
              </Pressable>

              <Pressable style={styles.footerButton} onPress={handleBookmark}>
                <Ionicons
                  name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                  size={24}
                  color={isBookmarked ? colors.primary : colors.text}
                />
                <Text style={[styles.footerButtonText, { color: colors.text }]}>
                  Save
                </Text>
              </Pressable>

              <Pressable style={styles.footerButton} onPress={handleShare}>
                <Ionicons name="share-outline" size={24} color={colors.text} />
                <Text style={[styles.footerButtonText, { color: colors.text }]}>
                  Share
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.primaryButton,
                  { backgroundColor: getAccentColor() },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  handleClose();
                }}
              >
                <Text style={styles.primaryButtonText}>Got it</Text>
              </Pressable>
            </BlurView>
          </LinearGradient>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.92,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
  },
  handleBar: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentInner: {
    paddingHorizontal: 20,
  },
  heroImageContainer: {
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    lineHeight: 34,
  },
  content: {
    fontSize: 17,
    lineHeight: 26,
    marginBottom: 12,
  },
  quoteContent: {
    fontSize: 22,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 32,
    paddingVertical: 20,
  },
  timeText: {
    fontSize: 13,
    marginBottom: 24,
  },
  detailsSection: {
    gap: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },
  infoBox: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 15,
    lineHeight: 22,
  },
  motivationQuote: {
    fontSize: 18,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 26,
    paddingVertical: 8,
  },
  graphContainer: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  graphImage: {
    width: '100%',
    height: '100%',
  },
  graphBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  graphBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  trendingSection: {},
  trendingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  trendingCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trendingSymbol: {
    fontSize: 15,
    fontWeight: '600',
  },
  trendingChange: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  expertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(100, 80, 255, 0.05)',
  },
  expertText: {
    flex: 1,
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  linksSection: {},
  linksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  comparisonSection: {},
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  comparisonCard: {
    width: '40%',
    aspectRatio: 3 / 4,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  comparisonImage: {
    width: '100%',
    height: '100%',
  },
  comparisonLabel: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 1 },
  },
  comparisonArrow: {
    width: '20%',
    alignItems: 'center',
  },
  aiBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  aiBadgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
  },
  videoContainer: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  playButton: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  videoInfo: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  videoTitle: {
    flex: 1,
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 1 },
  },
  routineSection: {},
  routineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  routineCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
  },
  routineText: {
    flex: 1,
    fontSize: 15,
  },
  questionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 20,
    borderRadius: 20,
  },
  questionText: {
    flex: 1,
    fontSize: 18,
    fontStyle: 'italic',
    lineHeight: 26,
  },
  actionsSection: {
    gap: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
  },
  actionText: {
    flex: 1,
    fontSize: 15,
  },
  goalsSection: {},
  goalsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  goalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  goalText: {
    fontSize: 13,
    fontWeight: '500',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  ctaButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  wellnessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  wellnessCard: {
    width: '47%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 10,
  },
  wellnessText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 16,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  footerButton: {
    alignItems: 'center',
    gap: 4,
  },
  footerButtonText: {
    fontSize: 11,
    fontWeight: '500',
  },
  primaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
