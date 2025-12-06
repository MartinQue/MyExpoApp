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
  withDelay,
  withSpring,
  Easing,
  FadeInDown,
  interpolate,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ChatMessage, sendMessageToAI } from '../chat/ChatHelpers';
import { useUserStore } from '@/stores/userStore';
import { useVoiceContext } from '@/contexts/VoiceContext';
import haptics from '@/lib/haptics';
import * as Speech from 'expo-speech';
import { useElevenLabs } from '@/lib/voice/elevenLabsService';
import { generateImage } from '@/lib/imageGeneration';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

interface CompanionData {
  id: string;
  name: string;
  personality: string;
  description: string;
  greeting: string;
  systemPrompt: string;
  animePrompt: string;
  color: string;
  backgroundColor: string;
}

const COMPANIONS: CompanionData[] = [
  {
    id: 'mika',
    name: 'Mika',
    personality: 'Free spirit, loyal friend',
    description: 'A calm guide focused on personal growth',
    greeting: "Hey there! I'm Mika. What's on your mind today?",
    systemPrompt: 'You are Mika, a free-spirited and loyal friend. Be casual, warm, and supportive.',
    animePrompt: 'full body anime girl character, teal cyan hair in high ponytail with loose strands, large expressive green eyes, gentle warm smile, wearing oversized pastel blue hoodie with cat ears hood, white crop top underneath, high waisted jean shorts, white sneakers, soft cel shading, standing pose with hand on hip, high quality anime art style, vibrant colors, transparent background, full body visible from head to feet',
    color: '#4ECDC4',
    backgroundColor: '#0a1628',
  },
  {
    id: 'ani',
    name: 'Ani',
    personality: 'Sweet vibe with a nerdy heart',
    description: 'Loves anime, games, and pop culture',
    greeting: "Hi! I'm Ani! Ready to chat about anything? Let's have fun!",
    systemPrompt: 'You are Ani, sweet and nerdy. Love anime, games, and pop culture. Be enthusiastic and cute.',
    animePrompt: 'full body anime girl character, long flowing golden blonde hair to waist, bright blue eyes with sparkles, wearing black fitted tank top, silver cross pendant necklace, black leather choker with silver studs, dark purple pleated mini skirt, thigh high black stockings, black boots, confident cute pose with peace sign, high quality anime art style, transparent background, full body visible from head to feet',
    color: '#FF6B9D',
    backgroundColor: '#2a1a2e',
  },
  {
    id: 'valentine',
    name: 'Valentine',
    personality: 'Dapper, mysterious, charming',
    description: 'Sophisticated with refined tastes',
    greeting: 'Good evening. I am Valentine. Shall we have an interesting conversation?',
    systemPrompt: 'You are Valentine, sophisticated and mysterious. Be elegant, charming, with subtle wit.',
    animePrompt: 'full body handsome anime man character, silver white slicked back hair with undercut, piercing purple amethyst eyes, mysterious charming smile, wearing fitted black suit jacket, dark purple dress shirt unbuttoned at collar, black dress pants, polished black shoes, one hand in pocket pose, tall lean build, high quality anime art style, transparent background, full body visible from head to feet',
    color: '#8B5CF6',
    backgroundColor: '#1a1a2e',
  },
  {
    id: 'sakura',
    name: 'Sakura',
    personality: 'Warm & nurturing',
    description: 'A caring friend who offers comfort',
    greeting: "Hello! I'm Sakura. I'm here for you, whatever you need.",
    systemPrompt: 'You are Sakura, warm and nurturing. Be emotionally supportive, gentle, and caring.',
    animePrompt: 'full body anime girl character, soft pink hair in twin low braids with cherry blossom flower accessories, warm honey brown eyes, gentle motherly smile, wearing white and pink traditional japanese inspired kimono style dress with modern twist, obi belt with floral pattern, wooden sandals, hands clasped in front pose, high quality anime art style, soft pink lighting, transparent background, full body visible from head to feet',
    color: '#F472B6',
    backgroundColor: '#2a1a28',
  },
  {
    id: 'kai',
    name: 'Kai',
    personality: 'Playful rebel with a golden heart',
    description: 'Adventurous spirit who pushes your limits',
    greeting: "Yo! I'm Kai. Ready to shake things up? Let's go!",
    systemPrompt: 'You are Kai, playful and rebellious but with a heart of gold. Be energetic, spontaneous, and encouraging. Push the user to try new things.',
    animePrompt: 'full body anime boy character, messy spiky dark blue hair with bright red streaks and highlights, sharp intense amber orange eyes, confident cocky smirk, wearing black leather biker jacket with red flame accents, white graphic tee underneath, ripped black jeans, red high top sneakers, silver chain necklace, arms crossed pose, athletic build, high quality anime art style, neon red lighting accents, transparent background, full body visible from head to feet',
    color: '#EF4444',
    backgroundColor: '#1a0a0a',
  },
];

