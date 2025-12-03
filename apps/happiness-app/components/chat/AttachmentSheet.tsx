import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

// This is a placeholder for the actual sheet logic.
// In a real app, this would likely be a Modal or a BottomSheet component.
// For now, we'll just export a function to show an alert, as implemented in ChatHelpers.
// But if we wanted a component, it would look like this:

export function AttachmentSheet() {
  return (
    <View style={styles.container}>
      <BlurView intensity={80} tint="dark" style={styles.content}>
        <View style={styles.handle} />
        <Text style={styles.title}>Attachments</Text>
        <View style={styles.grid}>
          <Option icon="camera" label="Camera" />
          <Option icon="images" label="Photos" />
          <Option icon="document-text" label="Files" />
          <Option icon="location" label="Location" />
        </View>
      </BlurView>
    </View>
  );
}

function Option({ icon, label }: { icon: any; label: string }) {
  return (
    <TouchableOpacity style={styles.option}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={24} color="#FFF" />
      </View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  content: {
    flex: 1,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  option: {
    alignItems: 'center',
    width: '20%',
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3A3A3C',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    color: '#8E8E93',
    fontSize: 12,
  },
});
