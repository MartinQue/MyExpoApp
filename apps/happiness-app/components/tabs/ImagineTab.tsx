import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  Text,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Keyboard,
  Alert,
  Modal,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as haptics from '@/lib/haptics';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeInRight,
  SlideInDown,
} from 'react-native-reanimated';
import { Colors } from '@/constants/Theme';
import {
  generateImage,
  enhancePrompt,
  getDALLESize,
  GeneratedImage,
  STYLE_PRESETS,
} from '@/lib/imageGeneration';
import { useUserStore } from '@/stores/userStore';
import { useImagineStore } from '@/stores/imagineStore';
import { useTheme } from '@/contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

// AI Models for image generation (Grok-style selection)
const AI_MODELS = [
  {
    id: 'dall-e-3',
    name: 'DALL·E 3',
    provider: 'OpenAI',
    icon: 'sparkles',
    description: 'Best for creative & artistic images',
    available: true,
    speed: 'medium',
    quality: 'high',
  },
  {
    id: 'dall-e-2',
    name: 'DALL·E 2',
    provider: 'OpenAI',
    icon: 'flash',
    description: 'Faster, good for iterations',
    available: true,
    speed: 'fast',
    quality: 'medium',
  },
  {
    id: 'flux-pro',
    name: 'Flux Pro',
    provider: 'Black Forest',
    icon: 'flame',
    description: 'Photorealistic excellence',
    available: false,
    speed: 'slow',
    quality: 'highest',
    comingSoon: true,
  },
  {
    id: 'midjourney',
    name: 'Midjourney',
    provider: 'Midjourney',
    icon: 'planet',
    description: 'Artistic & dreamlike',
    available: false,
    speed: 'medium',
    quality: 'highest',
    comingSoon: true,
  },
];

// Quality presets
const QUALITY_PRESETS = [
  {
    id: 'fast',
    name: 'Fast',
    icon: 'flash-outline',
    description: 'Quick preview',
  },
  {
    id: 'balanced',
    name: 'Balanced',
    icon: 'options-outline',
    description: 'Good quality',
  },
  {
    id: 'hd',
    name: 'HD',
    icon: 'diamond-outline',
    description: 'Maximum detail',
    premium: true,
  },
];

// Quick prompts for inspiration
const QUICK_PROMPTS = [
  '✨ A dreamy sunset over mountains',
  '🌌 Cosmic nebula with stars',
  '🎨 Abstract fluid art',
  '🏙️ Futuristic city skyline',
  '🌸 Cherry blossoms in spring',
  '🐉 Mystical dragon',
];

// Template cards (Grok-style)
const TEMPLATE_CARDS = [
  {
    id: 'girlfriend',
    name: 'Add Girlfriend',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    prompt: 'Add a beautiful girlfriend character to this scene',
  },
  {
    id: 'thumbsup',
    name: 'Thumbs Up',
    image: 'https://images.unsplash.com/photo-1529539795054-3c162aab037a?w=400',
    prompt: 'Add a person giving thumbs up gesture',
  },
  {
    id: 'moneyrain',
    name: 'Money Rain',
    image: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400',
    prompt: 'Add raining money effect to the scene',
  },
  {
    id: 'sunset',
    name: 'Golden Hour',
    image: 'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=400',
    prompt: 'Transform to golden hour sunset lighting',
  },
  {
    id: 'neon',
    name: 'Neon Glow',
    image: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=400',
    prompt: 'Add cyberpunk neon glow effects',
  },
  {
    id: 'vintage',
    name: 'Vintage Film',
    image: 'https://images.unsplash.com/photo-1502759683299-cdcd6974244f?w=400',
    prompt: 'Apply vintage film photography style',
  },
];

// Featured gallery items (Grok-style masonry)
const FEATURED_GALLERY = [
  {
    id: 'feat1',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800',
    prompt: 'Earth from space with city lights',
    size: 'large',
  },
  {
    id: 'feat2',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    prompt: 'Train station at night with fog',
    size: 'medium',
  },
  {
    id: 'feat3',
    url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800',
    prompt: 'Snowy mountain peak under stars',
    size: 'medium',
  },
  {
    id: 'feat4',
    url: 'https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?w=800',
    prompt: 'Hot air balloon over clouds',
    size: 'large',
  },
];

// Generation modes
type GenerationMode = 'image' | 'video' | 'multi';

const GENERATION_MODES = [
  {
    id: 'image' as GenerationMode,
    label: 'Image',
    icon: 'image-outline',
    available: true,
  },
  {
    id: 'video' as GenerationMode,
    label: 'Video',
    icon: 'videocam-outline',
    available: false,
    premium: true,
  },
  {
    id: 'multi' as GenerationMode,
    label: 'Multi-Image',
    icon: 'images-outline',
    available: true,
    premium: true,
  },
];

// Subscription tiers
const SUBSCRIPTION_TIERS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    credits: 10,
    features: ['10 image generations', 'Standard quality', 'Basic styles'],
    current: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$9.99/mo',
    credits: 'Unlimited',
    features: [
      'Unlimited generations',
      'HD quality',
      'All styles',
      'Priority processing',
      'Multi-image combos',
    ],
    recommended: true,
  },
  {
    id: 'elite',
    name: 'Elite',
    price: '$19.99/mo',
    credits: 'Unlimited+',
    features: [
      'Everything in Pro',
      'Video generation (coming soon)',
      'Custom training',
      'API access',
      'Priority support',
    ],
  },
];

