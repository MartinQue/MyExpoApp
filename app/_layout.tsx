import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThinkingProvider } from '@/lib/ThinkingContext';
import { Colors } from '@/constants/Theme';
import { LogViewer } from '@/components/DevTools/LogViewer';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThinkingProvider>
        <View style={{ flex: 1, backgroundColor: Colors.black }}>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
          </Stack>
          <LogViewer />
        </View>
      </ThinkingProvider>
    </GestureHandlerRootView>
  );
}
