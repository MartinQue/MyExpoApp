# 🔊 Speech Functionality Debug Guide

**Issue**: ElevenLabs TTS not working
**Status**: Debugging enabled, awaiting logs

---

## ✅ What I Just Fixed

### 1. **Chat Input Bar - Increased Height**
**Changes**:
- Height: 52px → **56px** (matches ChatGPT)
- Padding: 8px → **12px** vertical
- Border radius: 26px → **28px**
- Border width: 1px → **1.5px**
- Button size: 36px → **40px**
- Added shadow for depth
- More spacious, premium feel

**Result**: The chat bar should now look more like ChatGPT/Claude with proper height and spacing.

---

### 2. **ElevenLabs Debug Logging Added**

I've added comprehensive logging to track exactly where the speech fails:

```typescript
console.log('🎤 Generating speech for:', text);
console.log('📍 Voice ID:', voiceId);
console.log('🔑 API Key present:', !!ELEVENLABS_API_KEY);
console.log('💾 Audio will be saved to:', audioUri);
console.log('📥 Download result:', status, uri);
console.log('🔊 Playing audio from:', audioUri);
```

**Plus better error messages** that show the actual API error response.

---

## 🐛 How to Debug Speech Issue

### Step 1: Run the App with Logs

```bash
cd /Users/martinquansah/MyExpoApp
npm run happiness-app:dev
```

**Keep the terminal open** - this is where logs appear!

---

### Step 2: Test Speech

1. Open Chat tab
2. Type: "Hello, test speech"
3. Press send (purple arrow)
4. **Watch the terminal logs**

---

### Step 3: Check Logs

**Look for these console messages**:

#### ✅ **Success Flow**:
```
🎤 Generating speech for: Hello, test speech
📍 Voice ID: EXAVITQu4vr4xnSDxMaL
🔑 API Key present: true
💾 Audio will be saved to: file:///...elevenlabs_1234.mp3
📥 Download result: 200 file:///...elevenlabs_1234.mp3
🔊 Playing audio from: file:///...elevenlabs_1234.mp3
```
→ **Speech should work!** ✅

#### ❌ **Failure Flow - No API Key**:
```
🎤 Generating speech for: Hello, test speech
📍 Voice ID: EXAVITQu4vr4xnSDxMaL
🔑 API Key present: false  ← PROBLEM
❌ ElevenLabs API key not configured
```
→ **Fix**: API key not loaded, check `.env.local`

#### ❌ **Failure Flow - API Error**:
```
🎤 Generating speech for: Hello, test speech
📍 Voice ID: EXAVITQu4vr4xnSDxMaL
🔑 API Key present: true
💾 Audio will be saved to: file:///...
📥 Download result: 401 file:///...  ← PROBLEM (Unauthorized)
❌ ElevenLabs API error: Status 401: {"detail":"Invalid API key"}
```
→ **Fix**: API key is wrong, check ElevenLabs dashboard

#### ❌ **Failure Flow - Network Error**:
```
🎤 Generating speech for: Hello, test speech
📍 Voice ID: EXAVITQu4vr4xnSDxMaL
🔑 API Key present: true
💾 Audio will be saved to: file:///...
❌ Download error: Network request failed
```
→ **Fix**: Check internet connection

---

## 🔧 Common Fixes

### Fix 1: API Key Not Loaded

**Symptom**: `🔑 API Key present: false`

**Solution**:
```bash
# 1. Check .env.local exists
cat /Users/martinquansah/MyExpoApp/.env.local | grep ELEVENLABS

# Should show:
# EXPO_PUBLIC_ELEVENLABS_API_KEY=sk_...

# 2. Restart Expo (IMPORTANT!)
npm run happiness-app:dev

# Expo only loads .env on startup!
```

---

### Fix 2: Invalid API Key

**Symptom**: `📥 Download result: 401` or `Invalid API key`

