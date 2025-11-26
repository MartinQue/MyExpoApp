import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Theme';

interface MediaCardProps {
  source: any;
  title?: string;
  type: 'image' | 'video';
  onPress?: () => void;
  style?: any;
}

export function MediaCard({
  source,
  title,
  type,
  onPress,
  style,
}: MediaCardProps) {
  return (
    <Pressable style={[styles.container, style]} onPress={onPress}>
      <Image source={source} style={styles.image} resizeMode="cover" />

      {type === 'video' && (
        <View style={styles.playIconContainer}>
          <Ionicons name="play" size={20} color="white" />
        </View>
      )}

      {title && (
        <View style={styles.overlay}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  playIconContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  title: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 4,
  },
});
