import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../contexts/ThemeContext';
import { Live2DModel } from './Live2DAvatar';
import * as haptics from '../../lib/haptics';

// Avatar metadata
interface AvatarInfo {
  id: Live2DModel;
  name: string;
  description: string;
  personality: string;
  icon: keyof typeof Ionicons.glyphMap;
}

// Available avatars with descriptions
const AVATARS: AvatarInfo[] = [
  {
    id: 'hiyori',
    name: 'Hiyori',
    description: 'Soft and gentle personality',
    personality: 'Calm, supportive, empathetic',
    icon: 'flower',
  },
  {
    id: 'haru',
    name: 'Haru',
    description: 'Cheerful and energetic',
    personality: 'Upbeat, positive, encouraging',
    icon: 'sunny',
  },
  {
    id: 'shizuku',
    name: 'Shizuku',
    description: 'Calm and serene',
    personality: 'Peaceful, thoughtful, wise',
    icon: 'water',
  },
  {
    id: 'mao',
    name: 'Mao',
    description: 'Elegant and sophisticated',
    personality: 'Refined, articulate, graceful',
    icon: 'rose',
  },
  {
    id: 'hijiki',
    name: 'Hijiki',
    description: 'Cute and playful',
    personality: 'Fun, lighthearted, friendly',
    icon: 'heart',
  },
  {
    id: 'tororo',
    name: 'Tororo',
    description: 'Energetic and spirited',
    personality: 'Lively, passionate, dynamic',
    icon: 'flash',
  },
];

interface AvatarSelectorProps {
  visible: boolean;
  currentAvatar: Live2DModel;
  onSelect: (avatar: Live2DModel) => void;
  onClose: () => void;
}

/**
 * AvatarSelector displays a modal with available avatars
 *
 * Features:
 * - Grid layout of avatar cards
 * - Avatar name, description, and personality
 * - Glassmorphism design
 * - Haptic feedback on selection
 * - Current avatar highlighted
 *
 * Usage:
 * ```tsx
 * const [showSelector, setShowSelector] = useState(false);
 * const [avatar, setAvatar] = useState<Live2DModel>('hiyori');
 *
 * <AvatarSelector
 *   visible={showSelector}
 *   currentAvatar={avatar}
 *   onSelect={(newAvatar) => {
 *     setAvatar(newAvatar);
 *     setShowSelector(false);
 *   }}
 *   onClose={() => setShowSelector(false)}
 * />
 * ```
 */
export default function AvatarSelector({
  visible,
  currentAvatar,
  onSelect,
  onClose,
}: AvatarSelectorProps) {
  const { colors, isDark } = useTheme();

  const handleSelect = (avatar: Live2DModel) => {
    haptics.selectionFeedback();
    onSelect(avatar);
  };

  const handleClose = () => {
    haptics.button();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <BlurView
        intensity={90}
        tint={isDark ? 'dark' : 'light'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Choose Your Avatar
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Avatar Grid */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.gridContainer}
            showsVerticalScrollIndicator={false}
          >
            {AVATARS.map((avatar) => {
              const isSelected = avatar.id === currentAvatar;

              return (
                <TouchableOpacity
                  key={avatar.id}
                  onPress={() => handleSelect(avatar.id)}
                  activeOpacity={0.7}
                  style={styles.cardWrapper}
                >
                  <BlurView
                    intensity={60}
                    tint={isDark ? 'dark' : 'light'}
                    style={[
                      styles.card,
                      isSelected && {
                        borderColor: '#8B5CF6',
                        borderWidth: 2,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.cardInner,
                        {
                          backgroundColor: isDark
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'rgba(255, 255, 255, 0.7)',
                        },
                      ]}
                    >
                      {/* Icon */}
                      <View
                        style={[
                          styles.iconContainer,
                          {
                            backgroundColor: isSelected
                              ? 'rgba(139, 92, 246, 0.2)'
                              : isDark
                              ? 'rgba(255, 255, 255, 0.1)'
                              : 'rgba(0, 0, 0, 0.05)',
                          },
                        ]}
                      >
                        <Ionicons
                          name={avatar.icon}
                          size={32}
                          color={isSelected ? '#8B5CF6' : colors.text}
                        />
                      </View>

                      {/* Name */}
                      <Text
                        style={[
                          styles.name,
                          {
                            color: isSelected ? '#8B5CF6' : colors.text,
                          },
                        ]}
                      >
                        {avatar.name}
                      </Text>

                      {/* Description */}
                      <Text
                        style={[
                          styles.description,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {avatar.description}
                      </Text>

                      {/* Personality */}
                      <Text
                        style={[
                          styles.personality,
                          { color: colors.textSecondary },
                        ]}
                        numberOfLines={2}
                      >
                        {avatar.personality}
                      </Text>

                      {/* Selected Badge */}
                      {isSelected && (
                        <View style={styles.selectedBadge}>
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color="#8B5CF6"
                          />
                          <Text style={styles.selectedText}>Selected</Text>
                        </View>
                      )}
                    </View>
                  </BlurView>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    borderRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  gridContainer: {
    padding: 16,
    gap: 16,
  },
  cardWrapper: {
    width: '100%',
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardInner: {
    padding: 20,
    gap: 8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
  },
  personality: {
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.6,
    lineHeight: 16,
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 92, 246, 0.3)',
  },
  selectedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
});
