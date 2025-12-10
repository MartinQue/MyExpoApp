import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import type { AvatarId } from '@/assets/avatars/avatar_manifest';
import {
  useWardrobeStore,
  type WardrobeItem,
  type WardrobeSelection,
} from '@/stores/wardrobeStore';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

type WardrobeCategory = 'tops' | 'bottoms' | 'accessories';

interface WardrobePickerProps {
  avatarId: AvatarId;
  category: WardrobeCategory;
  title: string;
  description?: string;
}

function getSelectedId(selection: WardrobeSelection, category: WardrobeCategory) {
  switch (category) {
    case 'tops':
      return selection.topId;
    case 'bottoms':
      return selection.bottomId;
    case 'accessories':
      return selection.accessoryId;
    default:
      return undefined;
  }
}

function getRarityColor(rarity: WardrobeItem['rarity']) {
  switch (rarity) {
    case 'legendary':
      return '#FACC15';
    case 'epic':
      return '#C084FC';
    case 'rare':
      return '#60A5FA';
    case 'uncommon':
      return '#34D399';
    default:
      return '#E5E7EB';
  }
}

export function WardrobePicker({
  avatarId,
  category,
  title,
  description,
}: WardrobePickerProps) {
  const items = useWardrobeStore((state) => state.getItems(avatarId, category));
  const selection = useWardrobeStore((state) => state.getSelection(avatarId));
  const setSelection = useWardrobeStore((state) => state.setSelection);

  const selectedId = useMemo(
    () => getSelectedId(selection, category),
    [selection, category]
  );

  const handleSelect = useCallback(
    (itemId?: string) => {
      setSelection(avatarId, category, selectedId === itemId ? undefined : itemId);
    },
    [avatarId, category, selectedId, setSelection]
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.subtitle}>{description}</Text> : null}
      </View>
      <View style={styles.grid}>
        {items.map((item) => {
          const isSelected = item.id === selectedId;
          return (
            <AnimatedTouchable
              key={item.id}
              entering={FadeIn.duration(200)}
              style={[styles.card, isSelected && styles.cardSelected]}
              activeOpacity={0.85}
              onPress={() => handleSelect(item.id)}
            >
              <View style={styles.previewWrapper}>
                <Image source={{ uri: item.preview }} style={styles.preview} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.description ? (
                  <Text style={styles.itemDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
                <View
                  style={[styles.rarityPill, { backgroundColor: getRarityColor(item.rarity) }]}
                >
                  <Text style={styles.rarityText}>{item.rarity.toUpperCase()}</Text>
                </View>
              </View>
            </AnimatedTouchable>
          );
        })}
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>Coming soon</Text>
            <Text style={styles.emptyStateSubtitle}>
              Wardrobe options for this category will unlock in a future update.
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  headerRow: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.7)',
  },
  grid: {
    flexDirection: 'column',
    gap: 12,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: 'rgba(12,12,16,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    gap: 16,
  },
  cardSelected: {
    borderColor: '#F97316',
    backgroundColor: 'rgba(249,115,22,0.18)',
  },
  previewWrapper: {
    width: 68,
    height: 68,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  itemDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  rarityPill: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  rarityText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111827',
  },
  emptyState: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: 'rgba(12,12,16,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  emptyStateSubtitle: {
    color: 'rgba(255,255,255,0.6)',
  },
});
