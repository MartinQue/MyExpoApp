/**
 * GrokChatInputBar.tsx - Grok-Style Input Bar
 *
 * Matches Grok's exact input bar style:
 * - Mic button | Camera button | "Ask Anything" | Text button
 * - Attachment menu (Camera/Photos/Files)
 * - Voice recording state
 */

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
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../contexts/ThemeContext';
import {
  send as hapticSend,
  success as hapticSuccess,
  selection as hapticSelection,
} from '../../lib/haptics';

const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 88 : 70;

interface GrokChatInputBarProps {
  onSend: (text: string, attachment?: AttachmentInfo) => void;
  onVoiceToggle?: (isRecording: boolean) => void;
  onCancelRecording?: () => void;
  isListening?: boolean;
  isLoading?: boolean;
  isTranscribing?: boolean;
  recordingDuration?: number;
  placeholder?: string;
  companionName?: string;
}

interface AttachmentInfo {
  type: 'image' | 'document';
  uri: string;
  name?: string;
  mimeType?: string;
}

export function GrokChatInputBar({
  onSend,
  onVoiceToggle,
  onCancelRecording,
  isListening: externalIsListening,
  isLoading,
  isTranscribing,
  recordingDuration = 0,
  placeholder = 'Ask Anything',
  companionName = 'Companion',
}: GrokChatInputBarProps) {
  const { colors, isDark } = useTheme();
  const [text, setText] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showAttachments, setShowAttachments] = useState(false);
  const [attachment, setAttachment] = useState<AttachmentInfo | null>(null);
  const [isTextMode, setIsTextMode] = useState(false);
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const isListening = !!externalIsListening;

  // Animation for input bar
  const barScale = useSharedValue(1);

  useEffect(() => {
    const showListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setIsTextMode(true);
      }
    );
    const hideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        if (!text.trim()) {
          setIsTextMode(false);
        }
      }
    );

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, [text]);

  const barAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: barScale.value }],
  }));

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
    inputRef.current?.blur();
  }, []);

  const handleSend = () => {
    if (!text.trim() && !attachment) return;
    onSend(text, attachment || undefined);
    setText('');
    setAttachment(null);
    dismissKeyboard();
    setIsTextMode(false);
    hapticSend();
  };

  const handleCamera = async () => {
    setShowAttachments(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required');
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
      hapticSuccess();
    }
  };

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
      hapticSuccess();
    }
  };

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
        hapticSuccess();
      }
    } catch (error) {
      console.error('Document picker error:', error);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    hapticSelection();
  };

  const handleMicPress = useCallback(() => {
    if (isTranscribing) return;
    dismissKeyboard();
    hapticSelection();
    onVoiceToggle?.(!isListening);
  }, [isListening, isTranscribing, onVoiceToggle, dismissKeyboard]);

  const handleTextButtonPress = () => {
    hapticSelection();
    inputRef.current?.focus();
  };

  const toggleAttachments = () => {
    hapticSelection();
    setShowAttachments(!showAttachments);
  };

  const KEYBOARD_GAP = 10;
  const NAVBAR_GAP = 12;

  const bottomOffset =
    keyboardHeight > 0
      ? keyboardHeight + KEYBOARD_GAP
      : insets.bottom + TAB_BAR_HEIGHT + NAVBAR_GAP;

  const textColor = isDark ? '#fff' : colors.text;
  const placeholderColor = isDark ? 'rgba(255,255,255,0.4)' : colors.textMuted;
  const iconColor = isDark ? 'rgba(255,255,255,0.8)' : colors.textSecondary;

  // Keyboard open - show simple input with send arrow
  if (isTextMode && keyboardHeight > 0) {
    return (
      <>
        <Animated.View
          style={[
            styles.barWrapper,
            barAnimatedStyle,
            { bottom: bottomOffset },
          ]}
        >
          <BlurView
            intensity={isDark ? 80 : 60}
            tint={isDark ? 'dark' : 'light'}
            style={[
              styles.keyboardBar,
              {
                backgroundColor: isDark
                  ? 'rgba(168, 85, 247, 0.9)'
                  : 'rgba(168, 85, 247, 0.85)',
              },
            ]}
          >
            <TextInput
              ref={inputRef}
              style={[styles.keyboardInput, { color: '#fff' }]}
              placeholder={placeholder}
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={text}
              onChangeText={setText}
              multiline
              maxLength={2000}
              autoFocus
            />
            <TouchableOpacity
              style={styles.sendArrowButton}
              onPress={handleSend}
              disabled={!text.trim() && !attachment}
            >
              <Ionicons
                name="arrow-up"
                size={20}
                color={
                  text.trim() || attachment ? '#A855F7' : 'rgba(168,85,247,0.4)'
                }
              />
            </TouchableOpacity>
          </BlurView>
        </Animated.View>
      </>
    );
  }

  // Voice recording mode
  if (isListening) {
    return (
      <Animated.View
        style={[styles.barWrapper, barAnimatedStyle, { bottom: bottomOffset }]}
      >
        <BlurView
          intensity={isDark ? 80 : 60}
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.recordingBar,
            {
              backgroundColor: isDark
                ? 'rgba(28, 28, 30, 0.85)'
                : 'rgba(255, 253, 250, 0.85)',
              borderColor: isDark
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(45, 42, 38, 0.12)',
            },
          ]}
        >
          <Text
            style={[styles.recordingPlaceholder, { color: placeholderColor }]}
          >
            {placeholder}
          </Text>
          <TouchableOpacity
            onPress={handleMicPress}
            disabled={isTranscribing}
            style={styles.stopButton}
          >
            {isTranscribing ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <>
                <View style={styles.stopIcon} />
                <Text style={styles.stopText}>Stop</Text>
              </>
            )}
          </TouchableOpacity>
        </BlurView>
      </Animated.View>
    );
  }

  // Default Grok-style bar: Mic | Camera | "Ask Anything" | Text button
  return (
    <>
      <Animated.View
        style={[styles.barWrapper, barAnimatedStyle, { bottom: bottomOffset }]}
      >
        <BlurView
          intensity={isDark ? 80 : 60}
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.grokBar,
            {
              backgroundColor: isDark
                ? 'rgba(28, 28, 30, 0.85)'
                : 'rgba(255, 253, 250, 0.85)',
              borderColor: isDark
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(45, 42, 38, 0.12)',
            },
          ]}
        >
          {/* Mic button */}
          <TouchableOpacity
            style={[
              styles.iconButton,
              {
                backgroundColor: isDark
                  ? 'rgba(255,255,255,0.1)'
                  : 'rgba(45, 42, 38, 0.08)',
              },
            ]}
            onPress={handleMicPress}
            activeOpacity={0.7}
          >
            <Ionicons name="mic-outline" size={22} color={iconColor} />
          </TouchableOpacity>

          {/* Camera button */}
          <TouchableOpacity
            style={[
              styles.iconButton,
              {
                backgroundColor: isDark
                  ? 'rgba(255,255,255,0.1)'
                  : 'rgba(45, 42, 38, 0.08)',
              },
            ]}
            onPress={toggleAttachments}
            activeOpacity={0.7}
          >
            <Ionicons name="camera-outline" size={22} color={iconColor} />
          </TouchableOpacity>

          {/* Placeholder text */}
          <TouchableOpacity
            style={styles.placeholderArea}
            onPress={handleTextButtonPress}
            activeOpacity={0.7}
          >
            <Text style={[styles.placeholderText, { color: placeholderColor }]}>
              {placeholder}
            </Text>
          </TouchableOpacity>

          {/* Text/Call button */}
          <TouchableOpacity
            style={styles.textButton}
            onPress={handleTextButtonPress}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubble" size={16} color="#000" />
            <Text style={styles.textButtonLabel}>Text</Text>
          </TouchableOpacity>
        </BlurView>
      </Animated.View>

      {/* Attachment preview */}
      {attachment && (
        <View
          style={[
            styles.attachmentPreview,
            {
              bottom: bottomOffset + 64,
              backgroundColor: isDark
                ? 'rgba(30,30,30,0.95)'
                : 'rgba(255,253,250,0.95)',
              borderColor: isDark
                ? 'rgba(255,255,255,0.1)'
                : 'rgba(45,42,38,0.1)',
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
              <Ionicons name="document-text" size={24} color={textColor} />
              <Text
                style={[styles.documentName, { color: textColor }]}
                numberOfLines={1}
              >
                {attachment.name || 'Document'}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.removeAttachment}
            onPress={removeAttachment}
          >
            <Ionicons name="close-circle" size={24} color="#FF3B30" />
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
                  bottom: bottomOffset + 64,
                  borderColor: isDark
                    ? 'rgba(255,255,255,0.1)'
                    : 'rgba(45,42,38,0.1)',
                },
              ]}
            >
              <TouchableOpacity
                style={styles.attachmentOption}
                onPress={handleCamera}
              >
                <View style={styles.attachmentIconBadge}>
                  <Ionicons name="camera-outline" size={20} color="#fff" />
                </View>
                <Text style={[styles.attachmentLabel, { color: textColor }]}>
                  Camera
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachmentOption}
                onPress={handlePhotos}
              >
                <View style={styles.attachmentIconBadge}>
                  <Ionicons name="images-outline" size={20} color="#fff" />
                </View>
                <Text style={[styles.attachmentLabel, { color: textColor }]}>
                  Photos
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachmentOption}
                onPress={handleFiles}
              >
                <View style={styles.attachmentIconBadge}>
                  <Ionicons name="document-outline" size={20} color="#fff" />
                </View>
                <Text style={[styles.attachmentLabel, { color: textColor }]}>
                  Files
                </Text>
              </TouchableOpacity>
            </BlurView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  barWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 100,
  },
  grokBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 28,
    borderWidth: 0.5,
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderArea: {
    flex: 1,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '500',
  },
  textButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderRadius: 20,
  },
  textButtonLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  // Keyboard open state
  keyboardBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 12,
  },
  keyboardInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 24,
    paddingVertical: 0,
  },
  sendArrowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Recording state
  recordingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 28,
    borderWidth: 0.5,
    gap: 12,
  },
  recordingPlaceholder: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 19,
    backgroundColor: '#fff',
  },
  stopText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  stopIcon: {
    width: 10,
    height: 10,
    backgroundColor: '#000',
    borderRadius: 2,
  },
  // Attachment preview
  attachmentPreview: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    zIndex: 99,
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
    fontSize: 14,
    flex: 1,
  },
  removeAttachment: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  attachmentMenu: {
    position: 'absolute',
    left: 16,
    width: 200,
    borderRadius: 16,
    overflow: 'hidden',
    paddingVertical: 8,
    borderWidth: 1,
  },
  attachmentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  attachmentIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(168, 85, 247, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default GrokChatInputBar;
