import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useAvatarStore } from '@/stores/avatarStore';
import { AVATAR_MANIFEST } from '@/assets/avatars/avatar_manifest';
import { useWardrobeStore } from '@/stores/wardrobeStore';
import { WardrobePicker } from '@/components/avatars/WardrobePicker';
import { MakeMeAnimeUploader } from '@/components/avatars/MakeMeAnimeUploader';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

type TabKey = 'wardrobe' | 'anime';

function WardrobeTab() {
  const { selectedAvatarId, getAvatarById } = useAvatarStore();
  const selection = useWardrobeStore((state) => state.getSelection(selectedAvatarId));
  const avatar = useMemo(() => getAvatarById(selectedAvatarId), [selectedAvatarId, getAvatarById]);

  return (
    <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.summaryContainer}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>{avatar.name}&rsquo;s wardrobe</Text>
          <Text style={styles.summarySubtitle}>
            Customize outfits to cheer up your stage. Changes apply the next time you open Companions.
          </Text>
          <View style={styles.summaryChips}>
            <View style={styles.summaryChip}>
              <Text style={styles.summaryChipLabel}>Top</Text>
              <Text style={styles.summaryChipValue}>{selection.topId?.split('_').slice(-1)[0] ?? 'Default'}</Text>
            </View>
            <View style={styles.summaryChip}>
              <Text style={styles.summaryChipLabel}>Bottom</Text>
              <Text style={styles.summaryChipValue}>{selection.bottomId?.split('_').slice(-1)[0] ?? 'Default'}</Text>
            </View>
            <View style={styles.summaryChip}>
              <Text style={styles.summaryChipLabel}>Accessory</Text>
              <Text style={styles.summaryChipValue}>{selection.accessoryId?.split('_').slice(-1)[0] ?? 'None'}</Text>
            </View>
          </View>
        </View>

        <WardrobePicker avatarId={selectedAvatarId} category="tops" title="Tops" />
        <WardrobePicker avatarId={selectedAvatarId} category="bottoms" title="Bottoms" />
        <WardrobePicker avatarId={selectedAvatarId} category="accessories" title="Accessories" />
      </View>
    </ScrollView>
  );
}

function MakeMeAnimeTab() {
  return (
    <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
      <MakeMeAnimeUploader />
    </ScrollView>
  );
}

export default function CustomizeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedAvatarId } = useAvatarStore();
  const currentAvatar = AVATAR_MANIFEST.find((a) => a.id === selectedAvatarId);
  const [activeTab, setActiveTab] = useState<TabKey>('wardrobe');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }] }>
        <AnimatedTouchable entering={FadeIn} onPress={() => router.back()} style={styles.backButton} activeOpacity={0.8}>
          <BlurView intensity={40} tint="dark" style={styles.backBlur}>
            <Text style={styles.backText}>←</Text>
          </BlurView>
        </AnimatedTouchable>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>Customize</Text>
          <Text style={styles.headerSubtitleLarge}>{currentAvatar?.name ?? 'Your companion'}</Text>
        </View>
      </View>

      <View style={styles.tabSelector}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.tabButton, activeTab === 'wardrobe' && styles.tabButtonActive]}
          onPress={() => setActiveTab('wardrobe')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'wardrobe' && styles.tabButtonTextActive,
            ]}
          >
            Wardrobe
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.tabButton, activeTab === 'anime' && styles.tabButtonActive]}
          onPress={() => setActiveTab('anime')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'anime' && styles.tabButtonTextActive,
            ]}
          >
            Make Me Anime
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabBody}>
        {activeTab === 'wardrobe' ? <WardrobeTab /> : <MakeMeAnimeTab />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#05050a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  backBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 20,
    color: '#fff',
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  headerSubtitleLarge: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  tabSelector: {
    flexDirection: 'row',
    marginHorizontal: 20,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(12,12,16,0.6)',
    padding: 6,
    gap: 6,
  },
  tabButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#F97316',
  },
  tabButtonText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: '#111827',
  },
  tabBody: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tabContent: {
    paddingVertical: 24,
    gap: 24,
  },
  summaryContainer: {
    paddingVertical: 24,
    gap: 24,
  },
  summaryBox: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: 'rgba(12,12,16,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 16,
  },
  summaryTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  summarySubtitle: {
    color: 'rgba(255,255,255,0.7)',
  },
  summaryChips: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryChip: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 12,
    gap: 4,
  },
  summaryChipLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  summaryChipValue: {
    color: '#fff',
    fontWeight: '600',
  },
});
