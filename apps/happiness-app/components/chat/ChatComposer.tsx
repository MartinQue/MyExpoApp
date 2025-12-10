import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  Text,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { Colors } from '../../constants/Theme';
import {
  send as hapticSend,
  medium as hapticMedium,
  selection as hapticSelection,
} from '@/lib/haptics';

interface ChatInputProps {
  onSend: (text: string) => void;
  voiceMode: boolean;
  onToggleVoiceMode: () => void;
}

export function ChatComposer({
  onSend,
  voiceMode,
  onToggleVoiceMode,
}: ChatInputProps) {
  const [text, setText] = useState('');
  const [showAttachments, setShowAttachments] = useState(false);

  const handleSend = () => {
    if (!text.trim()) return;
    hapticSend();
    onSend(text);
    setText('');
  };

  const handleToggleVoice = () => {
    hapticMedium();
    onToggleVoiceMode();
  };

  const toggleAttachments = () => {
    hapticSelection();
    Keyboard.dismiss();
    setShowAttachments(!showAttachments);
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.pillContainer}>
          {/* Left: Attachment */}
          <Pressable style={styles.iconButton} onPress={toggleAttachments}>
            <Ionicons
              name="add-circle-outline"
              size={28}
              color={Colors.gray[400]}
            />
          </Pressable>

          {/* Middle: Input */}
          <TextInput
            style={styles.input}
            placeholder="Ask Anything"
            placeholderTextColor={Colors.gray[500]}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
          />

          {/* Right: Speak/Stop or Send */}
          {text.trim().length > 0 ? (
            <Pressable style={styles.sendButton} onPress={handleSend}>
              <Ionicons name="arrow-up" size={20} color="black" />
            </Pressable>
          ) : (
            <Pressable
              style={[
                styles.voiceButton,
                voiceMode && styles.voiceButtonActive,
              ]}
              onPress={handleToggleVoice}
            >
              {voiceMode ? (
                <View style={styles.stopIcon} />
              ) : (
                <Text style={styles.voiceButtonText}>Speak</Text>
              )}
            </Pressable>
          )}
        </View>
      </View>

      {/* Attachment Overlay */}
      <Modal
        visible={showAttachments}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAttachments(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowAttachments(false)}>
          <View style={styles.overlayBackdrop}>
            <TouchableWithoutFeedback>
              <MotiView
                from={{ translateY: 200, opacity: 0 }}
                animate={{ translateY: 0, opacity: 1 }}
                transition={{ type: 'timing', duration: 250 }}
                style={styles.overlayPanel}
              >
                <BlurView
                  intensity={80}
                  tint="dark"
                  style={styles.blurContainer}
                >
                  <View style={styles.attachmentOptions}>
                    {[
                      { label: 'Photo', icon: 'image-outline' },
                      { label: 'Camera', icon: 'camera-outline' },
                      { label: 'File', icon: 'document-text-outline' },
                    ].map((opt) => (
                      <Pressable
                        key={opt.label}
                        style={styles.attachmentOption}
                        onPress={() => {
                          hapticSelection();
                          setShowAttachments(false);
                        }}
                      >
                        <View style={styles.optionIcon}>
                          <Ionicons
                            name={opt.icon as any}
                            size={24}
                            color="white"
                          />
                        </View>
                        <Text style={styles.optionLabel}>{opt.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </BlurView>
              </MotiView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

export default ChatComposer;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 10 : 16,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1C20',
    borderRadius: 30,
    paddingHorizontal: 8,
    paddingVertical: 8,
    minHeight: 56,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  iconButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 4, // Center text vertically
  },
  voiceButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginLeft: 8,
  },
  voiceButtonActive: {
    backgroundColor: 'white',
  },
  voiceButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  stopIcon: {
    width: 14,
    height: 14,
    backgroundColor: 'black',
    borderRadius: 2,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  // Overlay
  overlayBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  overlayPanel: {
    margin: 16,
    marginBottom: 40,
    borderRadius: 24,
    overflow: 'hidden',
  },
  blurContainer: {
    padding: 24,
    alignItems: 'center',
  },
  attachmentOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  attachmentOption: {
    alignItems: 'center',
    gap: 8,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});
