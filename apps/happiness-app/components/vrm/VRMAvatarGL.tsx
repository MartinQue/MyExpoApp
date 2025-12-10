/**
 * VRMAvatarGL.tsx - Native GL-based VRM Avatar Component
 *
 * Uses expo-gl and expo-three for native 3D rendering
 * NO WebView - direct OpenGL context
 */

import React, {
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useState,
} from 'react';
import { View, StyleSheet } from 'react-native';
import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
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

export interface VRMAvatarGLRef {
  setExpression: (expression: VRMExpression) => void;
  startLipSync: () => void;
  stopLipSync: () => void;
}

interface VRMAvatarGLProps {
  modelModule?: number;
  initialExpression?: VRMExpression;
  isSpeaking?: boolean;
  onReady?: () => void;
  onModelLoaded?: (success: boolean) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: number) => void;
  style?: object;
}

// Create a stylized anime-like avatar using primitives
function createAnimeAvatar(): THREE.Group {
  const group = new THREE.Group();

  // Body color palette
  const skinColor = 0xffeedd;
  const hairColor = 0x4a90d9;
  const clothingColor = 0x2d3748;
  const accentColor = 0xed8936;

  // Materials
  const skinMaterial = new THREE.MeshPhongMaterial({
    color: skinColor,
    flatShading: false,
  });
  const hairMaterial = new THREE.MeshPhongMaterial({
    color: hairColor,
    flatShading: false,
  });
  const clothingMaterial = new THREE.MeshPhongMaterial({
    color: clothingColor,
    flatShading: false,
  });

  // Head
  const headGeometry = new THREE.SphereGeometry(0.15, 32, 32);
  const head = new THREE.Mesh(headGeometry, skinMaterial);
  head.position.y = 1.5;
  head.scale.set(1, 1.1, 0.95);
  group.add(head);

  // Hair (larger sphere behind head)
  const hairBackGeometry = new THREE.SphereGeometry(0.18, 32, 32);
  const hairBack = new THREE.Mesh(hairBackGeometry, hairMaterial);
  hairBack.position.set(0, 1.55, -0.02);
  group.add(hairBack);

  // Hair bangs
  const bangGeometry = new THREE.SphereGeometry(0.12, 32, 16, 0, Math.PI);
  const bangs = new THREE.Mesh(bangGeometry, hairMaterial);
  bangs.position.set(0, 1.6, 0.08);
  bangs.rotation.x = -Math.PI / 6;
  group.add(bangs);

  // Eyes
  const eyeGeometry = new THREE.SphereGeometry(0.025, 16, 16);
  const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });

  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(-0.05, 1.52, 0.12);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rightEye.position.set(0.05, 1.52, 0.12);
  group.add(rightEye);

  // Eye highlights
  const highlightGeometry = new THREE.SphereGeometry(0.008, 8, 8);
  const highlightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

  const leftHighlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
  leftHighlight.position.set(-0.045, 1.53, 0.14);
  group.add(leftHighlight);

  const rightHighlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
  rightHighlight.position.set(0.055, 1.53, 0.14);
  group.add(rightHighlight);

  // Neck
  const neckGeometry = new THREE.CylinderGeometry(0.05, 0.06, 0.1, 16);
  const neck = new THREE.Mesh(neckGeometry, skinMaterial);
  neck.position.y = 1.32;
  group.add(neck);

  // Torso
  const torsoGeometry = new THREE.CylinderGeometry(0.12, 0.15, 0.4, 16);
  const torso = new THREE.Mesh(torsoGeometry, clothingMaterial);
  torso.position.y = 1.05;
  group.add(torso);

  // Arms
  const armGeometry = new THREE.CylinderGeometry(0.03, 0.035, 0.35, 8);

  const leftArm = new THREE.Mesh(armGeometry, clothingMaterial);
  leftArm.position.set(-0.18, 1.0, 0);
  leftArm.rotation.z = 0.2;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeometry, clothingMaterial);
  rightArm.position.set(0.18, 1.0, 0);
  rightArm.rotation.z = -0.2;
  group.add(rightArm);

  // Hands
  const handGeometry = new THREE.SphereGeometry(0.04, 16, 16);

  const leftHand = new THREE.Mesh(handGeometry, skinMaterial);
  leftHand.position.set(-0.24, 0.82, 0);
  group.add(leftHand);

  const rightHand = new THREE.Mesh(handGeometry, skinMaterial);
  rightHand.position.set(0.24, 0.82, 0);
  group.add(rightHand);

  // Collar accent
  const collarGeometry = new THREE.TorusGeometry(0.08, 0.015, 8, 24);
  const collarMaterial = new THREE.MeshPhongMaterial({ color: accentColor });
  const collar = new THREE.Mesh(collarGeometry, collarMaterial);
  collar.position.y = 1.25;
  collar.rotation.x = Math.PI / 2;
  group.add(collar);

  return group;
}

