# VRM Avatar Implementation - Handover Document

## 📅 Date: December 10, 2025

## 🔍 Problem Analysis

### Issue Discovered

The 3D VRM avatars load to "100% downloaded" but never render on screen. Users see the loading progress complete, then nothing appears.

### Root Cause Identified

1. **VRM File Sizes Are Too Large**

   - Current VRM files: 15-16MB each
   - When converted to base64 for WebView: ~22MB per file
   - Mobile WebView has memory limits (~50MB for some devices)
   - The WebView crashes silently when parsing these large files

2. **Current Implementation Uses WebView**
   - Three.js + @pixiv/three-vrm loaded from CDN
   - VRM files converted to base64 data URLs
   - This approach works for small files (<2-3MB) but fails for large ones

### File Size Details

```
Airi.vrm:  16MB
Calm.vrm:  15MB
Heart.vrm: 15MB
Mind.vrm:  16MB
Rise.vrm:  16MB
Total:     78MB
```

---

## 🛠️ Solution Path

### Chosen Approach: expo-three + expo-gl with Optimized VRMs

**Why This Will Work:**

1. `expo-gl` provides native OpenGL context (no WebView)
2. `expo-three` bridges Three.js to native GL
3. Optimized VRM files (<2-3MB) can load efficiently
4. Memory is managed by native code, not JavaScript

### Required Steps

1. **Optimize VRM Files** (CRITICAL)

   - Target: 16MB → 2-3MB each
   - Tools: gltf-transform, VRM optimizer
   - Methods: Texture compression, mesh decimation, Draco compression

2. **Install Native GL Packages**

   ```bash
   cd apps/happiness-app
   npx expo install expo-gl expo-three three
   ```

3. **Create Native VRM Component**

   - Replace WebView-based VRMAvatar.tsx
   - Use GLView from expo-gl
   - Load VRM directly without base64 conversion

4. **Create Development Build**
   - expo-gl requires native modules
   - Cannot use Expo Go for full functionality
   - Run: `npx expo build:ios` or `eas build`

---

## 📊 UI Comparison: Grok vs Current

| Feature      | Grok                       | Our App                  |
| ------------ | -------------------------- | ------------------------ |
| Theme        | Dark black (#000)          | Light cream/beige        |
| Cards        | Full-bleed images          | Sectioned with padding   |
| Image style  | Edge-to-edge with gradient | Rounded corners          |
| Text         | Overlay on image           | Separate section         |
| Buttons      | Pill-shaped transparent    | Different style          |
| Loading text | White on dark              | Poor visibility on light |

### UI Fixes Needed

1. Switch to dark theme (match Grok)
2. Full-bleed card images
3. Gradient overlay for text readability
4. Update button styling
5. Fix loading text visibility

---

## 📝 Technical Notes

### Why WebView Approach Failed

```javascript
// This approach creates ~22MB strings - TOO LARGE
const blob = await response.blob();
const base64 = await new Promise((resolve) => {
  const reader = new FileReader();
  reader.readAsDataURL(blob); // Creates 22MB string
});
// WebView crashes silently trying to parse this
```

### Correct Approach (expo-gl)

```javascript
// Native GL context - no base64 conversion
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';

// Load VRM directly from file system
// Memory managed by native code
```

### Grok's Likely Implementation

1. **Unity Engine** embedded in native app
2. Or **native iOS SceneKit/RealityKit**
3. Or **pre-rendered video** of 3D animations
4. Their models are likely <2-3MB (professionally optimized)

---

## 🔄 Progress Tracking

### Completed

- [x] Identified root cause (file size + WebView limitation)
- [x] Analyzed Grok's implementation approach
- [x] Documented findings
- [x] Installed expo-gl (~16.0.8) and expo-three (^8.0.0) - already present
- [x] Installed @types/three for TypeScript support
- [x] Created VRMAvatarGL.tsx - Native GL-based component using expo-gl
- [x] Updated AlterEgoScreen to use VRMAvatarGL instead of WebView-based VRMAvatar
- [x] Created placeholder 3D avatar (anime-style using Three.js primitives)

### In Progress

- [ ] VRM optimization (16MB → <3MB) - gltf-transform extracts files, need embedded GLB format
- [ ] Full VRM model loading in VRMAvatarGL (currently shows placeholder)
- [ ] Fix UI to match Grok dark theme
- [ ] Test on physical device

### Next Steps for Future Developer

1. **VRM File Optimization**: Use vrm-optimizer or VRoid Studio export settings to reduce file size while keeping VRM format intact
2. **Load Actual VRM**: Update VRMAvatarGL to load real VRM models using three-vrm library with expo-three
3. **Animations**: Implement lip sync, expressions, and idle animations
4. **UI Polish**: Match Grok's dark theme with full-bleed card images

---

## 📚 References

- expo-gl: https://docs.expo.dev/versions/latest/sdk/gl-view/
- expo-three: https://github.com/expo/expo-three
- VRM format: https://vrm.dev/en/
- gltf-transform: https://gltf-transform.donmccurdy.com/

---

## ⚠️ Important Notes for Next Developer

1. **DO NOT use WebView** for VRM rendering with files >3MB
2. **ALWAYS check VRM file sizes** before implementing
3. **Development builds required** for expo-gl to work properly
4. **Expo Go has limitations** with native GL contexts
5. **Test on physical device** - simulators may behave differently

---

## 📞 Contact

If you have questions about this implementation, refer to:

1. This document
2. The PRD (PRODUCT_REQUIREMENTS_DOCUMENT.md)
3. GROK_UI_IMPLEMENTATION_PLAN.md
