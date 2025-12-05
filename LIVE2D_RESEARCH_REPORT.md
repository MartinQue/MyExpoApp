# Live2D & AIRI Integration Research Report
## Technical Analysis for React Native/Expo Integration

**Date:** December 5, 2025  
**Project:** MyExpoApp (Happiness App)

---

## Executive Summary

This report analyzes the AIRI project and Live2D integration possibilities for React Native/Expo applications. Key findings indicate that while AIRI is primarily a web-based application built with Vue.js, it can be embedded via WebView in React Native. Alternative native implementations using pixi-live2d-display are also viable. Free Live2D models are available through multiple sources, and lip-sync can be implemented using audio analysis.

---

## 1. AIRI Project Analysis

### 1.1 Architecture Overview

**Project Type:** Monorepo-based web application with desktop support  
**Primary Stack:**
- **Frontend Framework:** Vue.js (TypeScript)
- **Build Tool:** pnpm workspaces, Vite
- **Avatar Rendering:** 
  - Live2D Cubism SDK (for 2D anime avatars)
  - VRM models (for 3D humanoid avatars)
  - Three.js for 3D rendering
- **AI/LLM Integration:** xsAI (custom library supporting 20+ providers)
- **Desktop:** Tauri (Rust-based Electron alternative)
- **Web Technologies:** WebGPU, WebAudio, Web Workers, WebAssembly, WebSocket

**Repository Structure:**
```
airi/
├── apps/
│   ├── stage-web/          # Browser version (airi.moeru.ai)
│   ├── stage-tamagotchi/   # Desktop version (Tauri)
│   ├── realtime-audio/     # Audio processing
│   └── playground-prompt-engineering/
├── packages/
│   ├── @proj-airi/stage-ui/
│   ├── @proj-airi/ui/
│   ├── @proj-airi/drizzle-duckdb-wasm/
│   ├── @proj-airi/duckdb-wasm/
│   └── server-sdk/
├── services/
│   ├── telegram-bot/
│   ├── discord-bot/
│   ├── minecraft/
│   └── factorio/
└── crates/
    └── tauri-plugin-mcp/
```

### 1.2 Live2D Implementation in AIRI

**Key Features:**
- Supports both Live2D Cubism 2.1 and 4.0 models
- Auto-blink functionality
- Auto look-at (eye tracking)
- Idle eye movements
- Lip-sync support (currently with ElevenLabs TTS)
- Expression changes

**Rendering Pipeline:**
1. Uses Live2D Cubism SDK for Web (TypeScript/JavaScript)
2. WebGL-based rendering
3. Parameter manipulation for animations
4. Audio-driven lip-sync via mouth parameters

### 1.3 Can AIRI be Embedded via WebView?

**YES** - AIRI can be embedded in React Native via WebView with considerations:

**Pros:**
- AIRI already has a production web version at https://airi.moeru.ai/
- Built with web-first technologies (WebGPU, WebGL, WebAudio)
- Progressive Web App (PWA) support
- Mobile browser compatibility (Chrome, Firefox, Safari on iOS/Android)

**Cons:**
- Large bundle size (full AI assistant with LLM integration)
- May need API key configurations for LLM providers
- Network dependency for cloud features
- Limited native integration (no direct access to native APIs without bridge)

**Implementation Approach:**
```javascript
// React Native WebView integration
import { WebView } from 'react-native-webview';

const AIRIAvatar = () => {
  return (
    <WebView
      source={{ uri: 'https://airi.moeru.ai/' }}
      // Or self-host the web build
      // source={{ html: localBuild }}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      allowsInlineMediaPlayback={true}
      mediaPlaybackRequiresUserAction={false}
      onMessage={(event) => {
        // Handle messages from AIRI
        console.log(event.nativeEvent.data);
      }}
      injectedJavaScript={`
        // Send messages to AIRI
        window.ReactNativeWebView.postMessage('Hello from React Native');
      `}
    />
  );
};
```

### 1.4 Self-Hosting AIRI for Custom Integration

