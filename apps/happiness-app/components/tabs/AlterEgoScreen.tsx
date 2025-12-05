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
  ScrollView,
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
import { AVATAR_PRESETS, AvatarPreset, SUGGESTION_CHIPS } from '@/constants/Avatars';
import { useUserStore } from '@/stores/userStore';
import { useTheme } from '@/contexts/ThemeContext';
import { useVoiceContext } from '@/contexts/VoiceContext';
import haptics from '@/lib/haptics';
import * as Speech from 'expo-speech';
import AvatarController, { AvatarState } from '../live2d/AvatarController';
import { useElevenLabs } from '@/lib/voice/elevenLabsService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

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

function AvatarCard({
  avatar,
  customName,
  isSelected,
  onSelect,
  onChat,
  onVoice,
  onRename,
}: {
  avatar: AvatarPreset;
  customName?: string;
  isSelected: boolean;
  onSelect: () => void;
  onChat: () => void;
  onVoice: () => void;
  onRename: () => void;
}) {
  const { colors, isDark } = useTheme();
  const displayName = customName || avatar.name;
  const glassBg = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(45, 42, 38, 0.06)';
  const glassBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(45, 42, 38, 0.1)';
  const textColor = isDark ? '#ffffff' : colors.text;
  const subtleColor = isDark ? 'rgba(255, 255, 255, 0.7)' : colors.textSecondary;

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.cardWrapper}>
      <Pressable onPress={onSelect}>
        <BlurView
          intensity={isDark ? 40 : 20}
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.avatarCard,
            {
              borderColor: isSelected ? avatar.colors.primary : glassBorder,
              borderWidth: isSelected ? 2 : 1,
            },
          ]}
        >
          <View style={[styles.cardInner, { backgroundColor: glassBg }]}>
            <View style={styles.avatarImageContainer}>
              <Image
                source={{ uri: avatar.avatarImage }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                style={styles.avatarGradient}
              />
              {isSelected && (
                <View style={[styles.selectedBadge, { backgroundColor: avatar.colors.primary }]}>
                  <Ionicons name="checkmark" size={14} color="#fff" />
                </View>
              )}
            </View>
            <View style={styles.cardContent}>
              <Pressable onPress={onRename} style={styles.nameRow}>
                <Text style={[styles.avatarName, { color: textColor }]} numberOfLines={1}>
                  {displayName}
                </Text>
                <Ionicons name="pencil" size={12} color={subtleColor} />
              </Pressable>
              <Text style={[styles.avatarPersonality, { color: avatar.colors.primary }]}>
                {avatar.personality}
              </Text>
              <Text style={[styles.avatarDescription, { color: subtleColor }]} numberOfLines={2}>
                {avatar.description}
              </Text>
              <View style={styles.actionButtons}>
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: avatar.colors.primary }]}
                  onPress={onChat}
                >
                  <Ionicons name="chatbubble" size={14} color="#fff" />
                  <Text style={styles.actionBtnText}>Chat</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: glassBg, borderWidth: 1, borderColor: glassBorder }]}
                  onPress={onVoice}
                >
                  <Ionicons name="mic" size={14} color={textColor} />
                  <Text style={[styles.actionBtnText, { color: textColor }]}>Voice</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </BlurView>
      </Pressable>
    </Animated.View>
  );
}

