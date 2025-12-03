import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
  Platform,
  Alert,
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
import haptics from '@/lib/haptics';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, isDark, getGradientArray, toggleTheme } = useTheme();
  const {
    user,
    theme,
    notificationsEnabled,
    hapticEnabled,
    voiceEnabled,
    setNotificationsEnabled,
    setHapticEnabled,
    setVoiceEnabled,
    logout,
    isAuthenticated,
  } = useUserStore();

  const handleBack = () => {
    haptics.button();
    router.back();
  };

  const handleLogout = async () => {
    haptics.warning();
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/');
        },
      },
    ]);
  };

  const SettingItem = ({
    icon,
    label,
    type = 'arrow',
    value = false,
    onToggle,
    onPress,
    destructive = false,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    type?: 'arrow' | 'toggle' | 'none';
    value?: boolean;
    onToggle?: (val: boolean) => void;
    onPress?: () => void;
    destructive?: boolean;
  }) => (
    <Pressable
      style={({ pressed }) => [
        styles.settingItem,
        { borderBottomColor: colors.border },
        pressed && [
          styles.settingItemPressed,
          { backgroundColor: colors.glassBackground },
        ],
      ]}
      onPress={() => {
        if (type !== 'toggle') {
          haptics.selection();
          onPress?.();
        }
      }}
    >
      <View style={styles.settingLeft}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: colors.glassBackground },
          ]}
        >
          <Ionicons
            name={icon}
            size={20}
            color={destructive ? colors.error : colors.text}
          />
        </View>
        <ThemedText
          style={[styles.settingLabel, destructive && { color: colors.error }]}
        >
          {label}
        </ThemedText>
      </View>

      {type === 'toggle' ? (
        <Switch
          value={value}
          onValueChange={(val) => {
            haptics.toggle();
            onToggle?.(val);
          }}
          trackColor={{ false: colors.surface, true: colors.primary }}
          thumbColor={colors.text}
          ios_backgroundColor={colors.surface}
        />
      ) : type === 'arrow' ? (
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      ) : null}
    </Pressable>
  );

  const Section = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <View style={styles.section}>
      <ThemedText style={[styles.sectionTitle, { color: colors.textMuted }]}>
        {title}
      </ThemedText>
      <GlassView
        intensity={isDark ? 40 : 20}
        style={[
          styles.sectionContent,
          { backgroundColor: colors.glassBackground },
        ]}
      >
        {children}
      </GlassView>
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
        <ThemedText style={styles.headerTitle}>Settings</ThemedText>
        <View style={{ width: 40 }} />
      </BlurView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info Card */}
        <GlassView intensity={isDark ? 50 : 30} style={styles.userCard}>
          <View style={styles.userAvatar}>
            <Ionicons name="person-circle" size={60} color={colors.primary} />
          </View>
          <View style={styles.userInfo}>
            <ThemedText style={styles.userName}>{user.name}</ThemedText>
            <ThemedText style={[styles.userEmail, { color: colors.textMuted }]}>
              {user.email || 'Not signed in'}
            </ThemedText>
            {user.isPro && (
              <View
                style={[styles.proBadge, { backgroundColor: colors.primary }]}
              >
                <ThemedText style={styles.proBadgeText}>PRO</ThemedText>
              </View>
            )}
          </View>
        </GlassView>

        <Section title="Account">
          <SettingItem
            icon="person-outline"
            label="Personal Information"
            onPress={() =>
              Alert.alert(
                'Coming Soon',
                'Profile editing will be available in a future update.'
              )
            }
          />
          <SettingItem
            icon="shield-checkmark-outline"
            label="Security"
            onPress={() =>
              Alert.alert(
                'Coming Soon',
                'Security settings will be available in a future update.'
              )
            }
          />
          <SettingItem
            icon="card-outline"
            label="Subscription"
            onPress={() =>
              Alert.alert(
                'Subscription',
                user.isPro
                  ? 'You have an active Pro subscription!'
                  : 'Upgrade to Pro for unlimited features.'
              )
            }
          />
        </Section>

        <Section title="Preferences">
          <SettingItem
            icon="moon-outline"
            label="Dark Mode"
            type="toggle"
            value={isDark}
            onToggle={toggleTheme}
          />
          <SettingItem
            icon="notifications-outline"
            label="Push Notifications"
            type="toggle"
            value={notificationsEnabled}
            onToggle={setNotificationsEnabled}
          />
          <SettingItem
            icon="radio-outline"
            label="Haptic Feedback"
            type="toggle"
            value={hapticEnabled}
            onToggle={(val) => {
              setHapticEnabled(val);
              haptics.setEnabled(val);
            }}
          />
          <SettingItem
            icon="mic-outline"
            label="Voice Features"
            type="toggle"
            value={voiceEnabled}
            onToggle={setVoiceEnabled}
          />
        </Section>

        <Section title="Privacy & Data">
          <SettingItem
            icon="lock-closed-outline"
            label="Privacy Policy"
            onPress={() =>
              Alert.alert(
                'Privacy Policy',
                'View our privacy policy at happiness-ai.com/privacy'
              )
            }
          />
          <SettingItem
            icon="cloud-download-outline"
            label="Download My Data"
            onPress={() =>
              Alert.alert(
                'Download Data',
                'Your data export will be emailed to you within 24 hours.'
              )
            }
          />
          <SettingItem
            icon="trash-outline"
            label="Delete Account"
            destructive
            onPress={() =>
              Alert.alert(
                'Delete Account',
                'This action cannot be undone. All your data will be permanently deleted.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => {} },
                ]
              )
            }
          />
        </Section>

        <Section title="About">
          <SettingItem
            icon="information-circle-outline"
            label="Version 1.0.0"
            type="none"
          />
          <SettingItem
            icon="document-text-outline"
            label="Terms of Service"
            onPress={() =>
              Alert.alert(
                'Terms of Service',
                'View our terms at happiness-ai.com/terms'
              )
            }
          />
          <SettingItem
            icon="help-circle-outline"
            label="Help & Support"
            onPress={() =>
              Alert.alert('Support', 'Contact us at support@happiness-ai.com')
            }
          />
        </Section>

        {isAuthenticated && (
          <Section title="Account Actions">
            <SettingItem
              icon="log-out-outline"
              label="Sign Out"
              type="arrow"
              destructive
              onPress={handleLogout}
            />
          </Section>
        )}

        <View style={styles.footer}>
          <ThemedText style={[styles.footerText, { color: colors.textMuted }]}>
            Happiness AI
          </ThemedText>
          <ThemedText
            style={[styles.footerSubText, { color: colors.textMuted }]}
          >
            Designed for your well-being
          </ThemedText>
        </View>
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
    fontSize: 20,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: BorderRadius.lg,
    marginBottom: 24,
  },
  userAvatar: {
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  proBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionContent: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  settingItemPressed: {
    opacity: 0.8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    gap: 4,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footerSubText: {
    fontSize: 12,
  },
});
