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
  Easing,
  FadeInDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';

import { ChatMessage, sendMessageToAI } from '../chat/ChatHelpers';
import { useUserStore } from '@/stores/userStore';
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
  description: string;
  greeting: string;
  systemPrompt: string;
  color: string;
  backgroundColor: string;
  animation: any;
}

const COMPANIONS: CompanionData[] = [
  {
    id: 'mika',
    name: 'Mika',
    personality: 'Free spirit, loyal friend',
    description: 'A calm guide focused on personal growth',
    greeting: "Hey there! I'm Mika. What's on your mind today?",
    systemPrompt: 'You are Mika, a free-spirited and loyal friend. Be casual, warm, and supportive.',
    color: '#4ECDC4',
    backgroundColor: '#0a1628',
    animation: require('@/assets/companions/mika.json'),
  },
  {
    id: 'ani',
    name: 'Ani',
    personality: 'Sweet vibe with a nerdy heart',
    description: 'Loves anime, games, and pop culture',
    greeting: "Hi! I'm Ani! Ready to chat about anything? Let's have fun!",
    systemPrompt: 'You are Ani, sweet and nerdy. Love anime, games, and pop culture. Be enthusiastic and cute.',
    color: '#FF6B9D',
    backgroundColor: '#2a1a2e',
    animation: require('@/assets/companions/ani.json'),
  },
  {
    id: 'valentine',
    name: 'Valentine',
    personality: 'Dapper, mysterious, charming',
    description: 'Sophisticated with refined tastes',
    greeting: 'Good evening. I am Valentine. Shall we have an interesting conversation?',
    systemPrompt: 'You are Valentine, sophisticated and mysterious. Be elegant, charming, with subtle wit.',
    color: '#8B5CF6',
    backgroundColor: '#1a1a2e',
    animation: require('@/assets/companions/valentine.json'),
  },
  {
    id: 'sakura',
    name: 'Sakura',
    personality: 'Warm & nurturing',
    description: 'A caring friend who offers comfort',
    greeting: "Hello! I'm Sakura. I'm here for you, whatever you need.",
    systemPrompt: 'You are Sakura, warm and nurturing. Be emotionally supportive, gentle, and caring.',
    color: '#F472B6',
    backgroundColor: '#2a1a28',
    animation: require('@/assets/companions/sakura.json'),
  },
  {
    id: 'kai',
    name: 'Kai',
    personality: 'Playful rebel with a golden heart',
    description: 'Adventurous spirit who pushes your limits',
    greeting: "Yo! I'm Kai. Ready to shake things up? Let's go!",
    systemPrompt: 'You are Kai, playful and rebellious but with a heart of gold. Be energetic, spontaneous, and encouraging.',
    color: '#EF4444',
    backgroundColor: '#1a0a0a',
    animation: require('@/assets/companions/kai.json'),
  },
];

function AnimatedCharacter({ 
  companion, 
  isSpeaking,
}: { 
  companion: CompanionData; 
  isSpeaking: boolean;
}) {
  const lottieRef = useRef<LottieView>(null);
  const glowOpacity = useSharedValue(0.3);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (isSpeaking) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.9, { duration: 200 }),
          withTiming(0.4, { duration: 200 })
        ),
        -1,
        true
      );
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 150 }),
          withTiming(1, { duration: 150 })
        ),
        -1,
        true
      );
    } else {
      glowOpacity.value = withTiming(0.3, { duration: 500 });
      pulseScale.value = withTiming(1, { duration: 300 });
    }
  }, [isSpeaking]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: 1 + (glowOpacity.value * 0.2) }],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <View style={styles.characterWrapper}>
      <Animated.View style={[styles.characterGlow, glowStyle, { backgroundColor: companion.color }]} />
      <Animated.View style={[styles.lottieContainer, containerStyle]}>
        <LottieView
          ref={lottieRef}
          source={companion.animation}
          autoPlay
          loop
          speed={isSpeaking ? 1.5 : 1}
          style={styles.lottieAnimation}
        />
      </Animated.View>
    </View>
  );
}

function CompanionCard({ 
  companion, 
  onPress 
}: { 
  companion: CompanionData; 
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const cardFloat = useSharedValue(0);

  useEffect(() => {
    cardFloat.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 2000 + Math.random() * 1000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2000 + Math.random() * 1000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: cardFloat.value },
    ],
  }));

  return (
    <Pressable 
      onPress={onPress} 
      onPressIn={() => { scale.value = withSpring(0.95); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      style={styles.cardWrapper}
    >
      <Animated.View style={[styles.card, { backgroundColor: companion.backgroundColor }, cardStyle]}>
        <View style={styles.cardLottieWrapper}>
          <LottieView
            source={companion.animation}
            autoPlay
            loop
            style={styles.cardLottie}
          />
        </View>
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.95)']} style={styles.cardOverlay} />
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
      </Animated.View>
    </Pressable>
  );
}

