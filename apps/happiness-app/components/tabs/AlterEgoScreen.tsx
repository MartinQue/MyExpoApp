/**
 * AlterEgoScreen - Grok Ani-style Immersive AI Companion Experience
 * Features:
 * - Full-screen animated gradient background
 * - Floating action menu (Streaks, Capture, Outfit, Speaker, Settings)
 * - Central "Start talking" button
 * - Grok-style suggestion chips
 * - Minimal chat input bar with mic, video, and Chat button
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Platform,
  Keyboard,
  FlatList,
  Dimensions,
  Pressable,
  TextInput,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  withDelay,
  Easing,
  interpolate,
  Extrapolation,
  FadeIn,
  FadeInDown,
  FadeOut,
  SlideInRight,
  SlideInUp,
  ZoomIn,
  SharedValue,
} from 'react-native-reanimated';

import { ChatMessage, sendMessageToAI } from '../chat/ChatHelpers';
import { AVATAR_PRESETS, SUGGESTION_CHIPS } from '@/constants/Avatars';
import { useUserStore } from '@/stores/userStore';
import { useTheme } from '@/contexts/ThemeContext';
import { useVoiceContext } from '@/contexts/VoiceContext';
import haptics from '@/lib/haptics';
import * as Speech from 'expo-speech';
import AvatarController, { AvatarState } from '../live2d/AvatarController';
import AvatarSelector from '../live2d/AvatarSelector';
import { Live2DModel } from '../live2d/Live2DAvatar';
import { useElevenLabs } from '@/lib/voice/elevenLabsService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Floating action button configuration (Grok Ani style)
const FLOATING_ACTIONS = [
  {
    id: 'streaks',
    icon: 'flame',
    label: 'Streaks',
    badge: 4,
    color: '#FF6B00',
  },
  { id: 'capture', icon: 'scan-outline', label: 'Capture', color: '#ffffff' },
  {
    id: 'outfit',
    icon: 'shirt-outline',
    label: 'Outfit',
    badge: 1,
    color: '#ffffff',
  },
  {
    id: 'speaker',
    icon: 'volume-high-outline',
    label: 'Speaker',
    color: '#ffffff',
  },
  {
    id: 'settings',
    icon: 'settings-outline',
    label: 'Settings',
    color: '#ffffff',
  },
];

// Individual wave bar component to comply with React hooks rules
function WaveBar({
  value,
  color,
  index,
  isActive,
}: {
  value: SharedValue<number>;
  color: string;
  index: number;
  isActive: boolean;
}) {
  useEffect(() => {
    if (isActive) {
      value.value = withRepeat(
        withSequence(
          withDelay(
            index * 100,
            withTiming(1, {
              duration: 300 + index * 50,
              easing: Easing.inOut(Easing.ease),
            })
          ),
          withTiming(0.3, {
            duration: 300 + index * 50,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        true
      );
    } else {
      value.value = withSpring(0.3);
    }
  }, [isActive, index, value]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: interpolate(value.value, [0, 1], [12, 36], Extrapolation.CLAMP),
  }));

  return (
    <Animated.View
      style={[styles.waveBar, { backgroundColor: color }, animatedStyle]}
    />
  );
}

// Voice wave animation component
function VoiceWaveAnimation({
  isActive,
  color = '#ffffff',
}: {
  isActive: boolean;
  color?: string;
}) {
  const bar0 = useSharedValue(0.3);
  const bar1 = useSharedValue(0.5);
  const bar2 = useSharedValue(0.4);
  const bar3 = useSharedValue(0.6);
  const bar4 = useSharedValue(0.5);

  return (
    <View style={styles.waveContainer}>
      <WaveBar value={bar0} color={color} index={0} isActive={isActive} />
      <WaveBar value={bar1} color={color} index={1} isActive={isActive} />
      <WaveBar value={bar2} color={color} index={2} isActive={isActive} />
      <WaveBar value={bar3} color={color} index={3} isActive={isActive} />
      <WaveBar value={bar4} color={color} index={4} isActive={isActive} />
    </View>
  );
}

// Floating Action Menu Component
function FloatingActionMenu({
  isExpanded,
  onToggle,
  onAction,
  isMuted,
}: {
  isExpanded: boolean;
  onToggle: () => void;
  onAction: (actionId: string) => void;
  isMuted: boolean;
}) {
  const { colors, isDark } = useTheme();
  const textColor = isDark ? '#ffffff' : colors.text;
  const subtleTextColor = isDark ? 'rgba(255, 255, 255, 0.9)' : colors.textSecondary;
  const glassBg = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(45, 42, 38, 0.08)';

  return (
    <View style={styles.floatingMenuContainer}>
      {isExpanded ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={styles.floatingMenuExpanded}
        >
          {FLOATING_ACTIONS.map((action, index) => (
            <Animated.View
              key={action.id}
              entering={SlideInRight.delay(index * 50).duration(200)}
            >
              <Pressable
                style={styles.floatingActionItem}
                onPress={() => onAction(action.id)}
              >
                <Text style={[styles.floatingActionLabel, { color: subtleTextColor }]}>{action.label}</Text>
                <View
                  style={[
                    styles.floatingActionButton,
                    { backgroundColor: glassBg },
                  ]}
                >
                  <Ionicons
                    name={
                      action.id === 'speaker' && isMuted
                        ? 'volume-mute-outline'
                        : (action.icon as any)
                    }
                    size={22}
                    color={action.id === 'streaks' ? action.color : textColor}
                  />
                  {action.badge && (
                    <View
                      style={[
                        styles.actionBadge,
                        { backgroundColor: action.color },
                      ]}
                    >
                      <Text style={styles.actionBadgeText}>{action.badge}</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            </Animated.View>
          ))}
          {/* Close button */}
          <Pressable style={styles.floatingActionItem} onPress={onToggle}>
            <Text style={[styles.floatingActionLabel, { color: subtleTextColor }]}>Close</Text>
            <View
              style={[
                styles.floatingActionButton,
                { backgroundColor: glassBg },
              ]}
            >
              <Ionicons name="chevron-up" size={22} color={textColor} />
            </View>
          </Pressable>
        </Animated.View>
      ) : (
        <Pressable
          style={[
            styles.menuToggleButton,
            { backgroundColor: glassBg },
          ]}
          onPress={onToggle}
        >
          <Ionicons name="grid-outline" size={22} color={textColor} />
        </Pressable>
      )}
    </View>
  );
}

