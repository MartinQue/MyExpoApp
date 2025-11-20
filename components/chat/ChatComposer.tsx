import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';

import { Colors } from '../../constants/Theme';
import { GlassView } from '../Glass/GlassView';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ChatComposerProps {
  onSend?: (text: string) => void;
  messages?: any[];
  voiceMode: boolean;
  onToggleVoiceMode: () => void;
}

export default function ChatComposer({
  onSend,
  voiceMode,
  onToggleVoiceMode,
}: ChatComposerProps) {
  const [text, setText] = useState('');
  const [showAttachments, setShowAttachments] = useState(false);

  const handleToggleVoiceMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    console.log('Toggling Voice Mode:', !voiceMode);

    LayoutAnimation.configureNext({
      duration: 500,
      create: {
        type: LayoutAnimation.Types.spring,
        property: LayoutAnimation.Properties.scaleXY,
        springDamping: 0.8,
      },
      update: {
        type: LayoutAnimation.Types.spring,
        springDamping: 0.8,
      },
      delete: {
        type: LayoutAnimation.Types.linear,
        property: LayoutAnimation.Properties.opacity,
        duration: 200,
      },
    });
    onToggleVoiceMode();
  };

  const toggleAttachments = async () => {
    await Haptics.selectionAsync();
    setShowAttachments(!showAttachments);
  };

  const handleSend = async () => {
    if (!text.trim()) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('Send:', text);
    onSend?.(text);
    setText('');
  };

  const handleAttachmentAction = async (action: string) => {
    await Haptics.selectionAsync();
    setShowAttachments(false);
    console.log('Action Selected', action);
  };

  return (
    <View style={styles.container}>
      {/* Voice Mode Controls (Above Composer) */}
      {voiceMode && (
        <View style={styles.voiceModeContainer}>
          {/* Status Indicator */}
          <View style={styles.statusContainer}>
            <Ionicons
              name="bar-chart-outline"
              size={16}
              color={Colors.gray[400]}
            />
            <Text style={styles.statusText}>Start talking</Text>
          </View>

          {/* 4 Action Buttons */}
          <View style={styles.voiceControlsRow}>
            {[
              { icon: 'videocam-off-outline', active: false },
              { icon: 'volume-medium-outline', active: true },
              { icon: 'mic', active: true },
              { icon: 'settings-outline', active: false },
            ].map((item, idx) => (
              <GlassView
                key={idx}
                intensity={20}
                style={styles.voiceControlBtn}
              >
                <Ionicons
                  name={item.icon as any}
                  size={24}
                  color={item.active ? 'white' : Colors.gray[400]}
                />
              </GlassView>
            ))}
          </View>
        </View>
      )}

      {/* Attachment Menu Overlay */}
      {showAttachments && (
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          style={styles.attachmentMenu}
        >
          <GlassView intensity={90} style={styles.attachmentGlass}>
            {[
              { label: 'Camera', icon: 'camera-outline' },
              { label: 'Photos', icon: 'images-outline' },
              { label: 'Files', icon: 'document-text-outline' },
              {
                label: 'Create image',
                icon: 'color-wand-outline',
                highlight: true,
              },
            ].map((item, index) => (
              <Pressable
                key={index}
                style={[
                  styles.attachmentItem,
                  item.highlight && styles.highlightedItem,
                ]}
                onPress={() => handleAttachmentAction(item.label)}
              >
                <Ionicons name={item.icon as any} size={20} color="white" />
                <Text style={styles.attachmentText}>{item.label}</Text>
              </Pressable>
            ))}
          </GlassView>
        </MotiView>
      )}

      {/* Main Composer Panel */}
      {voiceMode ? (
        // Voice Mode Composer (Compact Input + Stop)
        <View style={styles.voiceComposerRow}>
          <GlassView intensity={80} style={styles.voiceInputPill}>
            <TextInput
              style={styles.voiceInput}
              placeholder="Ask Anything"
              placeholderTextColor={Colors.gray[500]}
              value={text}
              onChangeText={setText}
              editable={false} // Input disabled in voice mode usually? Or maybe active for corrections.
            />
          </GlassView>
          <Pressable
            style={styles.stopButton}
            onPress={handleToggleVoiceMode}
            hitSlop={10}
          >
            <Ionicons name="square" size={12} color="black" />
            <Text style={styles.stopText}>Stop</Text>
          </Pressable>
        </View>
      ) : (
        // Standard Composer Panel
        <GlassView intensity={80} style={styles.composerPanel}>
          <View style={styles.panelContent}>
            {/* Top: Input */}
            <TextInput
              style={styles.input}
              placeholder="Ask Anything"
              placeholderTextColor={Colors.gray[500]}
              value={text}
              onChangeText={setText}
              multiline
              maxLength={1000}
            />

            {/* Bottom Row: Controls */}
            <View style={styles.controlsRow}>
              <View style={styles.leftControls}>
                {/* Attachment */}
                <Pressable
                  style={styles.iconButton}
                  onPress={toggleAttachments}
                >
                  <Ionicons name="attach" size={24} color={Colors.gray[400]} />
                </Pressable>
              </View>

              {/* Right: Speak/Send */}
              {text.trim().length > 0 ? (
                <Pressable style={styles.sendButton} onPress={handleSend}>
                  <Ionicons name="arrow-up" size={20} color="black" />
                </Pressable>
              ) : (
                <Pressable
                  style={styles.speakButton}
                  onPress={handleToggleVoiceMode}
                  hitSlop={10}
                >
                  <Ionicons name="mic" size={18} color="black" />
                  <Text style={styles.speakText}>Speak</Text>
                </Pressable>
              )}
            </View>
          </View>
        </GlassView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 12,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
  },
  // Voice Mode
  voiceModeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  statusText: {
    color: Colors.gray[400],
    fontSize: 14,
    fontWeight: '500',
  },
  voiceControlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  voiceControlBtn: {
    width: 56, // Slightly smaller
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    // Removed background/border to fix "double icon" look
  },
  // Voice Composer
  voiceComposerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 50, // Explicit height for "shrunk" feel
  },
  voiceInputPill: {
    flex: 1,
    height: '100%',
    borderRadius: 25,
    backgroundColor: 'rgba(20, 20, 25, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  voiceInput: {
    color: 'white',
    fontSize: 16,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'white',
    paddingHorizontal: 20,
    height: '100%',
    borderRadius: 25,
    minWidth: 100,
  },
  stopText: {
    color: 'black',
    fontSize: 16,
    fontWeight: '700',
  },
  // Composer Panel
  composerPanel: {
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: 'rgba(20, 20, 25, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  panelContent: {
    padding: 16,
    gap: 12,
  },
  input: {
    color: 'white',
    fontSize: 18,
    minHeight: 40,
    maxHeight: 120,
    padding: 0,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  modelSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  modelSelectorText: {
    color: Colors.gray[200],
    fontSize: 14,
    fontWeight: '600',
  },
  speakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  speakText: {
    color: 'black',
    fontSize: 15,
    fontWeight: '700',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Attachment Menu
  attachmentMenu: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    width: 220,
    zIndex: 999,
  },
  attachmentGlass: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(30, 30, 35, 0.3)',
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  highlightedItem: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  attachmentText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '500',
  },
});
