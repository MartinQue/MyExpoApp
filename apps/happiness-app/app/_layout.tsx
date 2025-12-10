import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThinkingProvider } from '@/lib/ThinkingContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { VoiceProvider } from '@/contexts/VoiceContext';
import { LogViewer } from '@/components/DevTools/LogViewer';

// Register LiveKit globals for WebRTC support (only if available)
try {
  const { registerGlobals } = require('@livekit/react-native');
  registerGlobals();
} catch (error) {
  // LiveKit not available (e.g., in Expo Go) - will use expo-speech fallback
}

function AppContent() {
  const { colors, isDark } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="settings"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
      <LogViewer />
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <VoiceProvider>
            <ThinkingProvider>
              <AppContent />
            </ThinkingProvider>
          </VoiceProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