export function AlterEgoScreen() {
  const { colors, isDark } = useTheme();
  const { hapticEnabled } = useUserStore();
  const {
    isListening,
    isTranscribing,
    duration,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useVoiceContext();

  // ElevenLabs TTS integration
  const {
    isSpeaking: isElevenLabsSpeaking,
    speak: speakWithElevenLabs,
    stop: stopElevenLabs,
  } = useElevenLabs();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentAvatarIndex, setCurrentAvatarIndex] = useState(0);
  const [isThinking, setIsThinking] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [selectedLive2DModel, setSelectedLive2DModel] = useState<Live2DModel>('hiyori');
  const [avatarState, setAvatarState] = useState<AvatarState>('idle');
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  const currentAvatar = AVATAR_PRESETS[currentAvatarIndex];

  // Animated values for pulsing orb
  const orbPulse = useSharedValue(1);
  const orbGlow = useSharedValue(0.5);

  // Initialize with greeting
  useEffect(() => {
    setMessages([
      {
        _id: `greeting-${currentAvatar.id}`,
        text: currentAvatar.greeting,
        createdAt: new Date(),
        user: { _id: 2, name: currentAvatar.name },
      },
    ]);
  }, [currentAvatar.id]);

  // Breathing animation for the orb
  useEffect(() => {
    orbPulse.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    orbGlow.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 2000 }),
        withTiming(0.4, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);

  const orbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbPulse.value }],
    opacity: orbGlow.value,
  }));

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      if (hapticEnabled) haptics.light();

      // Stop any ongoing speech
      if (isElevenLabsSpeaking) {
        await stopElevenLabs();
      }

      const userMsg: ChatMessage = {
        _id: `user_${Date.now()}`,
        text: text.trim(),
        createdAt: new Date(),
        user: { _id: 1, name: 'You' },
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputText('');
      setShowMessages(true);
      scrollToBottom();
      setIsThinking(true);
      setAvatarState('thinking'); // Avatar shows thinking expression

      try {
        const response = await sendMessageToAI(text, {
          systemPrompt: currentAvatar.systemPrompt,
        });

        if (hapticEnabled) haptics.success();

        const avatarResponse: ChatMessage = {
          ...response,
          user: { _id: 2, name: currentAvatar.name },
        };

        setMessages((prev) => [...prev, avatarResponse]);
        scrollToBottom();

        // Use ElevenLabs TTS if available and not muted
        if (!isMuted && avatarResponse.text) {
          setAvatarState('speaking'); // Avatar shows speaking expression

          const success = await speakWithElevenLabs(avatarResponse.text, {
            onComplete: () => {
              setAvatarState('idle'); // Return to idle when done
            },
            onError: (error) => {
              console.error('ElevenLabs error, falling back to Speech:', error);
              // Fallback to expo-speech
              Speech.speak(avatarResponse.text!, { rate: 0.9, pitch: 1.0 });
              setAvatarState('idle');
            },
          });

          if (!success) {
            // If ElevenLabs fails, use fallback
            Speech.speak(avatarResponse.text, { rate: 0.9, pitch: 1.0 });
            setAvatarState('idle');
          }
        } else {
          setAvatarState('idle');
        }
      } catch (error) {
        console.error('AlterEgo error:', error);
        setMessages((prev) => [
          ...prev,
          {
            _id: `error_${Date.now()}`,
            text: "I felt that pause. Take your time, I'm here.",
            createdAt: new Date(),
            user: { _id: 2, name: currentAvatar.name },
          },
        ]);
        if (hapticEnabled) haptics.warning();
        setAvatarState('sad'); // Show empathetic expression
        setTimeout(() => setAvatarState('idle'), 2000);
      } finally {
        setIsThinking(false);
      }
    },
    [currentAvatar, hapticEnabled, isMuted, isElevenLabsSpeaking, stopElevenLabs, speakWithElevenLabs]
  );

  const handleVoicePress = async () => {
    if (hapticEnabled) haptics.selection();
    Speech.stop();

    if (isListening) {
      setAvatarState('thinking'); // Show thinking while transcribing
      try {
        const text = await stopRecording();
        if (text?.trim()) {
          handleSend(text);
        } else {
          setAvatarState('idle');
        }
      } catch (error) {
        console.error('Voice error:', error);
        if (hapticEnabled) haptics.error();
        setAvatarState('sad');
        setTimeout(() => setAvatarState('idle'), 1500);
      }
    } else {
      setAvatarState('listening'); // Show listening expression
      const started = await startRecording();
      if (!started) {
        if (hapticEnabled) haptics.error();
        setAvatarState('surprised'); // Show surprised on error
        setTimeout(() => setAvatarState('idle'), 1500);
      }
    }
  };

  const handleSuggestionPress = (text: string) => {
    if (hapticEnabled) haptics.selection();
    handleSend(text);
  };

  const handleFloatingAction = (actionId: string) => {
    if (hapticEnabled) haptics.selection();

    switch (actionId) {
      case 'streaks':
        Alert.alert('Streaks', 'You have a 4-day streak! Keep it going 🔥');
        break;
      case 'capture':
        handleCapture();
        break;
      case 'outfit':
        // Open avatar selector
        setShowAvatarSelector(true);
        break;
      case 'speaker':
        setIsMuted(!isMuted);
        if (isMuted) {
          Speech.stop();
        }
        break;
      case 'settings':
        Alert.alert('Settings', 'Character settings coming soon!');
        break;
    }
    setIsMenuExpanded(false);
  };

  const handleCapture = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      if (hapticEnabled) haptics.success();
      handleSend('[Shared a photo]');
    }
  };

  const handleVideoCall = () => {
    if (hapticEnabled) haptics.selection();
    Alert.alert(
      'Video Call',
      'Video calls with your AI companion coming soon!'
    );
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.user._id === 1;

    return (
      <Animated.View
        entering={FadeInDown.duration(300)}
        style={[styles.messageRow, isUser ? styles.userRow : styles.aiRow]}
      >
        <View
          style={[
            isUser ? styles.userBubble : styles.aiBubble,
            {
              backgroundColor: isUser
                ? isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(45, 42, 38, 0.08)'
                : isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(45, 42, 38, 0.06)',
            },
          ]}
        >
          <Text style={[styles.messageText, { color: isDark ? '#ffffff' : colors.text }]}>{item.text}</Text>
        </View>
      </Animated.View>
    );
  };

  const gradientColors = isDark 
    ? ['#2D1F4A', '#4A3070', '#6B3D8A', '#3D2060', '#1A0F30'] as const
    : [colors.gradients.chat.start, colors.gradients.chat.mid, colors.gradients.chat.end, colors.gradients.chat.mid, colors.gradients.chat.start] as const;

  const textColor = isDark ? '#ffffff' : colors.text;
  const subtleTextColor = isDark ? 'rgba(255, 255, 255, 0.9)' : colors.textSecondary;
  const mutedTextColor = isDark ? 'rgba(255, 255, 255, 0.7)' : colors.textMuted;
  const mutedTextColorLight = isDark ? 'rgba(255, 255, 255, 0.4)' : colors.inputPlaceholder;
  const glassBg = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(45, 42, 38, 0.08)';
  const glassBorder = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(45, 42, 38, 0.1)';
  const glassBgLight = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(45, 42, 38, 0.05)';

  return (
    <View style={styles.container}>
      {/* Full-screen gradient background */}
      <LinearGradient
        colors={gradientColors}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Animated background blobs */}
      {isDark && (
        <>
          <Animated.View style={[styles.backgroundBlob1, orbAnimatedStyle]} />
          <Animated.View style={[styles.backgroundBlob2, orbAnimatedStyle]} />
        </>
      )}

      {/* Main content */}
      <View style={styles.content}>
        {/* Center area - Live2D Avatar or messages */}
        <View style={styles.centerArea}>
          {!showMessages ? (
            <View style={styles.avatarContainer}>
              {/* Live2D Avatar */}
              <View style={styles.avatarWrapper}>
                <AvatarController
                  model={selectedLive2DModel}
                  state={avatarState}
                  isSpeaking={isElevenLabsSpeaking}
                  onReady={() => console.log('Avatar ready')}
                  onError={(error) => console.error('Avatar error:', error)}
                  style={styles.avatar}
                />
              </View>

              {/* Start talking button overlay */}
              <Animated.View
                entering={ZoomIn.duration(400)}
                style={styles.startTalkingContainer}
              >
                <Pressable
                  style={[styles.startTalkingButton, { backgroundColor: glassBgLight, borderColor: glassBorder }]}
                  onPress={handleVoicePress}
                >
                  <VoiceWaveAnimation isActive={isListening} color={textColor} />
                  <Text style={[styles.startTalkingText, { color: textColor }]}>
                    {isListening ? 'Listening...' : 'Start talking'}
                  </Text>
                </Pressable>
              </Animated.View>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item._id.toString()}
              contentContainerStyle={styles.messagesList}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={scrollToBottom}
            />
          )}
        </View>

        {/* Floating Action Menu (Right side) */}
        <FloatingActionMenu
          isExpanded={isMenuExpanded}
          onToggle={() => {
            if (hapticEnabled) haptics.selection();
            setIsMenuExpanded(!isMenuExpanded);
          }}
          onAction={handleFloatingAction}
          isMuted={isMuted}
        />

        {/* Bottom section - Suggestions & Input */}
        <View style={styles.bottomSection}>
          {/* Suggestion chips (Grok Ani style) */}
          {!showMessages && (
            <Animated.View
              entering={SlideInUp.delay(300).duration(400)}
              style={styles.suggestionsRow}
            >
              {SUGGESTION_CHIPS.map((chip) => (
                <Pressable
                  key={chip.id}
                  style={[styles.suggestionChip, { backgroundColor: glassBg, borderColor: glassBorder }]}
                  onPress={() => handleSuggestionPress(chip.text)}
                >
                  <Text style={[styles.suggestionText, { color: subtleTextColor }]}>{chip.text}</Text>
                </Pressable>
              ))}
            </Animated.View>
          )}

          {/* Input bar (Grok Ani style) */}
          <View style={[styles.inputBar, { backgroundColor: glassBgLight, borderColor: glassBorder }]}>
            {/* Mic button */}
            <Pressable
              style={[
                styles.inputIconButton,
                { backgroundColor: glassBgLight },
                isListening && styles.inputIconButtonActive,
              ]}
              onPress={handleVoicePress}
            >
              <Ionicons
                name={isListening ? 'mic' : 'mic-outline'}
                size={22}
                color={isListening ? colors.primary : mutedTextColor}
              />
            </Pressable>

            {/* Video button */}
            <Pressable style={[styles.inputIconButton, { backgroundColor: glassBgLight }]} onPress={handleVideoCall}>
              <Ionicons
                name="videocam-outline"
                size={22}
                color={mutedTextColor}
              />
            </Pressable>

            {/* Text input */}
            <View style={styles.textInputContainer}>
              <TextInput
                ref={inputRef}
                style={[styles.textInput, { color: textColor }]}
                placeholder="Ask Anything"
                placeholderTextColor={mutedTextColorLight}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={() => handleSend(inputText)}
                returnKeyType="send"
              />
            </View>

            {/* Chat/Send button */}
            <Pressable
              style={[
                styles.chatButton,
                { backgroundColor: isDark ? '#ffffff' : colors.primary },
                inputText.trim() && { backgroundColor: colors.primary },
              ]}
              onPress={() =>
                inputText.trim()
                  ? handleSend(inputText)
                  : inputRef.current?.focus()
              }
            >
              <Ionicons
                name={inputText.trim() ? 'send' : 'chatbubble-outline'}
                size={18}
                color={inputText.trim() ? '#ffffff' : (isDark ? '#000000' : '#ffffff')}
              />
              <Text style={[styles.chatButtonText, { color: inputText.trim() ? '#ffffff' : (isDark ? '#000000' : '#ffffff') }]}>
                {inputText.trim() ? 'Send' : 'Chat'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Attachment Modal */}
      <Modal
        visible={showAttachments}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAttachments(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowAttachments(false)}>
          <View style={styles.modalOverlay}>
            <BlurView intensity={60} tint="dark" style={styles.attachmentMenu}>
              <Pressable
                style={styles.attachmentOption}
                onPress={handleCapture}
              >
                <View style={styles.attachmentIconBadge}>
                  <Ionicons name="camera-outline" size={24} color="#ffffff" />
                </View>
                <Text style={styles.attachmentLabel}>Camera</Text>
              </Pressable>
              <Pressable
                style={styles.attachmentOption}
                onPress={async () => {
                  setShowAttachments(false);
                  const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images'],
                    quality: 0.8,
                  });
                  if (!result.canceled) {
                    handleSend('[Shared a photo]');
                  }
                }}
              >
                <View style={styles.attachmentIconBadge}>
                  <Ionicons name="images-outline" size={24} color="#ffffff" />
                </View>
                <Text style={styles.attachmentLabel}>Photos</Text>
              </Pressable>
              <Pressable
                style={styles.attachmentOption}
                onPress={() => setShowAttachments(false)}
              >
                <View style={styles.attachmentIconBadge}>
                  <Ionicons name="document-outline" size={24} color="#ffffff" />
                </View>
                <Text style={styles.attachmentLabel}>Files</Text>
              </Pressable>
            </BlurView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Avatar Selector Modal */}
      <AvatarSelector
        visible={showAvatarSelector}
        currentAvatar={selectedLive2DModel}
        onSelect={(avatar) => {
          setSelectedLive2DModel(avatar);
          setShowAvatarSelector(false);
          setAvatarState('happy'); // Show happy expression on avatar change
          setTimeout(() => setAvatarState('idle'), 2000);
        }}
        onClose={() => setShowAvatarSelector(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  // Background animated blobs
  backgroundBlob1: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    borderRadius: SCREEN_WIDTH * 0.4,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    top: SCREEN_HEIGHT * 0.15,
    left: -SCREEN_WIDTH * 0.2,
    transform: [{ scale: 1.2 }],
  },
  backgroundBlob2: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_WIDTH * 0.6,
    borderRadius: SCREEN_WIDTH * 0.3,
    backgroundColor: 'rgba(236, 72, 153, 0.2)',
    top: SCREEN_HEIGHT * 0.4,
    right: -SCREEN_WIDTH * 0.15,
  },
  // Center area
  centerArea: {
    flex: 1,
    justifyContent: 'center',
  },
  avatarContainer: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.6,
    top: '10%',
    left: 0,
    right: 0,
  },
  avatar: {
    flex: 1,
  },
  startTalkingContainer: {
    position: 'absolute',
    bottom: SCREEN_HEIGHT * 0.15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startTalkingButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    borderWidth: 1,
  },
  startTalkingText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  // Voice wave animation
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    gap: 4,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
    minHeight: 12,
  },
  // Floating action menu
  floatingMenuContainer: {
    position: 'absolute',
    right: 16,
    top: SCREEN_HEIGHT * 0.15,
  },
  floatingMenuExpanded: {
    gap: 12,
  },
  floatingActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
  },
  floatingActionLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
  floatingActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  actionBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  menuToggleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Bottom section
  bottomSection: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  suggestionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  suggestionChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 28,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderWidth: 1,
  },
  inputIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputIconButtonActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
  },
  textInputContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
  textInput: {
    fontSize: 16,
    paddingVertical: 8,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  chatButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  chatButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Messages
  messagesList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  aiRow: {
    justifyContent: 'flex-start',
  },
  userBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomRightRadius: 6,
  },
  aiBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
  },
  messageText: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 22,
  },
  // Attachment modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentMenu: {
    width: 240,
    borderRadius: 20,
    overflow: 'hidden',
    paddingVertical: 16,
  },
  attachmentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 16,
  },
  attachmentIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
});
