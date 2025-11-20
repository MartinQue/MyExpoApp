import React from 'react';
import { TextInput, TextInputProps, StyleSheet, View } from 'react-native';
import { Colors, BorderRadius, Spacing } from '@/constants/Theme';

interface InputProps extends TextInputProps {
  containerStyle?: any;
}

export function Input({ style, containerStyle, ...props }: InputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={Colors.gray[400]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  input: {
    backgroundColor: Colors.gray[800],
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    color: Colors.white,
    fontSize: 16,
  },
});
