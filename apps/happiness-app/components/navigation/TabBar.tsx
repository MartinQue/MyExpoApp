import React from 'react';
import { View, StyleSheet, Pressable, Platform, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Theme';
import { useTheme } from '@/contexts/ThemeContext';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import haptics from '@/lib/haptics';

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, isDark } = useTheme();
  const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
    profile: 'home-outline',
    chat: 'chatbubble-outline',
    imagine: 'sparkles-outline',
    library: 'library-outline',
    planner: 'radio-button-on-outline',
  };

  const labels: Record<string, string> = {
    profile: 'Home',
    chat: 'Chat',
    imagine: 'Imagine',
    library: 'Library',
    planner: 'Planner',
  };

  return (
    <View style={styles.wrapper}>
      <BlurView
        intensity={80}
        tint={isDark ? 'dark' : 'light'}
        style={[styles.container, { borderTopColor: colors.border }]}
      >
        <LinearGradient
          colors={
            isDark
              ? ['rgba(20, 18, 24, 0.85)', 'rgba(30, 26, 35, 0.9)']
              : ['rgba(255, 255, 255, 0.95)', 'rgba(245, 245, 250, 0.98)']
          }
          style={StyleSheet.absoluteFill}
        />
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              haptics.tabSwitch();
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          // Skip index route if it's just a redirect
          if (route.name === 'index') return null;

          const iconName = icons[route.name] || 'help-circle-outline';
          const label = labels[route.name] || route.name;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={(options as any).tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tab}
            >
              <Ionicons
                name={
                  isFocused
                    ? (iconName.replace('-outline', '') as any)
                    : (iconName as any)
                }
                size={24}
                color={
                  isFocused
                    ? isDark
                      ? Colors.white
                      : colors.primary
                    : isDark
                    ? Colors.gray[500]
                    : Colors.gray[400]
                }
              />
              <Text
                style={[
                  styles.label,
                  {
                    color: isFocused
                      ? isDark
                        ? Colors.white
                        : colors.primary
                      : isDark
                      ? Colors.gray[500]
                      : Colors.gray[500],
                  },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    width: 60,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto' }),
  },
});