**Steps:**
1. Clone repository: `git clone https://github.com/moeru-ai/airi.git`
2. Install dependencies: `pnpm install`
3. Build web version: `pnpm build`
4. Modify for minimal avatar-only mode (remove unnecessary features)
5. Serve via WebView with custom HTML/JS bundle

**Customization Options:**
- Strip out game-playing features (Minecraft, Factorio)
- Remove Discord/Telegram integrations
- Configure lightweight LLM provider or local inference
- Customize UI to match app theme
- Implement native bridge for features like haptics, notifications

---

## 2. Alternative React Native Live2D Solutions

### 2.1 Native Live2D Libraries

#### Option A: react-native-live2d (by raintoway)
- **Repository:** https://github.com/raintoway/react-native-live2d
- **Status:** Limited documentation, appears inactive
- **Approach:** Native bridge to Live2D SDK
- **Recommendation:** ⚠️ Not production-ready, lacks maintenance

#### Option B: WebView + pixi-live2d-display (Recommended)
- **Repository:** https://github.com/guansss/pixi-live2d-display
- **Status:** Active, well-maintained, 1.8k+ stars
- **Approach:** PixiJS plugin for Live2D rendering in WebGL
- **Compatibility:** Cubism 2.1 and 4.0

**Implementation:**
```html
<!-- HTML to inject in WebView -->
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/pixi.js@6/dist/browser/pixi.min.js"></script>
  <script src="https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/pixi-live2d-display/dist/index.min.js"></script>
</head>
<body>
  <canvas id="canvas"></canvas>
  <script>
    (async function() {
      const app = new PIXI.Application({
        view: document.getElementById('canvas'),
        autoStart: true,
        backgroundAlpha: 0,
        resizeTo: window
      });

      const model = await PIXI.live2d.Live2DModel.from(
        'path/to/model.model3.json'
      );
      
      app.stage.addChild(model);
      
      // Auto-resize
      model.scale.set(0.5);
      model.x = window.innerWidth / 2;
      model.y = window.innerHeight / 2;
      
      // Interaction
      model.on('hit', (hitAreas) => {
        console.log('Hit areas:', hitAreas);
      });

      // Communicate with React Native
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'model_loaded',
        modelName: model.name
      }));
    })();
  </script>
</body>
</html>
```

