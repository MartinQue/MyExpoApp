import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Theme';
import { MediaCard } from './MediaCard';
import haptics from '@/lib/haptics';

const { width } = Dimensions.get('window');

// Mock Data
const USER_PHOTOS = [
  {
    id: '1',
    source: {
      uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
    },
    type: 'image',
  },
  {
    id: '2',
    source: {
      uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop',
    },
    type: 'image',
  },
  {
    id: '3',
    source: {
      uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop',
    },
    type: 'image',
  },
  {
    id: '4',
    source: {
      uri: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop',
    },
    type: 'image',
  },
];

const TEMPLATES = [
  {
    id: 't1',
    title: 'Add Girlfriend',
    source: {
      uri: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop',
    },
    type: 'image',
  },
  {
    id: 't2',
    title: 'Thumbs Up',
    source: {
      uri: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=600&fit=crop',
    },
    type: 'image',
  },
  {
    id: 't3',
    title: 'Money Rain',
    source: {
      uri: 'https://images.unsplash.com/photo-1518183214770-9cffbec72538?w=400&h=600&fit=crop',
    },
    type: 'image',
  },
  {
    id: 't4',
    title: 'Cyberpunk',
    source: {
      uri: 'https://images.unsplash.com/photo-1515630278258-407f66498911?w=400&h=600&fit=crop',
    },
    type: 'image',
  },
];

const RECENT_CREATIONS = [
  {
    id: 'r1',
    title: 'Neon City',
    source: {
      uri: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=400&h=300&fit=crop',
    },
    type: 'image',
  },
  {
    id: 'r2',
    title: 'Space Diner',
    source: {
      uri: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=300&fit=crop',
    },
    type: 'video',
  },
];

interface ImagineFeedProps {
  onTemplatePress: (template: any) => void;
}

export function ImagineFeed({ onTemplatePress }: ImagineFeedProps) {
  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Animate Your Photos */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Animate your photos</Text>
          <Pressable onPress={() => haptics.selection()}>
            <Text style={styles.seeAll}>See All {'>'}</Text>
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {USER_PHOTOS.map((photo) => (
            <MediaCard
              key={photo.id}
              source={photo.source}
              type={photo.type as any}
              style={styles.portraitCard}
              onPress={() => onTemplatePress(photo)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Create from Template */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Create from template</Text>
        <View style={styles.grid}>
          {TEMPLATES.map((template) => (
            <MediaCard
              key={template.id}
              source={template.source}
              title={template.title}
              type={template.type as any}
              style={styles.gridCard}
              onPress={() => onTemplatePress(template)}
            />
          ))}
        </View>
      </View>

      {/* Recent Creations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Creations</Text>
        <View style={styles.grid}>
          {RECENT_CREATIONS.map((creation) => (
            <MediaCard
              key={creation.id}
              source={creation.source}
              title={creation.title}
              type={creation.type as any}
              style={styles.landscapeCard}
              onPress={() => onTemplatePress(creation)}
            />
          ))}
        </View>
      </View>

      {/* Bottom Spacer for Input Bar */}
      <View style={{ height: 150 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  seeAll: {
    color: Colors.gray[400],
    fontSize: 14,
  },
  horizontalScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  portraitCard: {
    width: 120,
    height: 180,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  gridCard: {
    width: (width - 44) / 3, // 3 columns
    height: 160,
  },
  landscapeCard: {
    width: (width - 40) / 2, // 2 columns
    height: 120,
  },
});