function ChatScreen({ 
  companion, 
  onBack,
}: { 
  companion: CompanionData; 
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { _id: 'greeting', text: companion.greeting, createdAt: new Date(), user: { _id: 2, name: companion.name } }
  ]);
  const [inputText, setInputText] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const { isListening: isRecording, startRecording, stopRecording } = useVoiceContext();
  const { isSpeaking, speak: speakWithElevenLabs } = useElevenLabs();

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e) => setKeyboardHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const handleSend = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: ChatMessage = {
      _id: `user_${Date.now()}`, text: text.trim(), createdAt: new Date(), user: { _id: 1, name: 'You' },
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await sendMessageToAI(text, { systemPrompt: companion.systemPrompt });
      const aiMsg: ChatMessage = {
        _id: `ai_${Date.now()}`, text: response.text || "I'm here for you.", createdAt: new Date(), user: { _id: 2, name: companion.name },
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
        _id: `err_${Date.now()}`, text: "I'm here whenever you're ready.", createdAt: new Date(), user: { _id: 2, name: companion.name },
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
      <LinearGradient colors={[companion.backgroundColor, '#000']} style={StyleSheet.absoluteFill} />

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
        <Pressable style={styles.sideBtn}><Ionicons name="happy-outline" size={20} color="#fff" /></Pressable>
        <Pressable style={styles.sideBtn}><Ionicons name="shirt-outline" size={20} color="#fff" /></Pressable>
        <Pressable style={styles.sideBtn}><Ionicons name="trash-outline" size={20} color="#fff" /></Pressable>
        <Pressable style={styles.sideBtn}><Ionicons name="chevron-down" size={20} color="#fff" /></Pressable>
      </View>

      <View style={styles.characterArea}>
        <AnimatedCharacter 
          companion={companion} 
          isSpeaking={isSpeaking} 
        />
      </View>

      {lastAIMessage && (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.speechBubble}>
          <BlurView intensity={40} tint="dark" style={styles.speechBubbleBlur}>
            <LinearGradient
              colors={['rgba(255,77,106,0.95)', 'rgba(180,30,60,0.95)']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.speechBubbleGradient}
            >
              <Text style={styles.speechText} numberOfLines={4}>{lastAIMessage.text}</Text>
            </LinearGradient>
          </BlurView>
        </Animated.View>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.inputWrapper} keyboardVerticalOffset={0}>
        <View style={[styles.inputRow, { marginBottom: keyboardHeight > 0 ? 8 : insets.bottom + 8 }]}>
          <BlurView intensity={60} tint="dark" style={styles.inputBlur}>
            <LinearGradient
              colors={['rgba(255,107,157,0.25)', 'rgba(139,92,246,0.25)']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.inputGradient}
            >
              <Pressable style={styles.inputIconBtn}>
                <Ionicons name="attach" size={22} color="rgba(255,255,255,0.6)" />
              </Pressable>
              <TextInput
                ref={inputRef}
                style={styles.textInput}
                placeholder={`Chat with ${companion.name}`}
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={() => handleSend(inputText)}
                returnKeyType="send"
              />
              <Pressable style={styles.callBtn} onPress={() => inputText.trim() ? handleSend(inputText) : handleVoice()}>
                <Ionicons name={inputText.trim() ? 'arrow-up' : 'pulse'} size={18} color="#000" />
                <Text style={styles.callBtnText}>{inputText.trim() ? '' : 'Call'}</Text>
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
        <Pressable style={styles.headerBtn}><Ionicons name="menu" size={24} color="#fff" /></Pressable>
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
            onPress={() => { if (hapticEnabled) haptics.medium(); setSelectedCompanion(c); }}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12 },
  headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTabs: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20 },
  tabInactive: { fontSize: 16, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  tabActiveWrap: { alignItems: 'center' },
  tabActive: { fontSize: 16, color: '#fff', fontWeight: '600' },
  tabUnderline: { width: 20, height: 2, backgroundColor: '#fff', marginTop: 4, borderRadius: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 100 },
  cardWrapper: { width: CARD_WIDTH, marginBottom: 16 },
  card: { height: 280, borderRadius: 24, overflow: 'hidden' },
  cardLottieWrapper: { width: '100%', height: '100%', position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  cardLottie: { width: '120%', height: '120%' },
  cardOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 180 },
  cardContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14 },
  cardName: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 2 },
  cardPersonality: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 12 },
  cardButtons: { flexDirection: 'row', gap: 10 },
  cardChatBtn: { flex: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  cardVoiceBtn: { flex: 1, height: 40, backgroundColor: '#fff', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  chatScreen: { flex: 1 },
  sideButtons: { position: 'absolute', right: 12, top: '28%', gap: 10, zIndex: 10 },
  sideBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  sideBtnFire: { backgroundColor: '#FF6B35' },
  fireBadge: { position: 'absolute', top: -2, right: -2, backgroundColor: '#FF6B35', borderRadius: 9, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#000' },
  fireBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  characterArea: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 20 },
  characterWrapper: { width: SCREEN_WIDTH * 0.9, height: SCREEN_HEIGHT * 0.55, justifyContent: 'center', alignItems: 'center' },
  characterGlow: { position: 'absolute', width: 280, height: 280, borderRadius: 140 },
  lottieContainer: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  lottieAnimation: { width: '100%', height: '100%' },
  speechBubble: { position: 'absolute', bottom: 130, left: 16, right: 70, borderRadius: 20, overflow: 'hidden' },
  speechBubbleBlur: { borderRadius: 20, overflow: 'hidden' },
  speechBubbleGradient: { padding: 16, borderRadius: 20 },
  speechText: { color: '#fff', fontSize: 15, lineHeight: 22 },
  inputWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  inputRow: { marginHorizontal: 12 },
  inputBlur: { borderRadius: 28, overflow: 'hidden' },
  inputGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 6 },
  inputIconBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  textInput: { flex: 1, color: '#fff', fontSize: 16, paddingHorizontal: 8 },
  callBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 22 },
  callBtnText: { color: '#000', fontSize: 15, fontWeight: '600' },
});
