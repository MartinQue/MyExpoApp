import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Linking,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { MotiView, AnimatePresence } from 'moti';
import { Video, ResizeMode } from 'expo-av';
import { Colors } from '@/constants/Theme';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import type { FeedCard as FeedCardType } from '@/lib/homeFeed';

const { width } = Dimensions.get('window');

interface FeedCardProps {
  card: FeedCardType;
  isContextRelevant?: boolean;
  index?: number;
}

export function FeedCard({
  card,
  isContextRelevant = false,
  index = 0,
}: FeedCardProps) {
  const { colors, isDark } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const videoRef = useRef<Video>(null);

  const toggleExpand = () => {
    if (!card.isExpandable) return;
    Haptics.selectionAsync();
    setExpanded(!expanded);
  };

  const openYouTubeVideo = (videoId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(`https://youtube.com/watch?v=${videoId}`);
  };

  // Render Finance Card Details
  const renderFinanceDetails = () => {
    if (!card.details) return null;

    return (
      <MotiView
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        exit={{ opacity: 0, translateY: -10 }}
        transition={{ type: 'timing', duration: 300 }}
        style={styles.detailsContainer}
      >
        {/* Graph Image */}
        {card.details.graphImage && (
          <View style={styles.graphContainer}>
            <Image
              source={{ uri: card.details.graphImage }}
              style={styles.graphImage}
              resizeMode="cover"
            />
            <View style={styles.graphOverlay}>
              <Text style={styles.graphLabel}>Live Market Data</Text>
            </View>
          </View>
        )}

        {/* Must Know Section */}
        {card.details.mustKnow && (
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>WHAT YOU MUST KNOW</Text>
            <Text style={styles.detailText}>{card.details.mustKnow}</Text>
          </View>
        )}

        {/* Trending Topics */}
        {card.details.trending && (
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>TRENDING & INVESTED</Text>
            <View style={styles.trendingRow}>
              {card.details.trending.map((item, idx) => (
                <View key={idx} style={styles.trendingChip}>
                  <Text style={styles.trendingTopic}>{item.topic}</Text>
                  <Text style={[styles.trendingChange, { color: item.color }]}>
                    {item.change}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Expert Advice */}
        {card.details.expertAdvice && (
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>EXPERT PREDICTION</Text>
            <View style={styles.expertBox}>
              <Ionicons
                name="analytics"
                size={16}
                color={Colors.primary[300]}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.expertText}>{card.details.expertAdvice}</Text>
            </View>
          </View>
        )}

        {/* External Links */}
        {card.details.links && (
          <View style={styles.linksRow}>
            {card.details.links.map((link, idx) => (
              <Pressable
                key={idx}
                style={styles.linkButton}
                onPress={() => {
                  Haptics.selectionAsync();
                  Linking.openURL(link.url).catch(() => {});
                }}
              >
                <Text style={styles.linkText}>{link.label}</Text>
                <Ionicons
                  name="open-outline"
                  size={12}
                  color={Colors.primary[300]}
                />
              </Pressable>
            ))}
          </View>
        )}
      </MotiView>
    );
  };

  // Render Fitness Card Details
  const renderFitnessDetails = () => {
    if (!card.details) return null;

    return (
      <MotiView
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        exit={{ opacity: 0, translateY: -10 }}
        transition={{ type: 'timing', duration: 300 }}
        style={styles.detailsContainer}
      >
        {/* Why You Started */}
        {card.details.whyStarted && (
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>REMEMBER WHY YOU STARTED</Text>
            <Text style={styles.memoireText}>
              &quot;{card.details.whyStarted}&quot;
            </Text>
          </View>
        )}

        {/* Before / Goal Comparison */}
        {card.details.comparison && (
          <View style={styles.comparisonContainer}>
            <View style={styles.comparisonItem}>
              <Image
                source={{ uri: card.details.comparison.before }}
                style={styles.comparisonImage}
              />
              <Text style={styles.comparisonLabel}>Day 1</Text>
            </View>
            <View style={styles.comparisonArrow}>
              <Ionicons
                name="arrow-forward"
                size={20}
                color={Colors.gray[400]}
              />
            </View>
            <View style={styles.comparisonItem}>
              <Image
                source={{ uri: card.details.comparison.goal }}
                style={styles.comparisonImage}
              />
              <View style={styles.aiBadge}>
                <Text style={styles.aiBadgeText}>AI GOAL</Text>
              </View>
              <Text style={styles.comparisonLabel}>Target</Text>
            </View>
          </View>
        )}

        {/* Video Snippet */}
        {card.details.videoSnippet && card.details.videoId && (
          <Pressable
            style={styles.videoContainer}
            onPress={() => openYouTubeVideo(card.details!.videoId!)}
          >
            <Image
              source={{ uri: card.details.videoSnippet }}
              style={styles.videoThumbnail}
            />
            <View style={styles.playButton}>
              <Ionicons name="play" size={24} color="white" />
            </View>
            <View style={styles.videoTitleContainer}>
              <Ionicons name="logo-youtube" size={16} color="#FF0000" />
              <Text style={styles.videoTitle}>{card.details.videoTitle}</Text>
            </View>
          </Pressable>
        )}

        {/* Today's Routine */}
        {card.details.todayRoutine && (
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>TODAY&apos;S ROUTINE</Text>
            {card.details.todayRoutine.map((item, idx) => (
              <View key={idx} style={styles.routineItem}>
                <View style={styles.routineCheckbox} />
                <Text style={styles.routineText}>{item}</Text>
              </View>
            ))}
          </View>
        )}
      </MotiView>
    );
  };

  // Render Reflection Card Details
  const renderReflectionDetails = () => {
    if (!card.details) return null;

    return (
      <MotiView
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        exit={{ opacity: 0, translateY: -10 }}
        transition={{ type: 'timing', duration: 300 }}
        style={styles.detailsContainer}
      >
        {/* Suggested Actions */}
        {card.details.suggestedActions && (
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>SUGGESTED ACTIONS</Text>
            {card.details.suggestedActions.map((action, idx) => (
              <Pressable
                key={idx}
                style={styles.actionItem}
                onPress={() => Haptics.selectionAsync()}
              >
                <Ionicons
                  name="arrow-forward-circle"
                  size={18}
                  color={Colors.primary[400]}
                />
                <Text style={styles.actionText}>{action}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Related Goals */}
        {card.details.relatedGoals && card.details.relatedGoals.length > 0 && (
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>RELATED TO YOUR GOALS</Text>
            <View style={styles.goalsRow}>
              {card.details.relatedGoals.map((goal, idx) => (
                <View key={idx} style={styles.goalChip}>
                  <Ionicons name="flag" size={12} color={Colors.primary[300]} />
                  <Text style={styles.goalText}>{goal}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Reflection Input Prompt */}
        <Pressable
          style={styles.reflectButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            // Would open journal or reflection modal
          }}
        >
          <Ionicons name="pencil" size={16} color="white" />
          <Text style={styles.reflectButtonText}>Write Your Thoughts</Text>
        </Pressable>
      </MotiView>
    );
  };

  // Render Wellness Card Details
  const renderWellnessDetails = () => {
    if (!card.details?.suggestedActions) return null;

    return (
      <MotiView
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        exit={{ opacity: 0, translateY: -10 }}
        transition={{ type: 'timing', duration: 300 }}
        style={styles.detailsContainer}
      >
        <View style={styles.detailSection}>
          <Text style={styles.detailLabel}>QUICK WELLNESS ACTIONS</Text>
          <View style={styles.wellnessGrid}>
            {card.details.suggestedActions.map((action, idx) => (
              <Pressable
                key={idx}
                style={styles.wellnessAction}
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
                  size={20}
                  color={Colors.primary[400]}
                />
                <Text style={styles.wellnessActionText}>{action}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </MotiView>
    );
  };

  // Get card gradient colors based on type
  const getCardStyle = () => {
    switch (card.type) {
      case 'finance':
        return { borderColor: 'rgba(34, 197, 94, 0.3)' };
      case 'fitness':
        return { borderColor: 'rgba(239, 68, 68, 0.3)' };
      case 'reflection':
        return { borderColor: 'rgba(139, 92, 246, 0.3)' };
      case 'wellness':
        return { borderColor: 'rgba(244, 114, 182, 0.3)' };
      case 'quote':
        return { borderColor: 'rgba(59, 130, 246, 0.3)' };
      default:
        return {};
    }
  };

  // Get icon for card type
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

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 400, delay: index * 100 }}
      style={styles.wrapper}
    >
      <Pressable
        onPress={toggleExpand}
        style={({ pressed }) => ({
          transform: [{ scale: pressed && card.isExpandable ? 0.98 : 1 }],
        })}
      >
        <BlurView
          intensity={isDark ? 60 : 40}
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.container,
            {
              backgroundColor: colors.glassBackground,
              borderColor: colors.glassBorder,
            },
            isContextRelevant && [
              styles.highlightedContainer,
              { shadowColor: colors.primary },
            ],
            getCardStyle(),
          ]}
        >
          {/* Hero Image (collapsed state) */}
          {card.image && !expanded && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: card.image }}
                style={[styles.cardImage, { backgroundColor: colors.surface }]}
                resizeMode="cover"
                onLoad={() => setImageLoaded(true)}
              />
              {!imageLoaded && (
                <View
                  style={[
                    styles.imagePlaceholder,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <Ionicons name="image" size={24} color={colors.textMuted} />
                </View>
              )}
              <View style={styles.imageOverlay} />
            </View>
          )}

          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View
                style={[
                  styles.sourceTag,
                  { backgroundColor: colors.glassBackground },
                  isContextRelevant && [
                    styles.highlightedSourceTag,
                    { backgroundColor: colors.primary },
                  ],
                ]}
              >
                <Ionicons
                  name={getTypeIcon() as any}
                  size={12}
                  color={
                    isContextRelevant ? colors.textInverse : colors.primary
                  }
                />
                <Text
                  style={[
                    styles.sourceText,
                    { color: colors.primary },
                    isContextRelevant && { color: colors.textInverse },
                  ]}
                >
                  {card.agent?.toUpperCase() || card.type.toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.timeText, { color: colors.textMuted }]}>
                {card.time}
              </Text>
            </View>

            {/* Title */}
            {card.title && card.type !== 'quote' && (
              <Text style={[styles.title, { color: colors.text }]}>
                {card.title}
              </Text>
            )}

            {/* Body */}
            <Text
              style={[
                styles.body,
                { color: colors.textSecondary },
                card.type === 'quote' && [
                  styles.quoteText,
                  { color: colors.text },
                ],
              ]}
              numberOfLines={expanded ? undefined : 3}
            >
              {card.type === 'quote' ? `"${card.content}"` : card.content}
            </Text>

            {/* Expanded Details */}
            <AnimatePresence>
              {expanded && card.type === 'finance' && renderFinanceDetails()}
              {expanded && card.type === 'fitness' && renderFitnessDetails()}
              {expanded &&
                card.type === 'reflection' &&
                renderReflectionDetails()}
              {expanded && card.type === 'wellness' && renderWellnessDetails()}
            </AnimatePresence>

            {/* Footer */}
            <View
              style={[styles.footer, { borderTopColor: colors.glassBorder }]}
            >
              <Pressable
                style={styles.actionButton}
                onPress={() => Haptics.selectionAsync()}
              >
                <Ionicons
                  name="heart-outline"
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>
              <Pressable
                style={styles.actionButton}
                onPress={() => Haptics.selectionAsync()}
              >
                <Ionicons
                  name="bookmark-outline"
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>

              {card.isExpandable && (
                <Pressable style={styles.expandButton} onPress={toggleExpand}>
                  <Text style={[styles.expandText, { color: colors.primary }]}>
                    {expanded ? 'Show Less' : 'View Details'}
                  </Text>
                  <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color={colors.primary}
                  />
                </Pressable>
              )}
            </View>
          </View>

          {/* Decorative Border */}
          <View
            style={[
              styles.border,
              { borderColor: colors.glassBorder },
              isContextRelevant && [
                styles.highlightedBorder,
                { borderColor: colors.primary },
              ],
              getCardStyle(),
            ]}
          />
        </BlurView>
      </Pressable>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  container: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
  },
  highlightedContainer: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sourceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  highlightedSourceTag: {
    // backgroundColor set dynamically
  },
  sourceText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timeText: {
    fontSize: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 26,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  quoteText: {
    fontSize: 18,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
    lineHeight: 26,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  actionButton: {
    padding: 6,
    marginRight: 12,
  },
  expandButton: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  expandText: {
    fontSize: 12,
    fontWeight: '600',
  },
  border: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    borderWidth: 1,
    pointerEvents: 'none',
  },
  highlightedBorder: {
    borderWidth: 1,
  },

  // Details Container
  detailsContainer: {
    marginTop: 16,
    gap: 16,
  },
  detailSection: {
    gap: 8,
  },
  detailLabel: {
    color: Colors.gray[500],
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  detailText: {
    color: Colors.gray[200],
    fontSize: 14,
    lineHeight: 20,
  },

  // Finance specific
  graphContainer: {
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  graphImage: {
    width: '100%',
    height: '100%',
    opacity: 0.85,
  },
  graphOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  graphLabel: {
    color: Colors.primary[300],
    fontSize: 10,
    fontWeight: 'bold',
  },
  trendingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  trendingChip: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  trendingTopic: {
    color: Colors.gray[300],
    fontSize: 13,
    fontWeight: '600',
  },
  trendingChange: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  expertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(100, 80, 255, 0.1)',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 80, 255, 0.2)',
  },
  expertText: {
    color: Colors.gray[200],
    fontSize: 13,
    fontStyle: 'italic',
    flex: 1,
    lineHeight: 20,
  },
  linksRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  linkText: {
    color: Colors.primary[300],
    fontSize: 12,
    fontWeight: '600',
  },

  // Fitness specific
  memoireText: {
    color: Colors.white,
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
    lineHeight: 24,
  },
  comparisonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  comparisonItem: {
    width: '40%',
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    position: 'relative',
  },
  comparisonImage: {
    width: '100%',
    height: '100%',
  },
  comparisonLabel: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: Colors.white,
    fontSize: 12,
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
    top: 8,
    right: 8,
    backgroundColor: Colors.primary[500],
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  aiBadgeText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
  videoContainer: {
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
    position: 'relative',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  playButton: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  videoTitleContainer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  videoTitle: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 1 },
  },
  routineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  routineCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.primary[400],
  },
  routineText: {
    color: Colors.gray[300],
    fontSize: 14,
    flex: 1,
  },

  // Reflection specific
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  actionText: {
    color: Colors.gray[200],
    fontSize: 14,
    flex: 1,
  },
  goalsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  goalText: {
    color: Colors.primary[300],
    fontSize: 12,
    fontWeight: '500',
  },
  reflectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary[500],
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  reflectButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

  // Wellness specific
  wellnessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  wellnessAction: {
    width: '48%',
    backgroundColor: 'rgba(244, 114, 182, 0.1)',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(244, 114, 182, 0.2)',
  },
  wellnessActionText: {
    color: Colors.gray[300],
    fontSize: 12,
    textAlign: 'center',
  },
});
