# Settings Synchronization Guide

This document tracks all app features that need to be reflected in the Settings page and vice versa.

## Settings Page Location
`apps/happiness-app/app/settings/index.tsx`

## Current Settings Sections

### Account
- Personal Information → `/settings/profile`
- Security & Password → `/settings/security`
- Subscription & Billing → `/settings/subscription`

### Preferences
| Setting | Toggle Key | Store Location |
|---------|------------|----------------|
| Notifications | `notificationsEnabled` | `userStore` |
| Dark Mode | `darkMode` | `ThemeContext` |
| Haptic Feedback | `hapticsEnabled` | `userStore` |
| Language | - | `/settings/language` |

### AI & Voice
- Voice Settings → `/settings/voice`
- AI Personality → `/settings/ai-personality`
- Conversation History → `/settings/history`

### Data & Privacy
- Export My Data → `exportUserData()` from `@/lib/accountService`
- Clear Cache → Clears AsyncStorage cache keys
- Privacy Policy → External URL
- Terms of Service → External URL

### Support
- Help & FAQ → External URL
- Send Feedback → mailto: link
- Rate Us → `expo-store-review`
- Share App → Native share sheet

### About
- What's New → `/settings/changelog`
- Open Source Licenses → `/settings/licenses`

### Danger Zone
- Delete Account → `deleteAccount()` from `@/lib/accountService`

## When to Update Settings

Update the Settings page when:
1. Adding a new user preference toggle
2. Adding a new feature that needs user configuration
3. Changing app name or branding
4. Adding new legal documents or policies
5. Changing support contact information
6. Adding new subscription tiers

## Dependencies

Required packages for Settings:
- `expo-store-review` - For app store rating
- `expo-application` - For app version info
- `@react-native-async-storage/async-storage` - For cache management

## Theme Support

The Settings page must support both light and dark themes:
- All text must use `colors.text` or appropriate theme color
- All backgrounds must use theme-aware colors
- GlassView intensity differs: `isDark ? 40 : 20`
- BlurView tint: `isDark ? 'dark' : 'light'`

## Version Display

App version is displayed at the bottom using:
```typescript
import * as Application from 'expo-application';
const APP_VERSION = Application.nativeApplicationVersion || '1.0.0';
const BUILD_NUMBER = Application.nativeBuildVersion || '1';
```

## Branding

Current app name: **Alter Ego**
Support email: support@alterego-ai.com
