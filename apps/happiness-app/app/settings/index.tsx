import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  Image,
  Switch,
  Linking,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Application from 'expo-application';
import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BorderRadius } from '@/constants/Theme';
import { ThemedText } from '@/components/ui/ThemedText';
import { GlassView } from '@/components/Glass/GlassView';
import { useUserStore } from '@/stores/userStore';
import { useTheme } from '@/contexts/ThemeContext';
import {
  exportUserData,
  deleteAccount,
  LEGAL_URLS,
} from '@/lib/accountService';
import haptics from '@/lib/haptics';

const APP_VERSION = Application.nativeApplicationVersion || '1.0.0';
const BUILD_NUMBER = Application.nativeBuildVersion || '1';

// Settings menu items organized by category
const SETTINGS_SECTIONS = [
  {
    title: 'Account',
    items: [
      {
        id: 'profile',
        icon: 'person-outline',
        label: 'Personal Information',
        route: '/settings/profile',
        chevron: true,
      },
      {
        id: 'security',
        icon: 'shield-outline',
        label: 'Security & Password',
        route: '/settings/security',
        chevron: true,
      },
      {
        id: 'subscription',
        icon: 'card-outline',
        label: 'Subscription & Billing',
        route: '/settings/subscription',
        chevron: true,
      },
    ],
  },
  {
    title: 'Preferences',
    items: [
      {
        id: 'notifications',
        icon: 'notifications-outline',
        label: 'Notifications',
        toggle: true,
        toggleKey: 'notificationsEnabled',
      },
      {
        id: 'darkMode',
        icon: 'moon-outline',
        label: 'Dark Mode',
        toggle: true,
        toggleKey: 'darkMode',
      },
      {
        id: 'haptics',
        icon: 'phone-portrait-outline',
        label: 'Haptic Feedback',
        toggle: true,
        toggleKey: 'hapticsEnabled',
      },
      {
        id: 'language',
        icon: 'language-outline',
        label: 'Language',
        value: 'English',
        route: '/settings/language',
        chevron: true,
      },
    ],
  },
  {
    title: 'AI & Voice',
    items: [
      {
        id: 'voiceSettings',
        icon: 'mic-outline',
        label: 'Voice Settings',
        route: '/settings/voice',
        chevron: true,
      },
      {
        id: 'aiPersonality',
        icon: 'sparkles-outline',
        label: 'AI Personality',
        route: '/settings/ai-personality',
        chevron: true,
      },
      {
        id: 'conversationHistory',
        icon: 'chatbubbles-outline',
        label: 'Conversation History',
        route: '/settings/history',
        chevron: true,
      },
    ],
  },
  {
    title: 'Data & Privacy',
    items: [
      {
        id: 'export',
        icon: 'download-outline',
        label: 'Export My Data',
        action: 'export',
      },
      {
        id: 'clearCache',
        icon: 'trash-bin-outline',
        label: 'Clear Cache',
        action: 'clearCache',
      },
      {
        id: 'privacy',
        icon: 'document-text-outline',
        label: 'Privacy Policy',
        url: LEGAL_URLS.privacyPolicy,
      },
      {
        id: 'terms',
        icon: 'reader-outline',
        label: 'Terms of Service',
        url: LEGAL_URLS.termsOfService,
      },
    ],
  },
  {
    title: 'Support',
    items: [
      {
        id: 'help',
        icon: 'help-circle-outline',
        label: 'Help & FAQ',
        url: LEGAL_URLS.helpSupport,
      },
      {
        id: 'feedback',
        icon: 'chatbubble-ellipses-outline',
        label: 'Send Feedback',
        action: 'feedback',
      },
      {
        id: 'rateApp',
        icon: 'star-outline',
        label: 'Rate Us',
        action: 'rateApp',
      },
      {
        id: 'shareApp',
        icon: 'share-social-outline',
        label: 'Share App',
        action: 'shareApp',
      },
    ],
  },
  {
    title: 'About',
    items: [
      {
        id: 'whatsNew',
        icon: 'gift-outline',
        label: "What's New",
        route: '/settings/changelog',
        chevron: true,
      },
      {
        id: 'licenses',
        icon: 'code-slash-outline',
        label: 'Open Source Licenses',
        route: '/settings/licenses',
        chevron: true,
      },
    ],
  },
];

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark, getGradientArray, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useUserStore();

  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get individual settings from store
  const notificationsEnabled = useUserStore((s) => s.notificationsEnabled);
  const hapticEnabled = useUserStore((s) => s.hapticEnabled);
  const setNotificationsEnabled = useUserStore(
    (s) => s.setNotificationsEnabled
  );
  const setHapticEnabled = useUserStore((s) => s.setHapticEnabled);

  const handleBack = () => {
    haptics.button();
    router.back();
  };

  const handleNavigate = (route: string) => {
    haptics.selection();
    router.push(route as any);
  };

  const handleOpenUrl = (url: string) => {
    haptics.selection();
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open link');
    });
  };

  const handleToggle = (key: string, value: boolean) => {
    haptics.selection();
    if (key === 'darkMode') {
      toggleTheme();
    } else if (key === 'notificationsEnabled') {
      setNotificationsEnabled(value);
    } else if (key === 'hapticsEnabled') {
      setHapticEnabled(value);
    }
  };

  const handleExportData = async () => {
    if (!isAuthenticated || !user.id) {
      Alert.alert('Not Signed In', 'Please sign in to export your data.');
      return;
    }

    Alert.alert(
      'Export Data',
      'This will export all your data as a JSON file. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            setIsExporting(true);
            haptics.medium();

            const result = await exportUserData(user.id!);

            setIsExporting(false);
            if (result.success) {
              haptics.success();
            } else {
              haptics.error();
              Alert.alert(
                'Export Failed',
                result.error || 'Could not export data'
              );
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    if (!isAuthenticated || !user.id) {
      Alert.alert('Not Signed In', 'Please sign in to delete your account.');
      return;
    }

    Alert.alert(
      '⚠️ Delete Account',
      'This will permanently delete your account and all your data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'Are you absolutely sure? All your conversations, plans, and generated content will be permanently deleted.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Forever',
                  style: 'destructive',
                  onPress: async () => {
                    setIsDeleting(true);
                    haptics.warning();

                    const result = await deleteAccount(user.id!);

                    setIsDeleting(false);
                    if (result.success) {
                      haptics.success();
                      logout();
                      router.replace('/');
                    } else {
                      haptics.error();
                      Alert.alert(
                        'Deletion Failed',
                        result.error || 'Could not delete account'
                      );
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleSendFeedback = () => {
    haptics.selection();
    Linking.openURL('mailto:support@alterego-ai.com?subject=App Feedback');
  };

  const handleRateApp = async () => {
    haptics.selection();
    if (await StoreReview.hasAction()) {
      await StoreReview.requestReview();
    } else {
      const storeUrl = Platform.select({
        ios: 'https://apps.apple.com/app/id123456789',
        android: 'https://play.google.com/store/apps/details?id=com.alterego.app',
      });
      if (storeUrl) Linking.openURL(storeUrl);
    }
  };

  const handleShareApp = async () => {
    haptics.selection();
    try {
      await Share.share({
        message: Platform.select({
          ios: 'Check out Alter Ego - Your AI companion for personal growth! https://apps.apple.com/app/id123456789',
          android: 'Check out Alter Ego - Your AI companion for personal growth! https://play.google.com/store/apps/details?id=com.alterego.app',
          default: 'Check out Alter Ego - Your AI companion for personal growth!',
        }),
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear cached data and temporary files. Your account data will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: async () => {
            haptics.medium();
            try {
              await AsyncStorage.multiRemove([
                'cache_messages',
                'cache_images',
                'cache_audio',
              ]);
              haptics.success();
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (error) {
              haptics.error();
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          haptics.medium();
          logout();
          router.replace('/');
        },
      },
    ]);
  };

  const handleAction = (action: string) => {
    switch (action) {
      case 'export':
        handleExportData();
        break;
      case 'feedback':
        handleSendFeedback();
        break;
      case 'rateApp':
        handleRateApp();
        break;
      case 'shareApp':
        handleShareApp();
        break;
      case 'clearCache':
        handleClearCache();
        break;
      default:
        break;
    }
  };

  const getToggleValue = (key: string): boolean => {
    if (key === 'darkMode') {
      return isDark;
    }
    if (key === 'notificationsEnabled') {
      return notificationsEnabled;
    }
    if (key === 'hapticsEnabled') {
      return hapticEnabled;
    }
    return false;
  };

  const renderSettingsItem = (item: any) => {
    const isLoading =
      (item.action === 'export' && isExporting) ||
      (item.id === 'delete' && isDeleting);

    return (
      <Pressable
        key={item.id}
        style={[styles.settingsItem, { borderBottomColor: colors.border }]}
        onPress={() => {
          if (item.route) handleNavigate(item.route);
          else if (item.url) handleOpenUrl(item.url);
          else if (item.action) handleAction(item.action);
        }}
        disabled={isLoading || item.toggle}
      >
        <View style={styles.settingsItemLeft}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: colors.glassBackground },
            ]}
          >
            <Ionicons name={item.icon} size={20} color={colors.primary} />
          </View>
          <ThemedText
            style={[styles.settingsItemLabel, { color: colors.text }]}
          >
            {item.label}
          </ThemedText>
        </View>

        <View style={styles.settingsItemRight}>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : item.toggle ? (
            <Switch
              value={getToggleValue(item.toggleKey)}
              onValueChange={(value) => handleToggle(item.toggleKey, value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFF"
            />
          ) : item.value ? (
            <View style={styles.valueContainer}>
              <ThemedText style={[styles.valueText, { color: colors.textMuted }]}>
                {item.value}
              </ThemedText>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textMuted}
              />
            </View>
          ) : item.chevron ? (
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          ) : null}
        </View>
      </Pressable>
    );
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
        style={[styles.header, { paddingTop: insets.top + 10 }]}
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
        <ThemedText style={[styles.headerTitle, { color: colors.text }]}>Settings</ThemedText>
        <View style={{ width: 40 }} />
      </BlurView>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <GlassView intensity={isDark ? 40 : 20} style={styles.profileCard}>
          <Pressable
            style={styles.profileContent}
            onPress={() => handleNavigate('/settings/profile')}
          >
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
            <View style={styles.profileInfo}>
              <ThemedText style={[styles.profileName, { color: colors.text }]}>
                {user.name || 'User'}
              </ThemedText>
              <ThemedText
                style={[styles.profileEmail, { color: colors.textMuted }]}
              >
                {user.email || 'Tap to set up profile'}
              </ThemedText>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </Pressable>

          {/* Subscription Status */}
          {!user.isPro && (
            <Pressable
              style={[
                styles.upgradeButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => {
                haptics.selection();
                Alert.alert('Upgrade to Pro', 'Coming soon!');
              }}
            >
              <Ionicons name="star" size={18} color="#FFF" />
              <ThemedText style={styles.upgradeText}>Upgrade to Pro</ThemedText>
            </Pressable>
          )}

          {user.isPro && (
            <View
              style={[styles.proBadge, { backgroundColor: colors.success }]}
            >
              <Ionicons name="checkmark-circle" size={16} color="#FFF" />
              <ThemedText style={styles.proBadgeText}>
                Pro Member • {user.credits || '∞'} Credits
              </ThemedText>
            </View>
          )}
        </GlassView>

        {/* Settings Sections */}
        {SETTINGS_SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <ThemedText
              style={[styles.sectionTitle, { color: colors.textMuted }]}
            >
              {section.title}
            </ThemedText>
            <GlassView intensity={isDark ? 40 : 20} style={styles.sectionCard}>
              {section.items.map((item, index) => (
                <View key={item.id}>
                  {renderSettingsItem(item)}
                  {index < section.items.length - 1 && (
                    <View
                      style={[
                        styles.divider,
                        { backgroundColor: colors.border },
                      ]}
                    />
                  )}
                </View>
              ))}
            </GlassView>
          </View>
        ))}

        {/* Danger Zone */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: colors.error }]}>
            Danger Zone
          </ThemedText>
          <GlassView
            intensity={isDark ? 40 : 20}
            style={[styles.sectionCard, { borderColor: 'rgba(239,68,68,0.3)' }]}
          >
            <Pressable
              style={styles.settingsItem}
              onPress={handleDeleteAccount}
              disabled={isDeleting}
            >
              <View style={styles.settingsItemLeft}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: 'rgba(239,68,68,0.15)' },
                  ]}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={colors.error}
                  />
                </View>
                <ThemedText
                  style={[styles.settingsItemLabel, { color: colors.error }]}
                >
                  Delete Account
                </ThemedText>
              </View>
              <View style={styles.settingsItemRight}>
                {isDeleting ? (
                  <ActivityIndicator size="small" color={colors.error} />
                ) : (
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.error}
                  />
                )}
              </View>
            </Pressable>
          </GlassView>
        </View>

        {/* Sign Out Button */}
        <Pressable
          style={[
            styles.signOutButton,
            { backgroundColor: colors.glassBackground },
          ]}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <ThemedText style={[styles.signOutText, { color: colors.error }]}>
            Sign Out
          </ThemedText>
        </Pressable>

        {/* App Version */}
        <ThemedText style={[styles.versionText, { color: colors.textMuted }]}>
          Alter Ego v{APP_VERSION} ({BUILD_NUMBER})
        </ThemedText>
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
  },
  profileCard: {
    borderRadius: BorderRadius.lg,
    padding: 20,
    marginBottom: 24,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  upgradeText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  proBadgeText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingsItemLabel: {
    fontSize: 16,
  },
  settingsItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  valueText: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginLeft: 66,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: BorderRadius.lg,
    marginBottom: 16,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 13,
  },
});
