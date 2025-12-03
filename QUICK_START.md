# Quick Start Guide

## 🚀 Running the Happiness App

### From Root Directory

```bash
# Start the app
npm run happiness-app

# Run on specific platform
npm run happiness-app:android
npm run happiness-app:ios
npm run happiness-app:web

# Start with cache clear
npm run happiness-app:dev
```

### From App Directory

```bash
cd apps/happiness-app
npm start
```

## 📦 Environment Variables

All environment variables are in the root `.env.local` file and automatically shared to all apps via `@myexpoapp/shared-config`.

**Current keys configured:**
- ✅ Supabase (URL, Anon Key)
- ✅ OpenAI API Key
- ✅ LangChain/LangSmith Keys
- ✅ LangGraph URL
- ✅ ElevenLabs API Key
- ✅ Google AI API Key

## 🆕 Creating a New App

```bash
# 1. Create app directory
mkdir apps/my-new-app
cd apps/my-new-app

# 2. Initialize Expo app
npx create-expo-app@latest . --template blank-typescript

# 3. Update package.json name
# Change "name" to "@myexpoapp/my-new-app"

# 4. Add shared config dependency
npm install @myexpoapp/shared-config

# 5. Install from root
cd ../..
npm install

# 6. Add convenience scripts to root package.json
# Copy the pattern from happiness-app scripts

# 7. Start your new app!
npm run my-new-app
```

## 📚 Using Shared Config in Your App

```typescript
// Import the shared config
import config from '@myexpoapp/shared-config';

// Use environment variables
const supabaseUrl = config.SUPABASE_URL;
const openaiKey = config.OPENAI_API_KEY;
const langchainKey = config.LANGCHAIN_API_KEY;
```

## 🔧 Common Commands

```bash
# Install all dependencies
npm install

# Type check all apps
npm run typecheck

# Lint all apps
npm run lint

# Clean everything
npm run clean

# List all workspace packages
npm ls --workspaces --depth=0

# Install package in specific app
npm install <package> --workspace=@myexpoapp/happiness-app
```

## 🐛 Troubleshooting

### Metro bundler issues
```bash
cd apps/happiness-app
npx expo start --clear
```

### Module not found
```bash
npm run clean
npm install
cd apps/happiness-app
npx expo start --clear
```

### TypeScript errors
```bash
cd apps/happiness-app
npx tsc --noEmit
```

## 📖 Full Documentation

- [Monorepo Guide](./MONOREPO_GUIDE.md) - Complete guide
- [README](./README.md) - Project overview
- [Shared Config](./packages/shared-config/README.md) - Environment config

## 🎯 Key Points

1. ✅ **Environment variables** are in root `.env.local`
2. ✅ **Run commands** from root directory using npm scripts
3. ✅ **All apps** can access shared config via `@myexpoapp/shared-config`
4. ✅ **Dependencies** are hoisted to root `node_modules/`
5. ✅ **Each app** is independent and can be run separately

---

**Need help?** See [MONOREPO_GUIDE.md](./MONOREPO_GUIDE.md) for detailed instructions.