**React Native Component:**
```typescript
import React, { useRef, useState } from 'react';
import { WebView } from 'react-native-webview';
import { View, StyleSheet } from 'react-native';

interface Live2DAvatarProps {
  modelUrl: string;
  onModelLoaded?: () => void;
}

export const Live2DAvatar: React.FC<Live2DAvatarProps> = ({ 
  modelUrl, 
  onModelLoaded 
}) => {
  const webViewRef = useRef<WebView>(null);
  
  const handleMessage = (event: any) => {
    const data = JSON.parse(event.nativeEvent.data);
    
    if (data.type === 'model_loaded') {
      onModelLoaded?.();
    }
  };
  
  const playMotion = (category: string, index: number) => {
    webViewRef.current?.injectJavaScript(`
      if (window.live2dModel) {
        window.live2dModel.motion('${category}', ${index});
      }
    `);
  };
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { margin: 0; overflow: hidden; }
        canvas { width: 100vw; height: 100vh; }
      </style>
      <script src="https://cdn.jsdelivr.net/npm/pixi.js@6/dist/browser/pixi.min.js"></script>
      <script src="https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/pixi-live2d-display/dist/index.min.js"></script>
    </head>
    <body>
      <canvas id="canvas"></canvas>
      <script>
        (async function() {
          const app = new PIXI.Application({
            view: document.getElementById('canvas'),
            autoStart: true,
            backgroundAlpha: 0,
            resizeTo: window
          });

          window.live2dModel = await PIXI.live2d.Live2DModel.from('${modelUrl}');
          app.stage.addChild(window.live2dModel);
          
          window.live2dModel.scale.set(0.5);
          window.live2dModel.anchor.set(0.5, 0.5);
          window.live2dModel.x = window.innerWidth / 2;
          window.live2dModel.y = window.innerHeight / 2;
          
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'model_loaded'
          }));
        })();
      </script>
    </body>
    </html>
  `;
  
  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html }}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        style={styles.webview}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent'
  },
  webview: {
    backgroundColor: 'transparent'
  }
});
```

#### Option C: Three.js + VRM Models
- **Library:** @pixiv/three-vrm
- **Approach:** Use VRM instead of Live2D (3D humanoid avatars)
- **Better suited for:** 3D environments, more realistic avatars
- **Models:** Available free on VRoid Hub

### 2.2 Inochi2D (Open Source Alternative)

**Project:** https://inochi2d.com/  
**License:** BSD-2-Clause (more permissive than Live2D)  
**Format:** Uses own .inp format (not compatible with Live2D)  
**Status:** Active development, growing community

**Pros:**
- Fully open source
- No licensing fees
- Similar workflow to Live2D

**Cons:**
- Smaller model library
- Less mature ecosystem
- Not compatible with existing Live2D models
- No official React Native support

---

## 3. Live2D Web SDK Documentation & Licensing

### 3.1 Official Live2D Cubism SDK for Web

**Download:** https://www.live2d.com/en/sdk/download/web/  
**Documentation:** https://docs.live2d.com/en/cubism-sdk-tutorials/sample-build-web/

**Technical Specs:**
- **Language:** TypeScript (transpiles to JavaScript)
- **Renderer:** WebGL (via canvas)
- **Supported Browsers:**
  - Chrome (Windows/macOS/Linux/Android/iOS)
  - Firefox (Windows/macOS/Linux/Android/iOS)
  - Safari (macOS/iOS)
  - Edge (Windows/Android/iOS)

**Core Components:**
1. **Live2D Cubism Core** - Proprietary binary for model rendering
2. **Cubism Framework** - High-level API for model manipulation
3. **Sample Projects** - Reference implementations

**API Structure:**
```typescript
// Model loading
const model = await CubismModel.fromModelSettingsJson(modelJson);

// Parameter manipulation (for expressions, lip-sync)
model.setParameterValueById('ParamMouthOpenY', 1.0); // 0-1 range

// Motion playback
const motion = await CubismMotion.fromMotion3Json(motionJson);
model.startMotion(motion);

// Physics simulation
model.update(deltaTime);
```

### 3.2 Licensing Requirements

**SDK License Agreement:**
- **Development:** FREE - No cost to download and develop
- **Publication:** Requires license ONLY at release/publication

**Publication License Exemptions:**
✅ **FREE for:**
- Individuals (personal projects)
- Small-scale businesses
- Non-commercial use
- Temporary promotional purposes (with approval)

⚠️ **Requires Payment for:**
- Medium to large enterprises (commercial products)
- "Expandable Applications" (apps where users can import custom Live2D models)

**License Types:**
1. **Individual License:** Free for personal projects
2. **Small Business License:** Free (revenue < certain threshold)
3. **Enterprise License:** Paid (contact Live2D Inc.)

**Source:** https://www.live2d.com/en/sdk/license/

### 3.3 Model Data Licenses

Models created with Live2D Cubism Editor can have custom licenses set by creators. Always check individual model licenses before use.

---

## 4. Free & Open Source Live2D Models

### 4.1 Official Live2D Sample Models

**Source:** https://www.live2d.com/en/learn/sample/

**Available Models:**
1. **Hiyori** - Basic sample (cmo3, can3 files)
2. **Hiyori Momose (video version)** - For animation learning
3. **Mark** - Male character sample
4. **Natori** - Sample with expressions
5. **Rice** - Mascot character
6. **Shizuku** - Popular sample model

**License:** Free for learning and testing (check individual terms)

**File Formats:**
- `.model3.json` - Model definition (Cubism 4.0)
- `.model.json` - Model definition (Cubism 2.1)
- `.moc3` - Model binary data
- `.physics3.json` - Physics parameters
- `.pose3.json` - Pose data
- `.motion3.json` - Motion data
- `.exp3.json` - Expression data
- Texture files (.png)

### 4.2 BOOTH.pm (Japanese Marketplace)

**URL:** https://booth.pm/en/search/free%20live2d

**Free Models Available:** 1,373+ items  
**Language:** Primarily Japanese (use browser translation)  
**License:** Varies per creator (always check usage terms)

**Popular Free Models:**
- Cat girl models
- Chibi character models
- Pixel art style models
- Customizable base models

**Search Tips:**
```
Keywords:
- "free live2d"
- "無料 live2d" (free in Japanese)
- "VTuber model free"
- "live2d model 無料"

