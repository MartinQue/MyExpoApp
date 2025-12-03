# Monorepo Structure Guide

This repository has been restructured as a **monorepo** to support multiple apps while keeping code organized and scalable.

## 📁 New Project Structure

```
MyExpoApp/                          # Root monorepo
├── apps/                           # All applications
│   └── happiness-app/              # Happiness AI App
│       ├── app/                    # Expo Router pages
│       ├── components/             # React components
│       ├── stores/                 # Zustand state management
│       ├── lib/                    # Business logic
│       ├── constants/              # Design system
│       ├── types/                  # TypeScript types
│       ├── utils/                  # Utilities
│       ├── assets/                 # Images, fonts
│       ├── package.json            # App dependencies
│       ├── app.config.ts           # Expo configuration
│       └── tsconfig.json           # TypeScript config
│
├── packages/                       # Shared packages
│   └── shared-config/              # Shared environment config
│       ├── index.js                # Environment variables
│       ├── index.d.ts              # TypeScript definitions
│       ├── package.json
│       └── README.md
│
├── langgraph/                      # Python backend (unchanged)
├── docs/                           # Documentation (unchanged)
├── package.json                    # Root workspace config
├── .env.local                      # Shared environment variables
└── MONOREPO_GUIDE.md              # This file
```

## 🎯 Key Benefits

### 1. **Clean Separation**
- Each app lives in its own folder under `apps/`
- No mixing of app-specific code
- Easy to add new apps without confusion

### 2. **Shared Configuration**
- API keys defined once in root `.env.local`
- Accessible to all apps via `@myexpoapp/shared-config`
- Single source of truth for environment variables

### 3. **Scalability**
- Add new apps easily: `mkdir apps/new-app`
- Share common code via `packages/` folder
- Independent versioning per app

### 4. **Type Safety**
- Full TypeScript support across workspace
- Shared types can be extracted to packages
- IntelliSense works across packages

## 🚀 Getting Started

### Initial Setup

```bash
# Install all dependencies (run from root)
npm install

# This installs dependencies for:
# - Root workspace
# - apps/happiness-app
# - packages/shared-config
```

### Running the Happiness App

```bash
# From root directory:
npm run happiness-app           # Start Expo dev server
npm run happiness-app:android   # Run on Android
npm run happiness-app:ios       # Run on iOS
npm run happiness-app:web       # Run on web
npm run happiness-app:dev       # Start with cache clear

# Or from the app directory:
cd apps/happiness-app
npm start
```

### Other Useful Commands

```bash
# Type check all apps
npm run typecheck

# Lint all apps
npm run lint

# Clean all node_modules
npm run clean

# Reinstall everything
npm run clean && npm install
```

## 📦 Using Shared Config

The `@myexpoapp/shared-config` package provides access to environment variables across all apps.

### In Your App Code:

```typescript
import config from '@myexpoapp/shared-config';

// Access environment variables
const supabaseUrl = config.SUPABASE_URL;
const openaiKey = config.OPENAI_API_KEY;
const elevenlabsKey = config.ELEVENLABS_API_KEY;
```

### Available Environment Variables:

All variables from `.env.local` are accessible:

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `OPENAI_API_KEY` - OpenAI API key
- `LANGCHAIN_API_KEY` - LangChain API key
- `LANGGRAPH_URL` - LangGraph deployment URL
- `ELEVENLABS_API_KEY` - ElevenLabs API key
- `GOOGLE_AI_API_KEY` - Google AI API key
- `GEMINI_MODEL` - Gemini model name
- And more...

### Environment File Location

**Important:** Environment variables are defined in the **root** `.env.local` file:

```
MyExpoApp/.env.local  ← Define variables here
```

Do NOT create separate `.env.local` files in each app directory.

## 🆕 Adding a New App

### Step 1: Create the App Structure

```bash
# From root directory
cd apps
expo init new-app-name

# Or manually create:
mkdir -p apps/new-app-name
cd apps/new-app-name
# Set up your app structure
```

### Step 2: Update package.json

Create `apps/new-app-name/package.json`:

```json
{
  "name": "@myexpoapp/new-app-name",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "dependencies": {
    "@myexpoapp/shared-config": "*",
    "expo": "~54.0.25",
    "react": "19.1.0",
    "react-native": "0.81.5"
    // ... other dependencies
  },
  "private": true
}
```

### Step 3: Add Scripts to Root package.json

Add convenience scripts in root `package.json`:

