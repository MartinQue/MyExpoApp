/**
 * VRMAvatar.tsx - Robust VRM Avatar Component
 *
 * Renders VRM 3D avatars in a WebView with Three.js
 * Features:
 * - Reliable VRM loading with progress tracking
 * - Idle animations (breathing, blinking)
 * - Lip sync for TTS
 * - Expression control
 * - Touch interaction
 */

import React, {
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useState,
} from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { Logger } from '../../utils/Logger';
import { useTheme } from '../../contexts/ThemeContext';

export type VRMExpression =
  | 'idle'
  | 'happy'
  | 'thinking'
  | 'listening'
  | 'speaking'
  | 'surprised'
  | 'sad';

export interface VRMAvatarRef {
  loadModel: (uri: string) => void;
  setExpression: (expression: VRMExpression) => void;
  startLipSync: () => void;
  stopLipSync: () => void;
  playAudio: (audioUrl: string) => void;
}

interface VRMAvatarProps {
  modelUri?: string;
  modelModule?: number; // require('./path/to.vrm') module ID
  initialExpression?: VRMExpression;
  isSpeaking?: boolean;
  onReady?: () => void;
  onModelLoaded?: (success: boolean) => void;
  onError?: (error: string) => void;
  onTouched?: () => void;
  onProgress?: (progress: number) => void;
  style?: any;
  backgroundColor?: string;
}