Filters:
- Price: ¥0 (free)
- Category: Materials (Other)
```

### 4.3 VRoid Hub (VRM Models)

**URL:** https://hub.vroid.com/en  
**Format:** VRM (3D, not Live2D)  
**Models:** 100,000+ free avatars

**Usage Rights:**
- Each model has custom license set by creator
- Filter by "Commercial Use: Allowed"
- Common permissions: Streaming, Videos, Gaming
- Some allow modification

**For Live2D Alternative:**
While VRM is 3D, it can be used with AIRI and three-vrm library in React Native WebView.

### 4.4 GitHub Repositories

**Search:** "free live2d models" on GitHub

**Example Repositories:**
- Sample models in SDK documentation repos
- Community-shared models (check licenses)
- Educational projects with bundled models

### 4.5 Live2D Official Sample Repository

**Included in SDK downloads:**
```
CubismSdkForWeb-5-r.1/
└── Samples/
    └── Resources/
        ├── Haru/
        ├── Hiyori/
        ├── Mark/
        ├── Natori/
        └── Rice/
```

Each includes complete model data, motions, and expressions.

---

## 5. Lip-Sync Implementation

### 5.1 Audio-Based Lip-Sync Architecture

**Principle:** Map audio volume/frequency to mouth opening parameter

**Live2D Mouth Parameters:**
- `ParamMouthOpenY` - Vertical mouth opening (0.0 to 1.0)
- `ParamMouthForm` - Mouth shape (smile, etc.)

**Implementation Flow:**
```
Audio Input → Audio Analysis → Parameter Mapping → Model Update
```

### 5.2 Basic Lip-Sync Implementation

**Using Web Audio API in WebView:**

```javascript
class Live2DLipSync {
  constructor(model, audioElement) {
    this.model = model;
    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    
    const source = this.audioContext.createMediaElementSource(audioElement);
    source.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
    
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
  }
  
  update() {
    this.analyser.getByteFrequencyData(this.dataArray);
    
    // Calculate average volume
    const average = this.dataArray.reduce((a, b) => a + b) / this.dataArray.length;
    
    // Map to 0-1 range (adjust threshold as needed)
    const mouthValue = Math.min(average / 128, 1.0);
    
    // Update model parameter
    this.model.setParameterValueById('ParamMouthOpenY', mouthValue);
  }
  
  startLipSync() {
    const animate = () => {
      this.update();
      requestAnimationFrame(animate);
    };
    animate();
  }
}

// Usage
const audio = new Audio('speech.mp3');
const lipSync = new Live2DLipSync(live2dModel, audio);
audio.play();
lipSync.startLipSync();
```

### 5.3 Advanced Lip-Sync with pixi-live2d-display

**Using the lipsync patch:**

```bash
npm install pixi-live2d-display-lipsyncpatch
```

**Implementation:**
```javascript
import * as PIXI from 'pixi.js';
import { Live2DModel } from 'pixi-live2d-display-lipsyncpatch';

(async function() {
  const app = new PIXI.Application({
    view: document.getElementById('canvas'),
    autoStart: true,
    backgroundAlpha: 0
  });

  const model = await Live2DModel.from('model.model3.json');
  app.stage.addChild(model);
  
  // Play motion with audio lip-sync
  const audioUrl = 'https://example.com/voice.wav';
  
  model.speak(audioUrl, {
    volume: 1.0,
    onFinish: () => console.log('Speech finished'),
    onError: (err) => console.error('Error:', err)
  });
  
  // Or with motion
  model.motion('Idle', 0, 3, {
    sound: audioUrl,
    volume: 1.0,
    expression: 'happy',
    onFinish: () => console.log('Done')
  });
})();
```

### 5.4 Live2D MotionSync (Official Solution)

**For Advanced Lip-Sync:**

Live2D provides official MotionSync plugin for precise audio-to-animation matching.

```javascript
// Initialize MotionSync
const motionSyncUrl = modelPath.replace('.model3.json', '.motionsync3.json');
const motionSync = new MotionSync(model.internalModel);
await motionSync.loadMotionSyncFromUrl(motionSyncUrl);