const ANIME_CACHE_KEY = 'companion_anime_images';

function AnimatedCharacter({ 
  companion, 
  isSpeaking,
  generatedImage,
  isGenerating 
}: { 
  companion: CompanionData; 
  isSpeaking: boolean;
  generatedImage: string | null;
  isGenerating: boolean;
}) {
  const breatheScale = useSharedValue(1);
  const floatY = useSharedValue(0);
  const swayX = useSharedValue(0);
  const headTilt = useSharedValue(0);
  const glowOpacity = useSharedValue(0.3);
  const pulseScale = useSharedValue(1);
  const hairFloat = useSharedValue(0);

  useEffect(() => {
    breatheScale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 2000, easing: Easing.inOut(Easing.sine) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sine) })
      ),
      -1,
      true
    );

    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2500, easing: Easing.inOut(Easing.sine) }),
        withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.sine) })
      ),
      -1,
      true
    );

    swayX.value = withRepeat(
      withSequence(
        withDelay(500, withTiming(3, { duration: 3000, easing: Easing.inOut(Easing.sine) })),
        withTiming(-3, { duration: 3000, easing: Easing.inOut(Easing.sine) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sine) })
      ),
      -1,
      true
    );

    headTilt.value = withRepeat(
      withSequence(
        withDelay(1000, withTiming(2, { duration: 4000, easing: Easing.inOut(Easing.sine) })),
        withTiming(-2, { duration: 4000, easing: Easing.inOut(Easing.sine) })
      ),
      -1,
      true
    );

    hairFloat.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sine) }),
        withTiming(-1, { duration: 1800, easing: Easing.inOut(Easing.sine) })
      ),
      -1,
      true
    );
  }, []);

  useEffect(() => {
    if (isSpeaking) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 200 }),
          withTiming(0.4, { duration: 200 })
        ),
        -1,
        true
      );
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.03, { duration: 150 }),
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

  const characterStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: breatheScale.value * pulseScale.value },
      { translateY: floatY.value },
      { translateX: swayX.value },
      { rotate: `${headTilt.value}deg` },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: 1 + (glowOpacity.value * 0.1) }],
  }));

  const shadowStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleX: interpolate(floatY.value, [-8, 0], [0.85, 1]) },
      { scaleY: interpolate(floatY.value, [-8, 0], [0.6, 0.8]) },
    ],
    opacity: interpolate(floatY.value, [-8, 0], [0.2, 0.4]),
  }));

  if (isGenerating) {
    return (
      <View style={styles.characterWrapper}>
        <Animated.View style={[styles.characterGlow, glowStyle, { backgroundColor: companion.color }]} />
        <View style={styles.generatingContainer}>
          <ActivityIndicator size="large" color={companion.color} />
          <Text style={styles.generatingText}>Summoning {companion.name}...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.characterWrapper}>
      <Animated.View style={[styles.characterGlow, glowStyle, { backgroundColor: companion.color }]} />
      <Animated.View style={[styles.characterShadow, shadowStyle]} />
      <Animated.View style={[styles.characterContainer, characterStyle]}>
        {generatedImage ? (
          <Image source={{ uri: generatedImage }} style={styles.characterImage} resizeMode="contain" />
        ) : (
          <LinearGradient
            colors={[companion.color + '60', companion.color + '20', 'transparent']}
            style={styles.fallbackCharacter}
          >
            <View style={[styles.avatarCircle, { borderColor: companion.color }]}>
              <Text style={styles.avatarEmoji}>✨</Text>
            </View>
            <Text style={[styles.avatarName, { color: companion.color }]}>{companion.name}</Text>
          </LinearGradient>
        )}
      </Animated.View>
    </View>
  );
}

