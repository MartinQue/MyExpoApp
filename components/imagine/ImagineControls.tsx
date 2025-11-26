import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Theme';
import * as Haptics from 'expo-haptics';

interface ImagineControlsProps {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  aspectRatio: string;
  setAspectRatio: (ratio: string) => void;
}

const MODELS = [
  { id: 'flux', name: 'Flux', icon: 'flash' },
  { id: 'sora', name: 'Sora', icon: 'videocam' },
  { id: 'dalle', name: 'DALL·E 3', icon: 'image' },
];

const RATIOS = [
  { id: '1:1', label: 'Square', icon: 'square-outline' },
  { id: '16:9', label: 'Landscape', icon: 'resize-outline' },
  { id: '9:16', label: 'Portrait', icon: 'phone-portrait-outline' },
];

export function ImagineControls({
  selectedModel,
  setSelectedModel,
  aspectRatio,
  setAspectRatio,
}: ImagineControlsProps) {
  return (
    <View style={styles.container}>
      {/* Model Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Model</Text>
        <View style={styles.row}>
          {MODELS.map((model) => (
            <Pressable
              key={model.id}
              style={[
                styles.optionButton,
                selectedModel === model.id && styles.optionButtonActive,
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedModel(model.id);
              }}
            >
              <Ionicons
                name={model.icon as any}
                size={20}
                color={selectedModel === model.id ? 'white' : Colors.gray[400]}
              />
              <Text
                style={[
                  styles.optionText,
                  selectedModel === model.id && styles.optionTextActive,
                ]}
              >
                {model.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Aspect Ratio Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Aspect Ratio</Text>
        <View style={styles.row}>
          {RATIOS.map((ratio) => (
            <Pressable
              key={ratio.id}
              style={[
                styles.optionButton,
                aspectRatio === ratio.id && styles.optionButtonActive,
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setAspectRatio(ratio.id);
              }}
            >
              <Ionicons
                name={ratio.icon as any}
                size={20}
                color={aspectRatio === ratio.id ? 'white' : Colors.gray[400]}
              />
              <Text
                style={[
                  styles.optionText,
                  aspectRatio === ratio.id && styles.optionTextActive,
                ]}
              >
                {ratio.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: Colors.gray[400],
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
  },
  optionButtonActive: {
    backgroundColor: Colors.primary[900],
    borderColor: Colors.primary[500],
  },
  optionText: {
    color: Colors.gray[400],
    fontSize: 14,
    fontWeight: '500',
  },
  optionTextActive: {
    color: 'white',
    fontWeight: '600',
  },
});
