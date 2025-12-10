import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  Pressable,
  Modal,
  Dimensions,
  FlatList,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  button as hapticButton,
  light as hapticLight,
  medium as hapticMedium,
} from '@/lib/haptics';
import { Video, ResizeMode } from 'expo-av';
import { MotiView } from 'moti';
import { useLibraryStore, MediaItem } from '@/stores/libraryStore';
import { usePlannerStore } from '@/stores/plannerStore';
import { ScalePressable } from '../ui/ScalePressable';
import { Colors } from '@/constants/Theme';
import { useTheme } from '@/contexts/ThemeContext';
import { SkeletonImage } from '../ui/Skeleton';

const { width } = Dimensions.get('window');
const GRID_GAP = 2;
const GRID_COLUMNS = 3;
const ITEM_SIZE = (width - GRID_GAP * (GRID_COLUMNS + 1)) / GRID_COLUMNS;

// Sentiment Analysis mock (would use AI in production)
function getSentimentData(note: MediaItem) {
  // Simulated sentiment analysis
  const sentiments = [
    { label: 'Positive', score: 85, color: '#22c55e', emoji: '😊' },
    { label: 'Neutral', score: 65, color: '#eab308', emoji: '😐' },
    { label: 'Focused', score: 78, color: '#3b82f6', emoji: '🎯' },
  ];
  return sentiments[Math.floor(Math.random() * sentiments.length)];
}