function RenameModal({
  visible,
  avatarName,
  currentName,
  onSave,
  onClose,
}: {
  visible: boolean;
  avatarName: string;
  currentName: string;
  onSave: (name: string) => void;
  onClose: () => void;
}) {
  const { colors, isDark } = useTheme();
  const [name, setName] = useState(currentName);

  useEffect(() => {
    setName(currentName);
  }, [currentName, visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={styles.renameModal}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Rename Your Avatar
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Give {avatarName} a custom name
              </Text>
              <TextInput
                style={[
                  styles.renameInput,
                  {
                    color: colors.text,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                  },
                ]}
                value={name}
                onChangeText={setName}
                placeholder={avatarName}
                placeholderTextColor={colors.textMuted}
                autoFocus
              />
              <View style={styles.modalButtons}>
                <Pressable style={styles.modalCancelBtn} onPress={onClose}>
                  <Text style={[styles.modalBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalSaveBtn, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    onSave(name.trim() || avatarName);
                    onClose();
                  }}
                >
                  <Text style={[styles.modalBtnText, { color: '#fff' }]}>Save</Text>
                </Pressable>
              </View>
            </BlurView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

export function AlterEgoScreen() {
  const { colors, isDark } = useTheme();
  const {
    hapticEnabled,
    avatarCustomNames,
    selectedAvatarId,
    setAvatarCustomName,
    setSelectedAvatar,
  } = useUserStore();
  const {
    isListening,
    startRecording,
    stopRecording,
  } = useVoiceContext();
  const {
    isSpeaking: isElevenLabsSpeaking,
    speak: speakWithElevenLabs,
    stop: stopElevenLabs,
  } = useElevenLabs();

  const [mode, setMode] = useState<'grid' | 'chat'>('grid');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [inputText, setInputText] = useState('');
  const [avatarState, setAvatarState] = useState<AvatarState>('idle');
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [avatarToRename, setAvatarToRename] = useState<AvatarPreset | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  const selectedAvatar = AVATAR_PRESETS.find((a) => a.id === selectedAvatarId) || AVATAR_PRESETS[0];
  const orbPulse = useSharedValue(1);
  const orbGlow = useSharedValue(0.5);

  useEffect(() => {
    if (mode === 'chat') {
      setMessages([
        {
          _id: `greeting-${selectedAvatar.id}`,
          text: selectedAvatar.greeting,
          createdAt: new Date(),
          user: { _id: 2, name: avatarCustomNames[selectedAvatar.id] || selectedAvatar.name },
        },
      ]);
    }
  }, [mode, selectedAvatar.id]);

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
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      if (hapticEnabled) haptics.light();
      if (isElevenLabsSpeaking) await stopElevenLabs();

      const userMsg: ChatMessage = {
        _id: `user_${Date.now()}`,
        text: text.trim(),
        createdAt: new Date(),
        user: { _id: 1, name: 'You' },
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputText('');
      scrollToBottom();
      setIsThinking(true);
      setAvatarState('thinking');

      try {
        const response = await sendMessageToAI(text, {
          systemPrompt: selectedAvatar.systemPrompt,
        });
        if (hapticEnabled) haptics.success();

        const avatarResponse: ChatMessage = {
          ...response,
          user: { _id: 2, name: avatarCustomNames[selectedAvatar.id] || selectedAvatar.name },
        };

        setMessages((prev) => [...prev, avatarResponse]);
        scrollToBottom();

        if (!isMuted && avatarResponse.text) {
          setAvatarState('speaking');
          const success = await speakWithElevenLabs(avatarResponse.text, {
            onComplete: () => setAvatarState('idle'),
            onError: () => {
              Speech.speak(avatarResponse.text!, { rate: 0.9, pitch: 1.0 });
              setAvatarState('idle');
            },
          });
          if (!success) {
            Speech.speak(avatarResponse.text, { rate: 0.9, pitch: 1.0 });
            setAvatarState('idle');
          }
        } else {
          setAvatarState('idle');
        }
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          {
            _id: `error_${Date.now()}`,
            text: "I felt that pause. Take your time, I'm here.",
            createdAt: new Date(),
            user: { _id: 2, name: avatarCustomNames[selectedAvatar.id] || selectedAvatar.name },
          },
        ]);
        if (hapticEnabled) haptics.warning();
        setAvatarState('sad');
        setTimeout(() => setAvatarState('idle'), 2000);
      } finally {
        setIsThinking(false);
      }
    },
    [selectedAvatar, hapticEnabled, isMuted, isElevenLabsSpeaking, stopElevenLabs, speakWithElevenLabs, avatarCustomNames]
  );

  const handleVoicePress = async () => {
    if (hapticEnabled) haptics.selection();
    Speech.stop();

    if (isListening) {
      setAvatarState('thinking');
      try {
        const text = await stopRecording();
        if (text?.trim()) handleSend(text);
        else setAvatarState('idle');
      } catch {
        if (hapticEnabled) haptics.error();
        setAvatarState('sad');
        setTimeout(() => setAvatarState('idle'), 1500);
      }
    } else {
      setAvatarState('listening');
      const started = await startRecording();
      if (!started) {
        if (hapticEnabled) haptics.error();
        setAvatarState('surprised');
        setTimeout(() => setAvatarState('idle'), 1500);
      }
    }
  };

  const handleSelectAvatar = (avatar: AvatarPreset) => {
    if (hapticEnabled) haptics.selection();
    setSelectedAvatar(avatar.id);
  };

  const handleStartChat = (avatar: AvatarPreset) => {
    if (hapticEnabled) haptics.medium();
    setSelectedAvatar(avatar.id);
    setMode('chat');
  };

  const handleStartVoice = (avatar: AvatarPreset) => {
    if (hapticEnabled) haptics.medium();
    setSelectedAvatar(avatar.id);
    setMode('chat');
    setTimeout(() => handleVoicePress(), 500);
  };

  const handleRename = (avatar: AvatarPreset) => {
    if (hapticEnabled) haptics.selection();
    setAvatarToRename(avatar);
    setRenameModalVisible(true);
  };

  const handleSaveRename = (newName: string) => {
    if (avatarToRename) {
      setAvatarCustomName(avatarToRename.id, newName);
    }
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
          <Text style={[styles.messageText, { color: isDark ? '#ffffff' : colors.text }]}>
            {item.text}
          </Text>
        </View>
      </Animated.View>
    );
  };

  const gradientColors = isDark
    ? ['#2D1F4A', '#4A3070', '#6B3D8A', '#3D2060', '#1A0F30'] as const
    : [colors.gradients.chat.start, colors.gradients.chat.mid, colors.gradients.chat.end, colors.gradients.chat.mid, colors.gradients.chat.start] as const;

  const textColor = isDark ? '#ffffff' : colors.text;
  const subtleTextColor = isDark ? 'rgba(255, 255, 255, 0.7)' : colors.textMuted;
  const glassBg = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(45, 42, 38, 0.05)';
  const glassBorder = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(45, 42, 38, 0.1)';

  if (mode === 'grid') {
    return (
      <View style={styles.container}>
        <LinearGradient colors={gradientColors} locations={[0, 0.25, 0.5, 0.75, 1]} style={StyleSheet.absoluteFill} />
        {isDark && (
          <>
            <Animated.View style={[styles.backgroundBlob1, orbAnimatedStyle]} />
            <Animated.View style={[styles.backgroundBlob2, orbAnimatedStyle]} />
          </>
        )}
        <View style={styles.gridContent}>
          <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
            <Text style={[styles.headerTitle, { color: textColor }]}>Companions</Text>
            <Text style={[styles.headerSubtitle, { color: subtleTextColor }]}>
              Choose an avatar to start talking
            </Text>
          </Animated.View>
          <ScrollView
            contentContainerStyle={styles.gridContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.grid}>
              {AVATAR_PRESETS.map((avatar) => (
                <AvatarCard
                  key={avatar.id}
                  avatar={avatar}
                  customName={avatarCustomNames[avatar.id]}
                  isSelected={avatar.id === selectedAvatarId}
                  onSelect={() => handleSelectAvatar(avatar)}
                  onChat={() => handleStartChat(avatar)}
                  onVoice={() => handleStartVoice(avatar)}
                  onRename={() => handleRename(avatar)}
                />
              ))}
            </View>
          </ScrollView>
        </View>
        <RenameModal
          visible={renameModalVisible}
          avatarName={avatarToRename?.name || ''}
          currentName={avatarToRename ? (avatarCustomNames[avatarToRename.id] || avatarToRename.name) : ''}
          onSave={handleSaveRename}
          onClose={() => setRenameModalVisible(false)}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradientColors} locations={[0, 0.25, 0.5, 0.75, 1]} style={StyleSheet.absoluteFill} />
      {isDark && (
        <>
          <Animated.View style={[styles.backgroundBlob1, orbAnimatedStyle]} />
          <Animated.View style={[styles.backgroundBlob2, orbAnimatedStyle]} />
        </>
      )}
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Pressable
            style={[styles.backButton, { backgroundColor: glassBg }]}
            onPress={() => {
              if (hapticEnabled) haptics.selection();
              setMode('grid');
            }}
          >
            <Ionicons name="chevron-back" size={22} color={textColor} />
          </Pressable>
          <View style={styles.chatHeaderInfo}>
            <Text style={[styles.chatHeaderName, { color: textColor }]}>
              {avatarCustomNames[selectedAvatar.id] || selectedAvatar.name}
            </Text>
            <Text style={[styles.chatHeaderStatus, { color: selectedAvatar.colors.primary }]}>
              {avatarState === 'speaking' ? 'Speaking...' : avatarState === 'listening' ? 'Listening...' : 'Online'}
            </Text>
          </View>
          <Pressable
            style={[styles.muteButton, { backgroundColor: glassBg }]}
            onPress={() => setIsMuted(!isMuted)}
          >
            <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={20} color={textColor} />
          </Pressable>
        </View>
        <View style={styles.avatarWrapper}>
          <AvatarController
            model={selectedAvatar.live2dModel}
            state={avatarState}
            isSpeaking={isElevenLabsSpeaking}
            onReady={() => {}}
            onError={() => {}}
            style={styles.avatar}
          />
        </View>
        {messages.length > 1 && (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item._id.toString()}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToBottom}
            style={styles.messagesContainer}
          />
        )}
        <View style={styles.bottomSection}>
          {messages.length <= 1 && (
            <Animated.View entering={SlideInUp.delay(300).duration(400)} style={styles.suggestionsRow}>
              {SUGGESTION_CHIPS.map((chip) => (
                <Pressable
                  key={chip.id}
                  style={[styles.suggestionChip, { backgroundColor: glassBg, borderColor: glassBorder }]}
                  onPress={() => handleSend(chip.text)}
                >
                  <Text style={[styles.suggestionText, { color: subtleTextColor }]}>{chip.text}</Text>
                </Pressable>
              ))}
            </Animated.View>
          )}
          <View style={[styles.inputBar, { backgroundColor: glassBg, borderColor: glassBorder }]}>
            <Pressable
              style={[styles.inputIconButton, { backgroundColor: glassBg }, isListening && styles.inputIconButtonActive]}
              onPress={handleVoicePress}
            >
              <Ionicons name={isListening ? 'mic' : 'mic-outline'} size={22} color={isListening ? colors.primary : subtleTextColor} />
            </Pressable>
            <View style={styles.textInputContainer}>
              <TextInput
                ref={inputRef}
                style={[styles.textInput, { color: textColor }]}
                placeholder="Ask Anything"
                placeholderTextColor={subtleTextColor}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={() => handleSend(inputText)}
                returnKeyType="send"
              />
            </View>
            <Pressable
              style={[
                styles.chatButton,
                { backgroundColor: inputText.trim() ? selectedAvatar.colors.primary : (isDark ? '#ffffff' : colors.primary) },
              ]}
              onPress={() => inputText.trim() ? handleSend(inputText) : inputRef.current?.focus()}
            >
              <Ionicons
                name={inputText.trim() ? 'send' : 'chatbubble-outline'}
                size={18}
                color={inputText.trim() ? '#ffffff' : (isDark ? '#000000' : '#ffffff')}
              />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gridContent: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
  },
  gridContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginBottom: 16,
  },
  avatarCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardInner: {
    borderRadius: 20,
  },
  avatarImageContainer: {
    width: '100%',
    height: 140,
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  avatarName: {
    fontSize: 16,
    fontWeight: '700',
  },
  avatarPersonality: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  avatarDescription: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 12,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  backgroundBlob1: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    borderRadius: SCREEN_WIDTH * 0.4,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    top: SCREEN_HEIGHT * 0.15,
    left: -SCREEN_WIDTH * 0.2,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  renameModal: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  renameInput: {
    fontSize: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  modalBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  chatContent: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  chatHeaderName: {
    fontSize: 18,
    fontWeight: '700',
  },
  chatHeaderStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  muteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarWrapper: {
    height: SCREEN_HEIGHT * 0.35,
    marginBottom: 10,
  },
  avatar: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    maxHeight: SCREEN_HEIGHT * 0.25,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  userRow: { justifyContent: 'flex-end' },
  aiRow: { justifyContent: 'flex-start' },
  userBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  bottomSection: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  suggestionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
  },
  suggestionChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: '500',
  },
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
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
});
