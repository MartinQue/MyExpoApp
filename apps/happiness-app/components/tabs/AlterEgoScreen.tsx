/**
 * AlterEgoScreen.tsx - Companions Gallery
 *
 * Displays a grid of AI companions with VRM avatar viewer
 * - 2x2 grid of companion cards
 * - Full-screen avatar viewer with loading progress
 * - Grok-style input bar
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  TextInput,
  Image,
  ScrollView,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

import { CompanionCard } from '@/components/avatars/CompanionCard';
import { VRMAvatarGL } from '@/components/vrm';
import {
  AVATAR_MANIFEST,
  type AvatarId,
  type AvatarConfig,
} from '@/assets/avatars/avatar_manifest';
import { useAvatarStore } from '@/stores/avatarStore';
import { useTheme } from '@/contexts/ThemeContext';
import { ttsService } from '@/lib/voice/ttsService';
import { Ionicons } from '@expo/vector-icons';
import { Svg, Circle } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 36) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.35;

type ProgressMap = Partial<Record<AvatarId, number>>;

export default function CompanionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark, getGradientArray } = useTheme();
  const selectAvatar = useAvatarStore((state) => state.selectAvatar);
  const storedSelectedId = useAvatarStore((state) => state.selectedAvatarId);

  const [selectedId, setSelectedId] = useState<AvatarId | null>(null);
  const [loadingId, setLoadingId] = useState<AvatarId | null>(null);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [viewerReady, setViewerReady] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const chatOpacity = useRef(new Animated.Value(0)).current;

  const selectedAvatar: AvatarConfig | undefined = useMemo(
    () => AVATAR_MANIFEST.find((a) => a.id === selectedId),
    [selectedId]
  );

  const rows = useMemo(
    () => [
      AVATAR_MANIFEST.slice(0, 2),
      AVATAR_MANIFEST.slice(2, 4),
      AVATAR_MANIFEST.slice(4, 5),
    ],
    []
  );

  // Sync with stored avatar on mount
  useEffect(() => {
    if (!selectedId && storedSelectedId) {
      setSelectedId(storedSelectedId);
    }
  }, [selectedId, storedSelectedId]);

  const updateOverlay = useCallback(
    (visible: boolean) => {
      Animated.timing(overlayOpacity, {
        toValue: visible ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    },
    [overlayOpacity]
  );

  const handleSelect = useCallback(
    async (avatar: AvatarConfig) => {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // ignore haptics error
      }

      // Update store and local state
      selectAvatar(avatar.id);
      setSelectedId(avatar.id);
      setLoadingId(avatar.id);
      setViewerReady(false);
      chatOpacity.setValue(0);
      setProgress((prev) => ({ ...prev, [avatar.id]: 0 }));

      // Show viewer overlay
      setViewerVisible(true);
      updateOverlay(true);
    },
    [chatOpacity, selectAvatar, updateOverlay]
  );

  const handleProgress = useCallback(
    (value: number) => {
      if (!selectedId) return;
      setProgress((prev) => ({ ...prev, [selectedId]: Math.min(100, value) }));
    },
    [selectedId]
  );

  const handleLoaded = useCallback(
    (success: boolean) => {
      if (!selectedId) return;

      if (!success) {
        setLoadingId(null);
        return;
      }

      setProgress((prev) => ({ ...prev, [selectedId]: 100 }));
      setLoadingId(null);
      setViewerReady(true);

      // Fade in chat overlay
      Animated.timing(chatOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    },
    [chatOpacity, selectedId]
  );

  const handleCloseViewer = useCallback(() => {
    setViewerVisible(false);
    updateOverlay(false);
    chatOpacity.setValue(0);
  }, [chatOpacity, updateOverlay]);

  const handleChat = useCallback(() => {
    router.push('/chat');
  }, [router]);

  const handleSpeak = useCallback(async (avatar?: AvatarConfig) => {
    const text =
      avatar?.greeting ||
      `Hi, I'm ${avatar?.name ?? 'your companion'}. Let's talk.`;
    await ttsService.speak(text);
  }, []);

  const gridOpacity = loadingId ? 0.45 : 1;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={getGradientArray('chat')}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Companions
            </Text>
            <Text
              style={[styles.headerSubtitle, { color: colors.textSecondary }]}
            >
              Five vibes. Pick one to chat or speak.
            </Text>
          </View>
          <BlurView
            intensity={50}
            tint={isDark ? 'dark' : 'light'}
            style={styles.headerBadge}
          >
            <Text style={[styles.badgeText, { color: colors.text }]}>5</Text>
          </BlurView>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: Math.max(insets.bottom + 24, 48),
          }}
        >
          <View style={[styles.grid, { opacity: gridOpacity }]}>
            {rows.map((row, idx) => (
              <View
                key={`row-${idx}`}
                style={[
                  styles.row,
                  idx === 0 ? styles.rowTop : styles.rowBottom,
                  row.length === 1 && styles.rowSingle,
                ]}
              >
                {row.map((avatar) => {
                  const isLoading = loadingId === avatar.id;
                  const pct = progress[avatar.id] ?? 0;
                  const isActive = selectedId === avatar.id;
                  return (
                    <CompanionCard
                      key={avatar.id}
                      id={avatar.id}
                      name={avatar.name}
                      description={avatar.description}
                      cardImage={avatar.thumbnail}
                      isActive={isActive}
                      isLoading={isLoading}
                      loadingProgress={pct}
                      onPress={() => handleSelect(avatar)}
                      onChatPress={handleChat}
                      onVoicePress={() => handleSpeak(avatar)}
                      layoutSize={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Full-screen Avatar Viewer */}
      {selectedAvatar && (
        <Animated.View
          pointerEvents={viewerVisible ? 'auto' : 'none'}
          style={[styles.viewerOverlay, { opacity: overlayOpacity }]}
        >
          {/* Close button */}
          <View style={[styles.viewerHeader, { top: insets.top + 10 }]}>
            <TouchableOpacity
              onPress={handleCloseViewer}
              style={styles.closeBtn}
              activeOpacity={0.85}
            >
              <BlurView
                intensity={60}
                tint={isDark ? 'dark' : 'light'}
                style={styles.closeBlur}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </BlurView>
            </TouchableOpacity>
          </View>

          {/* Background */}
          <LinearGradient
            colors={selectedAvatar.gradientColors[isDark ? 'dark' : 'light']}
            style={StyleSheet.absoluteFillObject}
          />
          <BlurView
            tint={isDark ? 'dark' : 'light'}
            intensity={30}
            style={StyleSheet.absoluteFillObject}
          />

          {/* VRM Avatar - uses native GL for reliable loading */}
          <VRMAvatarGL
            modelModule={selectedAvatar.modelModule}
            initialExpression="idle"
            onProgress={handleProgress}
            onModelLoaded={handleLoaded}
            style={styles.vrmCanvas}
            key={selectedAvatar.id}
          />

          {/* Grok-style Loading Screen - Circular portrait with progress ring */}
          {!viewerReady && (
            <View style={styles.loadingContainer}>
              {/* Small white dot indicator above */}
              <View style={styles.loadingDot} />

              {/* Circular portrait with progress ring */}
              <View style={styles.loadingRing}>
                {/* SVG Progress Ring */}
                <Svg width={160} height={160} style={styles.progressSvg}>
                  {/* Background ring */}
                  <Circle
                    cx={80}
                    cy={80}
                    r={74}
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth={4}
                    fill="none"
                  />
                  {/* Progress ring */}
                  <Circle
                    cx={80}
                    cy={80}
                    r={74}
                    stroke="#fff"
                    strokeWidth={4}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 74}`}
                    strokeDashoffset={
                      (1 -
                        (progress[selectedId ?? selectedAvatar.id] ?? 0) /
                          100) *
                      2 *
                      Math.PI *
                      74
                    }
                    rotation={-90}
                    origin="80, 80"
                  />
                </Svg>

                {/* Avatar portrait inside the ring */}
                <View style={styles.loadingPortrait}>
                  <Image
                    source={selectedAvatar.thumbnail}
                    style={styles.loadingImage}
                    resizeMode="cover"
                  />
                </View>
              </View>

              {/* Downloaded text below */}
              <Text style={styles.downloadedText}>
                {Math.round(progress[selectedId ?? selectedAvatar.id] ?? 0)}%
                downloaded
              </Text>
            </View>
          )}

          {/* Chat input bar (shows when avatar loaded) */}
          {viewerReady && (
            <Animated.View
              style={[styles.chatOverlay, { opacity: chatOpacity }]}
            >
              <BlurView
                intensity={60}
                tint={isDark ? 'dark' : 'light'}
                style={styles.chatBlur}
              >
                <TouchableOpacity
                  style={styles.circleBtn}
                  onPress={() => handleSpeak(selectedAvatar)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.circleBtnLabel}>🎙️</Text>
                </TouchableOpacity>
                <TextInput
                  placeholder="Ask Anything"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.input, { color: colors.text }]}
                  onFocus={handleChat}
                />
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={handleChat}
                  activeOpacity={0.9}
                >
                  <Text style={styles.callLabel}>Call</Text>
                </TouchableOpacity>
              </BlurView>
            </Animated.View>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  headerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  badgeText: {
    fontWeight: '700',
    fontSize: 14,
  },
  grid: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowTop: {
    marginBottom: 8,
  },
  rowBottom: {
    justifyContent: 'space-between',
  },
  rowSingle: {
    justifyContent: 'center',
  },
  viewerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerHeader: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  closeBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  vrmCanvas: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginBottom: 24,
  },
  loadingRing: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressSvg: {
    position: 'absolute',
  },
  loadingPortrait: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(60, 60, 60, 0.8)',
  },
  loadingImage: {
    width: '100%',
    height: '100%',
  },
  downloadedText: {
    marginTop: 24,
    fontSize: 18,
    fontWeight: '500',
    color: '#fff',
  },
  chatOverlay: {
    position: 'absolute',
    bottom: 28,
    left: 16,
    right: 16,
  },
  chatBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  circleBtnLabel: {
    fontSize: 18,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  callBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  callLabel: {
    fontWeight: '700',
    color: '#000',
  },
});
