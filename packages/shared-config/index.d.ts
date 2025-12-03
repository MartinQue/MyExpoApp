// TypeScript type definitions for shared config

export interface SharedConfig {
  SUPABASE_URL: string | undefined;
  SUPABASE_ANON_KEY: string | undefined;
  LANGCHAIN_API_KEY: string | undefined;
  LANGCHAIN_PROJECT: string;
  LANGCHAIN_ENDPOINT: string;
  LANGGRAPH_URL: string | undefined;
  OPENAI_API_KEY: string | undefined;
  LANGSMITH_API_KEY: string | undefined;
  LANGSMITH_BASE_URL: string;
  ELEVENLABS_API_KEY: string | undefined;
  GOOGLE_AI_API_KEY: string | undefined;
  GEMINI_MODEL: string;
  ASSEMBLYAI_PROXY_URL: string | undefined;
  RC_APP_ID: string | undefined;
  RC_API_KEY: string | undefined;
  RC_ENTITLEMENT: string | undefined;
}

declare const config: SharedConfig;
export default config;
