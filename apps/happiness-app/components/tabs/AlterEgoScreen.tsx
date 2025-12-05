import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Platform,
  Dimensions,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  ActivityIndicator,
  Image,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  FadeIn,
  FadeInDown,
  FadeOut,
  SlideInUp,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChatMessage, sendMessageToAI } from '../chat/ChatHelpers';
import { AVATAR_PRESETS, AvatarPreset, SUGGESTION_CHIPS } from '@/constants/Avatars';
import { useUserStore } from '@/stores/userStore';
import { useTheme } from '@/contexts/ThemeContext';
import { useVoiceContext } from '@/contexts/VoiceContext';
import haptics from '@/lib/haptics';
import * as Speech from 'expo-speech';
import { useElevenLabs } from '@/lib/voice/elevenLabsService';
import { generateImage } from '@/lib/imageGeneration';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

function CompanionCard({
  avatar,
  onChat,
  onVoice,
}: {
  avatar: AvatarPreset;
  onChat: () => void;
  onVoice: () => void;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.cardWrapper}>
      <Pressable onPress={onChat} style={styles.cardPressable}>
        <View style={styles.card}>
          <LinearGradient
            colors={[avatar.colors.background[0], avatar.colors.background[1]]}
            style={styles.cardGradient}
          />
          {!imageError ? (
            <Image
              source={{ uri: avatar.cardImage }}
              style={styles.cardImage}
              resizeMode="cover"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={[styles.cardImageFallback, { backgroundColor: avatar.colors.primary }]}>
              <Text style={styles.cardEmoji}>{avatar.emoji}</Text>
            </View>
          )}
          {!imageLoaded && !imageError && (
            <View style={styles.cardImageLoading}>
              <ActivityIndicator color={avatar.colors.primary} />
            </View>
          )}
          {avatar.isAdult && (
            <View style={styles.adultBadge}>
              <Text style={styles.adultBadgeText}>18+</Text>
            </View>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.cardOverlay}
          />
          <View style={styles.cardContent}>
            <Text style={styles.cardName}>{avatar.name}</Text>
            <Text style={styles.cardPersonality}>{avatar.personality}</Text>
            <View style={styles.cardButtons}>
              <Pressable style={styles.cardButton} onPress={onChat}>
                <Ionicons name="chatbubble-outline" size={18} color="#fff" />
              </Pressable>
              <Pressable style={styles.cardButtonVoice} onPress={onVoice}>
                <Ionicons name="pulse" size={18} color="#000" />
              </Pressable>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function ChatView({
  avatar,
  onBack,
  messages,
  onSend,
  isLoading,
  isSpeaking,
}: {
  avatar: AvatarPreset;
  onBack: () => void;
  messages: ChatMessage[];
  onSend: (text: string) => void;
  isLoading: boolean;
  isSpeaking: boolean;
}) {
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const { isRecording, startRecording, stopRecording } = useVoiceContext();

  useEffect(() => {
    generateCharacterImage();
  }, [avatar.id]);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardWillShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const generateCharacterImage = async () => {
    setIsGeneratingImage(true);
    try {
      const prompt = `Full body anime character, ${avatar.name}, ${avatar.personality}. 
High quality anime art style, detailed character design, dramatic lighting, 
dark atmospheric background with subtle glow effects matching ${avatar.colors.primary} color theme.
Professional anime illustration, VTuber style, expressive pose, looking at viewer.`;
      
      const result = await generateImage(prompt, {
        size: '1024x1792',
        quality: 'hd',
        style: 'vivid',
      });
      setGeneratedImage(result.imageUrl);
    } catch (error) {
      console.log('Image generation failed, using fallback');
      setGeneratedImage(null);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSend(inputText.trim());
    setInputText('');
    Keyboard.dismiss();
  };

  const handleVoice = async () => {
    haptics.selection();
    if (isRecording) {
      const text = await stopRecording();
      if (text?.trim()) onSend(text);
    } else {
      await startRecording();
    }
  };

  const lastAIMessage = messages.filter(m => m.user._id === 2).slice(-1)[0];

  return (
    <View style={styles.chatContainer}>
      <LinearGradient
        colors={[avatar.colors.background[0], avatar.colors.background[1], '#000']}
        style={StyleSheet.absoluteFill}
      />
      
      {isGeneratingImage ? (
        <View style={styles.characterLoading}>
          <ActivityIndicator size="large" color={avatar.colors.primary} />
          <Text style={styles.loadingText}>Summoning {avatar.name}...</Text>
        </View>
      ) : (
        <View style={styles.characterContainer}>
          {generatedImage ? (
            <Image
              source={{ uri: generatedImage }}
              style={styles.characterImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.characterFallback}>
              <LinearGradient
                colors={[avatar.colors.primary + '40', avatar.colors.secondary + '20', 'transparent']}
                style={styles.characterGlow}
              />
              <Text style={styles.characterEmoji}>{avatar.emoji}</Text>
            </View>
          )}
        </View>
      )}

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable style={styles.headerButton} onPress={onBack}>
          <Ionicons name="menu" size={24} color="#fff" />
        </Pressable>
        <View style={styles.headerTabs}>
          <Text style={styles.headerTabInactive}>Ask</Text>
          <Text style={styles.headerTabInactive}>Imagine</Text>
          <View style={styles.headerTabActiveContainer}>
            <Text style={styles.headerTabActive}>{avatar.name}</Text>
            <View style={styles.headerTabUnderline} />
          </View>
        </View>
        <Pressable style={styles.headerButton} onPress={onBack}>
          <Ionicons name="grid" size={22} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.sideActions}>
        <Pressable style={[styles.sideButton, styles.sideButtonFire]}>
          <Ionicons name="flame" size={22} color="#fff" />
          <View style={styles.fireCount}>
            <Text style={styles.fireCountText}>1</Text>
          </View>
        </Pressable>
        <Pressable style={styles.sideButton}>
          <Ionicons name="happy-outline" size={22} color="#fff" />
        </Pressable>
        <Pressable style={styles.sideButton}>
          <Ionicons name="shirt-outline" size={22} color="#fff" />
        </Pressable>
        <Pressable style={styles.sideButton}>
          <Ionicons name="trash-outline" size={22} color="#fff" />
        </Pressable>
        <Pressable style={styles.sideButton}>
          <Ionicons name="chevron-down" size={22} color="#fff" />
        </Pressable>
      </View>

      {lastAIMessage && (
        <Animated.View 
          entering={FadeInDown.duration(300)} 
          style={styles.speechBubble}
        >
          <LinearGradient
            colors={['#FF4D6A', '#C41E3A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.speechBubbleGradient}
          >
            <Text style={styles.speechBubbleText} numberOfLines={3}>
              {lastAIMessage.text}
            </Text>
          </LinearGradient>
        </Animated.View>
      )}

      {isSpeaking && (
        <View style={styles.speakingIndicator}>
          <Ionicons name="pulse" size={20} color="#fff" />
          <Text style={styles.speakingText}>Start talking...</Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputWrapper}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.inputContainer, { marginBottom: keyboardHeight > 0 ? 10 : insets.bottom + 10 }]}>
          <Pressable 
            style={[styles.inputButton, isRecording && styles.inputButtonActive]} 
            onPress={handleVoice}
          >
            <Ionicons name="mic-outline" size={22} color={isRecording ? '#fff' : 'rgba(255,255,255,0.7)'} />
          </Pressable>
          <Pressable style={styles.inputButton}>
            <Ionicons name="videocam-outline" size={22} color="rgba(255,255,255,0.7)" />
          </Pressable>
          <View style={styles.inputTextWrapper}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Ask Anything"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
          </View>
          <Pressable style={styles.textButton} onPress={handleSend}>
            <Ionicons name="chatbubble-outline" size={18} color="#000" />
            <Text style={styles.textButtonLabel}>Text</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

export default function AlterEgoScreen() {
  const { colors } = useTheme();
  const { hapticEnabled } = useUserStore();
  const [mode, setMode] = useState<'grid' | 'chat'>('grid');
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarPreset>(AVATAR_PRESETS[0]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const insets = useSafeAreaInsets();
  
  const { isPlaying: isElevenLabsSpeaking, speakWithElevenLabs, stop: stopElevenLabs } = useElevenLabs();

  const handleStartChat = (avatar: AvatarPreset) => {
    if (hapticEnabled) haptics.medium();
    setSelectedAvatar(avatar);
    setMessages([{
      _id: 'greeting',
      text: avatar.greeting,
      createdAt: new Date(),
      user: { _id: 2, name: avatar.name },
    }]);
    setMode('chat');
  };

  const handleStartVoice = (avatar: AvatarPreset) => {
    if (hapticEnabled) haptics.medium();
    handleStartChat(avatar);
  };

  const handleSend = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      _id: `user_${Date.now()}`,
      text,
      createdAt: new Date(),
      user: { _id: 1, name: 'You' },
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await sendMessageToAI(
        text,
        messages,
        selectedAvatar.systemPrompt,
        selectedAvatar.name
      );
      
      const aiMessage: ChatMessage = {
        _id: `ai_${Date.now()}`,
        text: response.text || "I'm here for you.",
        createdAt: new Date(),
        user: { _id: 2, name: selectedAvatar.name },
      };
      setMessages(prev => [...prev, aiMessage]);

      if (response.text) {
        speakWithElevenLabs(response.text, {
          voiceId: 'EXAVITQu4vr4xnSDxMaL',
          onComplete: () => {},
          onError: () => {
            Speech.speak(response.text!, { rate: 0.9, pitch: 1.0 });
          },
        });
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        _id: `error_${Date.now()}`,
        text: "I felt that pause. Take your time, I'm here.",
        createdAt: new Date(),
        user: { _id: 2, name: selectedAvatar.name },
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedAvatar, messages, speakWithElevenLabs]);

  if (mode === 'chat') {
    return (
      <ChatView
        avatar={selectedAvatar}
        onBack={() => setMode('grid')}
        messages={messages}
        onSend={handleSend}
        isLoading={isLoading}
        isSpeaking={isElevenLabsSpeaking}
      />
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0a0a', '#1a1a2e', '#0a0a0a']}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.gridHeader, { paddingTop: insets.top + 10 }]}>
        <Pressable style={styles.headerButton}>
          <Ionicons name="menu" size={24} color="#fff" />
        </Pressable>
        <View style={styles.headerTabs}>
          <Text style={styles.headerTabInactive}>Ask</Text>
          <Text style={styles.headerTabInactive}>Imagine</Text>
          <View style={styles.headerTabActiveContainer}>
            <Text style={styles.headerTabActive}>Companions</Text>
            <View style={styles.headerTabUnderline} />
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {AVATAR_PRESETS.map((avatar) => (
            <CompanionCard
              key={avatar.id}
              avatar={avatar}
              onChat={() => handleStartChat(avatar)}
              onVoice={() => handleStartVoice(avatar)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  gridHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTabs: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  headerTabInactive: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  headerTabActiveContainer: {
    alignItems: 'center',
  },
  headerTabActive: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  headerTabUnderline: {
    width: 24,
    height: 2,
    backgroundColor: '#fff',
    marginTop: 4,
    borderRadius: 1,
  },
  gridContent: {
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
  cardPressable: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  card: {
    height: 280,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  cardImageFallback: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardEmoji: {
    fontSize: 64,
  },
  cardImageLoading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  adultBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  adultBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
  },
  cardName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  cardPersonality: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
  },
  cardButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  cardButton: {
    flex: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardButtonVoice: {
    flex: 1,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  characterLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 16,
    fontSize: 16,
  },
  characterContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  characterImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.85,
  },
  characterFallback: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  characterGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  characterEmoji: {
    fontSize: 120,
  },
  sideActions: {
    position: 'absolute',
    right: 16,
    top: '30%',
    gap: 12,
  },
  sideButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideButtonFire: {
    backgroundColor: '#FF6B35',
  },
  fireCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fireCountText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  speechBubble: {
    position: 'absolute',
    bottom: 160,
    left: 20,
    right: 70,
    borderRadius: 20,
    overflow: 'hidden',
  },
  speechBubbleGradient: {
    padding: 16,
    borderRadius: 20,
  },
  speechBubbleText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
  },
  speakingIndicator: {
    position: 'absolute',
    bottom: 180,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  speakingText: {
    color: '#fff',
    fontSize: 14,
  },
  inputWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    gap: 8,
  },
  inputButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  inputTextWrapper: {
    flex: 1,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  input: {
    color: '#fff',
    fontSize: 16,
  },
  textButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 24,
  },
  textButtonLabel: {
    color: '#000',
    fontSize: 15,
    fontWeight: '600',
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
  },
});
