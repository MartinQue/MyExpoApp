# MyExpoApp Monorepo

A scalable monorepo for building multiple Expo/React Native applications with shared configuration and packages.

## 📱 Apps

### Happiness App
AI-powered multi-agent companion app for personal growth and happiness.

**Status:** ✅ Production Ready (v1.0.0)

**Tech Stack:**
- Expo SDK 54
- React Native 0.81.5
- TypeScript (strict mode)
- Zustand (state management)
- Expo Router (navigation)
- Supabase (backend)
- OpenAI GPT-4, DALL-E 3
- LangGraph (multi-agent orchestration)

**Features:**
- 🎙️ Voice conversation with AI agents
- 🎨 AI image generation (DALL-E 3)
- 📚 Knowledge vault/media library
- 📝 Goal & task planner
- 💬 Multi-modal chat interface
- 🌓 Light/dark theme support
- ✨ Glassmorphism UI design

[View Happiness App Documentation →](./apps/happiness-app/)

---

## 🏗️ Monorepo Structure

```
MyExpoApp/
├── apps/                    # All applications
│   └── happiness-app/       # Happiness AI App
│
├── packages/                # Shared packages
│   └── shared-config/       # Shared environment config
│
├── langgraph/               # Python backend
├── docs/                    # Documentation
└── MONOREPO_GUIDE.md       # Complete monorepo guide
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd MyExpoApp

# Install all dependencies
npm install

# Start the Happiness App
npm run happiness-app
```

### Available Commands

```bash
# Happiness App
npm run happiness-app           # Start dev server
npm run happiness-app:android   # Run on Android
npm run happiness-app:ios       # Run on iOS
npm run happiness-app:web       # Run on web
npm run happiness-app:dev       # Start with cache clear

# Workspace Management
npm run typecheck               # Type check all apps
npm run lint                    # Lint all apps
npm run clean                   # Remove all node_modules
npm install                     # Install all dependencies
```

## 📦 Packages

### @myexpoapp/shared-config
Shared environment configuration for all apps.

**Usage:**
```typescript
import config from '@myexpoapp/shared-config';

const supabaseUrl = config.SUPABASE_URL;
const openaiKey = config.OPENAI_API_KEY;
```

[Learn more →](./packages/shared-config/README.md)

## 🆕 Adding a New App

```bash
# Create new app directory
mkdir apps/your-new-app

# Add to workspace (automatic with npm workspaces)
npm install

# Add convenience scripts to root package.json
# See MONOREPO_GUIDE.md for detailed instructions
```

[Complete Guide →](./MONOREPO_GUIDE.md)

## 🔧 Environment Variables

All environment variables are defined in the root `.env.local` file and shared across all apps via `@myexpoapp/shared-config`.

**Setup:**
1. Copy `.env.local.example` to `.env.local` (if available)
2. Add your API keys to `.env.local`
3. Access in apps via `@myexpoapp/shared-config`

**Available Variables:**
- Supabase (URL, Anon Key)
- OpenAI API Key
- LangChain/LangSmith Keys
- ElevenLabs API Key
- Google AI API Key
- And more...

## 📚 Documentation

- **[Monorepo Guide](./MONOREPO_GUIDE.md)** - Complete guide to the monorepo structure
- **[Happiness App PRD](./docs/PRODUCT_REQUIREMENTS_DOCUMENT.md)** - Product requirements
- **[Figma Design Brief](./docs/FIGMA_DESIGN_BRIEF.md)** - UI/UX design specifications
- **[Implementation Docs](./docs/)** - Technical documentation

## 🏛️ Architecture

### Monorepo Strategy
- **npm workspaces** for package management
- **Shared packages** for common code
- **Independent apps** with separate versioning
- **Hoisted dependencies** for efficiency

### App Architecture
- **Expo Router** for file-based navigation
- **Zustand** for lightweight state management
- **React Context** for cross-cutting concerns
- **TypeScript** strict mode for type safety
- **Service layer** for business logic separation

## 🛠️ Tech Stack

- **Runtime:** React Native 0.81.5
- **Framework:** Expo SDK 54
- **Language:** TypeScript 5.9
- **State:** Zustand 5.0
- **Navigation:** Expo Router 6.0
- **UI:** Custom Glassmorphism Components
- **Styling:** NativeWind (Tailwind for RN)
- **Animation:** Reanimated 4 + Moti
- **Backend:** Supabase
- **AI:** OpenAI, Google Gemini, ElevenLabs

## 📊 Project Status

| App | Status | Version | Notes |
|-----|--------|---------|-------|
| Happiness App | ✅ Production Ready | 1.0.0 | All core features complete |

## 🤝 Contributing

### Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feat/your-feature
   ```

2. **Make your changes**
   - Follow existing code style
   - Add tests if applicable
   - Update documentation

3. **Commit with conventional commits**
   ```bash
   git commit -m "feat(happiness-app): add new feature"
   ```

4. **Test thoroughly**
   ```bash
   npm run typecheck
   npm run lint
   # Test the app
   ```

5. **Create a pull request**

### Commit Convention

- `feat(app-name): description` - New feature
- `fix(app-name): description` - Bug fix
- `docs: description` - Documentation
- `refactor(app-name): description` - Code refactoring
- `chore: description` - Maintenance tasks

## 🐛 Troubleshooting

### Common Issues

**Module not found errors:**
```bash
npm run clean
npm install
cd apps/happiness-app
npx expo start --clear
```

**Metro bundler cache issues:**
```bash
npm run happiness-app:dev  # Starts with --clear flag
```

**TypeScript errors:**
```bash
cd apps/happiness-app
npx tsc --noEmit
```

[More troubleshooting →](./MONOREPO_GUIDE.md#troubleshooting)

## 📄 License

Private repository. All rights reserved.

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev/)
- Powered by [React Native](https://reactnative.dev/)
- AI by [OpenAI](https://openai.com/)
- Backend by [Supabase](https://supabase.com/)
- Agent orchestration by [LangGraph](https://langchain.com/)

---

**Repository Structure Version:** 1.0.0
**Last Updated:** December 3, 2025

For detailed monorepo usage, see [MONOREPO_GUIDE.md](./MONOREPO_GUIDE.md)