export default function LibraryTab() {
  const { colors, isDark, getGradientArray } = useTheme();
  const {
    personalItems,
    noteItems,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
  } = useLibraryStore();
  const { plans } = usePlannerStore();

  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const handleFilterChange = (newFilter: string | null) => {
    hapticButton();
    setSelectedFilter(newFilter);
  };

  const openItem = useCallback((item: MediaItem) => {
    hapticLight();
    setSelectedItem(item);
    setShowDetailModal(true);
  }, []);

  const closeDetail = () => {
    hapticButton();
    setSelectedItem(null);
    setShowDetailModal(false);
  };

  // Filter items by type and goal
  const getFilteredItems = () => {
    let items = filter === 'notes' ? noteItems : personalItems;

    // Filter by search
    if (searchQuery) {
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.tags?.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          ) ||
          item.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.transcript?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by type
    if (selectedFilter && selectedFilter !== 'all') {
      items = items.filter((item) => item.type === selectedFilter);
    }

    // Filter by goal (if applicable)
    if (selectedGoal) {
      items = items.filter((item) =>
        item.tags?.some((tag) =>
          tag.toLowerCase().includes(selectedGoal.toLowerCase())
        )
      );
    }

    return items;
  };

  const filteredItems = getFilteredItems();

  const renderGridItem = useCallback(
    ({ item, index }: { item: MediaItem; index: number }) => (
      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 300, delay: index * 30 }}
        style={{ width: ITEM_SIZE }}
      >
        <Pressable
          style={[styles.gridItemContainer, { backgroundColor: colors.surface }]}
          onPress={() => openItem(item)}
        >
          {item.type === 'video' && item.url ? (
            <View style={styles.videoWrapper}>
              <Video
                source={{ uri: item.url }}
                style={styles.gridVideo}
                resizeMode={ResizeMode.COVER}
                isLooping
                isMuted
                shouldPlay
                useNativeControls={false}
              />
              <View style={styles.videoOverlay} />
              {item.duration && (
                <View style={styles.videoIndicator}>
                  <Ionicons name="play" size={12} color="white" />
                  <Text style={styles.durationText}>{item.duration}</Text>
                </View>
              )}
            </View>
          ) : (
            <Image
              source={{
                uri:
                  item.url ||
                  item.thumbnail ||
                  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400',
              }}
              style={styles.gridImage}
            />
          )}

          {item.type === 'voice-memo' && (
            <View style={styles.audioIndicator}>
              <Ionicons name="mic" size={18} color="white" />
            </View>
          )}

          {item.tags && item.tags.length > 2 && (
            <View style={styles.multiIndicator}>
              <Ionicons name="copy" size={14} color="white" />
            </View>
          )}
        </Pressable>
      </MotiView>
    ),
    [colors.surface, openItem]
  );



  // Render note card with sentiment
  const renderNoteCard = (note: MediaItem) => {
    const sentiment = getSentimentData(note);

    return (
      <MotiView
        key={note.id}
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 300 }}
      >
        <Pressable
          style={[
            styles.noteCard,
            {
              backgroundColor: isDark
                ? colors.surface
                : 'rgba(255,255,255,0.95)',
              borderColor: colors.border,
              borderWidth: isDark ? 1 : 0,
            },
          ]}
          onPress={() => openItem(note)}
        >
          <View style={styles.noteHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.noteTitle, { color: colors.text }]}>
                {note.title}
              </Text>
              <View style={styles.noteMetaRow}>
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={colors.textMuted}
                />
                <Text style={[styles.noteDate, { color: colors.textMuted }]}>
                  {note.date}
                </Text>
                {note.participants && (
                  <>
                    <View
                      style={[
                        styles.metaDot,
                        { backgroundColor: colors.textMuted },
                      ]}
                    />
                    <Ionicons
                      name="people-outline"
                      size={14}
                      color={colors.textMuted}
                    />
                    <Text
                      style={[styles.noteDate, { color: colors.textMuted }]}
                    >
                      {note.participants.length}
                    </Text>
                  </>
                )}
              </View>
            </View>

            {/* Sentiment Badge */}
            <View
              style={[
                styles.sentimentBadge,
                { backgroundColor: `${sentiment.color}20` },
              ]}
            >
              <Text style={styles.sentimentEmoji}>{sentiment.emoji}</Text>
              <Text style={[styles.sentimentText, { color: sentiment.color }]}>
                {sentiment.score}%
              </Text>
            </View>
          </View>

          {/* Summary */}
          {note.summary && (
            <Text
              style={[styles.noteSummary, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              {note.summary}
            </Text>
          )}

          {/* Transcript Preview */}
          {note.transcript && (
            <Text
              style={[styles.transcriptPreview, { color: colors.textMuted }]}
              numberOfLines={2}
            >
              {note.transcript}
            </Text>
          )}

          {/* Action Items */}
          {note.actionItems && note.actionItems.length > 0 && (
            <View style={styles.actionItemsPreview}>
              <View style={styles.actionItemsHeader}>
                <Ionicons
                  name="checkbox-outline"
                  size={14}
                  color={Colors.primary[400]}
                />
                <Text style={styles.actionItemsLabel}>
                  {note.actionItems.length} Action Items
                </Text>
              </View>
              <View style={styles.actionItemDot} />
            </View>
          )}

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {note.tags.slice(0, 3).map((tag, index) => (
                <View
                  key={index}
                  style={[
                    styles.tagBadge,
                    { backgroundColor: `${colors.primary}15` },
                  ]}
                >
                  <Text style={[styles.tagText, { color: colors.primary }]}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Pressable>
      </MotiView>
    );
  };

  // Detail Modal for selected item
  const renderDetailModal = () => {
    if (!selectedItem) return null;

    const isNote =
      selectedItem.type === 'meeting' || selectedItem.type === 'voice-memo';
    const sentiment = isNote ? getSentimentData(selectedItem) : null;

    return (
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeDetail}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.background },
          ]}
        >
          {/* Header */}
          <SafeAreaView edges={['top']}>
            <View style={styles.modalHeader}>
              <Pressable
                style={[
                  styles.closeButton,
                  { backgroundColor: colors.glassBackground },
                ]}
                onPress={closeDetail}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
              <View style={styles.modalActions}>
                <Pressable
                  style={styles.modalAction}
                  onPress={() => haptics.button()}
                >
                  <Ionicons
                    name="share-outline"
                    size={22}
                    color={colors.text}
                  />
                </Pressable>
                <Pressable
                  style={styles.modalAction}
                  onPress={() => haptics.button()}
                >
                  <Ionicons
                    name="ellipsis-horizontal"
                    size={22}
                    color={colors.text}
                  />
                </Pressable>
              </View>
            </View>
          </SafeAreaView>

          <ScrollView
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Media Display */}
            {!isNote && (
              <View style={styles.mediaContainer}>
                {selectedItem.type === 'video' ? (
                  <Video
                    source={{
                      uri: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
                    }}
                    rate={1.0}
                    volume={1.0}
                    isMuted={false}
                    resizeMode={ResizeMode.CONTAIN}
                    shouldPlay={false}
                    useNativeControls
                    style={styles.mediaVideo}
                  />
                ) : (
                  <Image
                    source={{
                      uri:
                        selectedItem.url ||
                        selectedItem.thumbnail ||
                        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
                    }}
                    style={styles.mediaImage}
                    resizeMode="contain"
                  />
                )}
              </View>
            )}

            {/* Title & Meta */}
            <View style={styles.detailSection}>
              <Text style={[styles.detailTitle, { color: colors.text }]}>
                {selectedItem.title}
              </Text>
              <View style={styles.detailMeta}>
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={colors.textMuted}
                />
                <Text
                  style={[styles.detailMetaText, { color: colors.textMuted }]}
                >
                  {selectedItem.date}
                </Text>
                {selectedItem.duration && (
                  <>
                    <View
                      style={[
                        styles.metaDot,
                        { backgroundColor: colors.textMuted },
                      ]}
                    />
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color={colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.detailMetaText,
                        { color: colors.textMuted },
                      ]}
                    >
                      {selectedItem.duration}
                    </Text>
                  </>
                )}
              </View>
            </View>

            {/* Sentiment Analysis (for notes) */}
            {sentiment && (
              <View style={styles.sentimentSection}>
                <Text
                  style={[styles.sectionLabel, { color: colors.textMuted }]}
                >
                  SENTIMENT ANALYSIS
                </Text>
                <View
                  style={[
                    styles.sentimentCard,
                    {
                      borderColor: sentiment.color,
                      backgroundColor: colors.glassBackground,
                    },
                  ]}
                >
                  <Text style={styles.sentimentEmojiLarge}>
                    {sentiment.emoji}
                  </Text>
                  <View style={styles.sentimentDetails}>
                    <Text
                      style={[styles.sentimentLabel, { color: colors.text }]}
                    >
                      {sentiment.label}
                    </Text>
                    <View
                      style={[
                        styles.sentimentBar,
                        { backgroundColor: colors.glassBackground },
                      ]}
                    >
                      <View
                        style={[
                          styles.sentimentBarFill,
                          {
                            width: `${sentiment.score}%`,
                            backgroundColor: sentiment.color,
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.sentimentScore,
                        { color: sentiment.color },
                      ]}
                    >
                      {sentiment.score}% confidence
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Summary */}
            {selectedItem.summary && (
              <View style={styles.detailSection}>
                <Text
                  style={[styles.sectionLabel, { color: colors.textMuted }]}
                >
                  SUMMARY
                </Text>
                <Text
                  style={[styles.summaryText, { color: colors.textSecondary }]}
                >
                  {selectedItem.summary}
                </Text>
              </View>
            )}

            {/* Transcript */}
            {selectedItem.transcript && (
              <View style={styles.detailSection}>
                <Text
                  style={[styles.sectionLabel, { color: colors.textMuted }]}
                >
                  TRANSCRIPT
                </Text>
                <View
                  style={[
                    styles.transcriptBox,
                    {
                      backgroundColor: colors.glassBackground,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.transcriptText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {selectedItem.transcript}
                  </Text>
                </View>
              </View>
            )}

            {/* Action Items */}
            {selectedItem.actionItems &&
              selectedItem.actionItems.length > 0 && (
                <View style={styles.detailSection}>
                  <Text
                    style={[styles.sectionLabel, { color: colors.textMuted }]}
                  >
                    ACTION ITEMS
                  </Text>
                  {selectedItem.actionItems.map((item, index) => (
                    <Pressable
                      key={index}
                      style={[
                        styles.actionItemRow,
                        { borderBottomColor: colors.border },
                      ]}
                      onPress={() => haptics.button()}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          { borderColor: colors.primary },
                        ]}
                      />
                      <Text
                        style={[
                          styles.actionItemText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {item}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

            {/* Participants */}
            {selectedItem.participants &&
              selectedItem.participants.length > 0 && (
                <View style={styles.detailSection}>
                  <Text
                    style={[styles.sectionLabel, { color: colors.textMuted }]}
                  >
                    PARTICIPANTS
                  </Text>
                  <View style={styles.participantsRow}>
                    {selectedItem.participants.map((person, index) => (
                      <View
                        key={index}
                        style={[
                          styles.participantChip,
                          { backgroundColor: colors.glassBackground },
                        ]}
                      >
                        <View
                          style={[
                            styles.participantAvatar,
                            { backgroundColor: colors.primary },
                          ]}
                        >
                          <Text style={styles.participantInitial}>
                            {person.charAt(0)}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.participantName,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {person}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

            {/* Tags */}
            {selectedItem.tags && selectedItem.tags.length > 0 && (
              <View style={styles.detailSection}>
                <Text
                  style={[styles.sectionLabel, { color: colors.textMuted }]}
                >
                  TAGS
                </Text>
                <View style={styles.tagsRow}>
                  {selectedItem.tags.map((tag, index) => (
                    <View
                      key={index}
                      style={[
                        styles.tagBadgeLarge,
                        {
                          backgroundColor: `${colors.primary}15`,
                          borderColor: `${colors.primary}30`,
                        },
                      ]}
                    >
                      <Text
                        style={[styles.tagTextLarge, { color: colors.primary }]}
                      >
                        {tag}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Linked Goals */}
            {plans.length > 0 && (
              <View style={styles.detailSection}>
                <Text
                  style={[styles.sectionLabel, { color: colors.textMuted }]}
                >
                  LINKED GOALS
                </Text>
                <View style={styles.goalsRow}>
                  {plans.slice(0, 2).map((plan, index) => (
                    <View
                      key={index}
                      style={[
                        styles.goalChip,
                        {
                          backgroundColor: `${colors.primary}15`,
                          borderColor: `${colors.primary}30`,
                        },
                      ]}
                    >
                      <Ionicons name="flag" size={14} color={colors.primary} />
                      <Text
                        style={[styles.goalText, { color: colors.primary }]}
                      >
                        {plan.title}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Actions */}
            <View style={styles.actionsRow}>
              <Pressable
                style={[
                  styles.actionButtonPrimary,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => hapticMedium()}
              >
                <Ionicons name="pencil" size={18} color="white" />
                <Text style={styles.actionButtonText}>Edit</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.actionButtonSecondary,
                  {
                    backgroundColor: `${colors.primary}15`,
                    borderColor: `${colors.primary}30`,
                  },
                ]}
                onPress={() => haptics.button()}
              >
                <Ionicons
                  name="share-outline"
                  size={18}
                  color={colors.primary}
                />
                <Text
                  style={[
                    styles.actionButtonTextSecondary,
                    { color: colors.primary },
                  ]}
                >
                  Share
                </Text>
              </Pressable>
              <Pressable
                style={styles.actionButtonDanger}
                onPress={() => haptics.button()}
              >
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
              </Pressable>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background Gradient */}
      <LinearGradient
        colors={getGradientArray('library')}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={[styles.headerWrapper, { borderColor: colors.border }]}>
          <BlurView
            intensity={isDark ? 40 : 60}
            tint={isDark ? 'dark' : 'light'}
            style={styles.headerBlur}
          >
            <LinearGradient
              colors={
                isDark
                  ? ['rgba(100, 120, 200, 0.2)', 'rgba(230, 215, 195, 0.15)']
                  : ['rgba(100, 120, 200, 0.15)', 'rgba(230, 215, 195, 0.1)']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerGradient}
            >
              <View style={styles.headerTop}>
                <View>
                  <Text style={[styles.headerTitle, { color: colors.text }]}>
                    Library
                  </Text>
                  <Text
                    style={[
                      styles.headerSubtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {filteredItems.length} items
                  </Text>
                </View>
                <ScalePressable
                  style={[
                    styles.filterButton,
                    { backgroundColor: colors.glassBackground },
                  ]}
                  onPress={() => {
                    hapticButton();
                    setSelectedFilter(null);
                  }}
                >
                  <Ionicons name="filter" size={20} color={colors.text} />
                </ScalePressable>
              </View>

              {/* Search Bar */}
              <View
                style={[
                  styles.searchContainer,
                  {
                    backgroundColor: colors.glassBackground,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons
                  name="search"
                  size={20}
                  color={colors.textMuted}
                  style={styles.searchIcon}
                />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search your library..."
                  placeholderTextColor={colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <Pressable
                    onPress={() => setSearchQuery('')}
                    style={styles.clearSearch}
                  >
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color={colors.textMuted}
                    />
                  </Pressable>
                )}
              </View>
            </LinearGradient>
          </BlurView>
        </View>

        {/* Tabs */}
        <View
          style={[
            styles.tabsContainer,
            { backgroundColor: colors.glassBackground },
          ]}
        >
          <ScalePressable
            style={[
              styles.tab,
              filter !== 'notes' && [
                styles.activeTab,
                { backgroundColor: colors.text },
              ],
            ]}
            onPress={() => {
              setFilter('personal');
              setSelectedFilter('personal');
              hapticButton();
            }}
          >
            <Ionicons
              name="images"
              size={16}
              color={filter !== 'notes' ? colors.background : colors.text}
            />
            <Text
              style={[
                styles.tabText,
                { color: colors.text },
                filter !== 'notes' && [
                  styles.activeTabText,
                  { color: colors.background },
                ],
              ]}
            >
              Personal
            </Text>
          </ScalePressable>
          <ScalePressable
            style={[
              styles.tab,
              filter === 'notes' && [
                styles.activeTab,
                { backgroundColor: colors.text },
              ],
            ]}
            onPress={() => {
              setFilter('notes');
              setSelectedFilter('notes');
              hapticButton();
            }}
          >
            <Ionicons
              name="document-text"
              size={16}
              color={filter === 'notes' ? colors.background : colors.text}
            />
            <Text
              style={[
                styles.tabText,
                { color: colors.text },
                filter === 'notes' && [
                  styles.activeTabText,
                  { color: colors.background },
                ],
              ]}
            >
              Notes
            </Text>
          </ScalePressable>
        </View>

        {/* Content */}
        {filter !== 'notes' ? (
          <>
            {/* Type Filters */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersScroll}
            >
              <ScalePressable
                style={[
                  styles.filterBadge,
                  {
                    backgroundColor: colors.glassBackground,
                    borderColor: colors.border,
                  },
                  selectedFilter === null && [
                    styles.activeFilterBadge,
                    { backgroundColor: colors.text, borderColor: colors.text },
                  ],
                ]}
                onPress={() => handleFilterChange(null)}
              >
                <Text
                  style={[
                    styles.filterBadgeText,
                    { color: colors.text },
                    selectedFilter === null && [
                      styles.activeFilterBadgeText,
                      { color: colors.background },
                    ],
                  ]}
                >
                  All
                </Text>
              </ScalePressable>
              <ScalePressable
                style={[
                  styles.filterBadge,
                  {
                    backgroundColor: colors.glassBackground,
                    borderColor: colors.border,
                  },
                  selectedFilter === 'image' && [
                    styles.activeFilterBadge,
                    { backgroundColor: colors.text, borderColor: colors.text },
                  ],
                ]}
                onPress={() => handleFilterChange('image')}
              >
                <Ionicons
                  name="image"
                  size={14}
                  color={
                    selectedFilter === 'image' ? colors.background : colors.text
                  }
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.filterBadgeText,
                    { color: colors.text },
                    selectedFilter === 'image' && [
                      styles.activeFilterBadgeText,
                      { color: colors.background },
                    ],
                  ]}
                >
                  Photos
                </Text>
              </ScalePressable>
              <ScalePressable
                style={[
                  styles.filterBadge,
                  {
                    backgroundColor: colors.glassBackground,
                    borderColor: colors.border,
                  },
                  selectedFilter === 'video' && [
                    styles.activeFilterBadge,
                    { backgroundColor: colors.text, borderColor: colors.text },
                  ],
                ]}
                onPress={() => handleFilterChange('video')}
              >
                <Ionicons
                  name="videocam"
                  size={14}
                  color={
                    selectedFilter === 'video' ? colors.background : colors.text
                  }
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.filterBadgeText,
                    { color: colors.text },
                    selectedFilter === 'video' && [
                      styles.activeFilterBadgeText,
                      { color: colors.background },
                    ],
                  ]}
                >
                  Videos
                </Text>
              </ScalePressable>
              <ScalePressable
                style={[
                  styles.filterBadge,
                  {
                    backgroundColor: colors.glassBackground,
                    borderColor: colors.border,
                  },
                  selectedFilter === 'voice-memo' && [
                    styles.activeFilterBadge,
                    { backgroundColor: colors.text, borderColor: colors.text },
                  ],
                ]}
                onPress={() => handleFilterChange('voice-memo')}
              >
                <Ionicons
                  name="mic"
                  size={14}
                  color={
                    selectedFilter === 'voice-memo'
                      ? colors.background
                      : colors.text
                  }
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.filterBadgeText,
                    { color: colors.text },
                    selectedFilter === 'voice-memo' && [
                      styles.activeFilterBadgeText,
                      { color: colors.background },
                    ],
                  ]}
                >
                  Audio
                </Text>
              </ScalePressable>
            </ScrollView>

            {/* Goal Filter */}
            {plans.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.goalsFilterScroll}
              >
                <Text
                  style={[styles.goalFilterLabel, { color: colors.textMuted }]}
                >
                  By Goal:
                </Text>
                <ScalePressable
                  style={[
                    styles.goalFilterBadge,
                    {
                      backgroundColor: `${colors.primary}15`,
                      borderColor: `${colors.primary}30`,
                    },
                    selectedGoal === null && [
                      styles.activeGoalFilterBadge,
                      {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                    ],
                  ]}
                  onPress={() => {
                    setSelectedGoal(null);
                    hapticButton();
                  }}
                >
                  <Text
                    style={[
                      styles.goalFilterText,
                      { color: colors.primary },
                      selectedGoal === null && styles.activeGoalFilterText,
                    ]}
                  >
                    All
                  </Text>
                </ScalePressable>
                {plans.slice(0, 3).map((plan) => (
                  <ScalePressable
                    key={plan.id}
                    style={[
                      styles.goalFilterBadge,
                      {
                        backgroundColor: `${colors.primary}15`,
                        borderColor: `${colors.primary}30`,
                      },
                      selectedGoal === plan.title && [
                        styles.activeGoalFilterBadge,
                        {
                          backgroundColor: colors.primary,
                          borderColor: colors.primary,
                        },
                      ],
                    ]}
                    onPress={() => {
                      setSelectedGoal(
                        selectedGoal === plan.title ? null : plan.title
                      );
                      hapticButton();
                    }}
                  >
                    <Text
                      style={[
                        styles.goalFilterText,
                        { color: colors.primary },
                        selectedGoal === plan.title &&
                          styles.activeGoalFilterText,
                      ]}
                    >
                      {plan.title}
                    </Text>
                  </ScalePressable>
                ))}
              </ScrollView>
            )}

            {/* Instagram-style Grid */}
            <FlatList
              data={filteredItems}
              renderItem={renderGridItem}
              keyExtractor={(item) => item.id}
              numColumns={GRID_COLUMNS}
              contentContainerStyle={styles.gridContainer}
              columnWrapperStyle={styles.gridRow}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                filteredItems.length === 0 && !searchQuery ? (
                  // Skeleton loading for initial load
                  <View style={styles.gridContainer}>
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <View
                        key={idx}
                        style={[styles.gridRow, { marginBottom: GRID_GAP }]}
                      >
                        {Array.from({ length: 3 }).map((_, colIdx) => (
                          <View
                            key={colIdx}
                            style={[
                              styles.gridItemContainer,
                              {
                                marginRight: colIdx === 2 ? 0 : GRID_GAP,
                                backgroundColor: colors.glassBackground,
                              },
                            ]}
                          >
                            <SkeletonImage aspectRatio={1} />
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons
                      name="images-outline"
                      size={48}
                      color={colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.emptyStateText,
                        { color: colors.textMuted },
                      ]}
                    >
                      No items found
                    </Text>
                  </View>
                )
              }
              ListFooterComponent={<View style={{ height: 120 }} />}
            />
          </>
        ) : (
          <ScrollView
            contentContainerStyle={styles.notesContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Notes Type Filter */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersScroll}
            >
              <ScalePressable
                style={[
                  styles.filterBadge,
                  {
                    backgroundColor: colors.glassBackground,
                    borderColor: colors.border,
                  },
                  selectedFilter === null && [
                    styles.activeFilterBadge,
                    { backgroundColor: colors.text, borderColor: colors.text },
                  ],
                ]}
                onPress={() => handleFilterChange(null)}
              >
                <Text
                  style={[
                    styles.filterBadgeText,
                    { color: colors.text },
                    selectedFilter === null && [
                      styles.activeFilterBadgeText,
                      { color: colors.background },
                    ],
                  ]}
                >
                  All
                </Text>
              </ScalePressable>
              <ScalePressable
                style={[
                  styles.filterBadge,
                  {
                    backgroundColor: colors.glassBackground,
                    borderColor: colors.border,
                  },
                  selectedFilter === 'meeting' && [
                    styles.activeFilterBadge,
                    { backgroundColor: colors.text, borderColor: colors.text },
                  ],
                ]}
                onPress={() => handleFilterChange('meeting')}
              >
                <Ionicons
                  name="people"
                  size={14}
                  color={
                    selectedFilter === 'meeting'
                      ? colors.background
                      : colors.text
                  }
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.filterBadgeText,
                    { color: colors.text },
                    selectedFilter === 'meeting' && [
                      styles.activeFilterBadgeText,
                      { color: colors.background },
                    ],
                  ]}
                >
                  Meetings
                </Text>
              </ScalePressable>
              <ScalePressable
                style={[
                  styles.filterBadge,
                  {
                    backgroundColor: colors.glassBackground,
                    borderColor: colors.border,
                  },
                  selectedFilter === 'voice-memo' && [
                    styles.activeFilterBadge,
                    { backgroundColor: colors.text, borderColor: colors.text },
                  ],
                ]}
                onPress={() => handleFilterChange('voice-memo')}
              >
                <Ionicons
                  name="mic"
                  size={14}
                  color={
                    selectedFilter === 'voice-memo'
                      ? colors.background
                      : colors.text
                  }
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.filterBadgeText,
                    { color: colors.text },
                    selectedFilter === 'voice-memo' && [
                      styles.activeFilterBadgeText,
                      { color: colors.background },
                    ],
                  ]}
                >
                  Voice Memos
                </Text>
              </ScalePressable>
            </ScrollView>

            {/* Notes List */}
            {filteredItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="document-text-outline"
                  size={48}
                  color={colors.textMuted}
                />
                <Text
                  style={[styles.emptyStateText, { color: colors.textMuted }]}
                >
                  No notes found
                </Text>
              </View>
            ) : (
              filteredItems.map(renderNoteCard)
            )}

            <View style={{ height: 120 }} />
          </ScrollView>
        )}

        {/* Detail Modal */}
        {renderDetailModal()}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  headerWrapper: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerBlur: {
    width: '100%',
  },
  headerGradient: {
    padding: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e0e7ff',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
  },
  clearSearch: {
    padding: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.3)',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 4,
    borderRadius: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  activeTab: {
    backgroundColor: 'white',
  },
  tabText: {
    color: 'white',
    fontWeight: '600',
  },
  activeTabText: {
    color: 'black',
  },
  filtersScroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
  },
  filterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  activeFilterBadge: {
    backgroundColor: 'white',
    borderColor: 'white',
  },
  filterBadgeText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '500',
  },
  activeFilterBadgeText: {
    color: 'black',
    fontWeight: '600',
  },
  goalsFilterScroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
    alignItems: 'center',
  },
  goalFilterLabel: {
    color: Colors.gray[400],
    fontSize: 12,
    marginRight: 4,
  },
  goalFilterBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  activeGoalFilterBadge: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  goalFilterText: {
    color: Colors.primary[300],
    fontSize: 12,
    fontWeight: '500',
  },
  activeGoalFilterText: {
    color: 'white',
  },

  // Grid Styles
  gridContainer: {
    paddingTop: 16,
    paddingHorizontal: GRID_GAP,
  },
  gridRow: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  gridItemContainer: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    backgroundColor: Colors.gray[800],
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  videoWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  gridVideo: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  videoIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 4,
  },
  audioIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  multiIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
  },

  // Notes Styles
  notesContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  noteCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  noteMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  noteDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#9ca3af',
    marginHorizontal: 6,
  },
  sentimentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  sentimentEmoji: {
    fontSize: 14,
  },
  sentimentText: {
    fontSize: 12,
    fontWeight: '700',
  },
  noteSummary: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 8,
  },
  transcriptPreview: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: 8,
  },
  actionItemsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionItemsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionItemsLabel: {
    fontSize: 12,
    color: Colors.primary[500],
    fontWeight: '600',
  },
  actionItemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f97316',
    marginLeft: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    color: Colors.primary[600],
    fontSize: 11,
    fontWeight: '500',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalAction: {
    padding: 8,
  },
  modalContent: {
    padding: 16,
  },
  mediaContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#000',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  mediaVideo: {
    width: '100%',
    height: '100%',
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    color: Colors.gray[500],
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
  },
  detailTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detailMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailMetaText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  sentimentSection: {
    marginBottom: 20,
  },
  sentimentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    gap: 16,
  },
  sentimentEmojiLarge: {
    fontSize: 36,
  },
  sentimentDetails: {
    flex: 1,
  },
  sentimentLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  sentimentBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    marginBottom: 6,
    overflow: 'hidden',
  },
  sentimentBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  sentimentScore: {
    fontSize: 12,
    fontWeight: '600',
  },
  summaryText: {
    color: Colors.gray[200],
    fontSize: 15,
    lineHeight: 22,
  },
  transcriptBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  transcriptText: {
    color: Colors.gray[300],
    fontSize: 14,
    lineHeight: 22,
  },
  actionItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.primary[400],
  },
  actionItemText: {
    color: Colors.gray[200],
    fontSize: 14,
    flex: 1,
  },
  participantsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  participantChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  participantAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantInitial: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  participantName: {
    color: Colors.gray[200],
    fontSize: 14,
  },
  tagBadgeLarge: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  tagTextLarge: {
    color: Colors.primary[300],
    fontSize: 13,
    fontWeight: '500',
  },
  goalsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  goalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  goalText: {
    color: Colors.primary[300],
    fontSize: 13,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  actionButtonPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary[500],
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  actionButtonTextSecondary: {
    color: Colors.primary[400],
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtonDanger: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    color: Colors.gray[500],
    fontSize: 14,
    marginTop: 12,
  },
});
