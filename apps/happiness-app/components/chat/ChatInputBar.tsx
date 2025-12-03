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
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useVoiceContext } from '@/contexts/VoiceContext';
import haptics from '@/lib/haptics';

interface ChatInputBarProps {
  onSend: (text: string, attachment?: AttachmentInfo) => void;
  onVoiceToggle?: (isRecording: boolean) => void;
  onCancelRecording?: () => void;
  isListening?: boolean;
  isLoading?: boolean;
  isTranscribing?: boolean;
  recordingDuration?: number;
  showCamera?: boolean;
  onCameraPress?: () => void;
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
  onCancelRecording,
  isListening: externalIsListening,
  isLoading,
  isTranscribing,
  recordingDuration = 0,
  showCamera = false,
  onCameraPress,
}: ChatInputBarProps) {
  const { colors, isDark } = useTheme();
  const { error: voiceError } = useVoiceContext();
  const [text, setText] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [attachment, setAttachment] = useState<AttachmentInfo | null>(null);
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const router = useRouter();

  // Animation for recording pulse
  const pulseScale = useSharedValue(1);

  // Use either external listening state or internal recording state
  const isListening = !!externalIsListening;

  // Recording pulse animation
  useEffect(() => {
    if (isListening) {
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
  }, [isListening, pulseScale]);

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
    haptics.send();
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
      haptics.success();
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
      haptics.success();
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
        haptics.success();
      }
    } catch (error) {
      console.error('Document picker error:', error);
    }
  };

  // Image generation - navigate to Imagine tab
  const handleCreateImage = () => {
    setShowAttachments(false);
    haptics.selection();
    router.push('/(tabs)/imagine' as any);
  };

  // Remove attachment
  const removeAttachment = () => {
    setAttachment(null);
    haptics.selection();
  };

  const handleMicPress = useCallback(async () => {
    if (isTranscribing) return;
    haptics.selection();
    onVoiceToggle?.(!isListening);
  }, [isListening, isTranscribing, onVoiceToggle]);

  const handleCancelRecording = useCallback(async () => {
    haptics.warning();
    if (onCancelRecording) {
      await onCancelRecording();
    } else {
      onVoiceToggle?.(false);
    }
    onVoiceToggle?.(false);
  }, [onCancelRecording, onVoiceToggle]);

  // Format recording duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleAttachments = () => {
    haptics.selection();
    setShowAttachments(!showAttachments);
  };

  // Dynamic padding to account for tab bar + 12px gap
  // TAB_BAR_HEIGHT = 84 (iOS) / 66 (Android) + CHAT_BAR_GAP (12px)
  // Total: 96px iOS, 78px Android when keyboard hidden
  const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 84 : 66;
  const CHAT_BAR_GAP = 12;
  
  const bottomPadding = keyboardVisible
    ? Math.max(insets.bottom, 12) + 8
    : TAB_BAR_HEIGHT + CHAT_BAR_GAP;

  return (
    <>
      <BlurView
        intensity={isDark ? 80 : 50}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.container,
          {
            paddingBottom: bottomPadding,
            borderTopColor: isDark 
              ? 'rgba(255,255,255,0.15)' 
              : 'rgba(0,0,0,0.1)',
            backgroundColor: isDark
              ? 'rgba(10,10,15,0.5)'
              : 'rgba(255,255,255,0.5)',
          },
        ]}
      >
        {/* Voice Wave Animation */}
        {isListening && (
          <View style={styles.voiceWaveContainer}>
            <VoiceWaveAnimation />
          </View>
        )}

        <View style={styles.innerContainer}>
          {/* Left: Circular Mic Button */}
          <Animated.View style={isListening ? pulseAnimatedStyle : undefined}>
            <TouchableOpacity
              onPress={handleMicPress}
              onLongPress={isListening ? handleCancelRecording : undefined}
              delayLongPress={1000}
              disabled={isTranscribing}
              style={[
                styles.micButton,
                {
                  backgroundColor: isListening 
                    ? '#FF3B30' 
                    : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'),
                  borderColor: isListening ? '#FF3B30' : colors.glassBorder,
                },
              ]}
            >
              {isTranscribing ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <Ionicons
                  name={isListening ? 'stop' : 'mic'}
                  size={24}
                  color={isListening ? '#FFF' : colors.text}
                />
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Optional: Camera Button (Grok Alter Ego Style) */}
          {showCamera && (
            <TouchableOpacity
              onPress={onCameraPress || handleCamera}
              style={[
                styles.micButton, // Reusing mic button shape
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  borderColor: colors.glassBorder,
                },
              ]}
            >
              <Ionicons
                name="camera-outline"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          )}

          {/* Center: Glassmorphism Text Input Pill */}
          <View
            style={[
              styles.inputPill,
              {
                backgroundColor: isDark
                  ? 'rgba(255,255,255,0.1)'
                  : 'rgba(0,0,0,0.05)',
                borderColor: isDark 
                  ? 'rgba(255,255,255,0.2)' 
                  : 'rgba(0,0,0,0.1)',
              },
            ]}
          >
            <TouchableOpacity
              onPress={toggleAttachments}
              style={styles.attachButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="attach"
                size={20}
                color={colors.inputPlaceholder}
              />
            </TouchableOpacity>

            <TextInput
              ref={inputRef}
              style={[styles.input, { color: colors.text }]}
              placeholder="Ask anything..."
              placeholderTextColor={colors.inputPlaceholder}
              value={text}
              onChangeText={setText}
              multiline
              maxLength={500}
              returnKeyType="default"
            />
          </View>

          {/* Right: Text Button */}
          <TouchableOpacity
            onPress={handleSend}
            disabled={!text.trim() && !attachment}
            style={[
              styles.textButton,
              {
                backgroundColor: text.trim() || attachment 
                  ? (isDark ? '#FFF' : '#000')
                  : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'),
              },
            ]}
          >
            <Text
              style={[
                styles.textButtonLabel,
                {
                  color: text.trim() || attachment 
                    ? (isDark ? '#000' : '#FFF')
                    : (isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'),
                },
              ]}
            >
              Text
            </Text>
          </TouchableOpacity>
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
                {
                  backgroundColor: colors.glassBackgroundStrong,
                  borderColor: colors.glassBorder,
                },
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

      {voiceError && (
        <View style={styles.voiceErrorContainer}>
          <Ionicons name="alert-circle" size={16} color={colors.error} />
          <Text style={[styles.voiceErrorText, { color: colors.error }]}>
            {voiceError}
          </Text>
        </View>
      )}
    </>
  );
}

