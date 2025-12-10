import React, { useCallback, useState, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  success as hapticSuccess,
  button as hapticButton,
  error as hapticError,
  medium as hapticMedium,
} from '@/lib/haptics';
import { MotiView } from 'moti';
import { usePlannerStore, Plan } from '@/stores/plannerStore';
import { Colors } from '@/constants/Theme';
import { useTheme } from '@/contexts/ThemeContext';
import { sendMessageToAI } from '@/components/chat/ChatHelpers';

// Motivational quotes with images
const MOTIVATIONAL_CONTENT = [
  {
    quote: "The process shapes the person. Focus on who you're becoming.",
    image: 'https://images.unsplash.com/photo-1504805572947-34fad45aed93?w=800',
  },
  {
    quote: 'Small steps lead to big changes. Keep moving forward.',
    image: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800',
  },
  {
    quote: 'Your future self will thank you for the work you put in today.',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
  },
  {
    quote:
      'Discipline is choosing between what you want now and what you want most.',
    image: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800',
  },
];

// Research AI success stories (would come from API in production)
const SUCCESS_STORIES = [
  {
    title: 'Lost 50lbs in 8 months',
    context: 'Similar starting point, consistent routine',
    source: 'r/loseit',
    avatar: '💪',
  },
  {
    title: 'Paid off $30k debt in 2 years',
    context: 'Using the snowball method with automation',
    source: 'r/personalfinance',
    avatar: '💰',
  },
  {
    title: 'Learned to code in 6 months',
    context: 'Started from zero, now employed as dev',
    source: 'r/learnprogramming',
    avatar: '💻',
  },
];

