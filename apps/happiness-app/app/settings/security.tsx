import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { BorderRadius } from '@/constants/Theme';
import { ThemedText } from '@/components/ui/ThemedText';
import { GlassView } from '@/components/Glass/GlassView';
import { useUserStore } from '@/stores/userStore';
import { useTheme } from '@/contexts/ThemeContext';
import { changePassword, sendPasswordReset } from '@/lib/accountService';
import haptics from '@/lib/haptics';

export default function SecuritySettingsScreen() {
  const router = useRouter();
  const { colors, isDark, getGradientArray } = useTheme();
  const { user, isAuthenticated } = useUserStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleBack = () => {
    haptics.button();
    router.back();
  };

  const validatePassword = (
    password: string
  ): { valid: boolean; error?: string } => {
    if (password.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters' };
    }
    if (!/[A-Z]/.test(password)) {
      return {
        valid: false,
        error: 'Password must contain at least one uppercase letter',
      };
    }
    if (!/[a-z]/.test(password)) {
      return {
        valid: false,
        error: 'Password must contain at least one lowercase letter',
      };
    }
    if (!/[0-9]/.test(password)) {
      return {
        valid: false,
        error: 'Password must contain at least one number',
      };
    }
    return { valid: true };
  };

  const handleChangePassword = async () => {
    if (!isAuthenticated) {
      Alert.alert('Not Signed In', 'Please sign in to change your password.');
      return;
    }

    if (!newPassword || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(
        'Password Mismatch',
        'New password and confirmation do not match.'
      );
      return;
    }

    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      Alert.alert('Weak Password', validation.error);
      return;
    }

    setIsUpdating(true);
    haptics.medium();

    try {
      const result = await changePassword(newPassword);

      if (result.success) {
        haptics.success();
        Alert.alert('Success', 'Your password has been updated.', [
          {
            text: 'OK',
            onPress: () => {
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
            },
          },
        ]);
      } else {
        haptics.error();
        Alert.alert(
          'Update Failed',
          result.error || 'Failed to change password'
        );
      }
    } catch (error) {
      haptics.error();
      Alert.alert('Error', 'Failed to update password. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!user.email) {
      Alert.alert(
        'No Email',
        'Please add an email address to your profile first.'
      );
      return;
    }

    Alert.alert(
      'Reset Password',
      `We'll send a password reset link to ${user.email}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            haptics.medium();
            const result = await sendPasswordReset(user.email!);
            if (result.success) {
              haptics.success();
              Alert.alert(
                'Email Sent',
                'Check your inbox for the password reset link.'
              );
            } else {
              haptics.error();
              Alert.alert(
                'Failed',
                result.error || 'Failed to send reset email'
              );
            }
          },
        },
      ]
    );
  };

  const PasswordInput = ({
    value,
    onChangeText,
    placeholder,
    showPassword,
    onToggleShow,
    label,
  }: {
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    showPassword: boolean;
    onToggleShow: () => void;
    label: string;
  }) => (
    <View style={styles.inputGroup}>
      <ThemedText style={[styles.inputLabel, { color: colors.textMuted }]}>
        {label}
      </ThemedText>
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.glassBackground,
            borderColor: colors.border,
          },
        ]}
      >
        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable onPress={onToggleShow} style={styles.eyeButton}>
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={colors.textMuted}
          />
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={getGradientArray('profile')}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Header */}
      <BlurView
        intensity={isDark ? 80 : 60}
        tint={isDark ? 'dark' : 'light'}
        style={styles.header}
      >
        <Pressable
          onPress={handleBack}
          style={[
            styles.backButton,
            { backgroundColor: colors.glassBackground },
          ]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Security</ThemedText>
        <View style={{ width: 40 }} />
      </BlurView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Change Password Section */}
        <GlassView intensity={isDark ? 40 : 20} style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
            Change Password
          </ThemedText>

          <PasswordInput
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Enter new password"
            showPassword={showNewPassword}
            onToggleShow={() => setShowNewPassword(!showNewPassword)}
            label="New Password"
          />

          <PasswordInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            showPassword={showConfirmPassword}
            onToggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
            label="Confirm Password"
          />

          {/* Password Requirements */}
          <View style={styles.requirements}>
            <ThemedText
              style={[styles.requirementTitle, { color: colors.textMuted }]}
            >
              Password Requirements:
            </ThemedText>
            <PasswordRequirement
              met={newPassword.length >= 8}
              text="At least 8 characters"
              colors={colors}
            />
            <PasswordRequirement
              met={/[A-Z]/.test(newPassword)}
              text="One uppercase letter"
              colors={colors}
            />
            <PasswordRequirement
              met={/[a-z]/.test(newPassword)}
              text="One lowercase letter"
              colors={colors}
            />
            <PasswordRequirement
              met={/[0-9]/.test(newPassword)}
              text="One number"
              colors={colors}
            />
          </View>

          <Pressable
            style={[
              styles.primaryButton,
              { backgroundColor: colors.primary },
              isUpdating && styles.buttonDisabled,
            ]}
            onPress={handleChangePassword}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <ThemedText style={styles.primaryButtonText}>
                Update Password
              </ThemedText>
            )}
          </Pressable>

          <Pressable style={styles.linkButton} onPress={handleForgotPassword}>
            <ThemedText
              style={[styles.linkButtonText, { color: colors.primary }]}
            >
              Forgot Password?
            </ThemedText>
          </Pressable>
        </GlassView>

        {/* Security Info */}
        <GlassView intensity={isDark ? 40 : 20} style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
            Security Tips
          </ThemedText>

          <View style={styles.tipItem}>
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color={colors.success}
            />
            <ThemedText style={[styles.tipText, { color: colors.textMuted }]}>
              Use a unique password that you don't use elsewhere
            </ThemedText>
          </View>

          <View style={styles.tipItem}>
            <Ionicons name="key-outline" size={20} color={colors.warning} />
            <ThemedText style={[styles.tipText, { color: colors.textMuted }]}>
              Consider using a password manager
            </ThemedText>
          </View>

          <View style={styles.tipItem}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={colors.primary}
            />
            <ThemedText style={[styles.tipText, { color: colors.textMuted }]}>
              Never share your password with anyone
            </ThemedText>
          </View>
        </GlassView>
      </ScrollView>
    </View>
  );
}

function PasswordRequirement({
  met,
  text,
  colors,
}: {
  met: boolean;
  text: string;
  colors: any;
}) {
  return (
    <View style={styles.requirementRow}>
      <Ionicons
        name={met ? 'checkmark-circle' : 'ellipse-outline'}
        size={16}
        color={met ? colors.success : colors.textMuted}
      />
      <ThemedText
        style={[
          styles.requirementText,
          { color: met ? colors.success : colors.textMuted },
        ]}
      >
        {text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  section: {
    borderRadius: BorderRadius.lg,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  eyeButton: {
    padding: 4,
  },
  requirements: {
    marginVertical: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  requirementTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  requirementText: {
    fontSize: 13,
  },
  primaryButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  linkButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
