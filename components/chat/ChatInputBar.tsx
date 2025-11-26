import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Keyboard,
  Text,
  Modal,
  TouchableWithoutFeedback,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useVoice } from '@/lib/voice';
import { useTheme } from '@/contexts/ThemeContext';

interface ChatInputBarProps {
  onSend: (text: string, attachment?: AttachmentInfo) => void;
  onVoiceToggle?: (isRecording: boolean) => void;
  onAttachmentPress?: () => void;
  isListening?: boolean;
  isLoading?: boolean;
}

interface AttachmentInfo {
  type: 'image' | 'document';
  uri: string;
  name?: string;
  mimeType?: string;
}

// Removed static THEME - now using dynamic theme context

export function ChatInputBar({
  onSend,
  onVoiceToggle,
  isListening: externalIsListening,
  isLoading,
}: ChatInputBarProps) {
  const { colors, isDark } = useTheme();
  const [text, setText] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [attachment, setAttachment] = useState<AttachmentInfo | null>(null);
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const router = useRouter();

  // Real voice recording with transcription
  const {
    isRecording,
    isTranscribing,
    duration,
    error: voiceError,
    transcript,
    startRecording,
    stopRecording,
    cancelRecording,
    clearTranscript,
  } = useVoice();

  // Animation for recording pulse
  const pulseScale = useSharedValue(1);

  // Use either external listening state or internal recording state
  const isListening = externalIsListening || isRecording;

  // Handle transcript - add to input field
  useEffect(() => {
    if (transcript) {
      setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      clearTranscript();
    }
  }, [transcript, clearTranscript]);

  // Recording pulse animation
  useEffect(() => {
    if (isRecording) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      pulseScale.value = withSpring(1);
    }
  }, [isRecording, pulseScale]);

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const handleSend = () => {
    if (!text.trim() && !attachment) return;
    onSend(text, attachment || undefined);
    setText('');
    setAttachment(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Camera handler
  const handleCamera = async () => {
    setShowAttachments(false);

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'Camera access is required to take photos'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      setAttachment({
        type: 'image',
        uri: result.assets[0].uri,
        mimeType: result.assets[0].mimeType || 'image/jpeg',
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  // Photo library handler
  const handlePhotos = async () => {
    setShowAttachments(false);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library access is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      setAttachment({
        type: 'image',
        uri: result.assets[0].uri,
        mimeType: result.assets[0].mimeType || 'image/jpeg',
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  // Document handler
  const handleFiles = async () => {
    setShowAttachments(false);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setAttachment({
          type: 'document',
          uri: result.assets[0].uri,
          name: result.assets[0].name,
          mimeType: result.assets[0].mimeType || 'application/octet-stream',
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Document picker error:', error);
    }
  };

  // Image generation - navigate to Imagine tab
  const handleCreateImage = () => {
    setShowAttachments(false);
    Haptics.selectionAsync();
    router.push('/(tabs)/imagine' as any);
  };

  // Remove attachment
  const removeAttachment = () => {
    setAttachment(null);
    Haptics.selectionAsync();
  };

  const handleMicPress = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isRecording) {
      // Stop recording and transcribe
      await stopRecording();
    } else {
      // Start recording
      await startRecording();
    }

    // Also notify parent if callback provided
    onVoiceToggle?.(!isRecording);
  }, [isRecording, startRecording, stopRecording, onVoiceToggle]);

  const handleCancelRecording = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await cancelRecording();
    onVoiceToggle?.(false);
  }, [cancelRecording, onVoiceToggle]);

  // Format recording duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleAttachments = () => {
    Haptics.selectionAsync();
    setShowAttachments(!showAttachments);
  };

  const showSendButton = text.trim().length > 0;

  // Dynamic padding
  const bottomPadding = keyboardVisible ? 12 : Math.max(insets.bottom, 20) + 60;

  return (
    <>
      <BlurView
        intensity={isDark ? 80 : 60}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.container,
          {
            paddingBottom: bottomPadding,
            borderTopColor: colors.glassBorder,
            backgroundColor: isDark
              ? 'rgba(0,0,0,0.5)'
              : 'rgba(255,255,255,0.7)',
          },
        ]}
      >
        <View style={styles.innerContainer}>
          {/* Input Area (Contains Paperclip + Text) */}
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                borderWidth: 1,
              },
            ]}
          >
            <TouchableOpacity
              onPress={toggleAttachments}
              style={styles.paperclipButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="attach"
                size={24}
                color={colors.inputPlaceholder}
              />
            </TouchableOpacity>

            <TextInput
              ref={inputRef}
              style={[styles.input, { color: colors.text }]}
              placeholder="Ask Anything"
              placeholderTextColor={colors.inputPlaceholder}
              value={text}
              onChangeText={setText}
              multiline
              maxLength={500}
              returnKeyType="default"
            />
          </View>

          {/* Action Button (Speak / Stop / Send) */}
          {showSendButton ? (
            <TouchableOpacity
              onPress={handleSend}
              style={[styles.sendButton, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="arrow-up" size={20} color={colors.textInverse} />
            </TouchableOpacity>
          ) : isTranscribing ? (
            // Transcribing state
            <View
              style={[
                styles.speakButton,
                styles.transcribingButton,
                { backgroundColor: isDark ? '#FFFFFF' : colors.primary },
              ]}
            >
              <ActivityIndicator
                size="small"
                color={isDark ? '#000' : '#FFF'}
              />
              <Text
                style={[
                  styles.transcribingText,
                  { color: isDark ? '#000' : '#FFF' },
                ]}
              >
                ...
              </Text>
            </View>
          ) : (
            // Recording / Speak button
            <Animated.View style={isRecording ? pulseAnimatedStyle : undefined}>
              <TouchableOpacity
                onPress={handleMicPress}
                onLongPress={isRecording ? handleCancelRecording : undefined}
                delayLongPress={1000}
                style={[
                  styles.speakButton,
                  { backgroundColor: isDark ? '#FFFFFF' : colors.primary },
                  isRecording && styles.recordingButton,
                ]}
              >
                {isRecording ? (
                  <View style={styles.stopContent}>
                    <View style={styles.stopIcon} />
                    <Text style={styles.stopText}>
                      {formatDuration(duration)}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.speakContent}>
                    <Ionicons
                      name="mic"
                      size={18}
                      color={isDark ? '#000' : '#FFF'}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.speakText,
                        { color: isDark ? '#000' : '#FFF' },
                      ]}
                    >
                      Speak
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </BlurView>

      {/* Attachment Preview */}
      {attachment && (
        <View
          style={[
            styles.attachmentPreview,
            {
              backgroundColor: colors.glassBackgroundStrong,
              borderColor: colors.glassBorder,
            },
          ]}
        >
          {attachment.type === 'image' ? (
            <Image
              source={{ uri: attachment.uri }}
              style={styles.attachmentImage}
            />
          ) : (
            <View style={styles.documentPreview}>
              <Ionicons name="document-text" size={24} color={colors.text} />
              <Text
                style={[styles.documentName, { color: colors.text }]}
                numberOfLines={1}
              >
                {attachment.name || 'Document'}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={[
              styles.removeAttachment,
              { backgroundColor: colors.surface },
            ]}
            onPress={removeAttachment}
          >
            <Ionicons name="close-circle" size={24} color={colors.error} />
          </TouchableOpacity>
        </View>
      )}

      {/* Attachment Menu Modal */}
      <Modal
        visible={showAttachments}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAttachments(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowAttachments(false)}>
          <View style={styles.modalOverlay}>
            <BlurView
              intensity={isDark ? 80 : 60}
              tint={isDark ? 'dark' : 'light'}
              style={[
                styles.attachmentMenu,
                { backgroundColor: colors.glassBackgroundStrong },
              ]}
            >
              <AttachmentOption
                icon="camera-outline"
                label="Camera"
                onPress={handleCamera}
                textColor={colors.text}
              />
              <AttachmentOption
                icon="images-outline"
                label="Photos"
                onPress={handlePhotos}
                textColor={colors.text}
              />
              <AttachmentOption
                icon="document-text-outline"
                label="Files"
                onPress={handleFiles}
                textColor={colors.text}
              />
              <AttachmentOption
                icon="sparkles-outline"
                label="Create image"
                onPress={handleCreateImage}
                textColor={colors.text}
              />
            </BlurView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

function AttachmentOption({
  icon,
  label,
  onPress,
  textColor = '#FFF',
}: {
  icon: any;
  label: string;
  onPress?: () => void;
  textColor?: string;
}) {
  return (
    <TouchableOpacity style={styles.attachmentOption} onPress={onPress}>
      <Ionicons
        name={icon}
        size={24}
        color={textColor}
        style={styles.attachmentIcon}
      />
      <Text style={[styles.attachmentLabel, { color: textColor }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 0.5,
    paddingTop: 12,
    paddingHorizontal: 12,
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  paperclipButton: {
    marginRight: 8,
    padding: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingTop: 0,
    paddingBottom: 0,
  },
  speakButton: {
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  speakContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  speakText: {
    fontSize: 16,
    fontWeight: '600',
  },
  stopContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stopIcon: {
    width: 12,
    height: 12,
    backgroundColor: '#FF3B30',
    borderRadius: 2,
  },
  stopText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingButton: {
    backgroundColor: '#FF3B30',
  },
  transcribingButton: {
    flexDirection: 'row',
    gap: 8,
  },
  transcribingText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },

  // Attachment Menu
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    paddingBottom: 100,
    paddingHorizontal: 16,
  },
  attachmentMenu: {
    borderRadius: 20,
    overflow: 'hidden',
    paddingVertical: 12,
    marginBottom: 80,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  attachmentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  attachmentIcon: {
    marginRight: 14,
  },
  attachmentLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  // Attachment Preview
  attachmentPreview: {
    position: 'absolute',
    top: -80,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
  },
  attachmentImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  documentPreview: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  documentName: {
    color: '#FFF',
    fontSize: 14,
    flex: 1,
  },
  removeAttachment: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
  },
});
