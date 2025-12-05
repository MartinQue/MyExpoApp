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

      {/* Header - Grok Style */}
      <SafeAreaView edges={['top']} style={styles.headerContainer}>
        <View style={styles.headerContent}>
          {/* Left: Menu Icon - Goes to Settings */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleMenuPress}
            activeOpacity={0.7}
          >
            <Ionicons name="menu" size={26} color={colors.text} />
          </TouchableOpacity>

          {/* Center: Tab Names (Grok-style text tabs with underline) */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={styles.tabButton}
              onPress={() => handleTabPress(0)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 0 ? colors.text : colors.textMuted },
                ]}
              >
                Ask
              </Text>
              {activeTab === 0 && (
                <View
                  style={[
                    styles.tabUnderline,
                    { backgroundColor: colors.text },
                  ]}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabButton}
              onPress={() => handleTabPress(1)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 1 ? colors.text : colors.textMuted },
                ]}
              >
                Alter Ego
              </Text>
              {activeTab === 1 && (
                <View
                  style={[
                    styles.tabUnderline,
                    { backgroundColor: colors.text },
                  ]}
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Right: Context-aware icon */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={activeTab === 0 ? handleNewChat : handleMenuPress}
            activeOpacity={0.7}
          >
            <Ionicons
              name={
                activeTab === 0 ? 'chatbubble-ellipses-outline' : 'grid-outline'
              }
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 12,
    height: 56,
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Grok-style tab navigation
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  tabButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabText: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  tabUnderline: {
    height: 2,
    width: '100%',
    marginTop: 4,
    borderRadius: 1,
  },
  pagerView: {
    flex: 1,
  },
});