// Placeholder Avatar Component using Native GL
const PlaceholderAvatar: React.FC<{
  onReady?: () => void;
  onProgress?: (progress: number) => void;
  onModelLoaded?: (success: boolean) => void;
}> = ({ onReady, onProgress, onModelLoaded }) => {
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const avatarRef = useRef<THREE.Group | null>(null);
  const frameIdRef = useRef<number | null>(null);
  const timeRef = useRef(0);

  const onContextCreate = useCallback(
    async (gl: ExpoWebGLRenderingContext) => {
      try {
        Logger.info('[VRM-GL] Initializing native GL context...');
        onProgress?.(10);

        // Create renderer using expo-three Renderer
        const renderer = new Renderer({ gl }) as unknown as THREE.WebGLRenderer;
        renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
        renderer.setClearColor(0x000000, 0);
        rendererRef.current = renderer;

        // Create scene
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        // Create camera
        const camera = new THREE.PerspectiveCamera(
          45,
          gl.drawingBufferWidth / gl.drawingBufferHeight,
          0.1,
          1000
        );
        camera.position.set(0, 1.2, 2.5);
        camera.lookAt(0, 1, 0);
        cameraRef.current = camera;

        onProgress?.(30);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);

        const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
        keyLight.position.set(1, 2, 2);
        scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
        fillLight.position.set(-1, 1, 1);
        scene.add(fillLight);

        onProgress?.(50);

        // Create avatar
        const avatar = createAnimeAvatar();
        scene.add(avatar);
        avatarRef.current = avatar;

        onProgress?.(80);

        // Animation loop
        const animate = () => {
          frameIdRef.current = requestAnimationFrame(animate);
          timeRef.current += 0.016;

          if (avatarRef.current) {
            // Breathing animation
            const breathScale = 1 + Math.sin(timeRef.current * 2) * 0.02;
            avatarRef.current.scale.setScalar(breathScale);

            // Subtle sway
            avatarRef.current.rotation.y =
              Math.sin(timeRef.current * 0.5) * 0.05;
          }

          renderer.render(scene, camera);
          gl.endFrameEXP();
        };

        animate();

        onProgress?.(100);
        onReady?.();
        onModelLoaded?.(true);

        Logger.info('[VRM-GL] Native GL context initialized successfully');
      } catch (error) {
        Logger.error('[VRM-GL] Failed to initialize:', error);
        onModelLoaded?.(false);
      }
    },
    [onReady, onProgress, onModelLoaded]
  );

  useEffect(() => {
    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  return (
    <GLView
      style={StyleSheet.absoluteFill}
      onContextCreate={onContextCreate}
      msaaSamples={4}
    />
  );
};

const VRMAvatarGL = forwardRef<VRMAvatarGLRef, VRMAvatarGLProps>(
  (
    {
      modelModule,
      initialExpression = 'idle',
      isSpeaking = false,
      onReady,
      onModelLoaded,
      onError,
      onProgress,
      style,
    },
    ref
  ) => {
    const { isDark } = useTheme();
    const [isLoading, setIsLoading] = useState(true);

    const setExpression = useCallback((expression: VRMExpression) => {
      Logger.info('[VRM-GL] Setting expression:', expression);
    }, []);

    const startLipSync = useCallback(() => {
      Logger.info('[VRM-GL] Starting lip sync');
    }, []);

    const stopLipSync = useCallback(() => {
      Logger.info('[VRM-GL] Stopping lip sync');
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        setExpression,
        startLipSync,
        stopLipSync,
      }),
      [setExpression, startLipSync, stopLipSync]
    );

    const handleProgress = useCallback(
      (progress: number) => {
        onProgress?.(progress);
        if (progress >= 100) {
          setIsLoading(false);
        }
      },
      [onProgress]
    );

    return (
      <View style={[styles.container, style]}>
        <PlaceholderAvatar
          onReady={onReady}
          onProgress={handleProgress}
          onModelLoaded={onModelLoaded}
        />
      </View>
    );
  }
);

VRMAvatarGL.displayName = 'VRMAvatarGL';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});

export default VRMAvatarGL;
