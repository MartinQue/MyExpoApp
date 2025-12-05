import React, { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

export type Live2DExpression =
  | 'idle'
  | 'happy'
  | 'thinking'
  | 'listening'
  | 'speaking'
  | 'surprised'
  | 'sad';

export type Live2DModel =
  | 'hiyori'
  | 'haru'
  | 'shizuku'
  | 'mao'
  | 'hijiki'
  | 'tororo';

interface WebViewMessage {
  type: 'ready' | 'modelLoaded' | 'expressionChanged' | 'lipSyncStarted' | 'lipSyncStopped' | 'error' | 'modelList' | 'touched';
  modelName?: string;
  expression?: string;
  message?: string;
  models?: string[];
}

export interface Live2DAvatarRef {
  loadModel: (modelName: Live2DModel) => void;
  setExpression: (expression: Live2DExpression) => void;
  startLipSync: () => void;
  stopLipSync: () => void;
  playAudio: (audioUrl: string) => void;
  getAvailableModels: () => void;
}

interface Live2DAvatarProps {
  initialModel?: Live2DModel;
  initialExpression?: Live2DExpression;
  onReady?: () => void;
  onModelLoaded?: (modelName: string) => void;
  onError?: (error: string) => void;
  onTouched?: () => void;
  style?: any;
}

const Live2DAvatar = forwardRef<Live2DAvatarRef, Live2DAvatarProps>(({
  initialModel = 'hiyori',
  initialExpression = 'idle',
  onReady,
  onModelLoaded,
  onError,
  onTouched,
  style
}, ref) => {
  const webViewRef = useRef<WebView>(null);
  const isReadyRef = useRef(false);

  const sendMessage = useCallback((data: any) => {
    if (!webViewRef.current) return;
    webViewRef.current.postMessage(JSON.stringify(data));
  }, []);

  const loadModel = useCallback((modelName: Live2DModel) => {
    sendMessage({ type: 'loadModel', modelName });
  }, [sendMessage]);

  const setExpression = useCallback((expression: Live2DExpression) => {
    sendMessage({ type: 'setExpression', expression });
  }, [sendMessage]);

  const startLipSync = useCallback(() => {
    sendMessage({ type: 'startLipSync' });
  }, [sendMessage]);

  const stopLipSync = useCallback(() => {
    sendMessage({ type: 'stopLipSync' });
  }, [sendMessage]);

  const playAudio = useCallback((audioUrl: string) => {
    sendMessage({ type: 'playAudio', audioUrl });
  }, [sendMessage]);

  const getAvailableModels = useCallback(() => {
    sendMessage({ type: 'getModels' });
  }, [sendMessage]);

  useImperativeHandle(ref, () => ({
    loadModel,
    setExpression,
    startLipSync,
    stopLipSync,
    playAudio,
    getAvailableModels
  }), [loadModel, setExpression, startLipSync, stopLipSync, playAudio, getAvailableModels]);

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data: WebViewMessage = JSON.parse(event.nativeEvent.data);

      switch (data.type) {
        case 'ready':
          isReadyRef.current = true;
          setTimeout(() => {
            loadModel(initialModel);
            setExpression(initialExpression);
          }, 100);
          onReady?.();
          break;
        case 'modelLoaded':
          onModelLoaded?.(data.modelName || '');
          break;
        case 'error':
          onError?.(data.message || 'Unknown error');
          break;
        case 'touched':
          onTouched?.();
          break;
      }
    } catch (error) {
      console.error('Message parse error:', error);
    }
  }, [initialModel, initialExpression, loadModel, setExpression, onReady, onModelLoaded, onError, onTouched]);

  const getInlineHtml = () => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: transparent; }
    body { display: flex; align-items: center; justify-content: center; }
    #canvas { width: 100%; height: 100%; touch-action: none; }
    #loading {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      color: rgba(255,255,255,0.8); font-family: system-ui; font-size: 14px;
      text-align: center;
    }
    .spinner {
      width: 40px; height: 40px; margin: 0 auto 12px;
      border: 3px solid rgba(255,255,255,0.2); border-top-color: #a855f7;
      border-radius: 50%; animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div id="loading"><div class="spinner"></div>Loading avatar...</div>
  <canvas id="canvas"></canvas>
  <script src="https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/pixi.js@7.3.2/dist/pixi.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/pixi-live2d-display@0.4.0/dist/cubism4.min.js"></script>
  <script>
    const PIXI_LIVE2D = PIXI.live2d;
    let app, model, audioContext, analyser, audioSource;
    let isSpeaking = false, lipSyncFrame = null;
    let idleMotionTimer = null, blinkTimer = null;
    let currentExpression = 'idle';

    const MODELS = {
      hiyori: 'https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/hiyori/hiyori.model3.json',
      haru: 'https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/haru/haru_greeter_t03.model3.json',
      shizuku: 'https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/shizuku/shizuku.model.json',
      mao: 'https://cdn.jsdelivr.net/gh/Eikanya/Live2d-model/Live2D-Model/live2d-widget-model-miku/assets/miku.model.json',
      hijiki: 'https://cdn.jsdelivr.net/gh/Eikanya/Live2d-model/Live2D-Model/live2d-widget-model-hijiki/assets/hijiki.model.json',
      tororo: 'https://cdn.jsdelivr.net/gh/Eikanya/Live2d-model/Live2D-Model/live2d-widget-model-tororo/assets/tororo.model.json'
    };

    const FALLBACK_MODELS = {
      hiyori: 'https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/hiyori/hiyori.model.json',
      haru: 'https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/haru/haru_greeter_t03.model3.json',
      shizuku: 'https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/shizuku/shizuku.model.json',
      mao: 'https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/shizuku/shizuku.model.json',
      hijiki: 'https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/hiyori/hiyori.model.json',
      tororo: 'https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/hiyori/hiyori.model.json'
    };

    function sendMessage(data) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      }
    }

    function hideLoading() {
      const el = document.getElementById('loading');
      if (el) el.style.display = 'none';
    }

    function showLoading(text) {
      const el = document.getElementById('loading');
      if (el) {
        el.innerHTML = '<div class="spinner"></div>' + text;
        el.style.display = 'block';
      }
    }

    async function init() {
      try {
        app = new PIXI.Application({
          view: document.getElementById('canvas'),
          autoStart: true,
          resizeTo: window,
          backgroundAlpha: 0,
          antialias: true,
          resolution: window.devicePixelRatio || 1
        });

        await loadModel('${initialModel}');
        sendMessage({ type: 'ready' });
      } catch (error) {
        console.error('Init error:', error);
        sendMessage({ type: 'error', message: error.message });
      }
    }

    async function loadModel(modelName) {
      showLoading('Loading ' + modelName + '...');
      
      try {
        let modelUrl = MODELS[modelName] || MODELS.hiyori;
        
        if (model) {
          stopIdleAnimations();
          app.stage.removeChild(model);
          model.destroy();
          model = null;
        }

        try {
          model = await PIXI_LIVE2D.Live2DModel.from(modelUrl, { autoInteract: false });
        } catch (e) {
          console.warn('Primary model failed, trying fallback:', e);
          modelUrl = FALLBACK_MODELS[modelName] || FALLBACK_MODELS.hiyori;
          model = await PIXI_LIVE2D.Live2DModel.from(modelUrl, { autoInteract: false });
        }

        model.anchor.set(0.5, 0.5);
        const padding = 0.85;
        const scale = Math.min(
          (app.screen.width * padding) / model.width,
          (app.screen.height * padding) / model.height
        );
        model.scale.set(scale);
        model.position.set(app.screen.width / 2, app.screen.height / 2 + 20);

        model.interactive = true;
        model.on('pointertap', () => {
          triggerTapReaction();
          sendMessage({ type: 'touched' });
        });

        app.stage.addChild(model);
        hideLoading();
        
        startIdleAnimations();
        sendMessage({ type: 'modelLoaded', modelName });
      } catch (error) {
        hideLoading();
        console.error('Model load error:', error);
        sendMessage({ type: 'error', message: 'Failed to load: ' + error.message });
      }
    }

    function startIdleAnimations() {
      startBlinking();
      startIdleMotion();
    }

    function stopIdleAnimations() {
      if (blinkTimer) { clearInterval(blinkTimer); blinkTimer = null; }
      if (idleMotionTimer) { clearInterval(idleMotionTimer); idleMotionTimer = null; }
    }

    function startBlinking() {
      if (blinkTimer) clearInterval(blinkTimer);
      
      const doBlink = () => {
        if (!model || !model.internalModel) return;
        
        try {
          const cm = model.internalModel.coreModel;
          if (!cm) return;
          
          const eyeParams = ['ParamEyeLOpen', 'ParamEyeROpen'];
          
          eyeParams.forEach(p => {
            try { cm.setParameterValueById(p, 0); } catch {}
          });
          
          setTimeout(() => {
            eyeParams.forEach(p => {
              try { cm.setParameterValueById(p, 1); } catch {}
            });
          }, 100);
        } catch (e) {}
      };
      
      blinkTimer = setInterval(doBlink, 3000 + Math.random() * 2000);
    }

    function startIdleMotion() {
      if (idleMotionTimer) clearInterval(idleMotionTimer);
      
      const doIdleMotion = () => {
        if (!model || isSpeaking) return;
        
        try {
          if (model.motion) {
            model.motion('idle', undefined, PIXI_LIVE2D.MotionPriority.IDLE);
          }
        } catch (e) {}
      };
      
      doIdleMotion();
      idleMotionTimer = setInterval(doIdleMotion, 10000 + Math.random() * 5000);
    }

    function triggerTapReaction() {
      if (!model) return;
      
      try {
        if (model.motion) {
          const motions = ['tap_body', 'tapBody', 'flick_head', 'tap'];
          for (const m of motions) {
            try {
              model.motion(m, undefined, PIXI_LIVE2D.MotionPriority.FORCE);
              return;
            } catch {}
          }
        }
        
        const cm = model.internalModel?.coreModel;
        if (cm) {
          try { cm.setParameterValueById('ParamEyeLSmile', 1); } catch {}
          try { cm.setParameterValueById('ParamEyeRSmile', 1); } catch {}
          try { cm.setParameterValueById('ParamMouthForm', 1); } catch {}
          
          setTimeout(() => {
            try { cm.setParameterValueById('ParamEyeLSmile', 0); } catch {}
            try { cm.setParameterValueById('ParamEyeRSmile', 0); } catch {}
            try { cm.setParameterValueById('ParamMouthForm', 0); } catch {}
          }, 500);
        }
      } catch (e) {}
    }

    function setExpression(expression) {
      if (!model) return;
      currentExpression = expression;
      
      try {
        const cm = model.internalModel?.coreModel;
        if (!cm) return;

        const reset = () => {
          const params = ['ParamEyeLSmile', 'ParamEyeRSmile', 'ParamMouthForm', 
                         'ParamBrowLY', 'ParamBrowRY', 'ParamAngleZ'];
          params.forEach(p => { try { cm.setParameterValueById(p, 0); } catch {} });
        };
        
        reset();

        switch (expression) {
          case 'happy':
            try { cm.setParameterValueById('ParamEyeLSmile', 1); } catch {}
            try { cm.setParameterValueById('ParamEyeRSmile', 1); } catch {}
            try { cm.setParameterValueById('ParamMouthForm', 1); } catch {}
            break;
            
          case 'sad':
            try { cm.setParameterValueById('ParamBrowLY', -1); } catch {}
            try { cm.setParameterValueById('ParamBrowRY', -1); } catch {}
            try { cm.setParameterValueById('ParamMouthForm', -0.5); } catch {}
            break;
            
          case 'surprised':
            try { cm.setParameterValueById('ParamEyeLOpen', 1.2); } catch {}
            try { cm.setParameterValueById('ParamEyeROpen', 1.2); } catch {}
            try { cm.setParameterValueById('ParamBrowLY', 1); } catch {}
            try { cm.setParameterValueById('ParamBrowRY', 1); } catch {}
            break;
            
          case 'thinking':
            try { cm.setParameterValueById('ParamAngleZ', 10); } catch {}
            try { cm.setParameterValueById('ParamEyeBallX', -0.5); } catch {}
            try { cm.setParameterValueById('ParamBrowLY', 0.3); } catch {}
            break;
            
          case 'listening':
            try { cm.setParameterValueById('ParamEyeLSmile', 0.3); } catch {}
            try { cm.setParameterValueById('ParamEyeRSmile', 0.3); } catch {}
            try { cm.setParameterValueById('ParamAngleZ', -5); } catch {}
            break;
            
          case 'speaking':
            break;
            
          case 'idle':
          default:
            break;
        }

        if (model.motion && expression !== 'idle') {
          try {
            model.motion(expression, undefined, PIXI_LIVE2D.MotionPriority.NORMAL);
          } catch {}
        }

        sendMessage({ type: 'expressionChanged', expression });
      } catch (e) {}
    }

    function startLipSync() {
      if (isSpeaking) return;
      isSpeaking = true;

      const animate = () => {
        if (!isSpeaking || !model) {
          stopLipSync();
          return;
        }

        try {
          const cm = model.internalModel?.coreModel;
          if (cm) {
            const mouthOpen = 0.2 + Math.random() * 0.6;
            const mouthForm = Math.sin(Date.now() / 200) * 0.3;
            
            try { cm.setParameterValueById('ParamMouthOpenY', mouthOpen); } catch {}
            try { cm.setParameterValueById('ParamMouthForm', mouthForm); } catch {}
          }
        } catch (e) {}

        lipSyncFrame = requestAnimationFrame(animate);
      };

      lipSyncFrame = requestAnimationFrame(animate);
      sendMessage({ type: 'lipSyncStarted' });
    }

    function stopLipSync() {
      isSpeaking = false;

      if (lipSyncFrame) {
        cancelAnimationFrame(lipSyncFrame);
        lipSyncFrame = null;
      }

      try {
        const cm = model?.internalModel?.coreModel;
        if (cm) {
          try { cm.setParameterValueById('ParamMouthOpenY', 0); } catch {}
          try { cm.setParameterValueById('ParamMouthForm', 0); } catch {}
        }
      } catch (e) {}

      sendMessage({ type: 'lipSyncStopped' });
    }

    async function playAudioWithLipSync(audioUrl) {
      try {
        if (!audioContext) {
          audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        
        audioSource = audioContext.createBufferSource();
        audioSource.buffer = audioBuffer;
        audioSource.connect(analyser);
        analyser.connect(audioContext.destination);
        
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        isSpeaking = true;
        
        const animateLipSync = () => {
          if (!isSpeaking) return;
          
          analyser.getByteFrequencyData(dataArray);
          const avg = dataArray.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
          const mouthOpen = Math.min(1, avg / 128);
          
          try {
            const cm = model?.internalModel?.coreModel;
            if (cm) {
              cm.setParameterValueById('ParamMouthOpenY', mouthOpen);
            }
          } catch {}
          
          lipSyncFrame = requestAnimationFrame(animateLipSync);
        };
        
        audioSource.onended = () => {
          stopLipSync();
        };
        
        audioSource.start(0);
        lipSyncFrame = requestAnimationFrame(animateLipSync);
        sendMessage({ type: 'lipSyncStarted' });
        
      } catch (error) {
        console.error('Audio playback error:', error);
        startLipSync();
      }
    }

    window.addEventListener('resize', () => {
      if (!model || !app) return;
      
      const padding = 0.85;
      const scale = Math.min(
        (app.screen.width * padding) / model.width,
        (app.screen.height * padding) / model.height
      );
      model.scale.set(scale);
      model.position.set(app.screen.width / 2, app.screen.height / 2 + 20);
    });

    window.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'loadModel': loadModel(data.modelName); break;
          case 'setExpression': setExpression(data.expression); break;
          case 'startLipSync': startLipSync(); break;
          case 'stopLipSync': stopLipSync(); break;
          case 'playAudio': playAudioWithLipSync(data.audioUrl); break;
          case 'getModels': sendMessage({ type: 'modelList', models: Object.keys(MODELS) }); break;
        }
      } catch (error) {
        console.error('Message error:', error);
      }
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
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          onError?.(`WebView error: ${nativeEvent.description}`);
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