function VoiceWaveAnimation() {
  const wave1 = useSharedValue(0.3);
  const wave2 = useSharedValue(0.5);
  const wave3 = useSharedValue(0.4);
  const wave4 = useSharedValue(0.6);

  useEffect(() => {
    wave1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 400, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
    wave2.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 350, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: 350, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
    wave3.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 450, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 450, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
    wave4.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 380, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.6, { duration: 380, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
  }, []);

  const createBarStyle = (sharedValue: any) =>
    useAnimatedStyle(() => ({
      height: `${sharedValue.value * 100}%`,
    }));

  return (
    <View style={styles.waveContainer}>
      <Animated.View style={[styles.waveBar, createBarStyle(wave1)]} />
      <Animated.View style={[styles.waveBar, createBarStyle(wave2)]} />
      <Animated.View style={[styles.waveBar, createBarStyle(wave3)]} />
      <Animated.View style={[styles.waveBar, createBarStyle(wave4)]} />
    </View>
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
      <View style={styles.attachmentIconBadge}>
        <Ionicons
          name={icon}
          size={20}
          color={textColor}
          style={styles.attachmentIcon}
        />
      </View>
      <Text style={[styles.attachmentLabel, { color: textColor }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingTop: 12,
    paddingHorizontal: 12,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 56,
  },
  
  // Voice Wave Animation
  voiceWaveContainer: {
    position: 'absolute',
    bottom: 68,
    left: 0,
    right: 0,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 40,
  },
  waveBar: {
    width: 3,
    backgroundColor: '#007AFF',
    borderRadius: 1.5,
    minHeight: 8,
  },

  // Left: Mic Button
  micButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },

  // Center: Input Pill
  inputPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 28,
    paddingHorizontal: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  attachButton: {
    marginRight: 8,
    padding: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 80,
    paddingTop: 0,
    paddingBottom: 0,
  },

  // Right: Text Button
  textButton: {
    height: 56,
    minWidth: 72,
    paddingHorizontal: 24,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Legacy styles (kept for reference/removal)
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  paperclipButton: {
    marginRight: 8,
    padding: 4,
  },
  speakButton: {
    height: 52,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
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
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
  },
  attachmentMenu: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    width: 200,
    borderRadius: 16,
    overflow: 'hidden',
    paddingVertical: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  attachmentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    columnGap: 12,
  },
  attachmentIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  attachmentIcon: {
    marginRight: 0,
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
  voiceErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  voiceErrorText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
