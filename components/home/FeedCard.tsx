import React, { useState } from 'react';
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
import { Colors } from '@/constants/Theme';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface FeedCardProps {
  card: any;
  isContextRelevant: boolean;
  index: number;
}

export function FeedCard({ card, isContextRelevant, index }: FeedCardProps) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    Haptics.selectionAsync();
    setExpanded(!expanded);
  };

  const renderFinanceDetails = () => (
    <MotiView
      from={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ type: 'timing', duration: 300 }}
      style={styles.detailsContainer}
    >
      {/* Graph */}
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

      {/* Must Know */}
      <View style={styles.detailSection}>
        <Text style={styles.detailLabel}>WHAT YOU MUST KNOW</Text>
        <Text style={styles.detailText}>{card.details.mustKnow}</Text>
      </View>

      {/* Trending Topics */}
      <View style={styles.detailSection}>
        <Text style={styles.detailLabel}>TRENDING & INVESTED</Text>
        <View style={styles.trendingRow}>
          {card.details.trending.map((item: any, index: number) => (
            <View key={index} style={styles.trendingChip}>
              <Text style={styles.trendingTopic}>{item.topic}</Text>
              <Text style={[styles.trendingChange, { color: item.color }]}>
                {item.change}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Expert Advice */}
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

      {/* External Links */}
      <View style={styles.linksRow}>
        {card.details.links.map((link: any, index: number) => (
          <Pressable
            key={index}
            style={styles.linkButton}
            onPress={() => Linking.openURL(link.url).catch(() => {})}
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
    </MotiView>
  );

  const renderGymDetails = () => (
    <MotiView
      from={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ type: 'timing', duration: 300 }}
      style={styles.detailsContainer}
    >
      {/* Why You Started */}
      <View style={styles.detailSection}>
        <Text style={styles.detailLabel}>REMEMBER WHY YOU STARTED</Text>
        <Text style={styles.memoireText}>"{card.details.whyStarted}"</Text>
      </View>

      {/* Before / Goal Comparison */}
      <View style={styles.comparisonContainer}>
        <View style={styles.comparisonItem}>
          <Image
            source={{ uri: card.details.comparison.before }}
            style={styles.comparisonImage}
          />
          <Text style={styles.comparisonLabel}>Day 1</Text>
        </View>
        <View style={styles.comparisonArrow}>
          <Ionicons name="arrow-forward" size={20} color={Colors.gray[400]} />
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

      {/* Video Snippet */}
      <Pressable
        style={styles.videoContainer}
        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
      >
        <Image
          source={{ uri: card.details.videoSnippet }}
          style={styles.videoThumbnail}
        />
        <View style={styles.playButton}>
          <Ionicons name="play" size={24} color="white" />
        </View>
        <Text style={styles.videoTitle}>{card.details.videoTitle}</Text>
      </Pressable>
    </MotiView>
  );

  return (
    <MotiView
      from={{ opacity: 0, translateY: 50, scale: 0.9 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{
        type: 'spring',
        damping: 15,
        stiffness: 100,
        delay: index * 150, // Staggered delay based on index
      }}
      style={styles.wrapper}
    >
      <Pressable
        onPress={toggleExpand}
        style={({ pressed }) => ({
          transform: [{ scale: pressed ? 0.99 : 1 }],
        })}
      >
        <BlurView
          intensity={isContextRelevant ? 80 : 50}
          tint="dark"
          style={[
            styles.container,
            isContextRelevant && styles.highlightedContainer,
          ]}
        >
          {/* Main Card Content (Always Visible) */}
          {!expanded && card.image && (
            <Image
              source={{ uri: card.image }}
              style={styles.cardImage}
              resizeMode="cover"
            />
          )}

          <View style={styles.content}>
            <View style={styles.header}>
              <View
                style={[
                  styles.sourceTag,
                  isContextRelevant && styles.highlightedSourceTag,
                ]}
              >
                <Ionicons
                  name={isContextRelevant ? 'location' : 'planet-outline'}
                  size={12}
                  color={isContextRelevant ? Colors.white : Colors.primary[300]}
                />
                <Text
                  style={[
                    styles.sourceText,
                    isContextRelevant && { color: Colors.white },
                  ]}
                >
                  {card.context ? card.context.toUpperCase() : 'INSIGHT'}
                </Text>
              </View>
              <Text style={styles.timeText}>{card.time}</Text>
            </View>

            {card.type !== 'quote' && (
              <Text style={styles.title}>{card.title}</Text>
            )}

            <Text
              style={[styles.body, card.type === 'quote' && styles.quoteText]}
            >
              {card.content}
            </Text>

            {/* Expanded Content */}
            <AnimatePresence>
              {expanded && card.type === 'news' && renderFinanceDetails()}
              {expanded && card.type === 'motivation' && renderGymDetails()}
            </AnimatePresence>

            {/* Footer */}
            <View style={styles.footer}>
              <Pressable style={styles.actionButton}>
                <Ionicons
                  name="heart-outline"
                  size={18}
                  color={Colors.gray[400]}
                />
              </Pressable>
              <Pressable style={styles.actionButton}>
                <Ionicons
                  name="share-outline"
                  size={18}
                  color={Colors.gray[400]}
                />
              </Pressable>
              <Pressable style={styles.expandButton} onPress={toggleExpand}>
                <Text style={styles.expandText}>
                  {expanded ? 'Show Less' : 'View Details'}
                </Text>
                <Ionicons
                  name={expanded ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={Colors.primary[300]}
                />
              </Pressable>
            </View>
          </View>

          {/* Decorative Border */}
          <View
            style={[
              styles.border,
              isContextRelevant && styles.highlightedBorder,
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
    backgroundColor: 'rgba(20, 20, 25, 0.7)',
  },
  highlightedContainer: {
    backgroundColor: 'rgba(30, 30, 45, 0.9)',
    shadowColor: Colors.primary[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  cardImage: {
    width: '100%',
    height: 200, // Increased height for better visual
    backgroundColor: Colors.gray[800],
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
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  highlightedSourceTag: {
    backgroundColor: Colors.primary[500],
  },
  sourceText: {
    color: Colors.primary[300],
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  timeText: {
    color: Colors.gray[500],
    fontSize: 12,
  },
  title: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 28,
  },
  body: {
    color: Colors.gray[300],
    fontSize: 15,
    lineHeight: 24,
  },
  quoteText: {
    fontSize: 20,
    fontStyle: 'italic',
    color: Colors.white,
    textAlign: 'center',
    paddingVertical: 10,
    fontFamily: 'System',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  actionButton: {
    padding: 4,
    marginRight: 16,
  },
  expandButton: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  expandText: {
    color: Colors.primary[300],
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
    borderColor: 'rgba(255,255,255,0.1)',
    pointerEvents: 'none',
  },
  highlightedBorder: {
    borderColor: Colors.primary[500],
    borderWidth: 1,
  },
  // Expanded Details Styles
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
    marginBottom: 4,
  },
  detailText: {
    color: Colors.white,
    fontSize: 14,
    lineHeight: 20,
  },
  graphContainer: {
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  graphImage: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  graphOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 6,
  },
  trendingTopic: {
    color: Colors.gray[300],
    fontSize: 12,
  },
  trendingChange: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  expertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(100, 80, 255, 0.1)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 80, 255, 0.2)',
  },
  expertText: {
    color: Colors.gray[200],
    fontSize: 13,
    fontStyle: 'italic',
    flex: 1,
  },
  linksRow: {
    flexDirection: 'row',
    gap: 12,
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
  // Gym Specific Styles
  memoireText: {
    color: Colors.white,
    fontSize: 16,
    fontStyle: 'italic',
    fontFamily: 'System',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  comparisonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  comparisonItem: {
    width: '42%',
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
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
  },
  comparisonArrow: {
    width: '16%',
    alignItems: 'center',
  },
  aiBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.primary[500],
    paddingHorizontal: 6,
    paddingVertical: 2,
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
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    opacity: 0.7,
  },
  playButton: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    // backdropFilter removed as it is not supported in RN
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  videoTitle: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 4,
  },
});