export default function ImagineTab() {
  const { colors, isDark, getGradientArray } = useTheme();
  const { user, updateCredits, togglePro } = useUserStore();
  const { addGeneration } = useImagineStore();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(
    null
  );
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [gallery, setGallery] = useState<GeneratedImage[]>([]);
  const [showGallery, setShowGallery] = useState(false);
  const [enhancedPrompt, setEnhancedPrompt] = useState<string | null>(null);
  const [generationMode, setGenerationMode] = useState<GenerationMode>('image');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [selectedModel, setSelectedModel] = useState('dall-e-3');
  const [selectedQuality, setSelectedQuality] = useState('balanced');
  const inputRef = useRef<TextInput>(null);

  // Get current model info
  const currentModel =
    AI_MODELS.find((m) => m.id === selectedModel) || AI_MODELS[0];

  const handleModeSelect = (mode: GenerationMode) => {
    const modeConfig = GENERATION_MODES.find((m) => m.id === mode);

    if (!modeConfig?.available && !user.isPro) {
      haptics.warning();
      setShowPaywall(true);
      return;
    }

    if (modeConfig?.premium && !user.isPro) {
      haptics.warning();
      setShowPaywall(true);
      return;
    }

    haptics.button();
    setGenerationMode(mode);

    if (mode === 'video') {
      setShowVideoPreview(true);
    }
  };

  const handleModelSelect = (modelId: string) => {
    const model = AI_MODELS.find((m) => m.id === modelId);
    if (!model?.available) {
      haptics.warning();
      return;
    }
    haptics.button();
    setSelectedModel(modelId);
    setShowModelPicker(false);
  };

  const handleQualitySelect = (qualityId: string) => {
    const quality = QUALITY_PRESETS.find((q) => q.id === qualityId);
    if (quality?.premium && !user.isPro) {
      haptics.warning();
      setShowPaywall(true);
      return;
    }
    haptics.button();
    setSelectedQuality(qualityId);
  };

  const handleSelectSourceImages = async () => {
    if (!user.isPro) {
      setShowPaywall(true);
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 3,
        quality: 0.8,
      });

      if (!result.canceled) {
        const uris = result.assets.map((a) => a.uri);
        setSelectedImages(uris);
        haptics.success();
      }
    } catch (error) {
      console.error('Image selection failed:', error);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      haptics.warning();
      return;
    }

    // Check credits (if not pro)
    if (!user.isPro && user.credits <= 0) {
      setShowPaywall(true);
      return;
    }

    haptics.medium();
    Keyboard.dismiss();
    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      // Build the final prompt with style prefix
      let finalPrompt = prompt;
      if (selectedStyle) {
        const stylePreset = STYLE_PRESETS.find((s) => s.id === selectedStyle);
        if (stylePreset) {
          finalPrompt = `${stylePreset.prefix} ${prompt}`;
        }
      }

      // Add multi-image context if applicable
      if (generationMode === 'multi' && selectedImages.length > 0) {
        finalPrompt = `Combine elements from ${selectedImages.length} reference images: ${finalPrompt}`;
      }

      // Optionally enhance the prompt
      const enhanced = await enhancePrompt(finalPrompt);
      setEnhancedPrompt(enhanced);

      // Determine quality setting
      const qualitySetting = selectedQuality === 'hd' ? 'hd' : 'standard';

      // Generate the image with selected model
      const result = await generateImage(enhanced, {
        model: selectedModel as 'dall-e-3' | 'dall-e-2',
        size: getDALLESize(aspectRatio),
        style: 'vivid',
        quality: qualitySetting,
      });

      setGeneratedImage(result);
      setGallery((prev) => [result, ...prev]);

      // Save to store
      await addGeneration({
        prompt: prompt,
        enhancedPrompt: enhanced,
        imageUrl: result.imageUrl,
        style: selectedStyle || undefined,
        aspectRatio: aspectRatio,
        creditsUsed: 1,
        favorited: false,
      });

      // Deduct credit if not pro
      if (!user.isPro) {
        updateCredits(-1);
      }

      haptics.success();
    } catch (error) {
      console.error('Generation failed:', error);
      haptics.error();
      Alert.alert(
        'Generation Failed',
        error instanceof Error
          ? error.message
          : 'Something went wrong. Try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickPrompt = (quickPrompt: string) => {
    haptics.button();
    const cleanPrompt = quickPrompt.replace(/^[^\w]+/, '').trim();
    setPrompt(cleanPrompt);
    inputRef.current?.focus();
  };

  const handleStyleSelect = (styleId: string) => {
    haptics.button();
    setSelectedStyle(selectedStyle === styleId ? null : styleId);
  };

  const renderGeneratingState = () => (
    <Animated.View entering={FadeIn} style={styles.generatingContainer}>
      <LinearGradient
        colors={['#2E1065', '#4C1D95', '#5B21B6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.generatingGradient}
      >
        <View style={styles.generatingContent}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.generatingTitle}>
            {generationMode === 'video'
              ? 'Creating your video...'
              : 'Creating your vision...'}
          </Text>
          <Text style={styles.generatingSubtitle}>
            {enhancedPrompt
              ? `"${enhancedPrompt.substring(0, 60)}..."`
              : 'Processing your prompt...'}
          </Text>
          <View style={styles.generatingDots}>
            <Animated.View style={[styles.dot, { opacity: 0.4 }]} />
            <Animated.View style={[styles.dot, { opacity: 0.7 }]} />
            <Animated.View style={[styles.dot, { opacity: 1 }]} />
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  // Save image to camera roll
  const handleSaveImage = async () => {
    if (!generatedImage?.imageUrl) return;

    haptics.button();

    try {
      // Request permission
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant permission to save images to your photo library.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Download image to local file
      const filename = `happiness-ai-${Date.now()}.png`;
      // Use cacheDirectory from FileSystem module (cast to avoid TS issues)
      const cacheDir =
        (FileSystem as { cacheDirectory?: string }).cacheDirectory || '';
      const fileUri = `${cacheDir}${filename}`;

      const downloadResult = await (FileSystem as any).downloadAsync(
        generatedImage.imageUrl,
        fileUri
      );

      if (downloadResult.status !== 200) {
        throw new Error('Failed to download image');
      }

      // Save to media library
      const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);

      // Try to create/get an album for our app
      const album = await MediaLibrary.getAlbumAsync('Happiness AI');
      if (album) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      } else {
        await MediaLibrary.createAlbumAsync('Happiness AI', asset, false);
      }

      // Clean up temporary file
      await (FileSystem as any).deleteAsync(fileUri, { idempotent: true });

      haptics.success();
      Alert.alert(
        'Saved!',
        'Image saved to your photo library in "Happiness AI" album'
      );
    } catch (error) {
      console.error('Failed to save image:', error);
      haptics.error();
      Alert.alert('Save Failed', 'Could not save image. Please try again.');
    }
  };

  // Share image
  const handleShareImage = async () => {
    if (!generatedImage?.imageUrl) return;

    haptics.button();

    try {
      if (Platform.OS === 'ios') {
        // On iOS, we can share the URL directly
        await Share.share({
          url: generatedImage.imageUrl,
          message: `Check out this AI-generated image! Created with Happiness AI\n\nPrompt: "${prompt}"`,
        });
      } else {
        // On Android, share as message with URL
        await Share.share({
          message: `Check out this AI-generated image! Created with Happiness AI\n\nPrompt: "${prompt}"\n\n${generatedImage.imageUrl}`,
        });
      }
      haptics.success();
    } catch (error) {
      if ((error as any).message !== 'User did not share') {
        console.error('Share failed:', error);
        haptics.error();
        Alert.alert('Share Failed', 'Could not share image. Please try again.');
      }
    }
  };

  const renderGeneratedImage = () => (
    <Animated.View
      entering={FadeInUp.springify()}
      style={styles.resultContainer}
    >
      <Image
        source={{ uri: generatedImage!.imageUrl }}
        style={styles.generatedImage}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.resultOverlay}
      >
        <View style={styles.resultActions}>
          <Pressable style={styles.resultAction} onPress={handleSaveImage}>
            <Ionicons name="download-outline" size={24} color="white" />
          </Pressable>
          <Pressable style={styles.resultAction} onPress={handleShareImage}>
            <Ionicons name="share-outline" size={24} color="white" />
          </Pressable>
          <Pressable
            style={[styles.resultAction, styles.regenerateButton]}
            onPress={handleGenerate}
          >
            <Ionicons name="refresh-outline" size={20} color="white" />
            <Text style={styles.regenerateText}>Regenerate</Text>
          </Pressable>
        </View>
      </LinearGradient>
      <Pressable
        style={styles.closeButton}
        onPress={() => {
          haptics.button();
          setGeneratedImage(null);
        }}
      >
        <Ionicons name="close" size={24} color="white" />
      </Pressable>
    </Animated.View>
  );

  // Render model picker modal (Grok-style)
  const renderModelPicker = () => (
    <Modal
      visible={showModelPicker}
      animationType="slide"
      transparent
      onRequestClose={() => setShowModelPicker(false)}
    >
      <Pressable
        style={styles.modelPickerOverlay}
        onPress={() => setShowModelPicker(false)}
      >
        <Animated.View
          entering={SlideInDown.springify()}
          style={[
            styles.modelPickerContent,
            { backgroundColor: colors.surface },
          ]}
        >
          <View style={styles.modelPickerHandle} />
          <Text style={[styles.modelPickerTitle, { color: colors.text }]}>
            Select AI Model
          </Text>

          {AI_MODELS.map((model) => (
            <Pressable
              key={model.id}
              style={[
                styles.modelOption,
                {
                  backgroundColor: colors.glassBackground,
                  borderColor: colors.border,
                },
                selectedModel === model.id && {
                  borderColor: colors.primary,
                  backgroundColor: `${colors.primary}15`,
                },
                !model.available && { opacity: 0.5 },
              ]}
              onPress={() => handleModelSelect(model.id)}
              disabled={!model.available}
            >
              <View
                style={[
                  styles.modelIconContainer,
                  { backgroundColor: `${colors.primary}20` },
                ]}
              >
                <Ionicons
                  name={model.icon as any}
                  size={24}
                  color={colors.primary}
                />
              </View>
              <View style={styles.modelInfo}>
                <View style={styles.modelNameRow}>
                  <Text style={[styles.modelName, { color: colors.text }]}>
                    {model.name}
                  </Text>
                  {model.comingSoon && (
                    <View
                      style={[
                        styles.comingSoonBadge,
                        { backgroundColor: colors.warning },
                      ]}
                    >
                      <Text style={styles.comingSoonText}>Soon</Text>
                    </View>
                  )}
                </View>
                <Text
                  style={[styles.modelProvider, { color: colors.textMuted }]}
                >
                  {model.provider}
                </Text>
                <Text
                  style={[
                    styles.modelDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  {model.description}
                </Text>
                <View style={styles.modelStats}>
                  <View style={styles.modelStat}>
                    <Ionicons
                      name="speedometer-outline"
                      size={12}
                      color={colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.modelStatText,
                        { color: colors.textMuted },
                      ]}
                    >
                      {model.speed}
                    </Text>
                  </View>
                  <View style={styles.modelStat}>
                    <Ionicons
                      name="star-outline"
                      size={12}
                      color={colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.modelStatText,
                        { color: colors.textMuted },
                      ]}
                    >
                      {model.quality}
                    </Text>
                  </View>
                </View>
              </View>
              {selectedModel === model.id && (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={colors.primary}
                />
              )}
            </Pressable>
          ))}
        </Animated.View>
      </Pressable>
    </Modal>
  );

  // Render quality selector
  const renderQualitySelector = () => (
    <View style={styles.qualitySection}>
      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
        Quality
      </Text>
      <View style={styles.qualityRow}>
        {QUALITY_PRESETS.map((quality) => (
          <Pressable
            key={quality.id}
            style={[
              styles.qualityButton,
              {
                backgroundColor: colors.glassBackground,
                borderColor: colors.border,
              },
              selectedQuality === quality.id && {
                borderColor: colors.primary,
                backgroundColor: `${colors.primary}15`,
              },
              quality.premium && !user.isPro && { opacity: 0.6 },
            ]}
            onPress={() => handleQualitySelect(quality.id)}
          >
            <Ionicons
              name={quality.icon as any}
              size={18}
              color={
                selectedQuality === quality.id
                  ? colors.primary
                  : colors.textMuted
              }
            />
            <Text
              style={[
                styles.qualityLabel,
                { color: colors.textMuted },
                selectedQuality === quality.id && { color: colors.text },
              ]}
            >
              {quality.name}
            </Text>
            {quality.premium && !user.isPro && (
              <Ionicons name="lock-closed" size={10} color="#FFD700" />
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );

  // Render model selector button (Grok-style)
  const renderModelSelector = () => (
    <Pressable
      style={[
        styles.modelSelector,
        {
          backgroundColor: colors.glassBackground,
          borderColor: colors.border,
        },
      ]}
      onPress={() => {
        haptics.button();
        setShowModelPicker(true);
      }}
    >
      <View style={styles.modelSelectorContent}>
        <Ionicons
          name={currentModel.icon as any}
          size={16}
          color={colors.primary}
        />
        <Text style={[styles.modelSelectorText, { color: colors.text }]}>
          {currentModel.name}
        </Text>
        <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
      </View>
    </Pressable>
  );

  // Animate your photos section (Grok-style)
  const renderAnimatePhotosSection = () => {
    // Demo photos - in production, these would come from user's camera roll
    const userPhotos =
      gallery.length > 0
        ? gallery.slice(0, 4).map((g) => ({ id: g.id, url: g.imageUrl }))
        : [
            {
              id: 'demo1',
              url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
            },
            {
              id: 'demo2',
              url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
            },
            {
              id: 'demo3',
              url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400',
            },
          ];

    return (
      <Animated.View
        entering={FadeInDown.delay(100)}
        style={styles.animateSection}
      >
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitleLarge, { color: colors.text }]}>
            Animate your photos
          </Text>
          <Pressable
            style={styles.seeAllButton}
            onPress={() => {
              haptics.button();
              setShowGallery(true);
            }}
          >
            <Text style={[styles.seeAllText, { color: colors.textMuted }]}>
              See All
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.textMuted}
            />
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.photosScroll}
        >
          {userPhotos.map((photo, index) => (
            <Animated.View
              key={photo.id}
              entering={FadeInRight.delay(100 + index * 50)}
            >
              <Pressable
                style={styles.photoCard}
                onPress={() => {
                  haptics.button();
                  // Open photo for animation
                }}
              >
                <Image
                  source={{ uri: photo.url }}
                  style={styles.photoCardImage}
                  resizeMode="cover"
                />
                <View style={styles.photoCardOverlay}>
                  <View style={styles.photoCardBadge}>
                    <Ionicons name="sparkles" size={12} color="#ffffff" />
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          ))}
          {/* Add photo button */}
          <Pressable
            style={[styles.addPhotoCard, { borderColor: colors.border }]}
            onPress={handleSelectSourceImages}
          >
            <Ionicons name="add" size={32} color={colors.textMuted} />
          </Pressable>
        </ScrollView>
      </Animated.View>
    );
  };

  // Create from template section (Grok-style)
  const renderTemplateSection = () => {
    return (
      <Animated.View
        entering={FadeInDown.delay(200)}
        style={styles.templateSection}
      >
        <Text style={[styles.sectionTitleLarge, { color: colors.text }]}>
          Create from template
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.templatesScroll}
        >
          {TEMPLATE_CARDS.map((template, index) => (
            <Animated.View
              key={template.id}
              entering={FadeInRight.delay(150 + index * 50)}
            >
              <Pressable
                style={styles.templateCard}
                onPress={() => {
                  haptics.button();
                  setPrompt(template.prompt);
                  inputRef.current?.focus();
                }}
              >
                <Image
                  source={{ uri: template.image }}
                  style={styles.templateImage}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={styles.templateGradient}
                >
                  <Text style={styles.templateName}>{template.name}</Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          ))}
        </ScrollView>
      </Animated.View>
    );
  };

  // Featured gallery section (Grok-style masonry)
  const renderFeaturedGallery = () => {
    return (
      <Animated.View
        entering={FadeInDown.delay(300)}
        style={styles.featuredSection}
      >
        <View style={styles.featuredGrid}>
          {/* First column */}
          <View style={styles.featuredColumn}>
            {FEATURED_GALLERY.filter((_, i) => i % 2 === 0).map(
              (item, index) => (
                <Animated.View
                  key={item.id}
                  entering={FadeInUp.delay(200 + index * 100)}
                >
                  <Pressable
                    style={[
                      styles.featuredCard,
                      item.size === 'large'
                        ? styles.featuredCardLarge
                        : styles.featuredCardMedium,
                    ]}
                    onPress={() => {
                      haptics.button();
                      setPrompt(item.prompt);
                      inputRef.current?.focus();
                    }}
                  >
                    <Image
                      source={{ uri: item.url }}
                      style={styles.featuredImage}
                      resizeMode="cover"
                    />
                  </Pressable>
                </Animated.View>
              )
            )}
          </View>
          {/* Second column */}
          <View style={styles.featuredColumn}>
            {FEATURED_GALLERY.filter((_, i) => i % 2 === 1).map(
              (item, index) => (
                <Animated.View
                  key={item.id}
                  entering={FadeInUp.delay(250 + index * 100)}
                >
                  <Pressable
                    style={[
                      styles.featuredCard,
                      item.size === 'large'
                        ? styles.featuredCardLarge
                        : styles.featuredCardMedium,
                    ]}
                    onPress={() => {
                      haptics.button();
                      setPrompt(item.prompt);
                      inputRef.current?.focus();
                    }}
                  >
                    <Image
                      source={{ uri: item.url }}
                      style={styles.featuredImage}
                      resizeMode="cover"
                    />
                  </Pressable>
                </Animated.View>
              )
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View
        style={[styles.emptyIcon, { backgroundColor: `${colors.primary}20` }]}
      >
        <Ionicons name="sparkles" size={48} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        Bring your ideas to life
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
        Type a description and watch AI create stunning images for you
      </Text>
    </View>
  );

  const renderModeSelector = () => (
    <View style={styles.modeSelector}>
      {GENERATION_MODES.map((mode) => (
        <Pressable
          key={mode.id}
          style={[
            styles.modeButton,
            {
              backgroundColor: colors.glassBackground,
              borderColor: colors.border,
            },
            generationMode === mode.id && [
              styles.modeButtonActive,
              { borderColor: colors.primary },
            ],
            (!mode.available || (mode.premium && !user.isPro)) &&
              styles.modeButtonLocked,
          ]}
          onPress={() => handleModeSelect(mode.id)}
        >
          <Ionicons
            name={mode.icon as any}
            size={20}
            color={generationMode === mode.id ? colors.text : colors.textMuted}
          />
          <Text
            style={[
              styles.modeLabel,
              { color: colors.textMuted },
              generationMode === mode.id && [
                styles.modeLabelActive,
                { color: colors.text },
              ],
            ]}
          >
            {mode.label}
          </Text>
          {mode.premium && !user.isPro && (
            <View style={styles.premiumBadge}>
              <Ionicons name="lock-closed" size={10} color="#FFD700" />
            </View>
          )}
        </Pressable>
      ))}
    </View>
  );

  const renderMultiImageSelector = () => {
    if (generationMode !== 'multi') return null;

    return (
      <Animated.View entering={FadeInDown} style={styles.multiImageSection}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          Reference Images
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Pressable
            style={[
              styles.addImageButton,
              {
                borderColor: colors.primary,
                backgroundColor: `${colors.primary}15`,
              },
            ]}
            onPress={handleSelectSourceImages}
          >
            <Ionicons name="add" size={32} color={colors.primary} />
            <Text style={[styles.addImageText, { color: colors.primary }]}>
              Add up to 3
            </Text>
          </Pressable>
          {selectedImages.map((uri, index) => (
            <View key={index} style={styles.selectedImageContainer}>
              <Image source={{ uri }} style={styles.selectedImage} />
              <Pressable
                style={styles.removeImageButton}
                onPress={() => {
                  haptics.button();
                  setSelectedImages((prev) =>
                    prev.filter((_, i) => i !== index)
                  );
                }}
              >
                <Ionicons name="close-circle" size={24} color={colors.text} />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    );
  };

  const renderPaywallModal = () => (
    <Modal
      visible={showPaywall}
      animationType="slide"
      transparent
      onRequestClose={() => setShowPaywall(false)}
    >
      <View style={styles.paywallOverlay}>
        <BlurView intensity={80} tint="dark" style={styles.paywallBlur}>
          <View style={styles.paywallContent}>
            <View style={styles.paywallHeader}>
              <LinearGradient
                colors={['#8B5CF6', '#6366F1', '#4F46E5']}
                style={styles.paywallIcon}
              >
                <Ionicons name="sparkles" size={32} color="white" />
              </LinearGradient>
              <Text style={styles.paywallTitle}>Unlock Premium</Text>
              <Text style={styles.paywallSubtitle}>
                Get unlimited generations and exclusive features
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tiersContainer}
              pagingEnabled
              snapToInterval={width - 60}
              decelerationRate="fast"
            >
              {SUBSCRIPTION_TIERS.map((tier) => (
                <Pressable
                  key={tier.id}
                  style={[
                    styles.tierCard,
                    tier.recommended && styles.tierCardRecommended,
                  ]}
                  onPress={() => {
                    if (tier.id !== 'free') {
                      haptics.medium();
                      // TODO: Implement actual subscription
                      togglePro();
                      setShowPaywall(false);
                      Alert.alert(
                        'Pro Activated!',
                        'Enjoy unlimited generations!'
                      );
                    }
                  }}
                >
                  {tier.recommended && (
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedText}>BEST VALUE</Text>
                    </View>
                  )}
                  <Text style={styles.tierName}>{tier.name}</Text>
                  <Text style={styles.tierPrice}>{tier.price}</Text>
                  <Text style={styles.tierCredits}>
                    {typeof tier.credits === 'number'
                      ? `${tier.credits} credits`
                      : tier.credits}
                  </Text>
                  <View style={styles.tierFeatures}>
                    {tier.features.map((feature, index) => (
                      <View key={index} style={styles.tierFeatureRow}>
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color={Colors.success}
                        />
                        <Text style={styles.tierFeatureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                  <View
                    style={[
                      styles.tierButton,
                      tier.current && styles.tierButtonCurrent,
                      tier.recommended && styles.tierButtonRecommended,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tierButtonText,
                        tier.recommended && styles.tierButtonTextRecommended,
                      ]}
                    >
                      {tier.current ? 'Current Plan' : 'Upgrade'}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>

            <Pressable
              style={styles.closePaywall}
              onPress={() => setShowPaywall(false)}
            >
              <Text style={styles.closePaywallText}>Maybe Later</Text>
            </Pressable>
          </View>
        </BlurView>
      </View>
    </Modal>
  );

  const renderVideoPreviewModal = () => (
    <Modal
      visible={showVideoPreview}
      animationType="fade"
      transparent
      onRequestClose={() => setShowVideoPreview(false)}
    >
      <Pressable
        style={styles.videoPreviewOverlay}
        onPress={() => setShowVideoPreview(false)}
      >
        <View style={styles.videoPreviewContent}>
          <LinearGradient
            colors={['#1a1a2e', '#16213e', '#0f3460']}
            style={styles.videoPreviewGradient}
          >
            <View style={styles.videoPreviewIcon}>
              <Ionicons name="videocam" size={48} color="#8B5CF6" />
            </View>
            <Text style={styles.videoPreviewTitle}>Video Generation</Text>
            <Text style={styles.videoPreviewSubtitle}>Coming Soon!</Text>
            <Text style={styles.videoPreviewDescription}>
              Create stunning AI-generated videos from text prompts. Powered by
              next-gen video models.
            </Text>
            <View style={styles.videoFeatures}>
              <View style={styles.videoFeatureItem}>
                <Ionicons
                  name="timer-outline"
                  size={20}
                  color={Colors.primary[400]}
                />
                <Text style={styles.videoFeatureText}>5-30 second clips</Text>
              </View>
              <View style={styles.videoFeatureItem}>
                <Ionicons
                  name="color-palette-outline"
                  size={20}
                  color={Colors.primary[400]}
                />
                <Text style={styles.videoFeatureText}>Multiple styles</Text>
              </View>
              <View style={styles.videoFeatureItem}>
                <Ionicons
                  name="musical-notes-outline"
                  size={20}
                  color={Colors.primary[400]}
                />
                <Text style={styles.videoFeatureText}>Audio sync</Text>
              </View>
            </View>
            <Pressable
              style={styles.notifyButton}
              onPress={() => {
                haptics.success();
                setShowVideoPreview(false);
                Alert.alert(
                  "You're on the list!",
                  "We'll notify you when video generation launches."
                );
              }}
            >
              <Ionicons name="notifications-outline" size={20} color="white" />
              <Text style={styles.notifyButtonText}>Notify Me</Text>
            </Pressable>
          </LinearGradient>
        </View>
      </Pressable>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={getGradientArray('imagine')}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Imagine
            </Text>
            {/* Model Selector (Grok-style) */}
            {renderModelSelector()}
          </View>
          <View style={styles.headerRight}>
            <View
              style={[
                styles.creditsBadge,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 215, 0, 0.15)'
                    : 'rgba(255, 215, 0, 0.2)',
                },
              ]}
            >
              <Ionicons name="flash" size={14} color="#FFD700" />
              <Text style={styles.creditsText}>
                {user.isPro ? '∞' : user.credits}
              </Text>
            </View>
            {!user.isPro && (
              <Pressable
                style={styles.upgradeButton}
                onPress={() => {
                  haptics.button();
                  setShowPaywall(true);
                }}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#6366F1']}
                  style={styles.upgradeGradient}
                >
                  <Text style={styles.upgradeText}>PRO</Text>
                </LinearGradient>
              </Pressable>
            )}
            <Pressable
              style={[
                styles.galleryButton,
                { backgroundColor: colors.glassBackground },
              ]}
              onPress={() => {
                haptics.button();
                setShowGallery(!showGallery);
              }}
            >
              <Ionicons name="images-outline" size={22} color={colors.text} />
            </Pressable>
          </View>
        </View>

        {/* Mode Selector */}
        {!generatedImage && !isGenerating && renderModeSelector()}

        {/* Main Content */}
        {isGenerating ? (
          renderGeneratingState()
        ) : generatedImage ? (
          renderGeneratedImage()
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Animate your photos section (Grok-style) */}
            {renderAnimatePhotosSection()}

            {/* Create from template section (Grok-style) */}
            {renderTemplateSection()}

            {/* Featured gallery (Grok-style masonry) */}
            {renderFeaturedGallery()}

            {/* Quality Selector */}
            {renderQualitySelector()}

            {/* Multi-Image Selector */}
            {renderMultiImageSelector()}

            {/* Quick Prompts */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                Quick Ideas
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickPrompts}
              >
                {QUICK_PROMPTS.map((qp, index) => (
                  <Pressable
                    key={index}
                    style={[
                      styles.quickPromptChip,
                      {
                        backgroundColor: colors.glassBackground,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => handleQuickPrompt(qp)}
                  >
                    <Text
                      style={[styles.quickPromptText, { color: colors.text }]}
                    >
                      {qp}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Style Presets */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                Style
              </Text>
              <View style={styles.styleGrid}>
                {STYLE_PRESETS.map((style) => (
                  <Pressable
                    key={style.id}
                    style={[
                      styles.styleChip,
                      {
                        backgroundColor: colors.glassBackground,
                        borderColor: colors.border,
                      },
                      selectedStyle === style.id && [
                        styles.styleChipActive,
                        {
                          backgroundColor: `${colors.primary}20`,
                          borderColor: colors.primary,
                        },
                      ],
                    ]}
                    onPress={() => handleStyleSelect(style.id)}
                  >
                    <Text
                      style={[
                        styles.styleChipText,
                        { color: colors.textSecondary },
                        selectedStyle === style.id && { color: colors.text },
                      ]}
                    >
                      {style.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Aspect Ratio */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                Aspect Ratio
              </Text>
              <View style={styles.ratioRow}>
                {[
                  { id: '1:1', icon: 'square-outline', label: 'Square' },
                  {
                    id: '16:9',
                    icon: 'tablet-landscape-outline',
                    label: 'Wide',
                  },
                  { id: '9:16', icon: 'phone-portrait-outline', label: 'Tall' },
                ].map((ratio) => (
                  <Pressable
                    key={ratio.id}
                    style={[
                      styles.ratioButton,
                      {
                        backgroundColor: colors.glassBackground,
                        borderColor: colors.border,
                      },
                      aspectRatio === ratio.id && [
                        styles.ratioButtonActive,
                        {
                          backgroundColor: `${colors.primary}20`,
                          borderColor: colors.primary,
                        },
                      ],
                    ]}
                    onPress={() => {
                      haptics.button();
                      setAspectRatio(ratio.id);
                    }}
                  >
                    <Ionicons
                      name={ratio.icon as any}
                      size={24}
                      color={
                        aspectRatio === ratio.id
                          ? colors.text
                          : colors.textMuted
                      }
                    />
                    <Text
                      style={[
                        styles.ratioLabel,
                        { color: colors.textMuted },
                        aspectRatio === ratio.id && { color: colors.text },
                      ]}
                    >
                      {ratio.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Gallery Preview */}
            {gallery.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text
                    style={[styles.sectionTitle, { color: colors.textMuted }]}
                  >
                    Recent
                  </Text>
                  <Pressable onPress={() => setShowGallery(true)}>
                    <Text
                      style={[styles.seeAllText, { color: colors.primary }]}
                    >
                      See All
                    </Text>
                  </Pressable>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.galleryScroll}
                >
                  {gallery.slice(0, 5).map((img) => (
                    <Pressable
                      key={img.id}
                      style={styles.galleryThumb}
                      onPress={() => {
                        haptics.button();
                        setGeneratedImage(img);
                      }}
                    >
                      <Image
                        source={{ uri: img.imageUrl }}
                        style={styles.galleryThumbImage}
                      />
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Skeleton loading for gallery when generating */}
            {isGenerating && gallery.length === 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View
                    style={[
                      {
                        width: 80,
                        height: 16,
                        borderRadius: 4,
                        backgroundColor: colors.glassBackground,
                      },
                    ]}
                  />
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.galleryScroll}
                >
                  {[1, 2, 3].map((idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.galleryThumb,
                        { backgroundColor: colors.glassBackground },
                      ]}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Spacing for input bar */}
            <View style={{ height: 140 }} />
          </ScrollView>
        )}

        {/* Input Bar (Grok-style) */}
        {!generatedImage && !isGenerating && (
          <View style={styles.grokInputContainer}>
            <BlurView
              intensity={isDark ? 60 : 40}
              tint={isDark ? 'dark' : 'light'}
              style={styles.grokInputBlur}
            >
              {/* Profile thumbnail */}
              <View style={styles.grokProfileThumb}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
                  }}
                  style={styles.grokProfileImage}
                />
              </View>

              {/* Attachment button with camera overlay */}
              <Pressable
                style={styles.grokAttachButton}
                onPress={handleSelectSourceImages}
              >
                <Ionicons name="sparkles" size={18} color={colors.primary} />
              </Pressable>

              {/* Input field */}
              <View style={styles.grokInputField}>
                <TextInput
                  ref={inputRef}
                  style={[styles.grokInput, { color: colors.text }]}
                  placeholder="Type to imagine"
                  placeholderTextColor={colors.textMuted}
                  value={prompt}
                  onChangeText={setPrompt}
                  multiline
                  maxLength={500}
                />
              </View>

              {/* Speak button */}
              <Pressable
                style={[
                  styles.grokSpeakButton,
                  prompt.trim() && styles.grokSpeakButtonActive,
                ]}
                onPress={prompt.trim() ? handleGenerate : undefined}
              >
                {prompt.trim() ? (
                  <Ionicons name="arrow-up" size={20} color="#000" />
                ) : (
                  <>
                    <Ionicons
                      name="mic"
                      size={16}
                      color="rgba(255,255,255,0.7)"
                    />
                    <Text style={styles.grokSpeakText}>Speak</Text>
                  </>
                )}
              </Pressable>
            </BlurView>
          </View>
        )}
      </SafeAreaView>

      {/* Modals */}
      {renderPaywallModal()}
      {renderVideoPreviewModal()}
      {renderModelPicker()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'column',
    gap: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  // Model Selector (Grok-style)
  modelSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  modelSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modelSelectorText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Model Picker Modal
  modelPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modelPickerContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: height * 0.7,
  },
  modelPickerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  modelPickerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  modelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  modelIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modelInfo: {
    flex: 1,
  },
  modelNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modelName: {
    fontSize: 16,
    fontWeight: '600',
  },
  comingSoonBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  comingSoonText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#000',
  },
  modelProvider: {
    fontSize: 12,
    marginTop: 2,
  },
  modelDescription: {
    fontSize: 13,
    marginTop: 4,
  },
  modelStats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  modelStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modelStatText: {
    fontSize: 11,
    textTransform: 'capitalize',
  },
  // Quality Section
  qualitySection: {
    marginBottom: 20,
  },
  qualityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  qualityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  qualityLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  creditsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  creditsText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
  },
  upgradeButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  upgradeGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  upgradeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  galleryButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 8,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modeButtonActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderColor: Colors.primary[500],
  },
  modeButtonLocked: {
    opacity: 0.6,
  },
  modeLabel: {
    color: Colors.gray[400],
    fontSize: 13,
    fontWeight: '600',
  },
  modeLabelActive: {
    color: 'white',
  },
  premiumBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: Colors.gray[400],
    fontSize: 15,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
  },
  multiImageSection: {
    marginBottom: 20,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.primary[500],
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addImageText: {
    color: Colors.primary[400],
    fontSize: 11,
    marginTop: 4,
  },
  selectedImageContainer: {
    marginRight: 12,
    position: 'relative',
  },
  selectedImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: Colors.gray[400],
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  seeAllText: {
    color: Colors.primary[400],
    fontSize: 14,
    fontWeight: '500',
  },
  quickPrompts: {
    gap: 10,
    paddingRight: 20,
  },
  quickPromptChip: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  quickPromptText: {
    color: 'white',
    fontSize: 14,
  },
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  styleChip: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  styleChipActive: {
    backgroundColor: Colors.primary[900],
    borderColor: Colors.primary[500],
  },
  styleChipText: {
    color: Colors.gray[300],
    fontSize: 14,
    fontWeight: '500',
  },
  styleChipTextActive: {
    color: 'white',
  },
  ratioRow: {
    flexDirection: 'row',
    gap: 12,
  },
  ratioButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 8,
  },
  ratioButtonActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderColor: Colors.primary[500],
  },
  ratioLabel: {
    color: Colors.gray[500],
    fontSize: 12,
    fontWeight: '500',
  },
  ratioLabelActive: {
    color: 'white',
  },
  galleryScroll: {
    gap: 12,
  },
  galleryThumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
  },
  galleryThumbImage: {
    width: '100%',
    height: '100%',
  },
  inputContainer: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
  },
  inputBlur: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    backgroundColor: 'rgba(20, 20, 25, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 28,
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 80,
  },
  generateButton: {
    marginRight: 4,
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  generateGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Generating state
  generatingContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 24,
    overflow: 'hidden',
  },
  generatingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  generatingContent: {
    alignItems: 'center',
    padding: 40,
  },
  generatingTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 8,
  },
  generatingSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 280,
  },
  generatingDots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  // Result state
  resultContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 24,
    overflow: 'hidden',
  },
  generatedImage: {
    width: '100%',
    height: '100%',
  },
  resultOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  resultAction: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  regenerateButton: {
    width: 'auto',
    paddingHorizontal: 20,
    flexDirection: 'row',
    gap: 8,
  },
  regenerateText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Paywall Modal
  paywallOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  paywallBlur: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  paywallContent: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  paywallHeader: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 20,
  },
  paywallIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  paywallTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  paywallSubtitle: {
    color: Colors.gray[400],
    fontSize: 15,
    textAlign: 'center',
    maxWidth: 280,
  },
  tiersContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  tierCard: {
    width: width - 80,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginRight: 16,
  },
  tierCardRecommended: {
    borderColor: Colors.primary[500],
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    alignSelf: 'center',
    backgroundColor: Colors.primary[500],
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  tierName: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  tierPrice: {
    color: Colors.primary[400],
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  tierCredits: {
    color: Colors.gray[400],
    fontSize: 14,
    marginBottom: 16,
  },
  tierFeatures: {
    gap: 8,
    marginBottom: 20,
  },
  tierFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tierFeatureText: {
    color: 'white',
    fontSize: 14,
  },
  tierButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tierButtonCurrent: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  tierButtonRecommended: {
    backgroundColor: Colors.primary[500],
  },
  tierButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  tierButtonTextRecommended: {
    color: 'white',
  },
  closePaywall: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  closePaywallText: {
    color: Colors.gray[500],
    fontSize: 16,
  },
  // Video Preview Modal
  videoPreviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  videoPreviewContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    overflow: 'hidden',
  },
  videoPreviewGradient: {
    padding: 28,
    alignItems: 'center',
  },
  videoPreviewIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  videoPreviewTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  videoPreviewSubtitle: {
    color: Colors.primary[400],
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  videoPreviewDescription: {
    color: Colors.gray[300],
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  videoFeatures: {
    gap: 12,
    marginBottom: 24,
    width: '100%',
  },
  videoFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  videoFeatureText: {
    color: 'white',
    fontSize: 14,
  },
  notifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary[500],
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  notifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Hero Section Styles
  heroSection: {
    marginBottom: 28,
  },
  heroHeader: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 13,
  },
  heroScroll: {
    paddingLeft: 4,
    gap: 12,
  },
  heroCard: {
    width: width - 40,
    marginRight: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  heroCardBlur: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  heroMediaContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroVideoContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroVideoThumbnail: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  heroPlayButton: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(139, 92, 246, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroModelBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  heroModelText: {
    fontSize: 11,
    fontWeight: '600',
  },
  heroContent: {
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  heroPrompt: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 12,
    lineHeight: 20,
  },
  heroUseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  heroUseText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Grok-style Animate Photos Section
  animateSection: {
    marginBottom: 28,
    paddingHorizontal: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleLarge: {
    fontSize: 20,
    fontWeight: '700',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  photosScroll: {
    gap: 12,
    paddingRight: 20,
  },
  photoCard: {
    width: 120,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  photoCardImage: {
    width: '100%',
    height: '100%',
  },
  photoCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    padding: 8,
  },
  photoCardBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoCard: {
    width: 120,
    height: 160,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  // Grok-style Template Section
  templateSection: {
    marginBottom: 28,
    paddingHorizontal: 4,
  },
  templatesScroll: {
    gap: 12,
    paddingRight: 20,
    marginTop: 16,
  },
  templateCard: {
    width: 140,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  templateImage: {
    width: '100%',
    height: '100%',
  },
  templateGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  templateName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Grok-style Featured Gallery (Masonry)
  featuredSection: {
    marginBottom: 28,
    paddingHorizontal: 4,
  },
  featuredGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  featuredColumn: {
    flex: 1,
    gap: 12,
  },
  featuredCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  featuredCardLarge: {
    height: 240,
  },
  featuredCardMedium: {
    height: 180,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  // Grok-style Input Bar
  grokInputContainer: {
    position: 'absolute',
    bottom: 100,
    left: 12,
    right: 12,
  },
  grokInputBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 28,
    overflow: 'hidden',
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 8,
    backgroundColor: 'rgba(60, 60, 70, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  grokProfileThumb: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  grokProfileImage: {
    width: '100%',
    height: '100%',
  },
  grokAttachButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  grokInputField: {
    flex: 1,
    minHeight: 40,
    justifyContent: 'center',
  },
  grokInput: {
    fontSize: 16,
    paddingVertical: 8,
  },
  grokSpeakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  grokSpeakButtonActive: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  grokSpeakText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
});