```json
{
  "scripts": {
    "new-app": "npm run start --workspace=@myexpoapp/new-app-name",
    "new-app:android": "npm run android --workspace=@myexpoapp/new-app-name",
    "new-app:ios": "npm run ios --workspace=@myexpoapp/new-app-name"
  }
}
```

### Step 4: Install Dependencies

```bash
# From root
npm install
```

### Step 5: Start Building!

```bash
npm run new-app
```

## 📚 Creating Shared Packages

Want to share UI components, utilities, or types across apps?

### Step 1: Create Package

```bash
mkdir -p packages/shared-ui
cd packages/shared-ui
```

### Step 2: Create package.json

```json
{
  "name": "@myexpoapp/shared-ui",
  "version": "1.0.0",
  "main": "index.js",
  "types": "index.d.ts",
  "private": true
}
```

### Step 3: Export Components

Create `packages/shared-ui/index.js`:

```javascript
export { default as Button } from './Button';
export { default as Card } from './Card';
```

### Step 4: Use in Apps

Add to app's `package.json`:

```json
{
  "dependencies": {
    "@myexpoapp/shared-ui": "*"
  }
}
```

Then import:

```typescript
import { Button, Card } from '@myexpoapp/shared-ui';
```

## 🔧 npm Workspaces Explained

This monorepo uses **npm workspaces** (built into npm 7+).

### Key Concepts:

1. **Workspace Root:** The root `package.json` defines workspaces
2. **Hoisting:** Dependencies are installed in root `node_modules/`
3. **Symlinking:** Workspace packages are symlinked in `node_modules/@myexpoapp/`
4. **Deduplication:** Shared dependencies are only installed once

### Workspace Commands:

```bash
# Run command in specific workspace
npm run <script> --workspace=@myexpoapp/happiness-app

# Run command in all workspaces
npm run <script> --workspaces

# Install in specific workspace
npm install <package> --workspace=@myexpoapp/happiness-app

# List all workspaces
npm ls --workspaces --depth=0
```

## 🐛 Troubleshooting

### "Module not found" errors

```bash
# Clear all caches and reinstall
npm run clean
npm install
cd apps/happiness-app
npx expo start --clear
```

### TypeScript can't find @myexpoapp/* packages

Make sure your app's `tsconfig.json` doesn't have strict path mappings. The workspace should resolve packages automatically.

### Expo dev server not starting

```bash
cd apps/happiness-app
npx expo start --clear
```

### Changes in shared-config not reflecting

```bash
# Restart the dev server with cache clear
npm run happiness-app:dev
```

## 📝 Best Practices

### 1. **Keep Apps Independent**
- Each app should run independently
- Don't create tight coupling between apps
- Share code via packages, not direct imports

### 2. **Use Shared Packages Wisely**
- Only share truly reusable code
- Document shared packages well
- Version shared packages if they evolve

### 3. **Environment Variables**
- Always define in root `.env.local`
- Access via `@myexpoapp/shared-config`
- Never commit `.env.local` to git

### 4. **Git Strategy**
- Keep all apps in one repo
- Use conventional commits: `feat(happiness-app): add feature`
- Tag releases per app: `happiness-app-v1.0.0`

### 5. **Dependencies**
- Run `npm install` from root
- Add app-specific deps to app's package.json
- Add shared deps to shared packages

## 🎓 Learning Resources

- [npm Workspaces Documentation](https://docs.npmjs.com/cli/v10/using-npm/workspaces)
- [Expo Monorepo Guide](https://docs.expo.dev/guides/monorepos/)
- [Managing Monorepos with npm](https://github.blog/2020-10-13-presenting-v7-0-0-of-the-npm-cli/)

## 🚨 Important Notes

### DO:
✅ Define environment variables in root `.env.local`
✅ Import shared config: `import config from '@myexpoapp/shared-config'`
✅ Run `npm install` from root directory
✅ Create new apps under `apps/` folder
✅ Share code via `packages/` folder

### DON'T:
❌ Create `.env.local` in individual app folders
❌ Import directly from other apps (use packages instead)
❌ Run `npm install` in individual app folders (use root)
❌ Mix app-specific code in root directory
❌ Commit `node_modules/` or `.env.local`

## 📞 Need Help?

If you run into issues:
1. Check this guide
2. Run `npm run clean && npm install`
3. Clear Expo cache: `npx expo start --clear`
4. Check package.json workspace configuration
5. Verify symlinks in `node_modules/@myexpoapp/`

---

**Last Updated:** December 3, 2025
**Structure Version:** 1.0.0