// When audio plays
audioElement.addEventListener('timeupdate', () => {
  const audioData = extractAudioFeatures(audioElement); // FFT analysis
  motionSync.updateParameters(audioData);
});
```

**Requires:**
- MotionSync data file (.motionsync3.json)
- Generated from audio using Live2D tools

### 5.5 Expression Changes

**Parameter Control:**
```javascript
// Manual expression change
model.setParameterValueById('ParamEyeLOpen', 0.0);  // Close left eye
model.setParameterValueById('ParamEyeROpen', 0.0);  // Close right eye
model.setParameterValueById('ParamMouthForm', 1.0); // Smile

// Using expression files
const expression = await CubismExpression.fromExpression3Json(expressionJson);
model.setExpression(expression);
```

**Common Expression Parameters:**
- `ParamEyeLOpen` / `ParamEyeROpen` - Eye openness
- `ParamEyeBallX` / `ParamEyeBallY` - Eye direction
- `ParamBrowLY` / `ParamBrowRY` - Eyebrow position
- `ParamMouthForm` - Mouth shape (smile/neutral/sad)
- `ParamMouthOpenY` - Mouth opening
- `ParamBodyAngleX` / `ParamBodyAngleY` - Body rotation

### 5.6 React Native Integration Example

**Complete WebView Component with Lip-Sync:**

```typescript
import React, { useRef } from 'react';
import { WebView } from 'react-native-webview';

interface Live2DAvatarWithSpeechProps {
  modelUrl: string;
  audioUrl?: string;
}

export const Live2DAvatarWithSpeech: React.FC<Live2DAvatarWithSpeechProps> = ({
  modelUrl,
  audioUrl
}) => {
  const webViewRef = useRef<WebView>(null);
  
  const speak = (audioSrc: string) => {
    webViewRef.current?.injectJavaScript(`
      if (window.live2dModel && window.live2dModel.speak) {
        window.live2dModel.speak('${audioSrc}', {
          volume: 1.0,
          onFinish: () => {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'speech_finished'
            }));
          }
        });
      }
    `);
  };
  
  const changeExpression = (expressionName: string) => {
    webViewRef.current?.injectJavaScript(`
      if (window.live2dModel) {
        window.live2dModel.expression('${expressionName}');
      }
    `);
  };
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { margin: 0; overflow: hidden; background: transparent; }
        canvas { width: 100vw; height: 100vh; }
      </style>
      <script src="https://cdn.jsdelivr.net/npm/pixi.js@6/dist/browser/pixi.min.js"></script>
      <script src="https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/pixi-live2d-display-lipsyncpatch/dist/index.min.js"></script>
    </head>
    <body>
      <canvas id="canvas"></canvas>
      <script>
        (async function() {
          const app = new PIXI.Application({
            view: document.getElementById('canvas'),
            autoStart: true,
            backgroundAlpha: 0,
            resizeTo: window
          });

          window.live2dModel = await PIXI.live2d.Live2DModel.from('${modelUrl}');
          app.stage.addChild(window.live2dModel);
          
          window.live2dModel.scale.set(0.5);
          window.live2dModel.anchor.set(0.5, 0.5);
          window.live2dModel.x = window.innerWidth / 2;
          window.live2dModel.y = window.innerHeight / 2;
          
          // Enable tap/click interaction
          window.live2dModel.on('hit', (hitAreas) => {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'hit',
              areas: hitAreas
            }));
          });
          
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'model_loaded'
          }));
        })();
      </script>
    </body>
    </html>
  `;
  
  return (
    <WebView
      ref={webViewRef}
      source={{ html }}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      allowsInlineMediaPlayback={true}
      mediaPlaybackRequiresUserAction={false}
      style={{ backgroundColor: 'transparent' }}
    />
  );
};
```