function CompanionCard({ 
  companion, 
  cachedImage,
  onPress 
}: { 
  companion: CompanionData; 
  cachedImage: string | null;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const cardFloat = useSharedValue(0);

  useEffect(() => {
    cardFloat.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 2000 + Math.random() * 1000, easing: Easing.inOut(Easing.sine) }),
        withTiming(0, { duration: 2000 + Math.random() * 1000, easing: Easing.inOut(Easing.sine) })
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
        {cachedImage ? (
          <Image source={{ uri: cachedImage }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={[companion.color + '60', companion.backgroundColor]}
            style={styles.cardImageFallback}
          >
            <Text style={styles.cardEmoji}>✨</Text>
          </LinearGradient>
        )}
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
  cachedImage,
  onImageGenerated,
}: { 
  companion: CompanionData; 
  onBack: () => void;
  cachedImage: string | null;
  onImageGenerated: (id: string, url: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { _id: 'greeting', text: companion.greeting, createdAt: new Date(), user: { _id: 2, name: companion.name } }
  ]);
  const [inputText, setInputText] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(cachedImage);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const { isListening: isRecording, startRecording, stopRecording } = useVoiceContext();
  const { isSpeaking, speak: speakWithElevenLabs } = useElevenLabs();

  useEffect(() => {
    if (!cachedImage && !generatedImage && !isGeneratingImage) {
      generateAnimeCharacter();
    }
  }, [companion.id]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e) => setKeyboardHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const generateAnimeCharacter = async () => {
    setIsGeneratingImage(true);
    try {
      const result = await generateImage(companion.animePrompt, {
        size: '1024x1792',
        quality: 'hd',
        style: 'vivid',
      });
      setGeneratedImage(result.imageUrl);
      onImageGenerated(companion.id, result.imageUrl);
    } catch (error) {
      console.log('Image generation failed:', error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSend = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: ChatMessage = {
      _id: `user_${Date.now()}`, text: text.trim(), createdAt: new Date(), user: { _id: 1, name: 'You' },
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await sendMessageToAI(text, messages, companion.systemPrompt, companion.name);
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
          generatedImage={generatedImage}
          isGenerating={isGeneratingImage}
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
              colors={['rgba(255,107,157,0.2)', 'rgba(139,92,246,0.2)']}
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
  const [imageCache, setImageCache] = useState<Record<string, string>>({});
  const insets = useSafeAreaInsets();
  const { hapticEnabled } = useUserStore();

  useEffect(() => {
    loadCachedImages();
  }, []);

  const loadCachedImages = async () => {
    try {
      const cached = await AsyncStorage.getItem(ANIME_CACHE_KEY);
      if (cached) setImageCache(JSON.parse(cached));
    } catch {}
  };

  const handleImageGenerated = async (id: string, url: string) => {
    const newCache = { ...imageCache, [id]: url };
    setImageCache(newCache);
    try {
      await AsyncStorage.setItem(ANIME_CACHE_KEY, JSON.stringify(newCache));
    } catch {}
  };

  if (selectedCompanion) {
    return (
      <ChatScreen
        companion={selectedCompanion}
        onBack={() => setSelectedCompanion(null)}
        cachedImage={imageCache[selectedCompanion.id] || null}
        onImageGenerated={handleImageGenerated}
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
            cachedImage={imageCache[c.id] || null}
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
  cardImage: { width: '100%', height: '100%', position: 'absolute' },
  cardImageFallback: { width: '100%', height: '100%', position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  cardEmoji: { fontSize: 48 },
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
  characterWrapper: { width: SCREEN_WIDTH * 0.95, height: SCREEN_HEIGHT * 0.58, justifyContent: 'center', alignItems: 'center' },
  characterGlow: { position: 'absolute', width: 300, height: 300, borderRadius: 150, bottom: '20%' },
  characterShadow: { position: 'absolute', bottom: 20, width: 120, height: 20, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 60 },
  characterContainer: { width: '100%', height: '100%', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 40 },
  characterImage: { width: '100%', height: '100%' },
  fallbackCharacter: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  avatarCircle: { width: 140, height: 140, borderRadius: 70, borderWidth: 3, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  avatarEmoji: { fontSize: 56 },
  avatarName: { marginTop: 16, fontSize: 24, fontWeight: '700' },
  generatingContainer: { alignItems: 'center', gap: 16 },
  generatingText: { color: 'rgba(255,255,255,0.7)', fontSize: 16 },
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
