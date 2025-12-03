import { Tabs, usePathname } from 'expo-router';
import { TabBar } from '@/components/navigation/TabBar';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { Colors } from '@/constants/Theme';
import { useUserStore } from '@/stores/userStore';
import { useChatStore } from '@/stores/chatStore';

export default function TabLayout() {
  const pathname = usePathname();
  const { theme } = useUserStore();
  const { voiceMode } = useChatStore();

  const getGradientColors = () => {
    const gradients =
      theme === 'dark' ? Colors.gradients : Colors.lightGradients;

    switch (pathname) {
      case '/profile':
      case '/':
        return gradients.profile;
      case '/planner':
        return gradients.planner;
      case '/library':
        return gradients.library;
      case '/chat':
        return gradients.chat;
      case '/imagine':
        return gradients.imagine;
      default:
        return gradients.profile;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={getGradientColors()}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <Tabs
        tabBar={(props) => (voiceMode ? null : <TabBar {...props} />)}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Tabs.Screen name="profile" />
        <Tabs.Screen name="chat" />
        <Tabs.Screen name="imagine" />
        <Tabs.Screen name="library" />
        <Tabs.Screen name="planner" />
        <Tabs.Screen name="index" options={{ href: null }} />
      </Tabs>
    </View>
  );
}
