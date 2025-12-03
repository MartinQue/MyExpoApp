import React from 'react';
import { TextInput, TextInputProps, StyleSheet, View } from 'react-native';
import { BorderRadius, Spacing } from '@/constants/Theme';
import { useTheme } from '@/contexts/ThemeContext';

interface InputProps extends TextInputProps {
  containerStyle?: any;
}

export function Input({ style, containerStyle, ...props }: InputProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, containerStyle]}>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.inputBackground,
            color: colors.text,
            borderColor: colors.inputBorder,
          },
          style,
        ]}
        placeholderTextColor={colors.inputPlaceholder}
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
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 16,
  },
});
