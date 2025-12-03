// Shared environment configuration
// This file exports environment variables that can be used across all apps

module.exports = {
  // Supabase Configuration
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,

  // LangChain / LangSmith
  LANGCHAIN_API_KEY: process.env.EXPO_PUBLIC_LANGCHAIN_API_KEY || process.env.LANGCHAIN_API_KEY,
  LANGCHAIN_PROJECT: process.env.LANGCHAIN_PROJECT || 'Happiness-App',
  LANGCHAIN_ENDPOINT: process.env.LANGCHAIN_ENDPOINT || 'https://api.smith.langchain.com',

  // LangGraph endpoint
  LANGGRAPH_URL: process.env.EXPO_PUBLIC_LANGGRAPH_URL,

  // OpenAI API Key
  OPENAI_API_KEY: process.env.EXPO_PUBLIC_OPENAI_API_KEY,

  // LangSmith
  LANGSMITH_API_KEY: process.env.EXPO_PUBLIC_LANGSMITH_API_KEY || process.env.EXPO_PUBLIC_LANGCHAIN_API_KEY,
  LANGSMITH_BASE_URL: process.env.EXPO_PUBLIC_LANGSMITH_BASE_URL || 'https://api.smith.langchain.com',

  // Voice AI
  ELEVENLABS_API_KEY: process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY,
  GOOGLE_AI_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_AI_API_KEY,
  GEMINI_MODEL: process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-2.0-flash-exp',

  // AssemblyAI
  ASSEMBLYAI_PROXY_URL: process.env.EXPO_PUBLIC_ASSEMBLYAI_PROXY_URL,

  // RevenueCat
  RC_APP_ID: process.env.EXPO_PUBLIC_RC_APP_ID,
  RC_API_KEY: process.env.EXPO_PUBLIC_RC_API_KEY,
  RC_ENTITLEMENT: process.env.EXPO_PUBLIC_RC_ENTITLEMENT,
};
