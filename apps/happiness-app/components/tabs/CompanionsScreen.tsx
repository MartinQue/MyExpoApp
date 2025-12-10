/**
 * CompanionsScreen.tsx - Grok-Style Companions Gallery
 *
 * A beautiful 2x2 grid of companion cards with Chat and Voice buttons.
 * Tapping a card transitions to the full avatar view with loading progress.
 */

import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Image,
  Animated,
  Platform,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../contexts/ThemeContext';
import { useAvatarStore } from '../../stores/avatarStore';
import {
  AVATAR_MANIFEST,
  type AvatarId,
  type AvatarConfig,
} from '../../assets/avatars/avatar_manifest';
import VRMAvatar from '../vrm/VRMAvatar';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_GAP = 12;
const HORIZONTAL_PADDING = 16;
const CARD_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - CARD_GAP) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

// Tab bar height for proper spacing
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 88 : 70;

type ViewState = 'gallery' | 'loading' | 'avatar';

export default function CompanionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark, getGradientArray } = useTheme();
  const selectAvatar = useAvatarStore((state) => state.selectAvatar);
  const storedSelectedId = useAvatarStore((state) => state.selectedAvatarId);

  // View state
  const [viewState, setViewState] = useState<ViewState>('gallery');
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarConfig | null>(
    null
  );
  const [loadProgress, setLoadProgress] = useState(0);
  const [avatarReady, setAvatarReady] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const loadingAnim = useRef(new Animated.Value(0)).current;
  const avatarAnim = useRef(new Animated.Value(0)).current;

  // Group avatars into rows of 2
  const avatarRows = useMemo(() => {
    const rows: AvatarConfig[][] = [];
    for (let i = 0; i < AVATAR_MANIFEST.length; i += 2) {
      rows.push(AVATAR_MANIFEST.slice(i, i + 2));
    }
    return rows;
  }, []);

  // Handle avatar selection
  const handleSelectAvatar = useCallback(
    async (avatar: AvatarConfig) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setSelectedAvatar(avatar);
      setLoadProgress(0);
      setAvatarReady(false);
      selectAvatar(avatar.id);

      // Transition to loading state
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(loadingAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setViewState('loading');
      });
    },
    [fadeAnim, loadingAnim, selectAvatar]
  );

  // Handle chat button press
  const handleChatPress = useCallback(
    async (avatar: AvatarConfig) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      selectAvatar(avatar.id);
      router.push('/chat');
    },
    [router, selectAvatar]
  );

  // Handle voice button press
  const handleVoicePress = useCallback(
    async (avatar: AvatarConfig) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      handleSelectAvatar(avatar);
    },
    [handleSelectAvatar]
  );

  // Handle back to gallery
  const handleBackToGallery = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.parallel([
      Animated.timing(loadingAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(avatarAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setViewState('gallery');
      setSelectedAvatar(null);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnim, loadingAnim, avatarAnim]);

  // Handle avatar loaded
  const handleAvatarLoaded = useCallback(
    (success: boolean) => {
      if (success) {
        setAvatarReady(true);
        // Transition to avatar view
        Animated.sequence([
          Animated.timing(loadingAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(avatarAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setViewState('avatar');
        });
      }
    },
    [loadingAnim, avatarAnim]
  );

  // Handle progress update
  const handleProgress = useCallback((progress: number) => {
    setLoadProgress(progress);
  }, []);

  // Render companion card
  const renderCompanionCard = (avatar: AvatarConfig) => {
    const isSelected = storedSelectedId === avatar.id;

    return (
      <TouchableOpacity
        key={avatar.id}
        style={[
          styles.card,
          { width: CARD_WIDTH, height: CARD_HEIGHT },
          isSelected && styles.cardSelected,
        ]}
        activeOpacity={0.9}
        onPress={() => handleSelectAvatar(avatar)}
      >
        {/* Background Image */}
        <Image
          source={avatar.thumbnail}
          style={styles.cardImage}
          resizeMode="cover"
        />

        {/* Gradient Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.cardGradient}
        />

        {/* Content */}
        <View style={styles.cardContent}>
          <Text style={styles.cardName}>{avatar.name}</Text>
          <Text style={styles.cardDescription} numberOfLines={2}>
            {avatar.description}
          </Text>

          {/* Action Buttons */}
          <View style={styles.cardButtons}>
            <TouchableOpacity
              style={styles.cardButton}
              onPress={() => handleChatPress(avatar)}
              activeOpacity={0.8}
            >
              <BlurView
                intensity={60}
                tint="dark"
                style={styles.cardButtonBlur}
              >
                <Ionicons name="chatbubble-outline" size={18} color="#FFF" />
              </BlurView>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cardButton, styles.cardButtonVoice]}
              onPress={() => handleVoicePress(avatar)}
              activeOpacity={0.8}
            >
              <View style={styles.voiceButtonInner}>
                <Ionicons name="pulse" size={18} color="#000" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Selected indicator */}
        {isSelected && (
          <View style={styles.selectedBadge}>
            <Ionicons name="checkmark-circle" size={20} color="#A855F7" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Render loading state
  const renderLoadingState = () => {
    if (!selectedAvatar) return null;

    return (
      <Animated.View
        style={[
          styles.loadingContainer,
          {
            opacity: loadingAnim,
          },
        ]}
        pointerEvents={viewState === 'loading' ? 'auto' : 'none'}
      >
        <LinearGradient
          colors={selectedAvatar.gradientColors[isDark ? 'dark' : 'light']}
          style={StyleSheet.absoluteFill}
        />

        {/* Back button */}
        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + 8 }]}
          onPress={handleBackToGallery}
          activeOpacity={0.8}
        >
          <BlurView intensity={60} tint="dark" style={styles.backButtonBlur}>
            <Ionicons name="grid" size={20} color="#FFF" />
          </BlurView>
        </TouchableOpacity>

        {/* Loading ring with avatar thumbnail */}
        <View style={styles.loadingRing}>
          <View style={styles.loadingThumbnail}>
            <Image
              source={selectedAvatar.thumbnail}
              style={styles.loadingImage}
              resizeMode="cover"
              blurRadius={4}
            />
          </View>

          {/* Progress ring */}
          <View style={styles.progressRing}>
            <BlurView intensity={40} tint="dark" style={styles.progressBlur}>
              <Text style={styles.progressText}>
                {Math.round(loadProgress)}%
              </Text>
            </BlurView>
          </View>
        </View>

        <Text style={styles.loadingLabel}>
          {loadProgress < 100
            ? `${Math.round(loadProgress)}% downloaded`
            : 'Loading...'}
        </Text>

        {/* VRM Avatar (hidden, just for loading) */}
        <View style={styles.hiddenAvatar}>
          <VRMAvatar
            modelModule={selectedAvatar.modelModule}
            onProgress={handleProgress}
            onModelLoaded={handleAvatarLoaded}
            backgroundColor="transparent"
          />
        </View>
      </Animated.View>
    );
  };

  // Render full avatar view
  const renderAvatarView = () => {
    if (!selectedAvatar || viewState !== 'avatar') return null;

    return (
      <Animated.View
        style={[
          styles.avatarContainer,
          {
            opacity: avatarAnim,
          },
        ]}
      >
        <LinearGradient
          colors={selectedAvatar.gradientColors[isDark ? 'dark' : 'light']}
          style={StyleSheet.absoluteFill}
        />

        {/* Header */}
        <View style={[styles.avatarHeader, { paddingTop: insets.top }]}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleBackToGallery}
            activeOpacity={0.8}
          >
            <BlurView
              intensity={60}
              tint="dark"
              style={styles.headerButtonBlur}
            >
              <Ionicons name="grid" size={20} color="#FFF" />
            </BlurView>
          </TouchableOpacity>

          <Text style={styles.avatarHeaderTitle}>{selectedAvatar.name}</Text>

          <View style={styles.headerSpacer} />
        </View>

        {/* VRM Avatar */}
        <View style={styles.avatarView}>
          <VRMAvatar
            modelModule={selectedAvatar.modelModule}
            initialExpression="idle"
            backgroundColor="transparent"
          />
        </View>

        {/* Right sidebar buttons */}
        <View style={styles.sidebarButtons}>
          <TouchableOpacity style={styles.sidebarButton} activeOpacity={0.8}>
            <BlurView
              intensity={60}
              tint="dark"
              style={styles.sidebarButtonBlur}
            >
              <Text style={styles.streakIcon}>🔥</Text>
              <Text style={styles.streakCount}>1</Text>
            </BlurView>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sidebarButton} activeOpacity={0.8}>
            <BlurView
              intensity={60}
              tint="dark"
              style={styles.sidebarButtonBlur}
            >
              <Ionicons name="happy-outline" size={22} color="#FFF" />
            </BlurView>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sidebarButton} activeOpacity={0.8}>
            <BlurView
              intensity={60}
              tint="dark"
              style={styles.sidebarButtonBlur}
            >
              <Ionicons name="shirt-outline" size={22} color="#FFF" />
            </BlurView>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sidebarButton} activeOpacity={0.8}>
            <BlurView
              intensity={60}
              tint="dark"
              style={styles.sidebarButtonBlur}
            >
              <Ionicons name="trash-outline" size={22} color="#FFF" />
            </BlurView>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sidebarButton} activeOpacity={0.8}>
            <BlurView
              intensity={60}
              tint="dark"
              style={styles.sidebarButtonBlur}
            >
              <Ionicons name="chevron-down" size={22} color="#FFF" />
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* Bottom input bar */}
        <View style={[styles.inputBar, { marginBottom: TAB_BAR_HEIGHT + 8 }]}>
          <BlurView intensity={80} tint="dark" style={styles.inputBarBlur}>
            <TouchableOpacity style={styles.inputButton} activeOpacity={0.8}>
              <Ionicons name="mic-outline" size={24} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.inputButton} activeOpacity={0.8}>
              <Ionicons name="camera-outline" size={24} color="#FFF" />
            </TouchableOpacity>

            <Text style={styles.inputPlaceholder}>Ask Anything</Text>

            <TouchableOpacity
              style={styles.callButton}
              activeOpacity={0.8}
              onPress={() => router.push('/chat')}
            >
              <Ionicons name="chatbubble" size={16} color="#000" />
              <Text style={styles.callButtonText}>Text</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Background */}
      <LinearGradient
        colors={getGradientArray('chat')}
        style={StyleSheet.absoluteFill}
      />

      {/* Gallery View */}
      <Animated.View
        style={[styles.galleryContainer, { opacity: fadeAnim }]}
        pointerEvents={viewState === 'gallery' ? 'auto' : 'none'}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                Companions
              </Text>
              <Text
                style={[styles.headerSubtitle, { color: colors.textSecondary }]}
              >
                Choose your AI companion
              </Text>
            </View>

            <BlurView
              intensity={50}
              tint={isDark ? 'dark' : 'light'}
              style={styles.countBadge}
            >
              <Text style={[styles.countText, { color: colors.text }]}>
                {AVATAR_MANIFEST.length}
              </Text>
            </BlurView>
          </View>

          {/* Avatar Grid */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.gridContent,
              { paddingBottom: TAB_BAR_HEIGHT + 16 },
            ]}
          >
            {avatarRows.map((row, rowIndex) => (
              <View key={`row-${rowIndex}`} style={styles.row}>
                {row.map(renderCompanionCard)}
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Animated.View>

      {/* Loading State */}
      {renderLoadingState()}

      {/* Avatar View */}
      {renderAvatarView()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  galleryContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  countBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  countText: {
    fontSize: 14,
    fontWeight: '700',
  },
  gridContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: CARD_GAP,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: '#A855F7',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 14,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 12,
    lineHeight: 16,
  },
  cardButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  cardButton: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardButtonBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
  },
  cardButtonVoice: {
    backgroundColor: '#FFF',
  },
  voiceButtonInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 4,
  },
  // Loading state
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    zIndex: 10,
  },
  backButtonBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 22,
  },
  loadingRing: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingThumbnail: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    position: 'absolute',
  },
  loadingImage: {
    width: '100%',
    height: '100%',
  },
  progressRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  progressBlur: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
  },
  loadingLabel: {
    marginTop: 24,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  hiddenAvatar: {
    width: 1,
    height: 1,
    opacity: 0,
    position: 'absolute',
  },
  // Avatar view
  avatarContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  avatarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    zIndex: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  headerButtonBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 22,
  },
  avatarHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  headerSpacer: {
    width: 44,
  },
  avatarView: {
    flex: 1,
    marginBottom: -50,
  },
  sidebarButtons: {
    position: 'absolute',
    right: 16,
    top: 120,
    gap: 12,
  },
  sidebarButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  sidebarButtonBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 24,
  },
  streakIcon: {
    fontSize: 18,
  },
  streakCount: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF6B00',
    position: 'absolute',
    top: 2,
    right: 8,
  },
  inputBar: {
    marginHorizontal: 16,
    borderRadius: 28,
    overflow: 'hidden',
  },
  inputBarBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 28,
  },
  inputButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  inputPlaceholder: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
    marginLeft: 8,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderRadius: 20,
  },
  callButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
});
