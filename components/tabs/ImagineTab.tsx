import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Dimensions,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Theme';
import * as Haptics from 'expo-haptics';
import { useUserStore } from '@/stores/userStore';

const { width } = Dimensions.get('window');

export default function ImagineTab() {
  const { user, updateCredits } = useUserStore();
  const [generationType, setGenerationType] = useState<'image' | 'video'>(
    'image'
  );
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const models = [
    { id: 'sora', name: 'Sora', type: 'video', isPro: true },
    { id: 'dalle', name: 'DALL-E 3', type: 'image', isPro: false },
    { id: 'midjourney', name: 'Midjourney', type: 'image', isPro: true },
    { id: 'runway', name: 'Runway', type: 'video', isPro: true },
    {
      id: 'stable-diffusion',
      name: 'Stable Diffusion',
      type: 'image',
      isPro: false,
    },
  ];

  const examplePrompts = [
    'Me surfing on a tropical beach at sunset',
    'Professional headshot in business attire',
    'Dancing at a concert with friends',
    'Cooking in a modern kitchen',
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (user.credits < 1) {
      setShowPaywall(true);
      return;
    }

    setIsGenerating(true);
    try {
      // Simulate generation delay
      await new Promise((resolve) => setTimeout(resolve, 2000));
      updateCredits(-1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPrompt(''); // Clear prompt on success
    } catch (error) {
      console.error(error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredModels = models.filter((m) => m.type === generationType);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerWrapper}>
            <BlurView intensity={20} tint="light" style={styles.headerBlur}>
              <LinearGradient
                colors={['rgba(141, 88, 180, 0.2)', 'rgba(218, 165, 32, 0.15)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerGradient}
              >
                <View style={styles.headerContent}>
                  <View>
                    <Text style={styles.historyTitle}>Recent Creations</Text>
                    <Text style={styles.historySubtitle}>
                      Your generated masterpieces will appear here.
                    </Text>
                  </View>
                  <Ionicons name="sparkles" size={28} color="white" />
                </View>
                <View style={styles.trialBadge}>
                  <View style={styles.badgeBlur}>
                    <Text style={styles.badgeText}>
                      {user.credits} Credits Left
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </BlurView>
          </View>

          {/* Type Selection Tabs */}
          <View style={styles.tabsContainer}>
            <Pressable
              style={[
                styles.tab,
                generationType === 'image' && styles.activeTab,
              ]}
              onPress={() => setGenerationType('image')}
            >
              <Ionicons
                name="image-outline"
                size={18}
                color={generationType === 'image' ? 'black' : 'white'}
              />
              <Text
                style={[
                  styles.tabText,
                  generationType === 'image' && styles.activeTabText,
                ]}
              >
                Image
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.tab,
                generationType === 'video' && styles.activeTab,
              ]}
              onPress={() => setGenerationType('video')}
            >
              <Ionicons
                name="videocam-outline"
                size={18}
                color={generationType === 'video' ? 'black' : 'white'}
              />
              <Text
                style={[
                  styles.tabText,
                  generationType === 'video' && styles.activeTabText,
                ]}
              >
                Video
              </Text>
            </Pressable>
          </View>

          {/* Model Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose AI Model</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.modelsScroll}
            >
              {filteredModels.map((model) => (
                <Pressable key={model.id} style={styles.modelBadge}>
                  <Text style={styles.modelText}>{model.name}</Text>
                  {model.isPro && (
                    <Ionicons
                      name="lock-closed"
                      size={10}
                      color="white"
                      style={{ marginLeft: 4 }}
                    />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Upload Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upload Reference Images</Text>
            <Pressable style={styles.uploadBox}>
              <Ionicons
                name="cloud-upload-outline"
                size={32}
                color={Colors.gray[400]}
              />
              <Text style={styles.uploadText}>
                Upload 1-3 images to help AI learn
              </Text>
              <Text style={styles.uploadSubtext}>PNG, JPG up to 10MB each</Text>
            </Pressable>
          </View>

          {/* Prompt Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Describe Your Vision</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder={`Describe what you want to create... e.g., "Me ${
                  generationType === 'video' ? 'dancing' : 'as a superhero'
                }"`}
                placeholderTextColor="rgba(255,255,255,0.5)"
                multiline
                value={prompt}
                onChangeText={setPrompt}
              />
            </View>
            <View style={styles.chipsContainer}>
              {examplePrompts.map((ex, i) => (
                <Pressable
                  key={i}
                  style={styles.chip}
                  onPress={() => setPrompt(ex)}
                >
                  <Text style={styles.chipText}>{ex}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Generate Button */}
          <Pressable
            style={[
              styles.generateButton,
              !prompt.trim() && !isGenerating && styles.disabledButton,
            ]}
            onPress={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
          >
            <LinearGradient
              colors={['#9333ea', '#db2777']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.generateGradient}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons
                    name="sparkles"
                    size={20}
                    color="white"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.generateText}>
                    Generate {generationType === 'image' ? 'Image' : 'Video'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </Pressable>

          {/* Spacer for bottom nav */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Paywall Modal */}
      <Modal
        visible={showPaywall}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaywall(false)}
      >
        <View style={styles.modalContainer}>
          <BlurView
            intensity={50}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.paywallContent}>
            <Ionicons name="diamond" size={48} color="#db2777" />
            <Text style={styles.paywallTitle}>Upgrade to Pro</Text>
            <Text style={styles.paywallText}>
              You've run out of free credits. Upgrade to unlock unlimited
              generations and premium models.
            </Text>
            <Pressable
              style={styles.upgradeButton}
              onPress={() => setShowPaywall(false)}
            >
              <Text style={styles.upgradeButtonText}>Get Pro - $9.99/mo</Text>
            </Pressable>
            <Pressable
              style={styles.closeButton}
              onPress={() => setShowPaywall(false)}
            >
              <Text style={styles.closeButtonText}>Maybe Later</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#2d1b3d', // Removed to show gradient
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerWrapper: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerBlur: {
    width: '100%',
  },
  headerGradient: {
    padding: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e9d5ff', // purple-100
  },
  trialBadge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  badgeBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.3)',
    marginHorizontal: 16,
    marginTop: 20,
    padding: 4,
    borderRadius: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  activeTab: {
    backgroundColor: 'white',
  },
  tabText: {
    color: 'white',
    fontWeight: '600',
  },
  activeTabText: {
    color: 'black',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  modelsScroll: {
    gap: 8,
  },
  modelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  modelText: {
    color: 'white',
    fontSize: 13,
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  uploadText: {
    color: Colors.gray[300],
    fontSize: 14,
    marginTop: 8,
  },
  uploadSubtext: {
    color: Colors.gray[500],
    fontSize: 12,
    marginTop: 4,
  },
  inputContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    minHeight: 100,
  },
  input: {
    color: 'white',
    fontSize: 16,
    textAlignVertical: 'top',
    height: '100%',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  chipText: {
    color: Colors.gray[300],
    fontSize: 12,
  },
  generateButton: {
    marginHorizontal: 16,
    marginTop: 30,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#db2777',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: {
    opacity: 0.6,
  },
  generateGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paywallContent: {
    width: '80%',
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  paywallTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  paywallText: {
    color: Colors.gray[300],
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  upgradeButton: {
    backgroundColor: '#db2777',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    paddingVertical: 10,
  },
  closeButtonText: {
    color: Colors.gray[400],
    fontSize: 14,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  historySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 16,
  },
});
