import React, { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PagerView from 'react-native-pager-view';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { AskScreen } from './AskScreen';
import { AlterEgoScreen } from './AlterEgoScreen';
import { useChatStore } from '@/stores/chatStore';
import { useTheme } from '@/contexts/ThemeContext';
import { useVoiceContext } from '@/contexts/VoiceContext';
import { useUserStore } from '@/stores/userStore';
import haptics from '@/lib/haptics';

export function ChatTab() {
  const { colors, isDark, getGradientArray } = useTheme();
  const { isListening, cancelRecording, startRecording } = useVoiceContext();
  const [activeTab, setActiveTab] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const pagerRef = useRef<PagerView>(null);
  const router = useRouter();
  const { clearHistory } = useChatStore();
  const { voiceEnabled } = useUserStore();

  const handleTabPress = (index: number) => {
    if (activeTab !== index) {
      haptics.selection();
      // Cancel recording if active when switching tabs
      if (isListening) {
        cancelRecording();
      }
      setActiveTab(index);
      pagerRef.current?.setPage(index);
    }
  };

  const onPageSelected = async (e: any) => {
    const newTab = e.nativeEvent.position;
    haptics.selection();

    // Cancel recording if active when swiping between tabs
    if (isListening && newTab !== activeTab) {
      await cancelRecording();
    }

    setActiveTab(newTab);

    // Auto-start listening when entering Alter Ego (Grok-like behaviour)
    if (newTab === 1 && voiceEnabled) {
      const started = await startRecording();
      if (!started) {
        Alert.alert(
          'Microphone unavailable',
          'Enable microphone access to chat hands-free with Alter Ego.'
        );
      }
    }
  };

  const handleNewChat = useCallback(() => {
    // Show confirmation
    Alert.alert(
      'Start New Conversation',
      'This will clear your current chat. Are you sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'New Chat',
          style: 'destructive',
          onPress: () => {
            // Clear chat store
            clearHistory();
            // Force re-render of chat screens
            setRefreshKey((prev) => prev + 1);
            haptics.success();
          },
        },
      ]
    );
  }, [clearHistory]);

  const handleMenuPress = useCallback(() => {
    haptics.selection();
    router.push('/settings');
  }, [router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background Gradient */}
      <LinearGradient
        colors={getGradientArray('chat')}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.headerContainer}>
        <BlurView
          intensity={isDark ? 40 : 30}
          tint={isDark ? 'dark' : 'light'}
          style={styles.headerBlur}
        >
          <View
            style={[
              styles.headerContent,
              { borderBottomColor: colors.glassBorder },
            ]}
          >
            {/* Left: Menu Icon - Goes to Settings */}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleMenuPress}
              activeOpacity={0.7}
            >
              <Ionicons name="menu" size={24} color={colors.text} />
            </TouchableOpacity>

            {/* Center: Segmented Control */}
            <View
              style={[
                styles.segmentedControl,
                { backgroundColor: colors.glassBackground },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.segment,
                  activeTab === 0 && [
                    styles.activeSegment,
                    { backgroundColor: colors.surfaceElevated },
                  ],
                ]}
                onPress={() => handleTabPress(0)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.segmentText,
                    { color: colors.textMuted },
                    activeTab === 0 && [
                      styles.activeSegmentText,
                      { color: colors.text },
                    ],
                  ]}
                >
                  Ask
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.segment,
                  activeTab === 1 && [
                    styles.activeSegment,
                    { backgroundColor: colors.surfaceElevated },
                  ],
                ]}
                onPress={() => handleTabPress(1)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.segmentText,
                    { color: colors.textMuted },
                    activeTab === 1 && [
                      styles.activeSegmentText,
                      { color: colors.text },
                    ],
                  ]}
                >
                  Alter Ego
                </Text>
              </TouchableOpacity>
            </View>

            {/* Right: New Chat Icon */}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleNewChat}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </BlurView>
      </SafeAreaView>

      {/* Content */}
      <PagerView
        key={refreshKey}
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={onPageSelected}
      >
        <View key="1">
          <AskScreen />
        </View>
        <View key="2">
          <AlterEgoScreen />
        </View>
      </PagerView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    zIndex: 10,
  },
  headerBlur: {
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 8,
    height: 64,
    borderBottomWidth: 0.5,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 3,
    height: 38,
    width: 180,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  segment: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 17,
  },
  activeSegment: {
    // backgroundColor set dynamically
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeSegmentText: {
    // color set dynamically
  },
  pagerView: {
    flex: 1,
  },
});
