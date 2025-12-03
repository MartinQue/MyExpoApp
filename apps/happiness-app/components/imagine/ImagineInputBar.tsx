import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  Text,
  Keyboard,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface ImagineInputBarProps {
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
  onAttachmentPress?: () => void;
}

export function ImagineInputBar({
  onGenerate,
  isGenerating,
  onAttachmentPress,
}: ImagineInputBarProps) {
  const [text, setText] = useState('');
  const insets = useSafeAreaInsets();
  const [isFocused, setIsFocused] = useState(false);

  const handleSend = () => {
    if (!text.trim()) return;
    onGenerate(text);
    setText('');
    Keyboard.dismiss();
  };

  // Add extra padding for bottom tab bar (approx 50-60px usually, plus safe area)
  const bottomOffset = insets.bottom + 60;

  return (
    <View style={[styles.container, { bottom: bottomOffset }]}>
      <View
        style={[styles.inputWrapper, isFocused && styles.inputWrapperFocused]}
      >
        {/* Attachment Button */}
        <Pressable style={styles.iconButton} onPress={onAttachmentPress}>
          <Ionicons
            name="add-circle-outline"
            size={24}
            color={Colors.gray[400]}
          />
        </Pressable>

        <TextInput
          style={styles.input}
          placeholder="Describe your imagination..."
          placeholderTextColor={Colors.gray[500]}
          value={text}
          onChangeText={setText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          multiline
          maxLength={500}
        />

        {text.length > 0 ? (
          <Pressable onPress={handleSend} style={styles.sendButton}>
            <Ionicons name="arrow-up" size={20} color="white" />
          </Pressable>
        ) : (
          <Pressable style={styles.iconButton}>
            <Ionicons name="mic-outline" size={24} color={Colors.gray[400]} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    // Removed background from container to allow floating pill shape
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A', // Darker, premium background
    borderRadius: 28,
    padding: 6,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  inputWrapperFocused: {
    borderColor: Colors.primary[500],
    backgroundColor: '#222',
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    maxHeight: 100,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
});
