import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { BorderRadius } from '@/constants/Theme';
import { ThemedText } from '@/components/ui/ThemedText';
import { GlassView } from '@/components/Glass/GlassView';
import { useUserStore } from '@/stores/userStore';
import { useTheme } from '@/contexts/ThemeContext';
import { updateProfile } from '@/lib/accountService';
import haptics from '@/lib/haptics';

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const { colors, isDark, getGradientArray } = useTheme();
  const { user, setUser, isAuthenticated } = useUserStore();

  const [displayName, setDisplayName] = useState(user.name);
  const [email, setEmail] = useState(user.email || '');
  const [avatarUri, setAvatarUri] = useState(user.avatar);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Track changes
    const changed =
      displayName !== user.name ||
      email !== (user.email || '') ||
      avatarUri !== user.avatar;
    setHasChanges(changed);
  }, [displayName, email, avatarUri, user]);

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Do you want to discard them?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
    }
  };

  const handlePickAvatar = async () => {
    haptics.selection();

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'Photo library access is required to change your avatar'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
      haptics.success();
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated || !user.id) {
      Alert.alert('Not Signed In', 'Please sign in to update your profile.');
      return;
    }

    if (!displayName.trim()) {
      Alert.alert('Invalid Name', 'Please enter a display name.');
      return;
    }

    setIsSaving(true);
    haptics.medium();

    try {
      const result = await updateProfile(user.id, {
        displayName: displayName.trim(),
        email: email.trim() || undefined,
        avatarUrl: avatarUri !== user.avatar ? avatarUri : undefined,
      });

      if (result.success) {
        // Update local store
        setUser({
          name: displayName.trim(),
          email: email.trim() || undefined,
          avatar: avatarUri,
        });

        haptics.success();
        Alert.alert('Success', 'Your profile has been updated.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        haptics.error();
        Alert.alert('Update Failed', result.error || 'Something went wrong');
      }
    } catch (error) {
      haptics.error();
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

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
        <ThemedText style={styles.headerTitle}>Personal Information</ThemedText>
        <Pressable
          onPress={handleSave}
          disabled={!hasChanges || isSaving}
          style={[
            styles.saveButton,
            {
              backgroundColor: hasChanges
                ? colors.primary
                : colors.glassBackground,
              opacity: hasChanges && !isSaving ? 1 : 0.5,
            },
          ]}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <ThemedText
              style={[
                styles.saveButtonText,
                { color: hasChanges ? '#FFF' : colors.textMuted },
              ]}
            >
              Save
            </ThemedText>
          )}
        </Pressable>
      </BlurView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <Pressable onPress={handlePickAvatar} style={styles.avatarContainer}>
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
            <View
              style={[
                styles.avatarEditBadge,
                { backgroundColor: colors.primary },
              ]}
            >
              <Ionicons name="camera" size={16} color="#FFF" />
            </View>
          </Pressable>
          <ThemedText style={[styles.avatarHint, { color: colors.textMuted }]}>
            Tap to change photo
          </ThemedText>
        </View>

        {/* Form Fields */}
        <GlassView intensity={isDark ? 40 : 20} style={styles.formSection}>
          <View style={styles.inputGroup}>
            <ThemedText
              style={[styles.inputLabel, { color: colors.textMuted }]}
            >
              Display Name
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.glassBackground,
                  borderColor: colors.border,
                },
              ]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter your name"
              placeholderTextColor={colors.textMuted}
              maxLength={50}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText
              style={[styles.inputLabel, { color: colors.textMuted }]}
            >
              Email Address
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.glassBackground,
                  borderColor: colors.border,
                },
              ]}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <ThemedText style={[styles.inputHint, { color: colors.textMuted }]}>
              Changing email requires re-verification
            </ThemedText>
          </View>
        </GlassView>

        {/* Account Info */}
        <GlassView intensity={isDark ? 40 : 20} style={styles.infoSection}>
          <View style={styles.infoRow}>
            <ThemedText style={[styles.infoLabel, { color: colors.textMuted }]}>
              Account Type
            </ThemedText>
            <View style={styles.infoValue}>
              <ThemedText style={{ color: colors.text }}>
                {user.isPro ? 'Pro' : 'Free'}
              </ThemedText>
              {user.isPro && (
                <View
                  style={[styles.proBadge, { backgroundColor: colors.primary }]}
                >
                  <ThemedText style={styles.proBadgeText}>PRO</ThemedText>
                </View>
              )}
            </View>
          </View>
          <View
            style={[styles.infoDivider, { backgroundColor: colors.border }]}
          />
          <View style={styles.infoRow}>
            <ThemedText style={[styles.infoLabel, { color: colors.textMuted }]}>
              Credits
            </ThemedText>
            <ThemedText style={{ color: colors.text }}>
              {user.isPro ? 'Unlimited' : user.credits}
            </ThemedText>
          </View>
        </GlassView>
      </ScrollView>
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
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000',
  },
  avatarHint: {
    fontSize: 13,
    marginTop: 8,
  },
  formSection: {
    borderRadius: BorderRadius.lg,
    padding: 20,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  inputHint: {
    fontSize: 12,
    marginTop: 6,
  },
  infoSection: {
    borderRadius: BorderRadius.lg,
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoDivider: {
    height: 1,
    marginVertical: 8,
  },
  proBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
  },
});