const VRMAvatar = forwardRef<VRMAvatarRef, VRMAvatarProps>(
  (
    {
      modelUri,
      modelModule,
      initialExpression = 'idle',
      isSpeaking = false,
      onReady,
      onModelLoaded,
      onError,
      onTouched,
      onProgress,
      style,
      backgroundColor = 'transparent',
    },
    ref
  ) => {
    const { isDark } = useTheme();
    const webViewRef = useRef<WebView>(null);
    const isReadyRef = useRef(false);
    const lastSpeakingState = useRef(isSpeaking);
    const [isLoading, setIsLoading] = useState(true);
    const [loadProgress, setLoadProgress] = useState(0);
    const [modelDataUrl, setModelDataUrl] = useState<string | null>(null);

    // Load VRM file and convert to base64 data URL
    const loadVRMAsDataUrl = useCallback(async () => {
      try {
        setIsLoading(true);
        setLoadProgress(5);
        onProgress?.(5);

        let fileUri: string | null = null;

        // If we have a module ID (from require()), use expo-asset
        if (modelModule) {
          Logger.info('[VRM] Loading from module:', modelModule);
          const asset = Asset.fromModule(modelModule);
          await asset.downloadAsync();
          fileUri = asset.localUri || asset.uri;
          Logger.info('[VRM] Asset downloaded to:', fileUri);
          setLoadProgress(20);
          onProgress?.(20);
        } else if (modelUri) {
          fileUri = modelUri;
          setLoadProgress(20);
          onProgress?.(20);
        }

        if (!fileUri) {
          throw new Error('No model URI provided');
        }

        // Try using fetch to load the file as blob (works better with expo-asset URIs)
        Logger.info('[VRM] Fetching file as blob...');
        setLoadProgress(30);
        onProgress?.(30);

        const response = await fetch(fileUri);
        if (!response.ok) {
          throw new Error(`Failed to fetch VRM: ${response.status}`);
        }

        setLoadProgress(50);
        onProgress?.(50);

        const blob = await response.blob();
        Logger.info('[VRM] Blob size:', blob.size);

        setLoadProgress(60);
        onProgress?.(60);

        // Convert blob to base64 using FileReader
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Remove the data URL prefix to get just the base64
            const base64Data = result.split(',')[1] || result;
            resolve(base64Data);
          };
          reader.onerror = () => reject(new Error('FileReader failed'));
          reader.readAsDataURL(blob);
        });

        setLoadProgress(75);
        onProgress?.(75);

        // Create data URL
        const dataUrl = `data:application/octet-stream;base64,${base64}`;
        Logger.info('[VRM] Data URL created, length:', dataUrl.length);

        setModelDataUrl(dataUrl);
        setLoadProgress(80);
        onProgress?.(80);
      } catch (error) {
        Logger.error('[VRM] Failed to load model:', error);
        onError?.(
          error instanceof Error ? error.message : 'Failed to load VRM'
        );
        onModelLoaded?.(false);
        setIsLoading(false);
      }
    }, [modelModule, modelUri, onError, onProgress, onModelLoaded]);

    // Load model when component mounts or model changes
    useEffect(() => {
      if (modelModule || modelUri) {
        loadVRMAsDataUrl();
      }
    }, [modelModule, modelUri, loadVRMAsDataUrl]);

    const sendMessage = useCallback((data: any) => {
      if (!webViewRef.current) return;
      webViewRef.current.postMessage(JSON.stringify(data));
    }, []);

    const loadModel = useCallback(
      (uri: string) => {
        sendMessage({ type: 'loadModel', url: uri });
      },
      [sendMessage]
    );

    const setExpression = useCallback(
      (expression: VRMExpression) => {
        sendMessage({ type: 'setExpression', expression });
      },
      [sendMessage]
    );

    const startLipSync = useCallback(() => {
      sendMessage({ type: 'startLipSync' });
    }, [sendMessage]);

    const stopLipSync = useCallback(() => {
      sendMessage({ type: 'stopLipSync' });
    }, [sendMessage]);

    const playAudio = useCallback(
      (audioUrl: string) => {
        sendMessage({ type: 'playAudio', audioUrl });
      },
      [sendMessage]
    );

    useImperativeHandle(
      ref,
      () => ({
        loadModel,
        setExpression,
        startLipSync,
        stopLipSync,
        playAudio,
      }),
      [loadModel, setExpression, startLipSync, stopLipSync, playAudio]
    );

    // Handle speaking state changes
    useEffect(() => {
      if (isSpeaking !== lastSpeakingState.current && isReadyRef.current) {
        lastSpeakingState.current = isSpeaking;
        if (isSpeaking) {
          startLipSync();
        } else {
          stopLipSync();
        }
      }
    }, [isSpeaking, startLipSync, stopLipSync]);

    // Send model data to WebView when ready
    useEffect(() => {
      if (modelDataUrl && isReadyRef.current) {
        Logger.info('[VRM] Sending model data to WebView');
        sendMessage({ type: 'loadModelDataUrl', dataUrl: modelDataUrl });
      }
    }, [modelDataUrl, sendMessage]);

    const handleMessage = useCallback(
      (event: WebViewMessageEvent) => {
        try {
          const data = JSON.parse(event.nativeEvent.data);

          switch (data.type) {
            case 'ready':
              Logger.info('[VRM] WebView ready');
              isReadyRef.current = true;
              onReady?.();

              // If we already have model data, send it now
              if (modelDataUrl) {
                Logger.info('[VRM] Sending pre-loaded model data');
                sendMessage({
                  type: 'loadModelDataUrl',
                  dataUrl: modelDataUrl,
                });
              }
              break;

            case 'modelLoaded':
              Logger.info('[VRM] Model loaded:', data.success);
              setIsLoading(false);
              setLoadProgress(100);
              onProgress?.(100);
              onModelLoaded?.(data.success);
              if (!data.success && data.error) {
                onError?.(data.error);
              }
              if (data.success && initialExpression) {
                setTimeout(() => setExpression(initialExpression), 200);
              }
              break;

            case 'loadingProgress':
              if (typeof data.progress === 'number') {
                // Map WebView progress (0-100) to our remaining range (80-100)
                const mappedProgress = 80 + data.progress * 0.2;
                setLoadProgress(mappedProgress);
                onProgress?.(mappedProgress);
              }
              break;

            case 'error':
              Logger.error('[VRM] WebView error:', data.message);
              setIsLoading(false);
              onError?.(data.message || 'Unknown error');
              break;

            case 'touched':
              onTouched?.();
              break;

            case 'log':
              Logger.info('[VRM WebView]', data.message);
              break;
          }
        } catch (error) {
          Logger.error('[VRM] Message parse error:', error);
        }
      },
      [
        modelDataUrl,
        initialExpression,
        setExpression,
        sendMessage,
        onReady,
        onModelLoaded,
        onError,
        onTouched,
        onProgress,
      ]
    );

    const getInlineHtml = () => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { 
      width: 100%; 
      height: 100%; 
      overflow: hidden; 
      background: ${backgroundColor};
    }
    body { display: flex; align-items: center; justify-content: center; }
    #canvas-container { width: 100%; height: 100%; position: relative; }
    canvas { display: block; width: 100%; height: 100%; touch-action: none; }
  </style>
