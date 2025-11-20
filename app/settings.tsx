import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Colors, BorderRadius } from '@/constants/Theme';
import { ThemedText } from '@/components/ui/ThemedText';
import { GlassView } from '@/components/Glass/GlassView';
import { useUserStore } from '@/stores/userStore';
import * as Haptics from 'expo-haptics';

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, toggleTheme } = useUserStore();

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const SettingItem = ({
    icon,
    label,
    type = 'arrow',
    value = false,
    onToggle,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    type?: 'arrow' | 'toggle' | 'none';
    value?: boolean;
    onToggle?: (val: boolean) => void;
  }) => (
    <Pressable
      style={({ pressed }) => [
        styles.settingItem,
        pressed && styles.settingItemPressed,
      ]}
      onPress={() => {
        if (type !== 'toggle') {
          Haptics.selectionAsync();
        }
      }}
    >
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color="white" />
        </View>
        <ThemedText style={styles.settingLabel}>{label}</ThemedText>
      </View>

      {type === 'toggle' ? (
        <Switch
          value={value}
          onValueChange={(val) => {
            Haptics.selectionAsync();
            onToggle?.(val);
          }}
          trackColor={{ false: '#3e3e3e', true: Colors.primary }}
          thumbColor={'white'}
        />
      ) : type === 'arrow' ? (
        <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
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
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
      <GlassView intensity={40} style={styles.sectionContent}>
        {children}
      </GlassView>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={
          theme === 'dark'
            ? Colors.gradients.profile
            : Colors.lightGradients.profile
        }
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Header */}
      <BlurView intensity={80} tint="dark" style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Settings</ThemedText>
        <View style={{ width: 40 }} />
      </BlurView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Section title="Account">
          <SettingItem icon="person-outline" label="Personal Information" />
          <SettingItem icon="shield-checkmark-outline" label="Security" />
          <SettingItem icon="card-outline" label="Subscription" />
        </Section>

        <Section title="Privacy & Data">
          <SettingItem icon="lock-closed-outline" label="Privacy Policy" />
          <SettingItem icon="cloud-download-outline" label="Download My Data" />
          <SettingItem icon="trash-outline" label="Delete Account" />
        </Section>

        <Section title="Notifications">
          <SettingItem
            icon="notifications-outline"
            label="Push Notifications"
            type="toggle"
            value={true}
          />
          <SettingItem
            icon="mail-outline"
            label="Email Updates"
            type="toggle"
            value={false}
          />
        </Section>

        <Section title="App Preferences">
          <SettingItem
            icon="moon-outline"
            label="Dark Mode"
            type="toggle"
            value={theme === 'dark'}
            onToggle={toggleTheme}
          />
          <SettingItem icon="language-outline" label="Language" />
        </Section>

        <Section title="About">
          <SettingItem
            icon="information-circle-outline"
            label="Version 1.0.0"
            type="none"
          />
          <SettingItem icon="document-text-outline" label="Terms of Service" />
        </Section>

        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>Happiness AI</ThemedText>
          <ThemedText style={styles.footerSubText}>
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
    backgroundColor: Colors.background,
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    color: Colors.gray[400],
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionContent: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  settingItemPressed: {
    backgroundColor: 'rgba(255,255,255,0.05)',
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    color: 'white',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    gap: 4,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[400],
  },
  footerSubText: {
    fontSize: 12,
    color: Colors.gray[600],
  },
});
