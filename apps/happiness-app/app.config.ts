import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Happiness App',
  slug: 'happiness-app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'myexpoapp',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    infoPlist: {
      NSMicrophoneUsageDescription:
        'This app uses the microphone to record audio.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-asset',
    '@livekit/react-native-expo-plugin',
    '@config-plugins/react-native-webrtc',
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    // Environment variables exposed via expo-constants
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    langgraphUrl: process.env.EXPO_PUBLIC_LANGGRAPH_URL,
    langchainApiKey: process.env.EXPO_PUBLIC_LANGCHAIN_API_KEY,
    langsmithApiKey:
      process.env.EXPO_PUBLIC_LANGSMITH_API_KEY ??
      process.env.EXPO_PUBLIC_LANGCHAIN_API_KEY,
    langsmithBaseUrl:
      process.env.EXPO_PUBLIC_LANGSMITH_BASE_URL ??
      'https://api.smith.langchain.com',
    openaiApiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
    assemblyaiProxyUrl: process.env.EXPO_PUBLIC_ASSEMBLYAI_PROXY_URL,
    rcAppId: process.env.EXPO_PUBLIC_RC_APP_ID,
    rcApiKey: process.env.EXPO_PUBLIC_RC_API_KEY,
    rcEntitlement: process.env.EXPO_PUBLIC_RC_ENTITLEMENT,
  },
});