---

## 6. Recommended Architecture for Expo/React Native Integration

### 6.1 Hybrid Architecture (Recommended)

**Approach:** WebView for rendering + React Native for app logic

```
┌─────────────────────────────────────────┐
│         React Native App                │
│  (UI, Navigation, State Management)     │
├─────────────────────────────────────────┤
│         WebView Container               │
│  ┌───────────────────────────────────┐  │
│  │   Live2D Renderer                 │  │
│  │   (pixi-live2d-display)           │  │
│  │                                   │  │
│  │   - Model loading                 │  │
│  │   - Animation playback            │  │
│  │   - Lip-sync                      │  │
│  │   - Expression control            │  │
│  └───────────────────────────────────┘  │
│             ↕ Message Bridge            │
├─────────────────────────────────────────┤
│      Native Services                    │
│  - Audio playback                       │
│  - TTS (Text-to-Speech)                 │
│  - Storage                              │
│  - Haptic feedback                      │
│  - Notifications                        │
└─────────────────────────────────────────┘
```

### 6.2 Proposed Implementation Structure

```
apps/happiness-app/
├── src/
│   ├── components/
│   │   ├── Live2DAvatar/
│   │   │   ├── index.tsx              # Main WebView component
│   │   │   ├── Live2DController.ts    # TypeScript interface
│   │   │   ├── live2d-template.html   # HTML template for WebView
│   │   │   └── types.ts               # TypeScript types
│   │   └── AvatarContainer/
│   │       ├── index.tsx              # Container with controls
│   │       └── styles.ts
│   ├── services/
│   │   ├── avatarService.ts           # Avatar state management
│   │   ├── speechService.ts           # TTS integration
│   │   └── emotionService.ts          # Emotion detection
│   ├── assets/
│   │   └── models/
│   │       ├── hiyori/                # Default Live2D model
│   │       │   ├── hiyori.model3.json
│   │       │   ├── hiyori.moc3
│   │       │   ├── textures/
│   │       │   ├── motions/
│   │       │   └── expressions/
│   │       └── README.md              # Model licenses
│   └── hooks/
│       ├── useLive2D.ts               # React hook for Live2D
│       └── useSpeech.ts               # React hook for speech
```

### 6.3 Implementation Phases

**Phase 1: Basic Integration (Week 1)**
- [ ] Set up WebView with pixi-live2d-display
- [ ] Load one free sample model (Hiyori or Shizuku)
- [ ] Implement basic animations (idle, blink)
- [ ] Test on iOS and Android

**Phase 2: Interaction (Week 2)**
- [ ] Implement tap interactions
- [ ] Add expression changes (happy, sad, surprised)
- [ ] Create motion presets (wave, nod, shake head)
- [ ] Bridge interactions to React Native

**Phase 3: Speech Integration (Week 3)**
- [ ] Integrate TTS service (e.g., Expo Speech)
- [ ] Implement audio-based lip-sync
- [ ] Add audio playback controls
- [ ] Synchronize speech with expressions

**Phase 4: Polish & Optimization (Week 4)**
- [ ] Optimize WebView performance
- [ ] Add model loading states
- [ ] Implement error handling
- [ ] Add configuration UI (model selection, volume, etc.)

### 6.4 Technology Stack Recommendation

**Core:**
- `react-native-webview`: ^13.6.0
- `pixi.js`: ^6.5.0
- `pixi-live2d-display`: ^0.5.0 or `pixi-live2d-display-lipsyncpatch`
- Live2D Cubism Core (CDN)

**Audio:**
- `expo-av`: For audio playback
- `expo-speech`: For text-to-speech (if needed)
- Web Audio API (in WebView for lip-sync)

**State Management:**
- Zustand or React Context for avatar state
- React hooks for component logic

**Storage:**
- `expo-file-system`: For local model storage
- `expo-asset`: For bundled models

### 6.5 Performance Considerations

**Optimization Strategies:**