// Days of week
const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function PlannerTab() {
  const { colors, isDark, getGradientArray } = useTheme();
  const { plans, addPlan } = usePlannerStore();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDescription, setNewGoalDescription] = useState('');
  const [viewMode, setViewMode] = useState<'overview' | 'timeline'>('overview');
  const [showAIPlanModal, setShowAIPlanModal] = useState(false);
  const [aiPlanRequest, setAiPlanRequest] = useState('');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  // Get random motivational content
  const [motivation] = useState(
    MOTIVATIONAL_CONTENT[
      Math.floor(Math.random() * MOTIVATIONAL_CONTENT.length)
    ]
  );

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  // Calculate goal synergies
  const getGoalSynergies = useCallback(
    (plan: Plan) => {
      const synergies: { goal: Plan; connection: string }[] = [];

      plans.forEach((otherPlan) => {
        if (otherPlan.id === plan.id) return;

        // Simple synergy detection based on keywords
        const healthKeywords = [
          'health',
          'fitness',
          'gym',
          'workout',
          'diet',
          'weight',
        ];
        const financeKeywords = [
          'finance',
          'money',
          'invest',
          'save',
          'budget',
          'debt',
        ];
        const productivityKeywords = [
          'productivity',
          'work',
          'career',
          'study',
          'learn',
        ];

        const planTitle = plan.title.toLowerCase();
        const otherTitle = otherPlan.title.toLowerCase();

        const planIsHealth = healthKeywords.some((k) => planTitle.includes(k));
        const otherIsFinance = financeKeywords.some((k) =>
          otherTitle.includes(k)
        );
        const planIsProd = productivityKeywords.some((k) =>
          planTitle.includes(k)
        );
        const otherIsProd = productivityKeywords.some((k) =>
          otherTitle.includes(k)
        );

        if (planIsHealth && otherIsProd) {
          synergies.push({
            goal: otherPlan,
            connection: 'Energy → Productivity',
          });
        } else if (planIsHealth && otherIsFinance) {
          synergies.push({
            goal: otherPlan,
            connection: 'Discipline → Savings',
          });
        } else if (planIsProd && otherIsFinance) {
          synergies.push({ goal: otherPlan, connection: 'Career → Income' });
        }
      });

      return synergies.slice(0, 2);
    },
    [plans]
  );

  // Get week progress
  const getWeekProgress = useCallback((plan: Plan) => {
    // Simulated week progress (would come from actual tracking in production)
    const progress = WEEK_DAYS.map((_, index) => {
      if (index < new Date().getDay()) {
        return Math.random() > 0.3; // 70% completion rate simulation
      }
      return null; // Future days
    });
    return progress;
  }, []);

  // Get relevant success story
  const handleCreateGoal = () => {
    if (!newGoalTitle.trim()) return;

    addPlan({
      title: newGoalTitle,
      description: newGoalDescription || 'New goal started today',
      progress: 0,
      nextTask: 'Define first milestone',
      dueDate: 'This Week',
      motivationQuote: motivation.quote,
      milestones: [],
    });

    setNewGoalTitle('');
    setNewGoalDescription('');
    setShowCreateModal(false);
    hapticSuccess();
  };

  const handleAIPlanGeneration = async () => {
    if (!aiPlanRequest.trim()) return;

    setIsGeneratingPlan(true);
    hapticButton();

    try {
      const systemPrompt = `You are a goal planning assistant. When a user asks you to create a plan, respond with a structured plan in this JSON format:
{
  "title": "Goal title",
  "description": "Why this goal matters",
  "milestones": [
    {"title": "Milestone 1", "description": "What to do", "dueDate": "Week 1"},
    {"title": "Milestone 2", "description": "What to do", "dueDate": "Week 2"}
  ],
  "nextTask": "First actionable step",
  "dueDate": "Timeline estimate"
}

Only respond with valid JSON, no other text.`;

      const response = await sendMessageToAI(
        `Create a detailed plan for: ${aiPlanRequest}`,
        { systemPrompt }
      );

      // Try to parse JSON from response
      let planData;
      try {
        // Extract JSON from response text (might be wrapped in markdown code blocks)
        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          planData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch {
        // If parsing fails, create a plan from the text response
        planData = {
          title: aiPlanRequest,
          description: response.text.substring(0, 200),
          milestones: [],
          nextTask: 'Get started with the first step',
          dueDate: 'This Month',
        };
      }

      addPlan({
        title: planData.title || aiPlanRequest,
        description: planData.description || 'AI-generated plan',
        progress: 0,
        nextTask: planData.nextTask || 'Start working on your goal',
        dueDate: planData.dueDate || 'This Month',
        motivationQuote: motivation.quote,
        milestones: planData.milestones || [],
      });

      setAiPlanRequest('');
      setShowAIPlanModal(false);
      hapticSuccess();
    } catch (error) {
      console.error('AI plan generation error:', error);
      hapticError();
      // Still create a basic plan
      addPlan({
        title: aiPlanRequest,
        description: 'AI-generated plan',
        progress: 0,
        nextTask: 'Get started',
        dueDate: 'This Month',
        motivationQuote: motivation.quote,
        milestones: [],
      });
      setAiPlanRequest('');
      setShowAIPlanModal(false);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handlePlanPress = useCallback(
    (id: string) => {
      hapticButton();
      setSelectedPlanId(id);
    },
    [setSelectedPlanId]
  );

  const handleBack = useCallback(() => {
    hapticButton();
    setSelectedPlanId(null);
  }, [setSelectedPlanId]);

  // Render Goal Synergy Map
  const renderSynergyMap = () => {
    if (plans.length < 2) return null;

    return (
      <View style={styles.synergySection}>
        <Text
          style={[
            styles.sectionTitle,
            { color: isDark ? 'rgba(255,255,255,0.8)' : colors.textSecondary },
          ]}
        >
          Goal Synergy
        </Text>
        <View
          style={[
            styles.synergyMap,
            { backgroundColor: colors.glassBackground },
          ]}
        >
          {plans.slice(0, 3).map((plan, index) => (
            <View key={plan.id} style={styles.synergyNode}>
              <View
                style={[
                  styles.synergyCircle,
                  {
                    backgroundColor:
                      index === 0 ? Colors.primary[500] : Colors.gray[700],
                  },
                ]}
              >
                <Ionicons
                  name={
                    plan.title.toLowerCase().includes('health')
                      ? 'fitness'
                      : plan.title.toLowerCase().includes('finance')
                      ? 'wallet'
                      : 'rocket'
                  }
                  size={20}
                  color="white"
                />
              </View>
              <Text style={styles.synergyLabel} numberOfLines={1}>
                {plan.title.slice(0, 12)}
              </Text>
              {index < plans.slice(0, 3).length - 1 && (
                <View style={styles.synergyConnector}>
                  <Ionicons
                    name="arrow-forward"
                    size={16}
                    color={Colors.gray[600]}
                  />
                </View>
              )}
            </View>
          ))}
        </View>
        <Text style={styles.synergyHint}>
          Your goals are connected. Progress in one fuels progress in others.
        </Text>
      </View>
    );
  };

  // Render This Week Focus
  const renderWeekFocus = () => {
    const thisWeekTasks = plans
      .filter((p) => p.nextTask)
      .slice(0, 3)
      .map((p) => ({
        goal: p.title,
        task: p.nextTask,
        icon: p.title.toLowerCase().includes('health')
          ? 'fitness'
          : p.title.toLowerCase().includes('finance')
          ? 'wallet'
          : 'checkbox',
      }));

    if (thisWeekTasks.length === 0) return null;

    return (
      <View style={styles.weekFocusSection}>
        <Text
          style={[
            styles.sectionTitle,
            { color: isDark ? 'rgba(255,255,255,0.8)' : colors.textSecondary },
          ]}
        >
          This Week&apos;s Focus
        </Text>
        {thisWeekTasks.map((task, index) => (
          <View
            key={index}
            style={[
              styles.weekFocusItem,
              { backgroundColor: isDark ? colors.surface : 'white' },
            ]}
          >
            <View
              style={[
                styles.weekFocusIcon,
                { backgroundColor: `${colors.primary}15` },
              ]}
            >
              <Ionicons
                name={task.icon as any}
                size={18}
                color={colors.primary}
              />
            </View>
            <View style={styles.weekFocusContent}>
              <Text style={[styles.weekFocusGoal, { color: colors.textMuted }]}>
                {task.goal}
              </Text>
              <Text style={[styles.weekFocusTask, { color: colors.text }]}>
                {task.task}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  // Render Goal Card
  const renderGoalCard = useCallback(
    (plan: Plan, index: number) => {
      const weekProgress = getWeekProgress(plan);
      const synergies = getGoalSynergies(plan);

      return (
        <MotiView
          key={plan.id}
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 300, delay: index * 100 }}
        >
          <Pressable
            style={[
              styles.planCard,
              {
                backgroundColor: isDark ? colors.surface : 'white',
                borderColor: isDark ? colors.border : 'transparent',
                borderWidth: isDark ? 1 : 0,
              },
            ]}
            onPress={() => handlePlanPress(plan.id)}
          >
            <View style={styles.planHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.planTitle, { color: colors.text }]}>
                  {plan.title}
                </Text>
                <Text
                  style={[styles.planDescription, { color: colors.textMuted }]}
                >
                  {plan.description}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textMuted}
              />
            </View>

            {/* Progress */}
            <View style={styles.progressContainer}>
              <View style={styles.progressLabelRow}>
                <Text
                  style={[styles.progressLabel, { color: colors.textMuted }]}
                >
                  Progress
                </Text>
                <Text style={[styles.progressValue, { color: colors.text }]}>
                  {plan.progress}%
                </Text>
              </View>
              <View
                style={[
                  styles.progressBarBg,
                  {
                    backgroundColor: isDark
                      ? colors.glassBackground
                      : '#f3f4f6',
                  },
                ]}
              >
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${plan.progress}%`,
                      backgroundColor: colors.success,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Week Timeline */}
            <View style={styles.weekTimeline}>
              {WEEK_DAYS.map((day, dayIndex) => (
                <View key={day} style={styles.dayColumn}>
                  <Text style={[styles.dayLabel, { color: colors.textMuted }]}>
                    {day}
                  </Text>
                  <View
                    style={[
                      styles.dayDot,
                      weekProgress[dayIndex] === true
                        ? styles.dayCompleted
                        : weekProgress[dayIndex] === false
                        ? styles.dayMissed
                        : [
                            styles.dayFuture,
                            {
                              backgroundColor: isDark
                                ? colors.glassBackground
                                : '#e5e7eb',
                            },
                          ],
                    ]}
                  >
                    {weekProgress[dayIndex] === true && (
                      <Ionicons name="checkmark" size={10} color="white" />
                    )}
                  </View>
                </View>
              ))}
            </View>

            {/* Synergies */}
            {synergies.length > 0 && (
              <View style={styles.synergiesRow}>
                {synergies.map((synergy, sIndex) => (
                  <View
                    key={sIndex}
                    style={[
                      styles.synergyBadge,
                      { backgroundColor: `${colors.primary}15` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.synergyBadgeText,
                        { color: colors.primary },
                      ]}
                    >
                      {synergy.connection}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Next Task */}
            <View
              style={[
                styles.nextTaskContainer,
                { backgroundColor: isDark ? `${colors.success}15` : '#f0fdf4' },
              ]}
            >
              <Ionicons
                name="time-outline"
                size={16}
                color={colors.success}
                style={{ marginTop: 2 }}
              />
              <View style={{ marginLeft: 8, flex: 1 }}>
                <Text
                  style={[
                    styles.nextTaskLabel,
                    { color: isDark ? colors.success : '#166534' },
                  ]}
                >
                  Next up
                </Text>
                <Text style={[styles.nextTaskTitle, { color: colors.text }]}>
                  {plan.nextTask}
                </Text>
                <Text style={[styles.nextTaskDate, { color: colors.success }]}>
                  {plan.dueDate}
                </Text>
              </View>
            </View>
          </Pressable>
        </MotiView>
      );
    },
    [
      colors.border,
      colors.glassBackground,
      colors.primary,
      colors.success,
      colors.surface,
      colors.text,
      colors.textMuted,
      getGoalSynergies,
      getWeekProgress,
      handlePlanPress,
      isDark,
    ]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background */}
      <LinearGradient
        colors={getGradientArray('planner')}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Motivational Image */}
          <View style={styles.headerWrapper}>
            <Image
              source={{ uri: motivation.image }}
              style={styles.headerImage}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.headerOverlay}
            />
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Your Journey</Text>
              <Text style={styles.headerQuote}>
                &quot;{motivation.quote}&quot;
              </Text>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: isDark ? colors.surface : 'white',
                  borderColor: isDark ? colors.border : 'transparent',
                  borderWidth: isDark ? 1 : 0,
                },
              ]}
            >
              <Ionicons
                name="flag"
                size={24}
                color={colors.success}
                style={{ marginBottom: 4 }}
              />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {plans.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                Active Goals
              </Text>
            </View>
            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: isDark ? colors.surface : 'white',
                  borderColor: isDark ? colors.border : 'transparent',
                  borderWidth: isDark ? 1 : 0,
                },
              ]}
            >
              <Ionicons
                name="trending-up"
                size={24}
                color="#2563eb"
                style={{ marginBottom: 4 }}
              />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {Math.round(
                  plans.reduce((acc, p) => acc + p.progress, 0) /
                    (plans.length || 1)
                )}
                %
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                Avg Progress
              </Text>
            </View>
            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: isDark ? colors.surface : 'white',
                  borderColor: isDark ? colors.border : 'transparent',
                  borderWidth: isDark ? 1 : 0,
                },
              ]}
            >
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={colors.primary}
                style={{ marginBottom: 4 }}
              />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {plans.reduce(
                  (acc, p) =>
                    acc +
                    (p.milestones?.filter((m) => m.status === 'completed')
                      .length || 0),
                  0
                )}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                Milestones
              </Text>
            </View>
          </View>

          {/* Goal Synergy Map */}
          {renderSynergyMap()}

          {/* This Week&apos;s Focus */}
          {renderWeekFocus()}

          {/* View Toggle */}
          <View
            style={[
              styles.viewToggle,
              { backgroundColor: colors.glassBackground },
            ]}
          >
            <Pressable
              style={[
                styles.viewButton,
                viewMode === 'overview' && [
                  styles.viewButtonActive,
                  { backgroundColor: colors.primary },
                ],
              ]}
              onPress={() => {
                setViewMode('overview');
                hapticButton();
              }}
            >
              <Ionicons
                name="grid"
                size={16}
                color={viewMode === 'overview' ? 'white' : colors.textMuted}
              />
              <Text
                style={[
                  styles.viewButtonText,
                  { color: colors.textMuted },
                  viewMode === 'overview' && styles.viewButtonTextActive,
                ]}
              >
                Overview
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.viewButton,
                viewMode === 'timeline' && [
                  styles.viewButtonActive,
                  { backgroundColor: colors.primary },
                ],
              ]}
              onPress={() => {
                setViewMode('timeline');
                hapticButton();
              }}
            >
              <Ionicons
                name="calendar"
                size={16}
                color={viewMode === 'timeline' ? 'white' : colors.textMuted}
              />
              <Text
                style={[
                  styles.viewButtonText,
                  { color: colors.textMuted },
                  viewMode === 'timeline' && styles.viewButtonTextActive,
                ]}
              >
                Timeline
              </Text>
            </Pressable>
          </View>

          {/* Goals List */}
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: isDark
                    ? 'rgba(255,255,255,0.8)'
                    : colors.textSecondary,
                },
              ]}
            >
              Your Goals
            </Text>
            {plans.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="flag-outline"
                  size={48}
                  color={colors.textMuted}
                />
                <Text
                  style={[styles.emptyStateText, { color: colors.textMuted }]}
                >
                  No goals yet
                </Text>
                <Text
                  style={[
                    styles.emptyStateSubtext,
                    { color: colors.textMuted },
                  ]}
                >
                  Create your first goal to start your journey
                </Text>
              </View>
            ) : (
              plans.map((plan, index) => renderGoalCard(plan, index))
            )}
          </View>

          {/* Add Buttons */}
          <View style={styles.addButtonsContainer}>
            <Pressable
              style={[styles.addButton, styles.addButtonSecondary]}
              onPress={() => {
                hapticButton();
                setShowAIPlanModal(true);
              }}
            >
              <BlurView
                intensity={isDark ? 40 : 20}
                tint={isDark ? 'dark' : 'light'}
                style={styles.addButtonBlur}
              >
                <Ionicons
                  name="sparkles"
                  size={20}
                  color={colors.primary}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={[
                    styles.addButtonTextSecondary,
                    { color: colors.primary },
                  ]}
                >
                  AI Plan
                </Text>
              </BlurView>
            </Pressable>
            <Pressable
              style={styles.addButton}
              onPress={() => {
                hapticButton();
                setShowCreateModal(true);
              }}
            >
              <LinearGradient
                colors={['#16a34a', '#0d9488']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addButtonGradient}
              >
                <Ionicons
                  name="add-circle"
                  size={20}
                  color="white"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.addButtonText}>Create Goal</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* AI Plan Modal */}
          <Modal
            visible={showAIPlanModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowAIPlanModal(false)}
          >
            <View style={styles.modalOverlay}>
              <BlurView
                intensity={isDark ? 40 : 20}
                tint={isDark ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
              />
              <View
                style={[
                  styles.modalContent,
                  { backgroundColor: isDark ? colors.surface : 'white' },
                ]}
              >
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  AI-Powered Planning
                </Text>
                <Text
                  style={[styles.modalSubtitle, { color: colors.textMuted }]}
                >
                  Describe your goal and I&apos;ll create a structured plan for
                  you
                </Text>

                <TextInput
                  style={[
                    styles.modalInput,
                    styles.modalTextarea,
                    {
                      backgroundColor: isDark
                        ? colors.glassBackground
                        : '#f3f4f6',
                      color: colors.text,
                    },
                  ]}
                  placeholder="e.g., Lose 20 pounds, Learn Spanish, Start a business"
                  placeholderTextColor={colors.textMuted}
                  value={aiPlanRequest}
                  onChangeText={setAiPlanRequest}
                  autoFocus
                  multiline
                  numberOfLines={4}
                />

                <View style={styles.modalButtons}>
                  <Pressable
                    style={styles.modalButtonCancel}
                    onPress={() => {
                      hapticButton();
                      setShowAIPlanModal(false);
                      setAiPlanRequest('');
                    }}
                  >
                    <Text
                      style={[
                        styles.modalButtonTextCancel,
                        { color: colors.textMuted },
                      ]}
                    >
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.modalButtonSave,
                      { backgroundColor: colors.primary },
                      isGeneratingPlan && styles.modalButtonDisabled,
                    ]}
                    onPress={handleAIPlanGeneration}
                    disabled={isGeneratingPlan || !aiPlanRequest.trim()}
                  >
                    {isGeneratingPlan ? (
                      <Text style={styles.modalButtonTextSave}>
                        Generating...
                      </Text>
                    ) : (
                      <Text style={styles.modalButtonTextSave}>
                        Generate Plan
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>

          {/* Create Goal Modal */}
          <Modal
            visible={showCreateModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowCreateModal(false)}
          >
            <View style={styles.modalOverlay}>
              <BlurView
                intensity={isDark ? 40 : 20}
                tint={isDark ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
              />
              <View
                style={[
                  styles.modalContent,
                  { backgroundColor: isDark ? colors.surface : 'white' },
                ]}
              >
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  New Goal
                </Text>
                <Text
                  style={[styles.modalSubtitle, { color: colors.textMuted }]}
                >
                  What do you want to achieve?
                </Text>

                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: isDark
                        ? colors.glassBackground
                        : '#f3f4f6',
                      color: colors.text,
                    },
                  ]}
                  placeholder="Goal title (e.g., Get fit, Save money)"
                  placeholderTextColor={colors.textMuted}
                  value={newGoalTitle}
                  onChangeText={setNewGoalTitle}
                  autoFocus
                />

                <TextInput
                  style={[
                    styles.modalInput,
                    styles.modalTextarea,
                    {
                      backgroundColor: isDark
                        ? colors.glassBackground
                        : '#f3f4f6',
                      color: colors.text,
                    },
                  ]}
                  placeholder="Why is this important to you?"
                  placeholderTextColor={colors.textMuted}
                  value={newGoalDescription}
                  onChangeText={setNewGoalDescription}
                  multiline
                  numberOfLines={3}
                />

                <View style={styles.modalButtons}>
                  <Pressable
                    style={styles.modalButtonCancel}
                    onPress={() => {
                      hapticButton();
                      setShowCreateModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalButtonTextCancel,
                        { color: colors.textMuted },
                      ]}
                    >
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.modalButtonSave,
                      { backgroundColor: colors.success },
                    ]}
                    onPress={handleCreateGoal}
                  >
                    <Text style={styles.modalButtonTextSave}>
                      Start Journey
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>

          {/* Plan Detail Modal */}
          <Modal
            visible={!!selectedPlan}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleBack}
          >
            {selectedPlan && (
              <PlanDetailView plan={selectedPlan} onBack={handleBack} />
            )}
          </Modal>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// Plan Detail View Component
const PlanDetailView = memo(
  ({ plan, onBack }: { plan: Plan; onBack: () => void }) => {
    const { updateProgress, completeMilestone, startMilestone } =
      usePlannerStore();
    const [localProgress, setLocalProgress] = useState(plan.progress);
    const [showProgressInput, setShowProgressInput] = useState(false);
    const successStory =
      SUCCESS_STORIES[Math.floor(Math.random() * SUCCESS_STORIES.length)];

    const handleProgressUpdate = (newProgress: number) => {
      hapticMedium();
      setLocalProgress(newProgress);
      updateProgress(plan.id, newProgress);
    };

    const handleQuickProgress = (increment: number) => {
      const newProgress = Math.max(0, Math.min(100, localProgress + increment));
      handleProgressUpdate(newProgress);
    };

    return (
      <View style={styles.detailContainer}>
        {/* Header with Image */}
        <View style={styles.detailHeaderWrapper}>
          <Image
            source={{
              uri: MOTIVATIONAL_CONTENT[
                Math.floor(Math.random() * MOTIVATIONAL_CONTENT.length)
              ].image,
            }}
            style={styles.detailHeaderImage}
          />
          <LinearGradient
            colors={['transparent', 'rgba(22, 163, 74, 0.9)']}
            style={styles.detailHeaderOverlay}
          />
          <SafeAreaView edges={['top']} style={styles.detailHeaderContent}>
            <Pressable onPress={onBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
              <Text style={styles.backButtonText}>Back</Text>
            </Pressable>

            <View style={styles.detailTitleSection}>
              <Text style={styles.detailTitle}>{plan.title}</Text>
              <Text style={styles.detailDescription}>{plan.description}</Text>

              <View style={styles.detailProgressCard}>
                <View style={styles.progressLabelRow}>
                  <Text style={styles.detailProgressLabel}>
                    Overall Progress
                  </Text>
                  <Text style={styles.detailProgressValue}>
                    {localProgress}%
                  </Text>
                </View>
                <View style={styles.detailProgressBarBg}>
                  <View
                    style={[
                      styles.detailProgressBarFill,
                      { width: `${localProgress}%` },
                    ]}
                  />
                </View>
                {/* Quick Progress Update Buttons */}
                <View style={styles.quickProgressRow}>
                  <Pressable
                    style={[
                      styles.quickProgressButton,
                      { backgroundColor: 'rgba(255,255,255,0.2)' },
                    ]}
                    onPress={() => handleQuickProgress(-10)}
                  >
                    <Ionicons name="remove" size={16} color="white" />
                    <Text style={styles.quickProgressText}>-10%</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.quickProgressButton,
                      { backgroundColor: 'rgba(255,255,255,0.2)' },
                    ]}
                    onPress={() => handleQuickProgress(-5)}
                  >
                    <Ionicons name="remove" size={14} color="white" />
                    <Text style={styles.quickProgressText}>-5%</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.quickProgressButton,
                      { backgroundColor: 'rgba(34, 197, 94, 0.3)' },
                    ]}
                    onPress={() => setShowProgressInput(!showProgressInput)}
                  >
                    <Ionicons name="create-outline" size={16} color="white" />
                    <Text style={styles.quickProgressText}>Set</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.quickProgressButton,
                      { backgroundColor: 'rgba(34, 197, 94, 0.3)' },
                    ]}
                    onPress={() => handleQuickProgress(5)}
                  >
                    <Ionicons name="add" size={14} color="white" />
                    <Text style={styles.quickProgressText}>+5%</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.quickProgressButton,
                      { backgroundColor: 'rgba(34, 197, 94, 0.3)' },
                    ]}
                    onPress={() => handleQuickProgress(10)}
                  >
                    <Ionicons name="add" size={16} color="white" />
                    <Text style={styles.quickProgressText}>+10%</Text>
                  </Pressable>
                </View>
                {showProgressInput && (
                  <View style={styles.progressInputContainer}>
                    <TextInput
                      style={[
                        styles.progressInput,
                        {
                          color: 'white',
                          borderColor: 'rgba(255,255,255,0.3)',
                        },
                      ]}
                      value={localProgress.toString()}
                      onChangeText={(text) => {
                        const num = parseInt(text) || 0;
                        const clamped = Math.max(0, Math.min(100, num));
                        setLocalProgress(clamped);
                      }}
                      keyboardType="number-pad"
                      maxLength={3}
                      placeholder="0-100"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                    />
                    <Pressable
                      style={[
                        styles.progressSaveButton,
                        { backgroundColor: '#22c55e' },
                      ]}
                      onPress={() => {
                        handleProgressUpdate(localProgress);
                        setShowProgressInput(false);
                      }}
                    >
                      <Text style={styles.progressSaveText}>Save</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          </SafeAreaView>
        </View>

        <ScrollView contentContainerStyle={styles.detailScrollContent}>
          {/* Motivation Card */}
          <LinearGradient
            colors={['#f97316', '#ec4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.motivationCard}
          >
            <Ionicons
              name="heart"
              size={20}
              color="white"
              style={{ marginRight: 12 }}
            />
            <Text style={styles.motivationText}>
              &quot;
              {plan.motivationQuote ||
                'Every journey begins with a single step.'}
              &quot;
            </Text>
          </LinearGradient>

          {/* Week Timeline */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color="#16a34a"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.cardTitle}>This Week</Text>
            </View>
            <View style={styles.weekTimelineLarge}>
              {WEEK_DAYS.map((day, index) => {
                const isComplete = index < 3; // Simulation
                const isToday = index === new Date().getDay() - 1;
                return (
                  <View key={day} style={styles.dayColumnLarge}>
                    <Text
                      style={[
                        styles.dayLabelLarge,
                        isToday && styles.dayLabelToday,
                      ]}
                    >
                      {day}
                    </Text>
                    <View
                      style={[
                        styles.dayDotLarge,
                        isComplete
                          ? styles.dayCompletedLarge
                          : isToday
                          ? styles.dayTodayLarge
                          : styles.dayFutureLarge,
                      ]}
                    >
                      {isComplete && (
                        <Ionicons name="checkmark" size={16} color="white" />
                      )}
                      {isToday && !isComplete && (
                        <View style={styles.todayInner} />
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Next Task */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons
                name="time-outline"
                size={20}
                color="#16a34a"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.cardTitle}>What&apos;s Next</Text>
            </View>
            <Text style={styles.cardBodyText}>{plan.nextTask}</Text>
            <View style={styles.dateBadge}>
              <Ionicons
                name="calendar-outline"
                size={14}
                color="#374151"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.dateBadgeText}>{plan.dueDate}</Text>
            </View>
          </View>

          {/* Research AI - Success Stories */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons
                name="bulb"
                size={20}
                color="#f59e0b"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.cardTitle}>People Like You Succeeded</Text>
            </View>
            <View style={styles.successStoryCard}>
              <Text style={styles.successAvatar}>{successStory.avatar}</Text>
              <View style={styles.successContent}>
                <Text style={styles.successTitle}>{successStory.title}</Text>
                <Text style={styles.successContext}>
                  {successStory.context}
                </Text>
                <Text style={styles.successSource}>
                  From {successStory.source}
                </Text>
              </View>
            </View>
          </View>

          {/* Milestones */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Milestones</Text>
            </View>
            {plan.milestones && plan.milestones.length > 0 ? (
              <View style={styles.milestonesList}>
                {plan.milestones.map((m, i) => (
                  <View key={m.id} style={styles.milestoneItem}>
                    <View style={styles.milestoneIcon}>
                      {m.status === 'completed' ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color="#22c55e"
                        />
                      ) : m.status === 'in-progress' ? (
                        <Ionicons name="time" size={24} color="#3b82f6" />
                      ) : (
                        <Ionicons
                          name="ellipse-outline"
                          size={24}
                          color="#d1d5db"
                        />
                      )}
                    </View>
                    <View style={styles.milestoneContent}>
                      <Pressable
                        style={{ flex: 1 }}
                        onPress={() => {
                          hapticButton();
                          if (m.status === 'upcoming') {
                            startMilestone(plan.id, m.id);
                          } else if (m.status === 'in-progress') {
                            completeMilestone(plan.id, m.id);
                          }
                        }}
                      >
                        <Text
                          style={[
                            styles.milestoneTitle,
                            m.status === 'completed' &&
                              styles.milestoneTitleCompleted,
                          ]}
                        >
                          {m.title}
                        </Text>
                      </Pressable>
                      <View
                        style={[
                          styles.statusBadge,
                          m.status === 'completed'
                            ? styles.statusCompleted
                            : m.status === 'in-progress'
                            ? styles.statusInProgress
                            : styles.statusUpcoming,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            m.status === 'completed'
                              ? styles.statusTextCompleted
                              : m.status === 'in-progress'
                              ? styles.statusTextInProgress
                              : styles.statusTextUpcoming,
                          ]}
                        >
                          {m.status === 'completed'
                            ? 'Completed'
                            : m.status === 'in-progress'
                            ? 'In Progress'
                            : 'Upcoming'}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noMilestones}>
                No milestones yet. They will be auto-generated as you progress.
              </Text>
            )}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Header with Image
  headerWrapper: {
    height: 200,
    position: 'relative',
    marginBottom: 16,
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  headerContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerQuote: {
    fontSize: 14,
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 10,
    color: '#6b7280',
  },

  // Synergy Section
  synergySection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  synergyMap: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  synergyNode: {
    alignItems: 'center',
    position: 'relative',
  },
  synergyCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  synergyLabel: {
    color: 'white',
    fontSize: 11,
    fontWeight: '500',
    maxWidth: 80,
    textAlign: 'center',
  },
  synergyConnector: {
    position: 'absolute',
    right: -20,
    top: 14,
  },
  synergyHint: {
    color: Colors.gray[400],
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },

  // Week Focus
  weekFocusSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  weekFocusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  weekFocusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  weekFocusContent: {
    flex: 1,
  },
  weekFocusGoal: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  weekFocusTask: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },

  // View Toggle
  viewToggle: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 4,
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  viewButtonActive: {
    backgroundColor: Colors.primary[500],
  },
  viewButtonText: {
    color: Colors.gray[400],
    fontSize: 13,
    fontWeight: '500',
  },
  viewButtonTextActive: {
    color: 'white',
  },

  // Goals Section
  section: {
    paddingHorizontal: 16,
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 13,
    color: '#6b7280',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#16a34a',
    borderRadius: 4,
  },

  // Week Timeline
  weekTimeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 8,
  },
  dayColumn: {
    alignItems: 'center',
    flex: 1,
  },
  dayLabel: {
    fontSize: 10,
    color: '#9ca3af',
    marginBottom: 6,
  },
  dayDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCompleted: {
    backgroundColor: '#22c55e',
  },
  dayMissed: {
    backgroundColor: '#ef4444',
  },
  dayFuture: {
    backgroundColor: '#e5e7eb',
  },

  // Synergies Row
  synergiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  synergyBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  synergyBadgeText: {
    fontSize: 11,
    color: Colors.primary[600],
    fontWeight: '500',
  },

  // Next Task
  nextTaskContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
  },
  nextTaskLabel: {
    fontSize: 10,
    color: '#166534',
    fontWeight: '600',
    marginBottom: 2,
  },
  nextTaskTitle: {
    fontSize: 13,
    color: '#1f2937',
    marginBottom: 2,
  },
  nextTaskDate: {
    fontSize: 11,
    color: '#16a34a',
  },

  // Add Buttons
  addButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 12,
  },
  addButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  addButtonSecondary: {
    borderWidth: 1,
  },
  addButtonBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 25,
    height: '100%',
  },
  addButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    color: Colors.gray[500],
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
  },
  emptyStateSubtext: {
    color: Colors.gray[400],
    fontSize: 13,
    marginTop: 4,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#1f2937',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 12,
    color: '#1f2937',
  },
  modalTextarea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  modalButtonCancel: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalButtonTextCancel: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonSave: {
    backgroundColor: '#16a34a',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  modalButtonTextSave: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Detail View
  detailContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  detailHeaderWrapper: {
    height: 280,
    position: 'relative',
  },
  detailHeaderImage: {
    width: '100%',
    height: '100%',
  },
  detailHeaderOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  detailHeaderContent: {
    ...StyleSheet.absoluteFillObject,
    padding: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 4,
  },
  detailTitleSection: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  detailTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 6,
  },
  detailDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 16,
  },
  detailProgressCard: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 14,
  },
  detailProgressLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
  },
  detailProgressValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailProgressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    marginTop: 8,
    overflow: 'hidden',
  },
  detailProgressBarFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 4,
  },
  detailScrollContent: {
    padding: 16,
  },
  motivationCard: {
    flexDirection: 'row',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  motivationText: {
    color: 'white',
    fontSize: 14,
    fontStyle: 'italic',
    flex: 1,
    lineHeight: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  cardBodyText: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 12,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dateBadgeText: {
    fontSize: 12,
    color: '#374151',
  },

  // Week Timeline Large
  weekTimelineLarge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayColumnLarge: {
    alignItems: 'center',
    flex: 1,
  },
  dayLabelLarge: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
  },
  dayLabelToday: {
    color: Colors.primary[500],
    fontWeight: '600',
  },
  dayDotLarge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCompletedLarge: {
    backgroundColor: '#22c55e',
  },
  dayTodayLarge: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 2,
    borderColor: Colors.primary[500],
  },
  dayFutureLarge: {
    backgroundColor: '#f3f4f6',
  },
  todayInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary[500],
  },

  // Success Story
  successStoryCard: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  successAvatar: {
    fontSize: 32,
    marginRight: 14,
  },
  successContent: {
    flex: 1,
  },
  successTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  successContext: {
    fontSize: 12,
    color: '#b45309',
    marginBottom: 4,
  },
  successSource: {
    fontSize: 11,
    color: '#d97706',
  },

  // Milestones
  milestonesList: {
    gap: 14,
  },
  milestoneItem: {
    flexDirection: 'row',
    gap: 12,
  },
  milestoneIcon: {
    marginTop: 2,
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  milestoneTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusCompleted: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  statusInProgress: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  statusUpcoming: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  statusTextCompleted: { color: '#15803d' },
  statusTextInProgress: { color: '#1d4ed8' },
  statusTextUpcoming: { color: '#4b5563' },
  noMilestones: {
    color: '#9ca3af',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  // Quick Progress Update Styles
  quickProgressRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    justifyContent: 'center',
  },
  quickProgressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  quickProgressText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  progressInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  progressInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  progressSaveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  progressSaveText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
});
