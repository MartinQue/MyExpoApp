import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Modal,
  LayoutAnimation,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { ChatContainer } from '../chat/ChatContainer';
import ChatComposer from '../chat/ChatComposer';
import { useChatStore } from '@/stores/chatStore';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedAvatar } from '../AnimatedAvatar';
import { Colors } from '@/constants/Theme';
import * as Haptics from 'expo-haptics';

import { MotiView } from 'moti';

const ListeningWave = () => {
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: 3, height: 20 }}
    >
      {[0, 1, 2, 3].map((i) => (
        <MotiView
          key={i}
          from={{ height: 8 }}
          animate={{ height: [8, 20, 8] }}
          transition={{
            type: 'timing',
            duration: 500 + i * 100,
            loop: true,
            repeatReverse: true,
          }}
          style={{
            width: 3,
            backgroundColor: Colors.gray[400],
            borderRadius: 1.5,
          }}
        />
      ))}
    </View>
  );
};

const { width } = Dimensions.get('window');

import { useNavigation } from 'expo-router';

// ... (inside component)
export function ChatTab() {
  const { messages, sendMessage, mode, setMode, voiceMode, setVoiceMode } =
    useChatStore();
  const [showStatus, setShowStatus] = useState(true);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const translateX = useRef(new Animated.Value(0)).current;

  // Keyboard Listeners
  React.useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Auto-hide status after 5 seconds
  React.useEffect(() => {
    if (voiceMode) {
      setShowStatus(true);
      const timer = setTimeout(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setShowStatus(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [voiceMode]);

  const handleSend = (text: string) => {
    sendMessage(text, 'user');
  };

  // Update chatContentContainer style dynamically
  const containerStyle = [
    styles.chatContentContainer,
    {
      paddingBottom: voiceMode
        ? insets.bottom + 20
        : keyboardVisible
        ? 10
        : 110,
    },
  ];

  const switchMode = (targetMode: 'chat' | 'avatar') => {
    const targetPosition = targetMode === 'chat' ? 0 : -width;

    setMode(targetMode);
    Haptics.selectionAsync();

    Animated.spring(translateX, {
      toValue: targetPosition,
      useNativeDriver: true,
      tension: 40,
      friction: 8,
    }).start(() => {
      translateX.setOffset(targetPosition);
      translateX.setValue(0);
    });
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationX } = event.nativeEvent;
      // If in 'chat' mode (index 0), offset is 0. If in 'avatar' mode (index 1), offset is -width.
      const currentOffset = mode === 'chat' ? 0 : -width;
      const projectedPosition = currentOffset + translationX;

      let targetPosition = 0;
      let targetMode: 'chat' | 'avatar' = 'chat';

      // Swipe Left to go to Alter Ego (Avatar)
      if (
        (mode === 'chat' && translationX < -50) ||
        (mode === 'avatar' && translationX < width / 2)
      ) {
        targetPosition = -width;
        targetMode = 'avatar';
      }
      // Swipe Right to go back to Ask (Chat)
      else {
        targetPosition = 0;
        targetMode = 'chat';
      }

      // Animate to target
      translateX.flattenOffset();
      Animated.spring(translateX, {
        toValue: targetPosition,
        useNativeDriver: true,
        tension: 40,
        friction: 8,
      }).start(() => {
        translateX.setOffset(targetPosition);
        translateX.setValue(0);
      });

      if (mode !== targetMode) {
        setMode(targetMode);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }
  };

  // Initialize offset
  React.useEffect(() => {
    const initialPosition = mode === 'chat' ? 0 : -width;
    translateX.setOffset(initialPosition);
    translateX.setValue(0);
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#121212']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top Navigation Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.iconButton}
            onPress={() => Haptics.selectionAsync()}
          >
            <Ionicons name="menu" size={24} color={Colors.gray[400]} />
          </Pressable>

          <View style={styles.tabContainer}>
            {['Ask', 'Alter Ego'].map((tab) => {
              const isActive =
                (tab === 'Ask' && mode === 'chat') ||
                (tab === 'Alter Ego' && mode === 'avatar');
              return (
                <Pressable
                  key={tab}
                  onPress={() => switchMode(tab === 'Ask' ? 'chat' : 'avatar')}
                  style={styles.tabItem}
                >
                  <Text
                    style={[styles.tabText, isActive && styles.activeTabText]}
                  >
                    {tab}
                  </Text>
                  {isActive && <View style={styles.activeIndicator} />}
                </Pressable>
              );
            })}
          </View>

          <Pressable
            style={styles.iconButton}
            onPress={() => Haptics.selectionAsync()}
          >
            <Ionicons name="create-outline" size={24} color={Colors.white} />
          </Pressable>
        </View>

        {/* Swipeable Content */}
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
        >
          <Animated.View
            style={[styles.screensContainer, { transform: [{ translateX }] }]}
          >
            {/* Screen 1: Ask (Chat) */}
            <View style={styles.screen}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 0}
                style={styles.keyboardAvoidingView}
              >
                <View style={containerStyle}>
                  {messages.length === 0 ? (
                    <View style={styles.centerLogoContainer}>
                      <Ionicons
                        name="planet-outline"
                        size={80}
                        color="rgba(255,255,255,0.1)"
                      />
                    </View>
                  ) : (
                    <ChatContainer messages={messages} />
                  )}
                  <View
                    style={{
                      zIndex: 100,
                      elevation: 5,
                      opacity: voiceMode ? 0 : 1,
                    }}
                    pointerEvents={voiceMode ? 'none' : 'auto'}
                  >
                    <ChatComposer
                      onSend={handleSend}
                      messages={messages}
                      voiceMode={voiceMode}
                      onToggleVoiceMode={() => setVoiceMode(!voiceMode)}
                    />
                  </View>
                </View>
              </KeyboardAvoidingView>
            </View>

            {/* Screen 2: Alter Ego (Placeholder) */}
            <View style={styles.screen}>
              <View style={styles.alterEgoContainer}>
                <AnimatedAvatar fullScreen isListening={true} />
                <Text style={styles.alterEgoText}>Alter Ego Mode</Text>
                <Text style={styles.alterEgoSubText}>
                  Swipe right to return
                </Text>
              </View>
            </View>
          </Animated.View>
        </PanGestureHandler>
      </SafeAreaView>

      {/* Voice Mode Overlay - Covers Content but Header is on top */}
      {voiceMode && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 40 }]}>
          <View style={styles.modalOverlay}>
            {/* Dimmed Background */}
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setVoiceMode(false)}
            >
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)' }} />
            </Pressable>

            {/* Voice Controls at Bottom */}
            <View
              style={[
                styles.voiceModalContent,
                { paddingBottom: insets.bottom + 20 },
              ]}
            >
              {/* Status */}
              {showStatus && (
                <View style={styles.statusContainer}>
                  <ListeningWave />
                  <Text style={styles.statusText}>Start talking</Text>
                </View>
              )}

              {/* 4 Buttons */}
              <View style={styles.voiceControlsRow}>
                {[
                  { icon: 'videocam-off-outline', active: false },
                  { icon: 'volume-medium-outline', active: true },
                  { icon: 'mic', active: true },
                  { icon: 'settings-outline', active: false },
                ].map((item, idx) => (
                  <View key={idx} style={styles.voiceControlBtn}>
                    <Ionicons
                      name={item.icon as any}
                      size={24}
                      color={item.active ? 'white' : Colors.gray[400]}
                    />
                  </View>
                ))}
              </View>

              {/* Input + Stop */}
              <View style={styles.voiceComposerRow}>
                <Pressable
                  style={styles.voiceInputPill}
                  onPress={() => setVoiceMode(false)}
                >
                  <Text style={styles.voiceInputText}>Ask Anything</Text>
                </Pressable>
                <Pressable
                  style={styles.stopButton}
                  onPress={() => setVoiceMode(false)}
                  hitSlop={10}
                >
                  <Ionicons name="square" size={12} color="black" />
                  <Text style={styles.stopText}>Stop</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    zIndex: 50,
  },
  iconButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 32,
  },
  tabItem: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  tabText: {
    color: Colors.gray[500],
    fontSize: 18,
    fontWeight: '600',
  },
  activeTabText: {
    color: Colors.white,
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -6,
    width: 24,
    height: 3,
    backgroundColor: Colors.white,
    borderRadius: 1.5,
  },
  screensContainer: {
    flexDirection: 'row',
    width: width * 2,
    flex: 1,
  },
  screen: {
    width: width,
    flex: 1,
  },
  chatContentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 90,
  },
  alterEgoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alterEgoText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
  alterEgoSubText: {
    color: Colors.gray[400],
    marginTop: 8,
  },
  centerLogoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 100,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  voiceModalContent: {
    paddingHorizontal: 16,
    gap: 20,
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    color: Colors.gray[400],
    fontSize: 14,
    fontWeight: '500',
  },
  voiceControlsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  voiceControlBtn: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: 'rgba(20,20,25,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  voiceComposerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 50,
    width: '100%',
  },
  voiceInputPill: {
    flex: 1,
    height: '100%',
    borderRadius: 25,
    backgroundColor: 'rgba(20,20,25,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  voiceInputText: {
    color: Colors.gray[500],
    fontSize: 16,
  },
  stopButton: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    height: '100%',
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 100,
    justifyContent: 'center',
  },
  stopText: {
    color: 'black',
    fontSize: 16,
    fontWeight: '700',
  },
});