1. **Model Size:**
   - Use optimized texture atlases (compress PNGs)
   - Limit model polygon count for mobile
   - Lazy load motion/expression files

2. **WebView Performance:**
   - Set `androidHardwareAccelerationDisabled={false}`
   - Use `webviewDebuggingEnabled={false}` in production
   - Implement proper cleanup on unmount

3. **Memory Management:**
   - Unload unused models
   - Cache frequently used animations
   - Monitor WebView memory usage

4. **Battery Optimization:**
   - Pause animations when app is backgrounded
   - Reduce frame rate when idle (30fps instead of 60fps)
   - Use `AppState` to detect app visibility

**Example:**
```typescript
import { AppState } from 'react-native';

useEffect(() => {
  const subscription = AppState.addEventListener('change', (nextAppState) => {
    if (nextAppState === 'background') {
      // Pause Live2D animations
      webViewRef.current?.injectJavaScript(`
        if (window.live2dApp) window.live2dApp.stop();
      `);
    } else if (nextAppState === 'active') {
      // Resume
      webViewRef.current?.injectJavaScript(`
        if (window.live2dApp) window.live2dApp.start();
      `);
    }
  });

  return () => subscription.remove();
}, []);
```

### 6.6 Alternative: Native Three.js Rendering

**For more advanced 3D integration:**

```typescript
// Using expo-three + three-vrm
import { ExpoWebGLRenderingContext } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { VRM, VRMLoaderPlugin } from '@pixiv/three-vrm';

export const VRMAvatarGL = () => {
  const onContextCreate = async (gl: ExpoWebGLRenderingContext) => {
    const renderer = new Renderer({ gl });
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 1000);
    
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));
    
    const gltf = await loader.loadAsync('path/to/model.vrm');
    const vrm = gltf.userData.vrm;
    scene.add(vrm.scene);
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      vrm.update(clock.getDelta());
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    animate();
  };
  
  return <GLView onContextCreate={onContextCreate} />;
};
```

**Trade-offs:**
- ✅ Better performance (native OpenGL)
- ✅ No WebView overhead
- ❌ More complex setup
- ❌ Requires VRM models (not Live2D)
- ❌ Limited to 3D avatars

---

## 7. Security & Privacy Considerations

### 7.1 Model Licenses

**Before shipping:**
1. Review each model's license terms
2. Attribute creators as required
3. Ensure commercial use is allowed
4. Document licenses in app's legal section

### 7.2 WebView Security

**Best Practices:**
```typescript
<WebView
  source={{ html }}
  originWhitelist={['*']}
  allowsInlineMediaPlayback={true}
  javaScriptEnabled={true}
  // Security settings
  mixedContentMode="never"
  allowUniversalAccessFromFileURLs={false}
  allowFileAccess={false}
  geolocationEnabled={false}
  saveFormDataDisabled={true}
/>
```

### 7.3 Asset Storage

**Secure model files:**
- Bundle models in app (not remote URLs for sensitive content)
- Use `expo-asset` for asset management
- Verify model integrity if downloading from external sources

---

## 8. Cost Analysis

### 8.1 Development Costs

| Item | Estimated Cost | Notes |
|------|---------------|-------|
| Live2D SDK License | $0 | Free for individual/small business |
| Development Time | ~4 weeks | For basic integration |
| Custom Model Creation | $200-2000 | If commissioning artist |
| Free Models | $0 | Using samples + BOOTH |

### 8.2 Operational Costs

| Service | Monthly Cost | Notes |
|---------|-------------|-------|
| TTS (ElevenLabs) | $0-22 | Free tier: 10k chars/month |
| TTS (Google Cloud) | $0-20 | Pay-per-use |
| Hosting (if self-hosting AIRI) | $5-20 | VPS for web version |
| CDN (model delivery) | $0-10 | If serving models remotely |

**Total Monthly:** $0-50 depending on scale

---

## 9. Conclusion & Recommendations

### 9.1 Summary

**AIRI:**
- Impressive open-source AI VTuber project
- Web-first architecture makes it WebView-compatible
- Can be embedded but requires customization
- Best for full AI assistant experience