**Solution**:
1. Go to https://elevenlabs.io/app/api-keys
2. Check if key is still active
3. Create new key if needed
4. Copy key (should start with `sk_`)
5. Update `.env.local`:
   ```bash
   EXPO_PUBLIC_ELEVENLABS_API_KEY=sk_your_new_key_here
   ```
6. **Restart Expo**: `npm run happiness-app:dev`

---

### Fix 3: Voice ID Not Found

**Symptom**: `📥 Download result: 404` or `Voice not found`

**Solution**:
The default voice ID is: `EXAVITQu4vr4xnSDxMaL` (Sarah)

If this doesn't work, try a public voice:
```typescript
// In elevenLabsService.ts, change:
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel (public)
```

---

### Fix 4: Audio Doesn't Play (But Downloads OK)

**Symptom**: `🔊 Playing audio from:...` appears but no sound

**Solution**:
1. Check device volume (turn up!)
2. Check silent mode is OFF
3. Check audio permissions:
   ```bash
   # iOS: Settings > Privacy > Microphone > Expo Go
   # Android: Settings > Apps > Expo > Permissions
   ```
4. Try playing a test sound:
   ```typescript
   import { Audio } from 'expo-av';

   // Test built-in sound
   const { sound } = await Audio.Sound.createAsync(
     require('./assets/sounds/test.mp3')
   );
   await sound.playAsync();
   ```

---

## 📊 Verify API Key is Correct

### Test API Key Manually:

```bash
# Replace YOUR_KEY with actual key from .env.local
curl -X POST "https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL" \
  -H "Accept: audio/mpeg" \
  -H "Content-Type: application/json" \
  -H "xi-api-key: YOUR_KEY" \
  -d '{
    "text": "Hello from ElevenLabs",
    "model_id": "eleven_turbo_v2_5"
  }' \
  --output test.mp3

# If successful, you'll get test.mp3
# Play it: afplay test.mp3 (macOS)
```

**If this fails**:
- ❌ Key is invalid → Get new key from ElevenLabs
- ✅ Key is valid → Problem is in the app code

---

## 🎯 What to Send Me

After running the app and testing speech, send me:

1. **Terminal logs** (copy from `🎤 Generating speech...` to the error/success)
2. **Screenshot** of the chat input bar (to verify height is correct)
3. **What happens**: Does text appear? Does voice play? Any errors?

Example response:
```
Logs:
🎤 Generating speech for: Hello
📍 Voice ID: EXAVITQu4vr4xnSDxMaL
🔑 API Key present: true
💾 Audio will be saved to: file:///.../elevenlabs_123.mp3
📥 Download result: 401 file:///.../elevenlabs_123.mp3
❌ ElevenLabs API error: Status 401: Invalid API key

What happened:
- Text appeared in chat ✅
- AI responded with text ✅
- No voice played ❌
- Error in terminal about invalid key
```

---

## 🔍 Alternative: Test with Simpler TTS

If ElevenLabs keeps failing, we can use **built-in Expo Speech** as a fallback:

```typescript
import * as Speech from 'expo-speech';

// Simple test:
Speech.speak('Hello, this is a test', {
  language: 'en-US',
  pitch: 1.0,
  rate: 1.0,
});
```

**Would you like me to add this as a fallback?**

---

## ✅ Expected Behavior (When Working)

1. User sends message → AI responds with text
2. Terminal shows: `🎤 Generating speech for: ...`
3. Terminal shows: `📥 Download result: 200`
4. Terminal shows: `🔊 Playing audio from: ...`
5. **Voice plays immediately** (natural voice)
6. If user starts typing → voice stops (seamless)

---

## 📝 Next Steps

1. **Run the app** with `npm run happiness-app:dev`
2. **Test speech** and **copy the terminal logs**
3. **Send me the logs** so I can see exactly what's failing
4. I'll fix the exact issue based on the error

**The chat bar UI should now look better!** Test it and let me know what you see. 🚀
