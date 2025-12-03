import Constants from 'expo-constants';

export type LangsmithAgents = {
  alter_ego: string;
  planner: string;
  notes: string;
  media: string;
  relationship: string;
  wellness: string;
  learning: string;
  financial: string;
};

export type LangsmithConfig = {
  apiKey: string;
  baseUrl: string;
  agents: LangsmithAgents;
};

export type AppConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  langgraphUrl: string;
  langchainApiKey: string;
  openaiApiKey: string;
  assemblyaiProxyUrl: string;
  rcAppId: string;
  rcApiKey: string;
  rcEntitlement: string;
  buildTime?: string;
  nodeEnv?: string;
  langsmith: LangsmithConfig;
  // External integrations
  epochApiUrl?: string;
  epochApiKey?: string;
  thinkingVideoApiUrl?: string;
  thinkingVideoApiKey?: string;
  theWhisperApiUrl?: string;
  theWhisperApiKey?: string;
  // Voice AI
  googleAiApiKey?: string;
  geminiModel?: string;
  elevenLabsApiKey?: string;
};

const extras = Constants.expoConfig?.extra || {};

const defaultLangsmithAgents: LangsmithAgents = {
  alter_ego: 'alter_ego',
  planner: 'planner_agent',
  notes: 'notes_agent',
  media: 'media_agent',
  relationship: 'relationship_agent',
  wellness: 'wellness_agent',
  learning: 'learning_agent',
  financial: 'financial_agent',
};

const resolvedLangsmithAgents: LangsmithAgents = {
  ...defaultLangsmithAgents,
  ...(extras.langsmithAgents ?? {}),
};

// Map uppercase keys from app.config.ts to camelCase config
export const Config: AppConfig = {
  supabaseUrl:
    extras.EXPO_PUBLIC_SUPABASE_URL ||
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    '',
  supabaseAnonKey:
    extras.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    '',
  langgraphUrl:
    extras.EXPO_PUBLIC_LANGGRAPH_URL ||
    process.env.EXPO_PUBLIC_LANGGRAPH_URL ||
    '',
  langchainApiKey:
    extras.EXPO_PUBLIC_LANGCHAIN_API_KEY ||
    process.env.EXPO_PUBLIC_LANGCHAIN_API_KEY ||
    '',
  openaiApiKey:
    extras.EXPO_PUBLIC_OPENAI_API_KEY ||
    process.env.EXPO_PUBLIC_OPENAI_API_KEY ||
    '',
  assemblyaiProxyUrl:
    extras.EXPO_PUBLIC_ASSEMBLYAI_PROXY_URL ||
    process.env.EXPO_PUBLIC_ASSEMBLYAI_PROXY_URL ||
    '',
  rcAppId:
    extras.EXPO_PUBLIC_RC_APP_ID || process.env.EXPO_PUBLIC_RC_APP_ID || '',
  rcApiKey:
    extras.EXPO_PUBLIC_RC_API_KEY || process.env.EXPO_PUBLIC_RC_API_KEY || '',
  rcEntitlement:
    extras.EXPO_PUBLIC_RC_ENTITLEMENT ||
    process.env.EXPO_PUBLIC_RC_ENTITLEMENT ||
    '',
  buildTime: extras.buildTime || '',
  nodeEnv: extras.nodeEnv || (process.env.NODE_ENV ?? 'development'),
  langsmith: {
    apiKey:
      extras.EXPO_PUBLIC_LANGSMITH_API_KEY ??
      process.env.EXPO_PUBLIC_LANGSMITH_API_KEY ??
      '',
    baseUrl:
      extras.EXPO_PUBLIC_LANGSMITH_BASE_URL ??
      process.env.EXPO_PUBLIC_LANGSMITH_BASE_URL ??
      'https://api.smith.langchain.com',
    agents: resolvedLangsmithAgents,
  },
  // External integrations
  epochApiUrl:
    extras.EXPO_PUBLIC_EPOCH_API_URL ||
    process.env.EXPO_PUBLIC_EPOCH_API_URL ||
    '',
  epochApiKey:
    extras.EXPO_PUBLIC_EPOCH_API_KEY ||
    process.env.EXPO_PUBLIC_EPOCH_API_KEY ||
    '',
  thinkingVideoApiUrl:
    extras.EXPO_PUBLIC_THINKING_VIDEO_API_URL ||
    process.env.EXPO_PUBLIC_THINKING_VIDEO_API_URL ||
    '',
  thinkingVideoApiKey:
    extras.EXPO_PUBLIC_THINKING_VIDEO_API_KEY ||
    process.env.EXPO_PUBLIC_THINKING_VIDEO_API_KEY ||
    '',
  theWhisperApiUrl:
    extras.EXPO_PUBLIC_THEWHISPER_API_URL ||
    process.env.EXPO_PUBLIC_THEWHISPER_API_URL ||
    '',
  theWhisperApiKey:
    extras.EXPO_PUBLIC_THEWHISPER_API_KEY ||
    process.env.EXPO_PUBLIC_THEWHISPER_API_KEY ||
    '',
  // Voice AI
  googleAiApiKey:
    extras.EXPO_PUBLIC_GOOGLE_AI_API_KEY ||
    process.env.EXPO_PUBLIC_GOOGLE_AI_API_KEY ||
    '',
  geminiModel:
    extras.EXPO_PUBLIC_GEMINI_MODEL ||
    process.env.EXPO_PUBLIC_GEMINI_MODEL ||
    'gemini-2.0-flash-exp',
  elevenLabsApiKey:
    extras.EXPO_PUBLIC_ELEVENLABS_API_KEY ||
    process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY ||
    '',
};

// Export named constants for backward compatibility with lib/supabase.ts
export const SUPABASE_URL = Config.supabaseUrl;
export const SUPABASE_ANON_KEY = Config.supabaseAnonKey;
export const OPENAI_API_KEY = Config.openaiApiKey;
export const LANGGRAPH_URL = Config.langgraphUrl;
export const LANGSMITH_API_KEY = Config.langsmith.apiKey;
export const AGENTS = Config.langsmith.agents;
export const GOOGLE_AI_API_KEY = Config.googleAiApiKey;
export const GEMINI_MODEL = Config.geminiModel;
export const ELEVENLABS_API_KEY = Config.elevenLabsApiKey;

export const validateConfig = (): boolean => {
  const required = ['supabaseUrl', 'supabaseAnonKey'] as const;
  const misses = required.filter((k) => !Config[k]);
  if (misses.length) console.warn('Missing env vars:', misses);
  return misses.length === 0;
};

export const getCriticalMissingVars = (): string[] =>
  ['supabaseUrl', 'supabaseAnonKey'].filter(
    (k) => !Config[k as keyof AppConfig]
  );

export const logConfigStatus = (): void => {
  if (__DEV__)
    Object.entries(Config).forEach(([k, v]) => {
      const mask = k.toLowerCase().includes('key');
      console.log(
        `${k}: ${v ? (mask ? '***masked***' : '✓ set') : '✗ missing'}`
      );
    });
};

export const isProductionReady = (): boolean =>
  validateConfig() && getCriticalMissingVars().length === 0;
