import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  RefreshControl,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  FadeIn,
  FadeInUp,
  SlideInRight,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useUserStore } from '@/stores/userStore';
import { usePlannerStore } from '@/stores/plannerStore';
import { medium as hapticMedium, light as hapticLight } from '@/lib/haptics';
import { useRouter, useFocusEffect } from 'expo-router';
import { NextTaskCard } from '@/components/home/NextTaskCard';
import { FeedCard } from '@/components/home/FeedCard';
import { CardDetailModal } from '@/components/home/CardDetailModal';
import {
  buildHomeFeed,
  getTimeContext,
  getDailyStats,
  generateInstantFeed,
  FeedCard as FeedCardType,
  DailyStats,
} from '@/lib/homeFeed';
import {
  getLocationContext,
  getLocationPermission,
  LocationContext,
} from '@/lib/locationService';

const { width } = Dimensions.get('window');
const HEADER_HEIGHT = 140;
const FEED_REFRESH_INTERVAL = 60 * 1000; // 1 minute for real-time updates
const REAL_TIME_UPDATE_INTERVAL = 30 * 1000; // 30 seconds for background updates

// Quick action items
const QUICK_ACTIONS = [
  { id: 'chat', icon: 'chatbubble', label: 'Chat', route: '/(tabs)/chat' },
  {
    id: 'imagine',
    icon: 'sparkles',
    label: 'Create',
    route: '/(tabs)/imagine',
  },
  { id: 'planner', icon: 'calendar', label: 'Plan', route: '/(tabs)/planner' },
  { id: 'library', icon: 'book', label: 'Library', route: '/(tabs)/library' },
];

// Weather icons based on time and conditions
const getWeatherIcon = (timeOfDay: string): string => {
  switch (timeOfDay) {
    case 'morning':
      return 'sunny';
    case 'afternoon':
      return 'partly-sunny';
    case 'evening':
      return 'cloudy-night';
    case 'night':
      return 'moon';
    default:
      return 'sunny';
  }
};

// Get contextual message based on time, day, and conditions
const getContextualMessage = (timeOfDay: string): string => {
  const day = new Date().getDay();
  const hour = new Date().getHours();

  // Weekend morning
  if ((day === 0 || day === 6) && timeOfDay === 'morning') {
    return 'Weekend vibes ☀️ Take it slow';
  }

  // Friday evening
  if (day === 5 && timeOfDay === 'evening') {
    return "It's Friday! 🎉 Time to unwind";
  }

  // Monday morning
  if (day === 1 && timeOfDay === 'morning') {
    return 'New week, new wins 💪';
  }

  // Late night work
  if (hour >= 23 || hour < 5) {
    return 'Burning the midnight oil? 🌙';
  }

  // Default messages by time
  const messages: Record<string, string[]> = {
    morning: ['Rise and conquer', 'Fresh start today', 'Make it count'],
    afternoon: ['Keep the momentum', 'Stay focused', 'Halfway there'],
    evening: ['Wind down gracefully', 'Reflect & recharge', 'Almost there'],
    night: ['Rest well tonight', 'Tomorrow awaits', 'Sweet dreams'],
  };

  const options = messages[timeOfDay] || messages.morning;
  return options[Math.floor(Math.random() * options.length)];
};

// Hero Video Snippet Component - Looping video for emotional engagement
const HeroVideoSnippet = React.memo(function HeroVideoSnippet({
  videoUri,
  thumbnailUri,
  title,
  subtitle,
  index,
}: {
  videoUri: string;
  thumbnailUri: string;
  title: string;
  subtitle: string;
  index: number;
}) {
  const { colors, isDark } = useTheme();
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Auto-play with staggered delay for visual interest
    const timer = setTimeout(() => {
      setIsPlaying(true);
    }, index * 300);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <View
      style={[
        styles.heroVideoCard,
        { backgroundColor: colors.glassBackground },
      ]}
    >
      <BlurView
        intensity={isDark ? 50 : 30}
        tint={isDark ? 'dark' : 'light'}
        style={styles.heroVideoBlur}
      >
        <View style={styles.heroVideoWrapper}>
          <Video
            ref={videoRef}
            source={{ uri: videoUri }}
            style={styles.heroVideo}
            resizeMode={ResizeMode.COVER}
            isLooping
            isMuted
            shouldPlay={isPlaying}
            useNativeControls={false}
            onError={(error) => {
              console.warn('Hero video error:', error);
              // Fallback to thumbnail if video fails
            }}
          />
          <View style={styles.heroVideoOverlay} />
          <View style={styles.heroVideoContent}>
            <Text style={[styles.heroVideoTitle, { color: colors.text }]}>
              {title}
            </Text>
            <Text
              style={[styles.heroVideoSubtitle, { color: colors.textMuted }]}
            >
              {subtitle}
            </Text>
          </View>
        </View>
      </BlurView>
    </View>
  );
});