</head>
<body>
  <div id="canvas-container"></div>
  
  <script src="https://unpkg.com/three@0.158.0/build/three.min.js"><\/script>
  <script src="https://unpkg.com/three@0.158.0/examples/js/loaders/GLTFLoader.js"><\/script>
  <script src="https://unpkg.com/@pixiv/three-vrm@2.0.6/lib/three-vrm.min.js"><\/script>
  
  <script>
    // Logging helper
    function log(msg) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'log', message: msg }));
      }
      console.log(msg);
    }

    function sendMessage(data) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      }
    }

    let scene, camera, renderer, vrm, clock;
    let isSpeaking = false;
    let lipSyncFrame = null;
    let idleAnimationFrame = null;
    let breathOffset = 0;
    let blinkTimer = 0;
    let nextBlinkTime = 2000;

    async function init() {
      try {
        log('Initializing Three.js scene...');
        
        const container = document.getElementById('canvas-container');
        const width = container.clientWidth || window.innerWidth;
        const height = container.clientHeight || window.innerHeight;

        // Scene
        scene = new THREE.Scene();
        
        // Camera - adjusted for full body view
        camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 1000);
        camera.position.set(0, 1.0, 2.5);
        camera.lookAt(0, 1.0, 0);

        // Renderer
        renderer = new THREE.WebGLRenderer({ 
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance'
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        container.appendChild(renderer.domElement);

        // Lighting
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
        keyLight.position.set(1, 2, 2);
        scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
        fillLight.position.set(-1, 1, 1);
        scene.add(fillLight);

        const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
        rimLight.position.set(0, 1, -1);
        scene.add(rimLight);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        clock = new THREE.Clock();

        // Handle resize
        window.addEventListener('resize', () => {
          const newWidth = container.clientWidth || window.innerWidth;
          const newHeight = container.clientHeight || window.innerHeight;
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        });

        // Start render loop
        animate();

        log('Scene initialized successfully');
        sendMessage({ type: 'ready' });
      } catch (error) {
        log('Init error: ' + error.message);
        sendMessage({ type: 'error', message: error.message });
      }
    }

    function animate() {
      requestAnimationFrame(animate);
      
      const delta = clock.getDelta();
      
      if (vrm) {
        // Update VRM
        vrm.update(delta);
        
        // Idle animation - breathing
        breathOffset += delta * 1.5;
        const breathScale = 1 + Math.sin(breathOffset) * 0.005;
        vrm.scene.scale.setScalar(breathScale);
        
        // Subtle body sway
        vrm.scene.rotation.y = Math.sin(breathOffset * 0.3) * 0.02;
        
        // Blinking
        blinkTimer += delta * 1000;
        if (blinkTimer > nextBlinkTime) {
          blink();
          blinkTimer = 0;
          nextBlinkTime = 2000 + Math.random() * 4000; // 2-6 seconds
        }
      }
      
      renderer.render(scene, camera);
    }

    function blink() {
      if (!vrm || !vrm.expressionManager) return;
      
      try {
        // Close eyes
        vrm.expressionManager.setValue('blink', 1.0);
        
        // Open eyes after short delay
        setTimeout(() => {
          if (vrm && vrm.expressionManager) {
            vrm.expressionManager.setValue('blink', 0);
          }
        }, 100);
      } catch (e) {
        // Blink expression might not exist
      }
    }

    async function loadModelFromDataUrl(dataUrl) {
      log('Loading model from data URL (length: ' + dataUrl.length + ')');
      
      try {
        sendMessage({ type: 'loadingProgress', progress: 10 });

        // Remove existing model
        if (vrm) {
          scene.remove(vrm.scene);
          if (vrm.dispose) vrm.dispose();
          vrm = null;
        }

        // Convert data URL to blob
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        sendMessage({ type: 'loadingProgress', progress: 30 });
        log('Blob URL created: ' + url.substring(0, 50) + '...');

        // Create loader
        const loader = new THREE.GLTFLoader();
        
        // Register VRM plugin
        loader.register((parser) => {
          return new THREE_VRM.VRMLoaderPlugin(parser);
        });

        sendMessage({ type: 'loadingProgress', progress: 50 });

        // Load the model
        const gltf = await new Promise((resolve, reject) => {
          loader.load(
            url,
            (gltf) => resolve(gltf),
            (progress) => {
              if (progress.total > 0) {
                const pct = 50 + (progress.loaded / progress.total) * 40;
                sendMessage({ type: 'loadingProgress', progress: Math.round(pct) });
              }
            },
            (error) => reject(error)
          );
        });

        sendMessage({ type: 'loadingProgress', progress: 90 });
        log('GLTF loaded, extracting VRM...');

        vrm = gltf.userData.vrm;
        
        if (!vrm) {
          throw new Error('No VRM data found in GLTF');
        }

        // Setup VRM
        vrm.scene.rotation.y = Math.PI; // Face camera
        
        // Center and scale model
        const box = new THREE.Box3().setFromObject(vrm.scene);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        // Position model so feet are at y=0 and centered
        vrm.scene.position.x = -center.x;
        vrm.scene.position.y = -box.min.y;
        vrm.scene.position.z = -center.z;
        
        // Adjust camera based on model height
        const modelHeight = size.y;
        camera.position.set(0, modelHeight * 0.5, modelHeight * 1.5);
        camera.lookAt(0, modelHeight * 0.5, 0);
        
        scene.add(vrm.scene);

        // Add click handler
        renderer.domElement.addEventListener('click', handleClick);
        renderer.domElement.addEventListener('touchend', handleClick);

        // Cleanup blob URL
        URL.revokeObjectURL(url);

        sendMessage({ type: 'loadingProgress', progress: 100 });
        log('VRM model loaded successfully');
        sendMessage({ type: 'modelLoaded', success: true });
      } catch (error) {
        log('Model load error: ' + error.message);
        sendMessage({ type: 'modelLoaded', success: false, error: error.message });
        sendMessage({ type: 'error', message: 'Failed to load: ' + error.message });
      }
    }

    function handleClick(event) {
      if (!vrm) return;
      
      const rect = renderer.domElement.getBoundingClientRect();
      let x, y;
      
      if (event.changedTouches) {
        x = ((event.changedTouches[0].clientX - rect.left) / rect.width) * 2 - 1;
        y = -((event.changedTouches[0].clientY - rect.top) / rect.height) * 2 + 1;
      } else {
        x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      }
      
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      const intersects = raycaster.intersectObject(vrm.scene, true);
      
      if (intersects.length > 0) {
        sendMessage({ type: 'touched' });
        
        // Quick reaction
        if (vrm.expressionManager) {
          try {
            vrm.expressionManager.setValue('happy', 0.7);
            setTimeout(() => {
              if (vrm && vrm.expressionManager) {
                vrm.expressionManager.setValue('happy', 0);
              }
            }, 500);
          } catch (e) {}
        }
      }
    }

    function setExpression(expression) {
      if (!vrm || !vrm.expressionManager) return;
      
      log('Setting expression: ' + expression);
      
      try {
        // Reset expressions
        const presets = ['happy', 'angry', 'sad', 'relaxed', 'surprised'];
        presets.forEach(preset => {
          try { vrm.expressionManager.setValue(preset, 0); } catch (e) {}
        });

        switch (expression) {
          case 'happy':
            vrm.expressionManager.setValue('happy', 0.8);
            break;
          case 'sad':
            vrm.expressionManager.setValue('sad', 0.7);
            break;
          case 'surprised':
            vrm.expressionManager.setValue('surprised', 0.8);
            break;
          case 'thinking':
            vrm.expressionManager.setValue('relaxed', 0.3);
            break;
          case 'listening':
            vrm.expressionManager.setValue('relaxed', 0.2);
            break;
          case 'speaking':
            // Handled by lip sync
            break;
          case 'idle':
          default:
            // Already reset
            break;
        }
      } catch (e) {
        log('Expression error: ' + e.message);
      }
    }

    function startLipSync() {
      if (isSpeaking || !vrm) return;
      isSpeaking = true;
      log('Starting lip sync');

      function animateMouth() {
        if (!isSpeaking || !vrm) {
          stopLipSync();
          return;
        }

        try {
          // Animate visemes for speech
          const time = Date.now() / 1000;
          const aa = Math.abs(Math.sin(time * 8)) * 0.5 + Math.random() * 0.3;
          const oh = Math.abs(Math.sin(time * 6 + 1)) * 0.3;
          
          if (vrm.expressionManager) {
            try { vrm.expressionManager.setValue('aa', aa); } catch (e) {}
            try { vrm.expressionManager.setValue('oh', oh * 0.5); } catch (e) {}
          }
        } catch (e) {}

        lipSyncFrame = requestAnimationFrame(animateMouth);
      }

      lipSyncFrame = requestAnimationFrame(animateMouth);
    }

    function stopLipSync() {
      isSpeaking = false;
      
      if (lipSyncFrame) {
        cancelAnimationFrame(lipSyncFrame);
        lipSyncFrame = null;
      }

      // Reset mouth
      if (vrm && vrm.expressionManager) {
        try {
          vrm.expressionManager.setValue('aa', 0);
          vrm.expressionManager.setValue('oh', 0);
          vrm.expressionManager.setValue('ih', 0);
        } catch (e) {}
      }
      
      log('Lip sync stopped');
    }

    // Message handler
    window.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'loadModelDataUrl':
            if (data.dataUrl) {
              loadModelFromDataUrl(data.dataUrl);
            }
            break;
          case 'loadModel':
            if (data.url) {
              loadModelFromDataUrl(data.url);
            }
            break;
          case 'setExpression':
            setExpression(data.expression);
            break;
          case 'startLipSync':
            startLipSync();
            break;
          case 'stopLipSync':
            stopLipSync();
            break;
        }
      } catch (error) {
        log('Message error: ' + error.message);
      }
    });

    // React Native uses different event
    document.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'loadModelDataUrl':
            if (data.dataUrl) {
              loadModelFromDataUrl(data.dataUrl);
            }
            break;
          case 'loadModel':
            if (data.url) {
              loadModelFromDataUrl(data.url);
            }
            break;
          case 'setExpression':
            setExpression(data.expression);
            break;
          case 'startLipSync':
            startLipSync();
            break;
          case 'stopLipSync':
            stopLipSync();
            break;
        }
      } catch (error) {
        log('Message error: ' + error.message);
      }
    });

    // Initialize on load
    window.addEventListener('load', init);
    
    // Also try immediate init in case load already fired
    if (document.readyState === 'complete') {
      init();
    }
  <\/script>
</body>
</html>
    `;

    return (
      <View style={[styles.container, style]}>
        <WebView
          ref={webViewRef}
          source={{ html: getInlineHtml() }}
          style={styles.webview}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          originWhitelist={['*']}
          mixedContentMode="always"
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          webviewDebuggingEnabled={__DEV__}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            Logger.error('[VRM] WebView error:', nativeEvent.description);
            onError?.(`WebView error: ${nativeEvent.description}`);
          }}
        />

        {/* Loading overlay removed - parent component handles loading UI */}
      </View>
    );
  }
);

VRMAvatar.displayName = 'VRMAvatar';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default VRMAvatar;
