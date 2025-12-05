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
  withDelay,
  Easing,
  FadeIn,
  FadeInDown,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChatMessage, sendMessageToAI } from '../chat/ChatHelpers';
import { useUserStore } from '@/stores/userStore';
import { useTheme } from '@/contexts/ThemeContext';
import { useVoiceContext } from '@/contexts/VoiceContext';
import haptics from '@/lib/haptics';
import * as Speech from 'expo-speech';
import { useElevenLabs } from '@/lib/voice/elevenLabsService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

interface CompanionData {
  id: string;
  name: string;
  personality: string;
  greeting: string;
  systemPrompt: string;
  image: string;
  color: string;
  backgroundColor: string;
}

const COMPANIONS: CompanionData[] = [
  {
    id: 'mika',
    name: 'Mika',
    personality: 'Free spirit, loyal friend',
    greeting: "Hey there! I'm Mika. What's on your mind today?",
    systemPrompt: 'You are Mika, a free-spirited and loyal friend. Be casual, warm, and supportive.',
    image: 'https://api.dicebear.com/7.x/notionists/png?seed=Mika&backgroundColor=0a1628&scale=120',
    color: '#4ECDC4',
    backgroundColor: '#0a1628',
  },
  {
    id: 'ani',
    name: 'Ani',
    personality: 'Sweet vibe with a nerdy heart',
    greeting: "Hi! I'm Ani! Ready to chat about anything? Let's have fun!",
    systemPrompt: 'You are Ani, sweet and nerdy. Love anime, games, and pop culture. Be enthusiastic and cute.',
    image: 'https://api.dicebear.com/7.x/notionists/png?seed=Ani&backgroundColor=2a1a2e&scale=120',
    color: '#FF6B9D',
    backgroundColor: '#2a1a2e',
  },
  {
    id: 'valentine',
    name: 'Valentine',
    personality: 'Dapper, mysterious, licensed to charm',
    greeting: 'Good evening. I am Valentine. Shall we have an interesting conversation?',
    systemPrompt: 'You are Valentine, sophisticated and mysterious. Be elegant, charming, with subtle wit.',
    image: 'https://api.dicebear.com/7.x/notionists/png?seed=Valentine&backgroundColor=1a1a2e&scale=120',
    color: '#8B5CF6',
    backgroundColor: '#1a1a2e',
  },
  {
    id: 'rudi',
    name: 'Good Rudi',
    personality: "Adventurous kids' storyteller",
    greeting: "Hi friend! I'm Rudi! Ready for an adventure?",
    systemPrompt: 'You are Good Rudi, friendly and adventurous. Tell stories, be encouraging, kid-friendly.',
    image: 'https://api.dicebear.com/7.x/notionists/png?seed=Rudi&backgroundColor=2a2a1a&scale=120',
    color: '#FF8C42',
    backgroundColor: '#2a2a1a',
  },
];

