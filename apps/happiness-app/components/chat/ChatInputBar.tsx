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
  SharedValue,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import {
  send as hapticSend,
  success as hapticSuccess,
  selection as hapticSelection,
} from '@/lib/haptics';

const TAB_BAR_HEIGHT = 49;
const BAR_HEIGHT_IDLE = 110;
const BAR_HEIGHT_RECORDING = 56;

interface ChatInputBarProps {
  onSend: (text: string, attachment?: AttachmentInfo) => void;
  onVoiceToggle?: (isRecording: boolean) => void;
  onCancelRecording?: () => void;
  isListening?: boolean;
  isLoading?: boolean;
  isTranscribing?: boolean;
  recordingDuration?: number;
  placeholder?: string;
}

interface AttachmentInfo {
  type: 'image' | 'document';
  uri: string;
  name?: string;
  mimeType?: string;
}

function WaveBar({
  value,
  index,
  isActive,
}: {
  value: SharedValue<number>;
  index: number;
  isActive: boolean;
}) {
  useEffect(() => {
    if (isActive) {
      value.value = withRepeat(
        withSequence(
          withTiming(1, {
            duration: 300 + index * 50,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0.3, {
            duration: 300 + index * 50,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        true
      );
    } else {
      value.value = withSpring(0.3);
    }
  }, [isActive, index, value]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: interpolate(value.value, [0, 1], [6, 20], Extrapolation.CLAMP),
  }));

  return <Animated.View style={[styles.waveBar, animatedStyle]} />;
}

function VoiceWaveAnimation({ isActive }: { isActive: boolean }) {
  const bar0 = useSharedValue(0.3);
  const bar1 = useSharedValue(0.5);
  const bar2 = useSharedValue(0.4);
  const bar3 = useSharedValue(0.6);
  const bar4 = useSharedValue(0.5);

  return (
    <View style={styles.waveContainer}>
      <WaveBar value={bar0} index={0} isActive={isActive} />
      <WaveBar value={bar1} index={1} isActive={isActive} />
      <WaveBar value={bar2} index={2} isActive={isActive} />
      <WaveBar value={bar3} index={3} isActive={isActive} />
      <WaveBar value={bar4} index={4} isActive={isActive} />
    </View>
  );
}

function AttachmentOption({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.attachmentOption} onPress={onPress}>
      <View style={styles.attachmentIconBadge}>
        <Ionicons name={icon as any} size={20} color="#fff" />
      </View>
      <Text style={styles.attachmentLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export function ChatInputBar({
  onSend,
  onVoiceToggle,
  onCancelRecording,
  isListening: externalIsListening,
  isLoading,
  isTranscribing,
  recordingDuration = 0,
  placeholder = 'Ask Anything',
}: ChatInputBarProps) {
  const { colors, isDark } = useTheme();
  const [text, setText] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showAttachments, setShowAttachments] = useState(false);
  const [attachment, setAttachment] = useState<AttachmentInfo | null>(null);
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const router = useRouter();

  const isListening = !!externalIsListening;

  const barHeight = useSharedValue(BAR_HEIGHT_IDLE);
  const optionsOpacity = useSharedValue(0);
  const statusOpacity = useSharedValue(0);

  useEffect(() => {
    if (isListening) {
      barHeight.value = withTiming(BAR_HEIGHT_RECORDING, { duration: 200 });
      optionsOpacity.value = withTiming(1, { duration: 200 });
      statusOpacity.value = withTiming(1, { duration: 300 });
    } else {
      barHeight.value = withTiming(BAR_HEIGHT_IDLE, { duration: 200 });
      optionsOpacity.value = withTiming(0, { duration: 150 });
      statusOpacity.value = withTiming(0, { duration: 150 });
    }
  }, [isListening, barHeight, optionsOpacity, statusOpacity]);

  const barAnimatedStyle = useAnimatedStyle(() => ({
    height: barHeight.value,
  }));

  const optionsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: optionsOpacity.value,
    transform: [{ translateY: interpolate(optionsOpacity.value, [0, 1], [10, 0]) }],
  }));

  const statusAnimatedStyle = useAnimatedStyle(() => ({
    opacity: statusOpacity.value,
  }));

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

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

  const handleCreateImage = () => {
    setShowAttachments(false);
    hapticSelection();
    router.push('/(tabs)/imagine' as any);
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

  const toggleAttachments = () => {
    hapticSelection();
    setShowAttachments(!showAttachments);
  };

  const KEYBOARD_GAP = 10;
  const NAVBAR_GAP = 12;
  
  const bottomOffset = keyboardHeight > 0
    ? keyboardHeight + KEYBOARD_GAP
    : insets.bottom + TAB_BAR_HEIGHT + NAVBAR_GAP;

  const getStatusText = () => {
    if (isTranscribing) return 'Processing...';
    if (recordingDuration > 0) return 'Start talking';
    return 'Connecting...';
  };

  const textColor = isDark ? '#fff' : colors.text;
  const placeholderColor = isDark ? 'rgba(255,255,255,0.4)' : colors.textMuted;
  const iconColor = isDark ? 'rgba(255,255,255,0.6)' : colors.textSecondary;

  return (
    <>
      {isListening && (
        <Animated.View
          style={[
            styles.statusTextWrapper,
            statusAnimatedStyle,
            { bottom: bottomOffset + BAR_HEIGHT_RECORDING + 80 },
          ]}
        >
          <VoiceWaveAnimation isActive={isListening && !isTranscribing} />
          <Text style={[styles.statusText, { color: isDark ? 'rgba(255,255,255,0.7)' : colors.textSecondary }]}>
            {getStatusText()}
          </Text>
        </Animated.View>
      )}

      {isListening && (
        <Animated.View
          style={[
            styles.optionsRow,
            optionsAnimatedStyle,
            { bottom: bottomOffset + BAR_HEIGHT_RECORDING + 16 },
          ]}
        >
          <BlurView intensity={isDark ? 60 : 40} tint={isDark ? 'dark' : 'light'} style={styles.optionPillBlur}>
            <TouchableOpacity style={styles.optionPillInner}>
              <Ionicons name="scan-outline" size={20} color={textColor} />
            </TouchableOpacity>
          </BlurView>
          <BlurView intensity={isDark ? 60 : 40} tint={isDark ? 'dark' : 'light'} style={styles.optionPillBlur}>
            <TouchableOpacity style={styles.optionPillInner}>
              <Ionicons name="volume-high-outline" size={20} color={textColor} />
            </TouchableOpacity>
          </BlurView>
          <BlurView intensity={isDark ? 60 : 40} tint={isDark ? 'dark' : 'light'} style={styles.optionPillBlur}>
            <TouchableOpacity style={styles.optionPillInner}>
              <Ionicons name="mic-outline" size={20} color={textColor} />
            </TouchableOpacity>
          </BlurView>
          <View style={styles.optionPillWithEmoji}>
            <BlurView intensity={isDark ? 60 : 40} tint={isDark ? 'dark' : 'light'} style={styles.optionPillBlur}>
              <TouchableOpacity style={styles.optionPillInner}>
                <Ionicons name="settings-outline" size={20} color={textColor} />
              </TouchableOpacity>
            </BlurView>
            <View style={[styles.emojiBadge, { backgroundColor: isDark ? 'rgba(58, 58, 60, 0.95)' : 'rgba(255, 255, 255, 0.9)' }]}>
              <Text style={styles.emojiText}>😊</Text>
            </View>
          </View>
        </Animated.View>
      )}

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
            styles.barBlur,
            { 
              backgroundColor: isDark ? 'rgba(28, 28, 30, 0.85)' : 'rgba(255, 253, 250, 0.85)',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(45, 42, 38, 0.12)',
            }
          ]}
        >
          {isListening ? (
            <View style={styles.recordingContent}>
              <TextInput
                ref={inputRef}
                style={[styles.textInputRecording, { color: placeholderColor }]}
                placeholder={placeholder}
                placeholderTextColor={placeholderColor}
                value={text}
                onChangeText={setText}
                editable={false}
              />
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
            </View>
          ) : (
            <>
              <View style={styles.inputRow}>
                <TextInput
                  ref={inputRef}
                  style={[styles.textInput, { color: textColor }]}
                  placeholder={placeholder}
                  placeholderTextColor={placeholderColor}
                  value={text}
                  onChangeText={setText}
                  multiline
                  maxLength={2000}
                  onSubmitEditing={handleSend}
                  blurOnSubmit={false}
                />
              </View>

              <View style={styles.controlsRow}>
                <TouchableOpacity
                  onPress={toggleAttachments}
                  style={[styles.controlButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(45, 42, 38, 0.06)' }]}
                >
                  <Ionicons name="attach" size={22} color={iconColor} />
                </TouchableOpacity>

                <View style={styles.spacer} />

                {text.trim() || attachment ? (
                  <TouchableOpacity onPress={handleSend} style={[styles.sendButton, { backgroundColor: isDark ? '#fff' : colors.primary }]}>
                    <Ionicons name="arrow-up" size={18} color={isDark ? '#000' : '#fff'} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={handleMicPress}
                    disabled={isTranscribing}
                    style={[styles.speakButton, { backgroundColor: isDark ? '#fff' : colors.primary }]}
                  >
                    <View style={styles.speakWaveIcon}>
                      <View style={[styles.speakWaveBarShort, { backgroundColor: isDark ? '#000' : '#fff' }]} />
                      <View style={[styles.speakWaveBarTall, { backgroundColor: isDark ? '#000' : '#fff' }]} />
                      <View style={[styles.speakWaveBarShort, { backgroundColor: isDark ? '#000' : '#fff' }]} />
                    </View>
                    <Text style={[styles.speakText, { color: isDark ? '#000' : '#fff' }]}>Speak</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </BlurView>
      </Animated.View>

      {attachment && !isListening && (
        <View
          style={[
            styles.attachmentPreview,
            { 
              bottom: bottomOffset + BAR_HEIGHT_IDLE + 12,
              backgroundColor: isDark ? 'rgba(30,30,30,0.95)' : 'rgba(255,253,250,0.95)',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(45,42,38,0.1)',
            },
          ]}
        >
          {attachment.type === 'image' ? (
            <Image source={{ uri: attachment.uri }} style={styles.attachmentImage} />
          ) : (
            <View style={styles.documentPreview}>
              <Ionicons name="document-text" size={24} color={textColor} />
              <Text style={[styles.documentName, { color: textColor }]} numberOfLines={1}>
                {attachment.name || 'Document'}
              </Text>
            </View>
          )}
          <TouchableOpacity style={styles.removeAttachment} onPress={removeAttachment}>
            <Ionicons name="close-circle" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      )}

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
                  bottom: bottomOffset + BAR_HEIGHT_IDLE + 12,
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(45,42,38,0.1)',
                },
              ]}
            >
              <AttachmentOption icon="camera-outline" label="Camera" onPress={handleCamera} />
              <AttachmentOption icon="images-outline" label="Photos" onPress={handlePhotos} />
              <AttachmentOption icon="document-outline" label="Files" onPress={handleFiles} />
              <View style={[styles.menuDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(45,42,38,0.1)' }]} />
              <AttachmentOption icon="sparkles-outline" label="Create image" onPress={handleCreateImage} />
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
    borderRadius: 24,
    overflow: 'hidden',
  },
  barBlur: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  inputRow: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 10,
  },
  textInput: {
    fontSize: 17,
    color: '#fff',
    maxHeight: 60,
    minHeight: 24,
    paddingVertical: 0,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 8,
  },
  controlButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  spacer: {
    flex: 1,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 19,
    backgroundColor: '#fff',
  },
  speakText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  speakWaveIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  speakWaveBarShort: {
    width: 2.5,
    height: 8,
    backgroundColor: '#000',
    borderRadius: 1.25,
  },
  speakWaveBarTall: {
    width: 2.5,
    height: 14,
    backgroundColor: '#000',
    borderRadius: 1.25,
  },
  recordingContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    gap: 12,
  },
  textInputRecording: {
    flex: 1,
    fontSize: 17,
    color: 'rgba(255,255,255,0.4)',
    paddingVertical: 0,
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
  statusTextWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  optionsRow: {
    position: 'absolute',
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  optionPillBlur: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  optionPillInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionPillWithEmoji: {
    flex: 1,
    position: 'relative',
  },
  emojiBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiText: {
    fontSize: 12,
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 24,
  },
  waveBar: {
    width: 3,
    borderRadius: 1.5,
    backgroundColor: '#fff',
    minHeight: 6,
  },
  attachmentPreview: {
    position: 'absolute',
    left: 16,
    right: 16,
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
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  removeAttachment: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
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
    borderColor: 'rgba(255,255,255,0.1)',
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 4,
    marginHorizontal: 16,
  },
});

export default ChatInputBar;