**Live2D Integration:**
- WebView + pixi-live2d-display is the most viable approach
- Free models available but verify licenses
- Lip-sync requires audio analysis implementation
- Performance is acceptable on modern mobile devices

### 9.2 Recommended Approach

**For MyExpoApp (Happiness App):**

1. **Use pixi-live2d-display in WebView** (not full AIRI)
   - Lighter weight
   - More control over avatar behavior
   - Easier to customize for happiness tracking

2. **Start with free sample models**
   - Use official Live2D samples (Hiyori, Shizuku)
   - Test with BOOTH free models
   - Commission custom model later if needed

3. **Implement basic lip-sync**
   - Use `pixi-live2d-display-lipsyncpatch`
   - Integrate with Expo Speech or preferred TTS
   - Start simple, enhance later

4. **Build modular architecture**
   - Separate avatar component from app logic
   - Use message bridge for communication
   - Plan for future enhancements (emotion detection, custom expressions)

### 9.3 Next Steps

**Immediate Actions:**
1. Download Live2D Cubism SDK and sample models
2. Create proof-of-concept WebView with one model
3. Test lip-sync with pre-recorded audio
4. Evaluate performance on target devices

**Future Enhancements:**
- Multiple avatar options
- Custom expressions based on user mood
- Integration with journaling features
- Avatar customization (clothing, accessories)
- Advanced animations (gestures, reactions)

### 9.4 Alternatives to Consider

**If Live2D proves challenging:**
1. **VRM + three-vrm** - 3D avatars, larger model library
2. **Lottie animations** - Simpler 2D animations, no lip-sync
3. **React Native Skia** - Custom 2D avatar system
4. **SVG animations** - Lightweight, fully customizable

---

## 10. Resources & References

### 10.1 Official Documentation

- **Live2D Cubism SDK:** https://docs.live2d.com/en/
- **pixi-live2d-display:** https://github.com/guansss/pixi-live2d-display/wiki
- **AIRI Documentation:** https://airi.moeru.ai/docs/
- **React Native WebView:** https://github.com/react-native-webview/react-native-webview

### 10.2 Sample Code Repositories

- **AIRI:** https://github.com/moeru-ai/airi
- **pixi-live2d-display demos:** https://codepen.io/guansss/pen/oNzoNoz
- **Live2D Web Viewer:** https://guansss.github.io/live2d-viewer-web/
- **ChatVRM (Pixiv):** https://github.com/pixiv/ChatVRM

### 10.3 Model Resources

- **Live2D Samples:** https://www.live2d.com/en/learn/sample/
- **BOOTH.pm:** https://booth.pm/en/search/free%20live2d
- **VRoid Hub:** https://hub.vroid.com/en
- **nizima:** https://nizima.com/ (Live2D marketplace)

### 10.4 Tutorials & Guides

- **Live2D on the Web (Part 1):** https://medium.com/@mizutori/live2d-on-the-web-part-1-how-to-load-a-live2d-model-in-your-vue-js-project-2f3987ceb91f
- **Live2D on the Web (Part 2 - Lip Sync):** https://medium.com/@mizutori/live2d-on-the-web-part-2-integrating-lip-sync-for-custom-audio-files-in-vue-js-4e521e57e49c
- **Build Live2D Voice Assistant:** https://theten.ai/blog/building-live2d-voice-assistant
- **VTuber Studio with Three.js:** https://wawasensei.dev/tuto/vrm-avatar-with-threejs-react-three-fiber-and-mediapipe

### 10.5 Community

- **AIRI Discord:** https://discord.gg/TgQ3Cu2F7A
- **Live2D Forums:** https://community.live2d.com/
- **r/Live2D:** https://reddit.com/r/Live2D
- **r/VirtualYoutubers:** https://reddit.com/r/VirtualYoutubers

---

**Report Compiled By:** AI Research Assistant  
**Date:** December 5, 2025  
**For:** MyExpoApp (Happiness App) Development Team

**License:** This research report is provided for internal use. All referenced projects and resources maintain their respective licenses.
