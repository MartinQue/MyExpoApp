import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
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
import * as haptics from '@/lib/haptics';
import { useRouter } from 'expo-router';
import { NextTaskCard } from '@/components/home/NextTaskCard';
import { FeedCard } from '@/components/home/FeedCard';
import {
  buildHomeFeed,
  getTimeContext,
  getDailyStats,
  FeedCard as FeedCardType,
  DailyStats,
} from '@/lib/homeFeed';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = 140;
const HEADER_COLLAPSED_HEIGHT = 60;

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

export default function ProfileTab() {
  const { colors, isDark, getGradientArray } = useTheme();
  const { user } = useUserStore();
  const { plans } = usePlannerStore();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feed, setFeed] = useState<FeedCardType[]>([]);
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [contextMessage, setContextMessage] = useState('');
  const router = useRouter();
  const scrollY = useSharedValue(0);

  // Time context
  const timeContext = getTimeContext();
  const { greeting, timeOfDay, suggestedContext } = timeContext;

  // Set contextual message on mount
  useEffect(() => {
    setContextMessage(getContextualMessage(timeOfDay));
  }, [timeOfDay]);

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

  // Load AI-powered feed
  const loadFeed = useCallback(async () => {
    try {
      console.log('📱 Loading personalized home feed...');
      const [feedData, statsData] = await Promise.all([
        buildHomeFeed({
          userName: user?.name || 'Friend',
          plans: plans,
        }),
        getDailyStats(),
      ]);

      setFeed(feedData);
      setStats(statsData);
      console.log(`✅ Loaded ${feedData.length} feed items`);
    } catch (error) {
      console.error('Failed to load feed:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.name, plans]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.light();

    // Refresh contextual message too
    setContextMessage(getContextualMessage(timeOfDay));

    await loadFeed();

    setRefreshing(false);
    haptics.success();
  }, [loadFeed, timeOfDay]);

  // Navigate to a quick action
  const handleQuickAction = (route: string) => {
    haptics.button();
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
              <View
                style={[
                  styles.weatherBadge,
                  { backgroundColor: colors.glassBackground },
                ]}
              >
                <Ionicons
                  name={getWeatherIcon(timeOfDay) as any}
                  size={16}
                  color={colors.primary}
                />
              </View>
            </View>
            <Text style={[styles.subGreeting, { color: colors.primary }]}>
              {contextMessage}
            </Text>
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
              haptics.button();
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
              haptics.button();
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

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={getGradientArray('profile')}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              Preparing your personalized feed...
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

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
              <FeedCard
                key={item.id}
                card={item}
                isContextRelevant={item.priority === 3}
                index={index}
              />
            ))}
            {renderFooter()}
          </View>
        </Animated.ScrollView>
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
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subGreeting: {
    fontSize: 13,
    marginTop: 6,
    fontWeight: '600',
    letterSpacing: 0.3,
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
