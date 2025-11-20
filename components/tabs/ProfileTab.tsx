import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  Pressable,
  RefreshControl,
  LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { MotiView, AnimatePresence } from 'moti';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import { Colors } from '@/constants/Theme';
import { useUserStore } from '@/stores/userStore';
import { usePlannerStore } from '@/stores/plannerStore';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { NextTaskCard } from '@/components/home/NextTaskCard';
import { FeedCard } from '@/components/home/FeedCard';
import { mockFeedCards } from '@/constants/MockData';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Wrapper component for scroll effects
const ParallaxItem = ({
  children,
  index,
  scrollY,
}: {
  children: React.ReactNode;
  index: number;
  scrollY: Animated.SharedValue<number>;
}) => {
  const [itemY, setItemY] = useState(0);

  const onLayout = (event: LayoutChangeEvent) => {
    setItemY(event.nativeEvent.layout.y);
  };

  const animatedStyle = useAnimatedStyle(() => {
    // Only animate if we have a valid Y position
    if (itemY === 0) return {};

    const inputRange = [
      itemY - SCREEN_HEIGHT + 50, // Enters from bottom
      itemY - SCREEN_HEIGHT * 0.2, // Near center
      itemY, // At top
    ];

    const opacity = interpolate(
      scrollY.value,
      inputRange,
      [0.6, 1, 1],
      Extrapolation.CLAMP
    );

    const scale = interpolate(
      scrollY.value,
      inputRange,
      [0.96, 1, 1],
      Extrapolation.CLAMP
    );

    const translateY = interpolate(
      scrollY.value,
      inputRange,
      [20, 0, 0],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY }, { scale }],
    };
  });

  return (
    <Animated.View
      onLayout={onLayout}
      style={[styles.feedItemWrapper, animatedStyle]}
    >
      {children}
    </Animated.View>
  );
};

export default function ProfileTab() {
  const { user } = useUserStore();
  const { plans } = usePlannerStore();
  const [greeting, setGreeting] = useState('Good Morning');
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const scrollY = useSharedValue(0);

  // Automated Context State
  const [timeOfDay, setTimeOfDay] = useState<
    'Morning' | 'Afternoon' | 'Evening'
  >('Morning');
  const [simulatedLocation, setSimulatedLocation] = useState<
    'Home' | 'Work' | 'Gym'
  >('Home');
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  useEffect(() => {
    const updateContext = () => {
      const hour = new Date().getHours();
      let currentGreeting = 'Good Morning';
      let time: 'Morning' | 'Afternoon' | 'Evening' = 'Morning';

      if (hour >= 12 && hour < 17) {
        currentGreeting = 'Good Afternoon';
        time = 'Afternoon';
      } else if (hour >= 17) {
        currentGreeting = 'Good Evening';
        time = 'Evening';
      }
      setGreeting(currentGreeting);
      setTimeOfDay(time);

      // Simulated Location Logic
      if (hour >= 9 && hour < 17) {
        setSimulatedLocation('Work');
        setIsPrivacyMode(true);
      } else if (hour >= 18 && hour < 20) {
        setSimulatedLocation('Gym');
        setIsPrivacyMode(false);
      } else {
        setSimulatedLocation('Home');
        setIsPrivacyMode(false);
      }
    };

    updateContext();
    const interval = setInterval(updateContext, 60000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 2000);
  }, []);

  // Context-Aware Feed Logic
  const processedFeed = [...mockFeedCards].sort((a, b) => {
    const aScore =
      a.context?.toLowerCase() === simulatedLocation.toLowerCase() ? 2 : 0;
    const bScore =
      b.context?.toLowerCase() === simulatedLocation.toLowerCase() ? 2 : 0;
    return bScore - aScore;
  });

  const getNextTaskCard = () => {
    const nextTask = plans[0];
    if (!nextTask)
      return {
        title: 'Relax and recharge',
        time: 'No immediate plans',
        type: 'free',
      };
    const isToday =
      nextTask.dueDate?.toLowerCase().includes('today') ||
      nextTask.dueDate?.toLowerCase().includes('now');
    if (isToday) {
      return nextTask;
    } else {
      return {
        title: 'Relax and recharge',
        time: 'No immediate plans',
        type: 'free',
      };
    }
  };

  const nextTask = getNextTaskCard();

  const renderHeader = () => (
    <>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <MotiView
              from={{ opacity: 0, translateY: -10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500 }}
            >
              <Text style={styles.greeting}>
                {greeting}, {user?.name || 'Traveler'}
              </Text>
              <Text style={styles.subGreeting}>
                {isPrivacyMode ? 'Privacy Mode Active • ' : ''}
                {simulatedLocation} • {timeOfDay}
              </Text>
            </MotiView>
          </View>

          <Pressable
            style={styles.iconButton}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={20} color="white" />
          </Pressable>
        </View>
      </View>

      {/* What's up next */}
      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', delay: 200 }}
      >
        <NextTaskCard
          task={nextTask}
          onPress={() => router.push('/(tabs)/planner' as any)}
        />
      </MotiView>

      {/* Your Story Today */}
      <Text style={styles.sectionTitle}>Your Story Today</Text>
    </>
  );

  const renderFooter = () => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: 600 }}
      style={styles.progressCardWrapper}
    >
      <Pressable
        style={styles.progressCard}
        onPress={() => {
          Haptics.selectionAsync();
          // Navigate to detailed analysis
        }}
      >
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Daily Review</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
        </View>
        <View style={styles.progressStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>4/6</Text>
            <Text style={styles.statLabel}>Tasks Done</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>85%</Text>
            <Text style={styles.statLabel}>Energy</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>2h</Text>
            <Text style={styles.statLabel}>Focus Time</Text>
          </View>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: '66%' }]} />
        </View>
        <Text style={styles.progressFooter}>Tap to view full analysis</Text>
      </Pressable>
    </MotiView>
  );

  const renderItem = useCallback(
    ({ item, index }: { item: any; index: number }) => {
      const isContextRelevant =
        item.context?.toLowerCase() === simulatedLocation.toLowerCase();
      return (
        <ParallaxItem key={item.id} index={index} scrollY={scrollY}>
          <FeedCard
            card={item}
            isContextRelevant={isContextRelevant}
            index={index}
          />
        </ParallaxItem>
      );
    },
    [simulatedLocation]
  );

  return (
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
            tintColor={Colors.primary[400]}
          />
        }
      >
        {renderHeader()}
        <View style={styles.feedContainer}>
          {processedFeed.map((item, index) => renderItem({ item, index }))}
          {renderFooter()}
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
    fontFamily: 'System',
  },
  subGreeting: {
    fontSize: 12,
    color: Colors.primary[400],
    marginTop: 4,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.gray[700],
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 16,
    marginTop: 24,
    letterSpacing: 0.5,
  },
  feedContainer: {
    gap: 12,
  },
  feedItemWrapper: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 28,
  },
  cardBody: {
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
    fontFamily: 'System', // Use a nice serif if available, or default
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 16,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  actionButton: {
    padding: 4,
  },
  priorityBadge: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  progressCardWrapper: {
    marginTop: 10,
    marginBottom: 20,
  },
  progressCard: {
    backgroundColor: 'rgba(20, 20, 25, 0.9)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressTitle: {
    color: Colors.white,
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
  },
  statValue: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: Colors.gray[400],
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary[500],
    borderRadius: 3,
  },
  progressFooter: {
    color: Colors.primary[300],
    fontSize: 12,
    textAlign: 'center',
  },
});