export default function ProfileTab() {
  const { colors, isDark, getGradientArray } = useTheme();
  const {
    user,
    likedCards,
    bookmarkedCards,
    toggleLikeCard,
    toggleBookmarkCard,
  } = useUserStore();
  const { plans } = usePlannerStore();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feed, setFeed] = useState<FeedCardType[]>(() =>
    generateInstantFeed({ userName: user?.name || 'Friend', plans })
  );
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [contextMessage, setContextMessage] = useState('');
  const [locationContext, setLocationContext] =
    useState<LocationContext | null>(null);
  const [selectedCard, setSelectedCard] = useState<FeedCardType | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const router = useRouter();
  const scrollY = useSharedValue(0);
  const lastRefreshRef = useRef<number>(0);
  const isInitialLoadDone = useRef<boolean>(false);

  // Time context
  const timeContext = getTimeContext();
  const { greeting, timeOfDay, suggestedContext } = timeContext;

  // Get location context on mount
  useEffect(() => {
    const initLocationContext = async () => {
      try {
        const hasPermission = await getLocationPermission();
        if (hasPermission) {
          const context = await getLocationContext();
          setLocationContext(context);

          if (context.location && context.weather) {
            setContextMessage(
              context.suggestions[0] ||
                `${context.weather.description} • ${context.weather.temperature}°C`
            );
          } else {
            setContextMessage(getContextualMessage(timeOfDay));
          }
        } else {
          setContextMessage(getContextualMessage(timeOfDay));
        }
      } catch (error) {
        console.warn('Failed to get location context:', error);
        setContextMessage(getContextualMessage(timeOfDay));
      }
    };

    initLocationContext();
  }, [timeOfDay]);

  // Auto-refresh feed periodically for real-time updates
  useEffect(() => {
    const timer = setInterval(async () => {
      const now = Date.now();
      if (now - lastRefreshRef.current >= FEED_REFRESH_INTERVAL) {
        console.log('🔄 Auto-refreshing feed...');
        await loadFeed(true);
      }
    }, REAL_TIME_UPDATE_INTERVAL);

    return () => {
      clearInterval(timer);
    };
  }, [loadFeed]);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  // Animated header opacity that fades as you scroll
  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT],
      [1, 0],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT],
      [0, -20],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  // Animated scale for the greeting
  const greetingAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT / 2],
      [1, 0.9],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ scale }],
    };
  });

  // Parallax effect for quick actions
  const quickActionsAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT],
      [0, -30],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT / 2],
      [1, 0.5],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ translateY }],
      opacity,
    };
  });

  // Load AI-powered feed with location context
  const loadFeed = useCallback(
    async (silent = false) => {
      try {
        if (!silent) {
          setLoading(true);
        }
        if (!silent && !isInitialLoadDone.current) {
          console.log('📱 Loading personalized home feed...');
        }

        const [feedData, statsData] = await Promise.all([
          buildHomeFeed({
            userName: user?.name || 'Friend',
            plans: plans,
            useLocation: true,
          }),
          getDailyStats(),
        ]);

        setFeed(feedData);
        setStats(statsData);
        lastRefreshRef.current = Date.now();
        isInitialLoadDone.current = true;

        if (!silent) {
          console.log(`✅ Loaded ${feedData.length} feed items`);
        }
      } catch (error) {
        console.error('Failed to load feed:', error);
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [user?.name, plans]
  );

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  useEffect(() => {
    if (plans.length > 0) {
      setFeed(generateInstantFeed({ userName: user?.name || 'Friend', plans }));
    }
  }, [plans, user?.name]);

  // Refresh feed when tab comes into focus (activity-based refresh)
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      // Only refresh if more than 2 minutes since last refresh (avoids rapid refreshes)
      if (now - lastRefreshRef.current >= 2 * 60 * 1000) {
        console.log('🔄 Tab focused - refreshing feed...');
        loadFeed(true); // Silent refresh on focus
      }
      return () => {
        // Cleanup if needed
      };
    }, [loadFeed])
  );

  // Handle card tap - open full-screen modal for expandable cards, navigate for others
  const handleCardTap = useCallback(
    (card: FeedCardType) => {
      if (card.isExpandable) {
        hapticMedium();
        setSelectedCard(card);
        setShowCardModal(true);
      } else if (card.navigationRoute && card.sourceType === 'internal') {
        hapticLight();
        router.push(card.navigationRoute as any);
      } else if (card.externalUrl && card.sourceType === 'external') {
        hapticLight();
        Linking.openURL(card.externalUrl).catch((err) =>
          console.error('Failed to open URL:', err)
        );
      }
    },
    [router]
  );

  // Handle navigation from expanded card modal
  const handleCardNavigate = useCallback(
    (card: FeedCardType) => {
      setShowCardModal(false);
      setSelectedCard(null);

      setTimeout(() => {
        if (card.navigationRoute && card.sourceType === 'internal') {
          hapticLight();
          router.push(card.navigationRoute as any);
        } else if (card.externalUrl && card.sourceType === 'external') {
          hapticLight();
          Linking.openURL(card.externalUrl).catch((err) =>
            console.error('Failed to open URL:', err)
          );
        }
      }, 300);
    },
    [router]
  );

  // Handle like from modal
  const handleModalLike = useCallback(
    (liked: boolean) => {
      if (selectedCard) {
        toggleLikeCard(selectedCard.id);
      }
    },
    [selectedCard, toggleLikeCard]
  );

  // Handle bookmark from modal
  const handleModalBookmark = useCallback(
    (bookmarked: boolean) => {
      if (selectedCard) {
        toggleBookmarkCard(selectedCard.id);
      }
    },
    [selectedCard, toggleBookmarkCard]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    hapticLight();

    setContextMessage(getContextualMessage(timeOfDay));

    await loadFeed();

    setRefreshing(false);
    hapticSuccess();
  }, [loadFeed, timeOfDay]);

  // Navigate to a quick action
  const handleQuickAction = (route: string) => {
    hapticButton();
    router.push(route as any);
  };

  const getNextTaskCard = () => {
    const nextTask =
      plans.find(
        (p) =>
          p.dueDate?.toLowerCase().includes('today') ||
          p.dueDate?.toLowerCase().includes('now')
      ) || plans[0];

    if (!nextTask) {
      return {
        title: suggestedContext,
        time: 'No scheduled tasks',
        type: 'free',
      };
    }

    return {
      title: nextTask.nextTask || nextTask.title,
      time: nextTask.dueDate,
      type: 'task',
    };
  };

  const nextTask = getNextTaskCard();

  // Get weather icon from location context or time
  const getDisplayWeatherIcon = () => {
    if (locationContext?.weather?.icon) {
      return locationContext.weather.icon;
    }
    return getWeatherIcon(timeOfDay);
  };

  const renderHeader = () => (
    <>
      {/* Animated Header */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <View style={styles.headerTop}>
          <Animated.View style={greetingAnimatedStyle}>
            <View style={styles.greetingRow}>
              <Text style={[styles.greeting, { color: colors.text }]}>
                {greeting}, {user?.name || 'Traveler'}
              </Text>
              {/* Weather badge with location context */}
              <View
                style={[
                  styles.weatherBadge,
                  { backgroundColor: colors.glassBackground },
                ]}
              >
                <Ionicons
                  name={getDisplayWeatherIcon() as any}
                  size={16}
                  color={colors.primary}
                />
                {locationContext?.weather && (
                  <Text style={[styles.tempText, { color: colors.primary }]}>
                    {locationContext.weather.temperature}°
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.subGreetingRow}>
              <Text style={[styles.subGreeting, { color: colors.primary }]}>
                {contextMessage}
              </Text>
              {locationContext?.location?.city && (
                <Text
                  style={[styles.locationText, { color: colors.textMuted }]}
                >
                  📍 {locationContext.location.city}
                </Text>
              )}
            </View>
          </Animated.View>

          <Pressable
            style={[
              styles.iconButton,
              {
                backgroundColor: colors.glassBackground,
                borderColor: colors.glassBorder,
              },
            ]}
            onPress={() => {
              hapticButton();
              router.push('/settings');
            }}
          >
            <Ionicons name="settings-outline" size={20} color={colors.text} />
          </Pressable>
        </View>
      </Animated.View>

      {/* Quick Actions */}
      <Animated.View
        style={[styles.quickActionsContainer, quickActionsAnimatedStyle]}
      >
        <Animated.ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickActionsScroll}
        >
          {QUICK_ACTIONS.map((action, index) => (
            <Animated.View
              key={action.id}
              entering={SlideInRight.delay(index * 50).duration(300)}
            >
              <Pressable
                style={[
                  styles.quickActionPill,
                  {
                    backgroundColor: colors.glassBackground,
                    borderColor: colors.glassBorder,
                  },
                ]}
                onPress={() => handleQuickAction(action.route)}
              >
                <Ionicons
                  name={action.icon as any}
                  size={18}
                  color={colors.primary}
                />
                <Text style={[styles.quickActionLabel, { color: colors.text }]}>
                  {action.label}
                </Text>
              </Pressable>
            </Animated.View>
          ))}
        </Animated.ScrollView>
      </Animated.View>

      {/* Hero Video Snippets - Looping videos for emotional engagement */}
      <Animated.View
        entering={FadeInUp.delay(150).duration(400)}
        style={styles.heroVideosContainer}
      >
        <Animated.ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.heroVideosScroll}
          snapToInterval={width - 32}
          decelerationRate="fast"
        >
          {/* Hero Video 1 - Motivational */}
          <HeroVideoSnippet
            videoUri="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
            thumbnailUri="https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800"
            title="Stay Motivated"
            subtitle="Your journey continues"
            index={0}
          />
          {/* Hero Video 2 - Wellness */}
          <HeroVideoSnippet
            videoUri="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
            thumbnailUri="https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800"
            title="Mindful Moment"
            subtitle="Take a breath"
            index={1}
          />
        </Animated.ScrollView>
      </Animated.View>

      {/* What's up next */}
      <Animated.View entering={FadeInUp.delay(200).duration(400)}>
        <NextTaskCard
          task={nextTask}
          onPress={() => router.push('/(tabs)/planner' as any)}
        />
      </Animated.View>

      {/* Your Story Today */}
      <Animated.Text
        entering={FadeIn.delay(300)}
        style={[styles.sectionTitle, { color: colors.text }]}
      >
        Your Story Today
      </Animated.Text>
    </>
  );

  const renderFooter = () => {
    if (!stats) return null;

    const completionPercent =
      Math.round((stats.tasksCompleted / stats.totalTasks) * 100) || 0;

    return (
      <Animated.View
        entering={FadeIn.delay(300)}
        style={styles.progressCardWrapper}
      >
        <BlurView
          intensity={isDark ? 60 : 30}
          tint={isDark ? 'dark' : 'light'}
          style={styles.progressCardBlur}
        >
          <Pressable
            style={[
              styles.progressCard,
              {
                backgroundColor: colors.glassBackground,
                borderColor: colors.glassBorder,
              },
            ]}
            onPress={() => {
              hapticButton();
              router.push('/(tabs)/planner' as any);
            }}
          >
            <View style={styles.progressHeader}>
              <Text style={[styles.progressTitle, { color: colors.text }]}>
                Daily Review
              </Text>
              <View
                style={[
                  styles.streakBadge,
                  { backgroundColor: 'rgba(255, 107, 0, 0.15)' },
                ]}
              >
                <Ionicons name="flame" size={14} color="#FF6B00" />
                <Text style={styles.streakText}>{stats.streak} day streak</Text>
              </View>
            </View>
            <View style={styles.progressStats}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {stats.tasksCompleted}/{stats.totalTasks}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                  Tasks Done
                </Text>
              </View>
              <View
                style={[styles.statDivider, { backgroundColor: colors.border }]}
              />
              <View style={styles.statItem}>
                <View style={styles.statValueRow}>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {stats.energyLevel}%
                  </Text>
                  <Ionicons
                    name={
                      stats.moodTrend === 'up'
                        ? 'arrow-up'
                        : stats.moodTrend === 'down'
                        ? 'arrow-down'
                        : 'remove'
                    }
                    size={12}
                    color={
                      stats.moodTrend === 'up'
                        ? colors.success
                        : stats.moodTrend === 'down'
                        ? colors.error
                        : colors.textMuted
                    }
                  />
                </View>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                  Energy
                </Text>
              </View>
              <View
                style={[styles.statDivider, { backgroundColor: colors.border }]}
              />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {Math.round(stats.focusMinutes / 60)}h{' '}
                  {stats.focusMinutes % 60}m
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                  Focus Time
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.progressBarContainer,
                { backgroundColor: colors.border },
              ]}
            >
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    width: `${completionPercent}%`,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressFooter, { color: colors.primary }]}>
              {completionPercent >= 80
                ? '🎉 Great progress today!'
                : 'Tap to view tasks'}
            </Text>
          </Pressable>
        </BlurView>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={getGradientArray('profile')}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Animated.ScrollView
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {renderHeader()}
          <View style={styles.feedContainer}>
            {feed.map((item, index) => (
              <Pressable key={item.id} onPress={() => handleCardTap(item)}>
                <FeedCard
                  card={item}
                  isContextRelevant={item.priority === 3}
                  index={index}
                  isLiked={likedCards.includes(item.id)}
                  isBookmarked={bookmarkedCards.includes(item.id)}
                  onLike={(cardId) => toggleLikeCard(cardId)}
                  onBookmark={(cardId) => toggleBookmarkCard(cardId)}
                />
              </Pressable>
            ))}
            {renderFooter()}
          </View>
        </Animated.ScrollView>

        {/* Full-screen Card Detail Modal */}
        <CardDetailModal
          visible={showCardModal}
          card={selectedCard}
          onClose={() => {
            setShowCardModal(false);
            setSelectedCard(null);
          }}
          onLike={handleModalLike}
          onBookmark={handleModalBookmark}
          onNavigate={handleCardNavigate}
          isLiked={selectedCard ? likedCards.includes(selectedCard.id) : false}
          isBookmarked={
            selectedCard ? bookmarkedCards.includes(selectedCard.id) : false
          }
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
    paddingHorizontal: 16,
  },
  header: {
    paddingTop: 10,
    marginBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  weatherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tempText: {
    fontSize: 12,
    fontWeight: '600',
  },
  subGreetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  subGreeting: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    flex: 1,
  },
  locationText: {
    fontSize: 12,
    marginLeft: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionsContainer: {
    marginBottom: 20,
    marginTop: 8,
  },
  quickActionsScroll: {
    paddingVertical: 4,
    gap: 10,
  },
  quickActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    marginTop: 16,
    letterSpacing: 0.5,
  },
  // Hero Video Snippets
  heroVideosContainer: {
    marginTop: 20,
    marginBottom: 16,
  },
  heroVideosScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  heroVideoCard: {
    width: width - 40,
    height: 200,
    borderRadius: 24,
    overflow: 'hidden',
    marginRight: 12,
  },
  heroVideoBlur: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  heroVideoWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  heroVideo: {
    width: '100%',
    height: '100%',
  },
  heroVideoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  heroVideoContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  heroVideoTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 1 },
  },
  heroVideoSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 1 },
  },
  feedContainer: {
    gap: 0,
  },
  progressCardWrapper: {
    marginTop: 10,
    marginBottom: 20,
  },
  progressCardBlur: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  progressCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: '100%',
  },
  progressBarContainer: {
    height: 6,
    borderRadius: 3,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  progressFooter: {
    fontSize: 12,
    textAlign: 'center',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakText: {
    color: '#FF6B00',
    fontSize: 12,
    fontWeight: '600',
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
  },
});