function AnimatedCharacter({ companion, isSpeaking }: { companion: CompanionData; isSpeaking: boolean }) {
  const breathe = useSharedValue(1);
  const float = useSharedValue(0);
  const glow = useSharedValue(0.3);
  const eyeBlink = useSharedValue(1);

  useEffect(() => {
    breathe.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    float.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    const blinkInterval = setInterval(() => {
      eyeBlink.value = withSequence(
        withTiming(0.1, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
    }, 3500 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  useEffect(() => {
    if (isSpeaking) {
      glow.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 300 }),
          withTiming(0.4, { duration: 300 })
        ),
        -1,
        true
      );
    } else {
      glow.value = withTiming(0.3, { duration: 500 });
    }
  }, [isSpeaking]);

  const characterStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: breathe.value },
      { translateY: float.value },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  return (
    <View style={styles.characterWrapper}>
      <Animated.View style={[styles.characterGlow, glowStyle, { backgroundColor: companion.color }]} />
      <Animated.View style={[styles.characterContainer, characterStyle]}>
        <Image
          source={{ uri: companion.image }}
          style={styles.characterImage}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

function CompanionCard({ companion, onPress }: { companion: CompanionData; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.cardWrapper}>
      <View style={[styles.card, { backgroundColor: companion.backgroundColor }]}>
        <Image
          source={{ uri: companion.image }}
          style={styles.cardImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.9)']}
          style={styles.cardOverlay}
        />
        <View style={styles.cardContent}>
          <Text style={styles.cardName}>{companion.name}</Text>
          <Text style={styles.cardPersonality}>{companion.personality}</Text>
          <View style={styles.cardButtons}>
            <Pressable style={styles.cardChatBtn}>
              <Ionicons name="chatbubble" size={16} color="#fff" />
            </Pressable>
            <Pressable style={styles.cardVoiceBtn}>
              <Ionicons name="pulse" size={16} color="#000" />
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function ChatScreen({ companion, onBack }: { companion: CompanionData; onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { _id: 'greeting', text: companion.greeting, createdAt: new Date(), user: { _id: 2, name: companion.name } }
  ]);
  const [inputText, setInputText] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const { isRecording, startRecording, stopRecording } = useVoiceContext();
  const { isPlaying: isSpeaking, speakWithElevenLabs } = useElevenLabs();

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const handleSend = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      _id: `user_${Date.now()}`,
      text: text.trim(),
      createdAt: new Date(),
      user: { _id: 1, name: 'You' },
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await sendMessageToAI(text, messages, companion.systemPrompt, companion.name);
      const aiMsg: ChatMessage = {
        _id: `ai_${Date.now()}`,
        text: response.text || "I'm here for you.",
        createdAt: new Date(),
        user: { _id: 2, name: companion.name },
      };
      setMessages(prev => [...prev, aiMsg]);

      if (response.text) {
        speakWithElevenLabs(response.text, {
          voiceId: 'EXAVITQu4vr4xnSDxMaL',
          onComplete: () => {},
          onError: () => Speech.speak(response.text!, { rate: 0.9 }),
        });
      }
    } catch {
      setMessages(prev => [...prev, {
        _id: `err_${Date.now()}`,
        text: "I'm here whenever you're ready.",
        createdAt: new Date(),
        user: { _id: 2, name: companion.name },
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, companion, isLoading, speakWithElevenLabs]);

  const handleVoice = async () => {
    haptics.selection();
    if (isRecording) {
      const text = await stopRecording();
      if (text?.trim()) handleSend(text);
    } else {
      await startRecording();
    }
  };

  const lastAIMessage = messages.filter(m => m.user._id === 2).slice(-1)[0];

  return (
    <View style={[styles.chatScreen, { backgroundColor: companion.backgroundColor }]}>
      <LinearGradient
        colors={[companion.backgroundColor, '#000']}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable style={styles.headerBtn} onPress={onBack}>
          <Ionicons name="menu" size={24} color="#fff" />
        </Pressable>
        <View style={styles.headerTabs}>
          <Text style={styles.tabInactive}>Ask</Text>
          <Text style={styles.tabInactive}>Imagine</Text>
          <View style={styles.tabActiveWrap}>
            <Text style={styles.tabActive}>{companion.name}</Text>
            <View style={styles.tabUnderline} />
          </View>
        </View>
        <Pressable style={styles.headerBtn} onPress={onBack}>
          <Ionicons name="grid" size={22} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.sideButtons}>
        <Pressable style={[styles.sideBtn, styles.sideBtnFire]}>
          <Ionicons name="flame" size={20} color="#fff" />
          <View style={styles.fireBadge}><Text style={styles.fireBadgeText}>1</Text></View>
        </Pressable>
        <Pressable style={styles.sideBtn}>
          <Ionicons name="happy-outline" size={20} color="#fff" />
        </Pressable>
        <Pressable style={styles.sideBtn}>
          <Ionicons name="shirt-outline" size={20} color="#fff" />
        </Pressable>
        <Pressable style={styles.sideBtn}>
          <Ionicons name="trash-outline" size={20} color="#fff" />
        </Pressable>
        <Pressable style={styles.sideBtn}>
          <Ionicons name="chevron-down" size={20} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.characterArea}>
        <AnimatedCharacter companion={companion} isSpeaking={isSpeaking} />
      </View>

      {lastAIMessage && (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.speechBubble}>
          <BlurView intensity={40} tint="dark" style={styles.speechBubbleBlur}>
            <LinearGradient
              colors={['rgba(255,77,106,0.9)', 'rgba(196,30,58,0.9)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.speechBubbleGradient}
            >
              <Text style={styles.speechText} numberOfLines={4}>{lastAIMessage.text}</Text>
            </LinearGradient>
          </BlurView>
        </Animated.View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.inputWrapper}
        keyboardVerticalOffset={0}
      >
        <View style={[
          styles.inputRow,
          { marginBottom: keyboardHeight > 0 ? 8 : insets.bottom + 8 }
        ]}>
          <BlurView intensity={60} tint="dark" style={styles.inputBlur}>
            <LinearGradient
              colors={['rgba(255,107,157,0.15)', 'rgba(139,92,246,0.15)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.inputGradient}
            >
              <Pressable style={styles.inputIconBtn}>
                <Ionicons name="attach" size={22} color="rgba(255,255,255,0.7)" />
              </Pressable>
              <TextInput
                ref={inputRef}
                style={styles.textInput}
                placeholder={`Chat with ${companion.name}`}
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={() => handleSend(inputText)}
                returnKeyType="send"
              />
              <Pressable
                style={styles.callBtn}
                onPress={() => inputText.trim() ? handleSend(inputText) : handleVoice()}
              >
                <Ionicons name={inputText.trim() ? 'send' : 'pulse'} size={18} color="#000" />
                <Text style={styles.callBtnText}>{inputText.trim() ? 'Send' : 'Call'}</Text>
              </Pressable>
            </LinearGradient>
          </BlurView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

export default function AlterEgoScreen() {
  const [selectedCompanion, setSelectedCompanion] = useState<CompanionData | null>(null);
  const insets = useSafeAreaInsets();
  const { hapticEnabled } = useUserStore();

  if (selectedCompanion) {
    return (
      <ChatScreen
        companion={selectedCompanion}
        onBack={() => setSelectedCompanion(null)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a0a0a', '#1a1a2e', '#0a0a0a']} style={StyleSheet.absoluteFill} />
      
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable style={styles.headerBtn}>
          <Ionicons name="menu" size={24} color="#fff" />
        </Pressable>
        <View style={styles.headerTabs}>
          <Text style={styles.tabInactive}>Ask</Text>
          <Text style={styles.tabInactive}>Imagine</Text>
          <View style={styles.tabActiveWrap}>
            <Text style={styles.tabActive}>Companions</Text>
            <View style={styles.tabUnderline} />
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {COMPANIONS.map(c => (
          <CompanionCard
            key={c.id}
            companion={c}
            onPress={() => {
              if (hapticEnabled) haptics.medium();
              setSelectedCompanion(c);
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerBtn: {
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
    gap: 20,
  },
  tabInactive: { fontSize: 16, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  tabActiveWrap: { alignItems: 'center' },
  tabActive: { fontSize: 16, color: '#fff', fontWeight: '600' },
  tabUnderline: { width: 20, height: 2, backgroundColor: '#fff', marginTop: 4, borderRadius: 1 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  cardWrapper: { width: CARD_WIDTH, marginBottom: 16 },
  card: {
    height: 260,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 160,
  },
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  cardName: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 2 },
  cardPersonality: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 10 },
  cardButtons: { flexDirection: 'row', gap: 8 },
  cardChatBtn: {
    flex: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardVoiceBtn: {
    flex: 1,
    height: 36,
    backgroundColor: '#fff',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatScreen: { flex: 1 },
  sideButtons: {
    position: 'absolute',
    right: 12,
    top: '28%',
    gap: 10,
    zIndex: 10,
  },
  sideBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideBtnFire: { backgroundColor: '#FF6B35' },
  fireBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fireBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  characterArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  characterWrapper: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_HEIGHT * 0.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  characterGlow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.3,
  },
  characterContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  characterImage: {
    width: '100%',
    height: '100%',
  },
  speechBubble: {
    position: 'absolute',
    bottom: 140,
    left: 16,
    right: 70,
    borderRadius: 20,
    overflow: 'hidden',
  },
  speechBubbleBlur: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  speechBubbleGradient: {
    padding: 14,
    borderRadius: 20,
  },
  speechText: { color: '#fff', fontSize: 15, lineHeight: 21 },
  inputWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  inputRow: {
    marginHorizontal: 12,
  },
  inputBlur: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  inputGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  inputIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingHorizontal: 8,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 22,
  },
  callBtnText: { color: '#000', fontSize: 15, fontWeight: '600' },
});
