import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Video, ResizeMode } from 'expo-av';
import { useLibraryStore } from '@/stores/libraryStore';
import { ScalePressable } from '../ui/ScalePressable';

export default function LibraryTab() {
  const {
    personalItems,
    noteItems,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
  } = useLibraryStore();

  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  const handleFilterChange = (filter: string | null) => {
    Haptics.selectionAsync();
    setSelectedFilter(filter);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerWrapper}>
            <BlurView intensity={20} tint="light" style={styles.headerBlur}>
              <LinearGradient
                colors={[
                  'rgba(100, 120, 200, 0.2)',
                  'rgba(230, 215, 195, 0.15)',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerGradient}
              >
                <View style={styles.headerTop}>
                  <View>
                    <Text style={styles.headerTitle}>Library</Text>
                    <Text style={styles.headerSubtitle}>
                      Your organized archive
                    </Text>
                  </View>
                  <ScalePressable
                    style={styles.filterButton}
                    onPress={() => {}}
                  >
                    <Ionicons name="filter" size={20} color="white" />
                  </ScalePressable>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                  <Ionicons
                    name="search"
                    size={20}
                    color="#a5b4fc"
                    style={styles.searchIcon}
                  />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search your library..."
                    placeholderTextColor="#c7d2fe"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
              </LinearGradient>
            </BlurView>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <ScalePressable
              style={[styles.tab, filter !== 'notes' && styles.activeTab]}
              onPress={() => {
                setFilter('personal');
                Haptics.selectionAsync();
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  filter !== 'notes' && styles.activeTabText,
                ]}
              >
                Personal
              </Text>
            </ScalePressable>
            <ScalePressable
              style={[styles.tab, filter === 'notes' && styles.activeTab]}
              onPress={() => {
                setFilter('notes');
                Haptics.selectionAsync();
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  filter === 'notes' && styles.activeTabText,
                ]}
              >
                Notes
              </Text>
            </ScalePressable>
          </View>

          {/* Content */}
          {filter !== 'notes' ? (
            <View style={styles.contentSection}>
              {/* Filters */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filtersScroll}
              >
                <ScalePressable
                  style={[
                    styles.filterBadge,
                    selectedFilter === null && styles.activeFilterBadge,
                  ]}
                  onPress={() => handleFilterChange(null)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      selectedFilter === null && styles.activeFilterText,
                    ]}
                  >
                    All
                  </Text>
                </ScalePressable>
                <ScalePressable
                  style={[
                    styles.filterBadge,
                    selectedFilter === 'image' && styles.activeFilterBadge,
                  ]}
                  onPress={() => handleFilterChange('image')}
                >
                  <Ionicons
                    name="image"
                    size={14}
                    color={selectedFilter === 'image' ? 'black' : 'white'}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.filterText,
                      selectedFilter === 'image' && styles.activeFilterText,
                    ]}
                  >
                    Images
                  </Text>
                </ScalePressable>
                <ScalePressable
                  style={[
                    styles.filterBadge,
                    selectedFilter === 'video' && styles.activeFilterBadge,
                  ]}
                  onPress={() => handleFilterChange('video')}
                >
                  <Ionicons
                    name="videocam"
                    size={14}
                    color={selectedFilter === 'video' ? 'black' : 'white'}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.filterText,
                      selectedFilter === 'video' && styles.activeFilterText,
                    ]}
                  >
                    Videos
                  </Text>
                </ScalePressable>
              </ScrollView>

              {/* Grid */}
              <View style={styles.grid}>
                {personalItems
                  .filter(
                    (item) =>
                      (!selectedFilter || item.type === selectedFilter) &&
                      item.title
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())
                  )
                  .map((item) => (
                    <View key={item.id} style={styles.gridItem}>
                      <Image
                        source={{ uri: item.url || item.thumbnail }}
                        style={styles.gridImage}
                      />
                      {item.type === 'video' && (
                        <View style={styles.videoContainer}>
                          <Video
                            source={{
                              uri: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
                            }} // Placeholder for demo
                            rate={1.0}
                            volume={1.0}
                            isMuted={true}
                            resizeMode={ResizeMode.COVER}
                            shouldPlay={false}
                            isLooping
                            style={styles.gridImage}
                            useNativeControls={false}
                          />
                          <View style={styles.videoOverlay}>
                            <Ionicons name="play" size={24} color="white" />
                          </View>
                          <View style={styles.durationBadge}>
                            <Text style={styles.durationText}>
                              {item.duration}
                            </Text>
                          </View>
                        </View>
                      )}
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={styles.itemGradient}
                      >
                        <Text style={styles.itemTitle}>{item.title}</Text>
                        <View style={styles.tagsRow}>
                          {item.tags?.map((tag, index) => (
                            <View key={index} style={styles.tagBadge}>
                              <Text style={styles.tagText}>{tag}</Text>
                            </View>
                          ))}
                        </View>
                      </LinearGradient>
                    </View>
                  ))}
              </View>
            </View>
          ) : (
            <View style={styles.contentSection}>
              {noteItems
                .filter((note) =>
                  note.title.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((note) => (
                  <View key={note.id} style={styles.noteCard}>
                    <View style={styles.noteHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.noteTitle}>{note.title}</Text>
                        <View style={styles.noteMetaRow}>
                          <Ionicons
                            name="calendar-outline"
                            size={14}
                            color="#6b7280"
                          />
                          <Text style={styles.noteDate}>{note.date}</Text>
                        </View>
                      </View>
                      <View style={styles.noteTypeBadge}>
                        <Ionicons
                          name={
                            note.type === 'meeting'
                              ? 'people-outline'
                              : 'mic-outline'
                          }
                          size={14}
                          color="black"
                        />
                        <Text style={styles.noteTypeText}>
                          {note.type === 'meeting' ? 'Meeting' : 'Voice'}
                        </Text>
                      </View>
                    </View>

                    {note.type === 'meeting' && (
                      <>
                        <Text style={styles.noteSummary}>{note.summary}</Text>
                        {note.actionItems && (
                          <View style={styles.actionItemsContainer}>
                            <Text style={styles.actionItemsTitle}>
                              Action Items:
                            </Text>
                            {note.actionItems.map((item, i) => (
                              <View key={i} style={styles.actionItem}>
                                <View style={styles.bullet} />
                                <Text style={styles.actionItemText}>
                                  {item}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </>
                    )}

                    {note.type === 'voice-memo' && (
                      <>
                        <Text style={styles.noteSummary}>
                          {note.transcript}
                        </Text>
                        <Text style={styles.durationTextDark}>
                          Duration: {note.duration}
                        </Text>
                      </>
                    )}
                  </View>
                ))}
            </View>
          )}

          {/* Spacer for bottom nav */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#1e1a28', // Removed to show gradient
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
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
    color: '#e0e7ff', // indigo-100
  },
  iconButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.3)',
    marginHorizontal: 16,
    marginTop: 20,
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
  contentSection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  filtersScroll: {
    gap: 8,
    marginBottom: 16,
  },
  filterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  activeFilterBadge: {
    backgroundColor: 'white',
    borderColor: 'white',
  },
  filterText: {
    color: 'white',
    fontSize: 13,
  },
  activeFilterText: {
    color: 'black',
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#2d2d2d',
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  videoContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  playButton: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 10,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  itemGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    paddingTop: 30,
  },
  itemTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  tagBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    color: 'white',
    fontSize: 10,
  },
  noteCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
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
  noteTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  noteTypeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  noteSummary: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 12,
    lineHeight: 20,
  },
  actionItemsContainer: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
  },
  actionItemsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },

  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4f46e5',
    marginTop: 6,
    marginRight: 8,
  },
  actionItemText: {
    fontSize: 13,
    color: '#4b5563',
    flex: 1,
  },
  durationTextDark: {
    fontSize: 12,
    color: '#6b7280',
  },
});
