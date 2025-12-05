import React, { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { Asset } from 'expo-asset';

// Expression types matching the HTML bundle
export type Live2DExpression =
  | 'idle'
  | 'happy'
  | 'thinking'
  | 'listening'
  | 'speaking'
  | 'surprised'
  | 'sad';

// Available models
export type Live2DModel =
  | 'hiyori'   // Female - soft, gentle
  | 'haru'     // Female - cheerful
  | 'shizuku'  // Female - calm
  | 'mao'      // Female - elegant
  | 'hijiki'   // Female - cute
  | 'tororo';  // Female - energetic

// Message types from WebView
interface WebViewMessage {
  type: 'ready' | 'modelLoaded' | 'expressionChanged' | 'lipSyncStarted' | 'lipSyncStopped' | 'error' | 'modelList';
  modelName?: string;
  expression?: string;
  message?: string;
  models?: string[];
}

// Ref methods exposed to parent
export interface Live2DAvatarRef {
  loadModel: (modelName: Live2DModel) => void;
  setExpression: (expression: Live2DExpression) => void;
  startLipSync: () => void;
  stopLipSync: () => void;
  getAvailableModels: () => void;
}

interface Live2DAvatarProps {
  initialModel?: Live2DModel;
  initialExpression?: Live2DExpression;
  onReady?: () => void;
  onModelLoaded?: (modelName: string) => void;
  onError?: (error: string) => void;
  style?: any;
}

const Live2DAvatar = forwardRef<Live2DAvatarRef, Live2DAvatarProps>(({
  initialModel = 'hiyori',
  initialExpression = 'idle',
  onReady,
  onModelLoaded,
  onError,
  style
}, ref) => {
  const webViewRef = useRef<WebView>(null);
  const isReadyRef = useRef(false);

  // Send message to WebView
  const sendMessage = useCallback((data: any) => {
    if (!webViewRef.current) {
      console.warn('⚠️ WebView not ready');
      return;
    }

    const message = JSON.stringify(data);
    console.log('📤 Sending to WebView:', data);

    webViewRef.current.postMessage(message);
  }, []);

  // Load a different model
  const loadModel = useCallback((modelName: Live2DModel) => {
    console.log('🎭 Loading model:', modelName);
    sendMessage({ type: 'loadModel', modelName });
  }, [sendMessage]);

  // Set expression
  const setExpression = useCallback((expression: Live2DExpression) => {
    console.log('😊 Setting expression:', expression);
    sendMessage({ type: 'setExpression', expression });
  }, [sendMessage]);

  // Start lip sync animation
  const startLipSync = useCallback(() => {
    console.log('🗣️ Starting lip sync');
    sendMessage({ type: 'startLipSync' });
  }, [sendMessage]);

  // Stop lip sync animation
  const stopLipSync = useCallback(() => {
    console.log('🤐 Stopping lip sync');
    sendMessage({ type: 'stopLipSync' });
  }, [sendMessage]);

  // Get available models
  const getAvailableModels = useCallback(() => {
    console.log('📋 Requesting model list');
    sendMessage({ type: 'getModels' });
  }, [sendMessage]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    loadModel,
    setExpression,
    startLipSync,
    stopLipSync,
    getAvailableModels
  }), [loadModel, setExpression, startLipSync, stopLipSync, getAvailableModels]);

  // Handle messages from WebView
  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data: WebViewMessage = JSON.parse(event.nativeEvent.data);
      console.log('📥 Message from WebView:', data);

      switch (data.type) {
        case 'ready':
          console.log('✅ Live2D WebView ready');
          isReadyRef.current = true;

          // Load initial model and expression
          setTimeout(() => {
            loadModel(initialModel);
            setExpression(initialExpression);
          }, 100);

          onReady?.();
          break;

        case 'modelLoaded':
          console.log('✅ Model loaded:', data.modelName);
          onModelLoaded?.(data.modelName || '');
          break;

        case 'expressionChanged':
          console.log('😊 Expression changed:', data.expression);
          break;

        case 'lipSyncStarted':
          console.log('🗣️ Lip sync started');
          break;

        case 'lipSyncStopped':
          console.log('🤐 Lip sync stopped');
          break;

        case 'error':
          console.error('❌ Live2D error:', data.message);
          onError?.(data.message || 'Unknown error');
          break;

        case 'modelList':
          console.log('📋 Available models:', data.models);
          break;

        default:
          console.warn('⚠️ Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('❌ Message parse error:', error);
    }
  }, [initialModel, initialExpression, loadModel, setExpression, onReady, onModelLoaded, onError]);

  // Generate inline HTML with CDN resources
  const getInlineHtml = () => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        #canvas { width: 100%; height: 100%; }
      </style>
    </head>
    <body>
      <canvas id="canvas"></canvas>
      <script src="https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/pixi.js@7.3.2/dist/pixi.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/pixi-live2d-display@0.5.0/dist/index.min.js"></script>
      <script>
        let app, model, isSpeaking = false, lipSyncInterval = null;

        const MODELS = {
          hiyori: 'https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/hiyori/hiyori.model.json',
          haru: 'https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/haru/haru_greeter_t03.model3.json',
          shizuku: 'https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/shizuku/shizuku.model.json',
          mao: 'https://cdn.jsdelivr.net/gh/Eikanya/Live2d-model/mao_2.0/model.json',
          hijiki: 'https://cdn.jsdelivr.net/gh/Eikanya/Live2d-model/hijiki/model.json',
          tororo: 'https://cdn.jsdelivr.net/gh/Eikanya/Live2d-model/tororo/tororo.model.json'
        };

        function sendMessage(data) {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify(data));
          }
        }

        async function init() {
          try {
            app = new PIXI.Application({
              view: document.getElementById('canvas'),
              autoStart: true,
              resizeTo: window,
              backgroundAlpha: 0,
              antialias: true
            });

            await loadModel('${initialModel}');
            sendMessage({ type: 'ready' });
          } catch (error) {
            console.error('Init error:', error);
            sendMessage({ type: 'error', message: error.message });
          }
        }

        async function loadModel(modelName) {
          try {
            const modelUrl = MODELS[modelName];
            if (!modelUrl) throw new Error('Model not found: ' + modelName);

            if (model) {
              app.stage.removeChild(model);
              model.destroy();
            }

            model = await PIXI.live2d.Live2DModel.from(modelUrl, { autoInteract: false });
            model.anchor.set(0.5, 0.5);
            model.position.set(app.screen.width / 2, app.screen.height / 2);

            const scale = Math.min(app.screen.width / model.width, app.screen.height / model.height) * 0.8;
            model.scale.set(scale);

            app.stage.addChild(model);
            sendMessage({ type: 'modelLoaded', modelName });
          } catch (error) {
            sendMessage({ type: 'error', message: error.message });
          }
        }

        function setExpression(expression) {
          if (!model) return;
          try {
            if (model.motion) {
              model.motion(expression, 0, PIXI.live2d.MotionPriority.NORMAL);
            }
            sendMessage({ type: 'expressionChanged', expression });
          } catch (error) {
            console.warn('Expression error:', error);
          }
        }

        function startLipSync() {
          if (isSpeaking) return;
          isSpeaking = true;

          lipSyncInterval = setInterval(() => {
            if (!model || !isSpeaking) {
              stopLipSync();
              return;
            }

            try {
              const mouthOpen = Math.random() * 0.8 + 0.2;
              if (model.internalModel?.coreModel) {
                const params = ['ParamMouthOpenY', 'PARAM_MOUTH_OPEN_Y', 'MouthOpenY'];
                for (const param of params) {
                  try {
                    model.internalModel.coreModel.setParameterValueById(param, mouthOpen);
                    break;
                  } catch {}
                }
              }
            } catch (error) {
              console.warn('Lip sync error:', error);
            }
          }, 100);

          sendMessage({ type: 'lipSyncStarted' });
        }

        function stopLipSync() {
          if (!isSpeaking) return;
          isSpeaking = false;

          if (lipSyncInterval) {
            clearInterval(lipSyncInterval);
            lipSyncInterval = null;
          }

          try {
            if (model?.internalModel?.coreModel) {
              const params = ['ParamMouthOpenY', 'PARAM_MOUTH_OPEN_Y', 'MouthOpenY'];
              for (const param of params) {
                try {
                  model.internalModel.coreModel.setParameterValueById(param, 0);
                  break;
                } catch {}
              }
            }
          } catch (error) {
            console.warn('Mouth close error:', error);
          }

          sendMessage({ type: 'lipSyncStopped' });
        }

        window.addEventListener('message', (event) => {
          try {
            const data = JSON.parse(event.data);

            switch (data.type) {
              case 'loadModel':
                loadModel(data.modelName);
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
              case 'getModels':
                sendMessage({ type: 'modelList', models: Object.keys(MODELS) });
                break;
            }
          } catch (error) {
            console.error('Message handler error:', error);
          }
        });

        window.addEventListener('resize', () => {
          if (!model || !app) return;
          model.position.set(app.screen.width / 2, app.screen.height / 2);
          const scale = Math.min(app.screen.width / model.width, app.screen.height / model.height) * 0.8;
          model.scale.set(scale);
        });

        window.addEventListener('load', init);
      </script>
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
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('❌ WebView error:', nativeEvent);
          onError?.(`WebView error: ${nativeEvent.description}`);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('❌ HTTP error:', nativeEvent);
        }}
      />
    </View>
  );
});

Live2DAvatar.displayName = 'Live2DAvatar';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});

export default Live2DAvatar;
