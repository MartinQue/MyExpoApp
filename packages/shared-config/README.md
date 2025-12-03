# Shared Config Package

This package contains shared environment configuration that can be used across all apps in the monorepo.

## Usage

In your app, you can import the shared config:

```typescript
import config from '@myexpoapp/shared-config';

// Access environment variables
const supabaseUrl = config.SUPABASE_URL;
const openaiKey = config.OPENAI_API_KEY;
```

## Environment Variables

All environment variables should be defined in the root `.env.local` file. The shared config package will read from these variables and make them available to all apps.

### Available Variables:

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `LANGCHAIN_API_KEY` - LangChain API key
- `LANGGRAPH_URL` - LangGraph deployment URL
- `OPENAI_API_KEY` - OpenAI API key
- `ELEVENLABS_API_KEY` - ElevenLabs API key
- `GOOGLE_AI_API_KEY` - Google AI API key
- And more...

## Benefits

- **Single source of truth**: All API keys and configuration in one place
- **Type safety**: TypeScript definitions ensure proper usage
- **Easy to share**: New apps can immediately access all configuration
- **Maintainable**: Update keys in one place, affects all apps
