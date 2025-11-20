import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { usePlannerStore } from '@/stores/plannerStore';

export const motivationalQuotes = [
  "Believe you can and you're halfway there.",
  'The only way to do great work is to love what you do.',
  "Don't watch the clock; do what it does. Keep going.",
];

export default function PlannerTab() {
  const { plans, addPlan } = usePlannerStore();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [todayQuote] = useState(
    motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
  );

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  const handleCreateGoal = () => {
    if (!newGoalTitle.trim()) return;

    addPlan({
      id: Date.now().toString(),
      title: newGoalTitle,
      description: 'New goal started today',
      progress: 0,
      nextTask: 'Define first milestone',
      dueDate: 'Next Week',
      motivationQuote: 'Every journey begins with a single step.',
      milestones: [],
    });

    setNewGoalTitle('');
    setShowCreateModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handlePlanPress = (id: string) => {
    Haptics.selectionAsync();
    setSelectedPlanId(id);
  };

  const handleBack = () => {
    Haptics.selectionAsync();
    setSelectedPlanId(null);
  };

  return (
    <View style={styles.container}>
      {/* Main Background Gradient */}
      <LinearGradient
        colors={['#1a2820', '#2f4a3d', '#f0f5e8']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerWrapper}>
            <BlurView intensity={20} tint="light" style={styles.headerBlur}>
              <LinearGradient
                colors={[
                  'rgba(80, 180, 120, 0.2)',
                  'rgba(235, 240, 220, 0.15)',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerGradient}
              >
                <View style={styles.headerTop}>
                  <View>
                    <Text style={styles.headerTitle}>Your Journey</Text>
                    {plans.length === 0 && (
                      <Text style={styles.emptyStateText}>
                        You haven&apos;t created any goals yet.
                      </Text>
                    )}
                  </View>
                  <Ionicons name="disc-outline" size={32} color="white" />
                </View>

                {/* Quote Card */}
                <View style={styles.quoteCard}>
                  <Ionicons
                    name="chatbox-ellipses-outline"
                    size={20}
                    color="#bbf7d0"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.quoteText}>&quot;{todayQuote}&quot;</Text>
                </View>
              </LinearGradient>
            </BlurView>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons
                name="disc-outline"
                size={24}
                color="#16a34a"
                style={{ marginBottom: 4 }}
              />
              <Text style={styles.statValue}>{plans.length}</Text>
              <Text style={styles.statLabel}>Active Goals</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons
                name="trending-up-outline"
                size={24}
                color="#2563eb"
                style={{ marginBottom: 4 }}
              />
              <Text style={styles.statValue}>
                {Math.round(
                  plans.reduce((acc, p) => acc + p.progress, 0) /
                    (plans.length || 1)
                )}
                %
              </Text>
              <Text style={styles.statLabel}>Avg Progress</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons
                name="checkmark-circle-outline"
                size={24}
                color="#9333ea"
                style={{ marginBottom: 4 }}
              />
              <Text style={styles.statValue}>
                {plans.reduce(
                  (acc, p) =>
                    acc +
                    p.milestones.filter((m) => m.status === 'completed').length,
                  0
                )}
              </Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
          </View>

          {/* Goals List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Goals</Text>
            {plans.map((plan) => (
              <Pressable
                key={plan.id}
                style={styles.planCard}
                onPress={() => handlePlanPress(plan.id)}
              >
                <View style={styles.planHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planTitle}>{plan.title}</Text>
                    <Text style={styles.planDescription}>
                      {plan.description}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </View>

                {/* Progress */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressLabelRow}>
                    <Text style={styles.progressLabel}>Progress</Text>
                    <Text style={styles.progressValue}>{plan.progress}%</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${plan.progress}%` },
                      ]}
                    />
                  </View>
                </View>

                {/* Next Task */}
                <View style={styles.nextTaskContainer}>
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color="#16a34a"
                    style={{ marginTop: 2 }}
                  />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.nextTaskLabel}>Next up</Text>
                    <Text style={styles.nextTaskTitle}>{plan.nextTask}</Text>
                    <Text style={styles.nextTaskDate}>{plan.dueDate}</Text>
                  </View>
                </View>

                {/* Milestones Dots */}
                <View style={styles.milestonesDots}>
                  {plan.milestones.map((m) => (
                    <View
                      key={m.id}
                      style={[
                        styles.dot,
                        m.status === 'completed'
                          ? styles.dotCompleted
                          : m.status === 'in-progress'
                          ? styles.dotInProgress
                          : styles.dotUpcoming,
                      ]}
                    />
                  ))}
                </View>
              </Pressable>
            ))}
          </View>

          {/* Add Button */}
          <Pressable
            style={styles.addButton}
            onPress={() => setShowCreateModal(true)}
          >
            <LinearGradient
              colors={['#16a34a', '#0d9488']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addButtonGradient}
            >
              <Ionicons
                name="sparkles"
                size={20}
                color="white"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.addButtonText}>Create New Goal</Text>
            </LinearGradient>
          </Pressable>

          {/* Create Goal Modal */}
          <Modal
            visible={showCreateModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowCreateModal(false)}
          >
            <View style={styles.modalOverlay}>
              <BlurView intensity={20} style={StyleSheet.absoluteFill} />
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>New Goal</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="What do you want to achieve?"
                  placeholderTextColor="#9ca3af"
                  value={newGoalTitle}
                  onChangeText={setNewGoalTitle}
                  autoFocus
                />
                <View style={styles.modalButtons}>
                  <Pressable
                    style={styles.modalButtonCancel}
                    onPress={() => setShowCreateModal(false)}
                  >
                    <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={styles.modalButtonSave}
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

          {/* Spacer for bottom nav */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function PlanDetailView({ plan, onBack }: { plan: any; onBack: () => void }) {
  return (
    <View style={styles.detailContainer}>
      {/* Header */}
      <LinearGradient
        colors={['#16a34a', '#0d9488']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.detailHeader}
      >
        <SafeAreaView edges={['top']}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>

          <View style={styles.detailHeaderContent}>
            <Text style={styles.detailTitle}>{plan.title}</Text>
            <Text style={styles.detailDescription}>{plan.description}</Text>

            <View style={styles.detailProgressCard}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.detailProgressLabel}>Overall Progress</Text>
                <Text style={styles.detailProgressValue}>{plan.progress}%</Text>
              </View>
              <View style={styles.detailProgressBarBg}>
                <View
                  style={[
                    styles.detailProgressBarFill,
                    { width: `${plan.progress}%` },
                  ]}
                />
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.detailScrollContent}>
        {/* Motivation Card */}
        <LinearGradient
          colors={['#f97316', '#ec4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.motivationCard}
        >
          <Ionicons
            name="chatbox-ellipses"
            size={20}
            color="white"
            style={{ marginRight: 12 }}
          />
          <Text style={styles.motivationText}>
            &quot;{plan.motivationQuote}&quot;
          </Text>
        </LinearGradient>

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

        {/* Milestones */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Milestones</Text>
          </View>
          <View style={styles.milestonesList}>
            {plan.milestones.map((m: any, i: number) => (
              <View key={m.id} style={styles.milestoneItem}>
                <View style={styles.milestoneIcon}>
                  {m.status === 'completed' ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#22c55e"
                    />
                  ) : m.status === 'in-progress' ? (
                    <Ionicons
                      name="ellipse-outline"
                      size={24}
                      color="#3b82f6"
                    />
                  ) : (
                    <Ionicons
                      name="ellipse-outline"
                      size={24}
                      color="#d1d5db"
                    />
                  )}
                </View>
                <View style={styles.milestoneContent}>
                  <Text
                    style={[
                      styles.milestoneTitle,
                      m.status === 'completed' &&
                        styles.milestoneTitleCompleted,
                    ]}
                  >
                    {m.title}
                  </Text>
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
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#1a2820', // Removed to show gradient
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
  headerTop: {
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
    color: '#dcfce7', // green-100
  },
  quoteCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  quoteText: {
    color: 'white',
    fontSize: 14,
    fontStyle: 'italic',
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 16,
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
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
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
  nextTaskContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
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
  milestonesDots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  dotCompleted: {
    backgroundColor: '#22c55e',
  },
  dotInProgress: {
    backgroundColor: '#3b82f6',
  },
  dotUpcoming: {
    backgroundColor: '#e5e7eb',
  },
  addButton: {
    marginHorizontal: 16,
    marginTop: 12,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
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

  // Detail View Styles
  detailContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  detailHeader: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 4,
  },
  detailHeaderContent: {
    paddingBottom: 10,
  },
  detailTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  detailDescription: {
    fontSize: 16,
    color: '#dcfce7',
    marginBottom: 20,
  },
  detailProgressCard: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 16,
  },
  detailProgressLabel: {
    color: '#dcfce7',
    fontSize: 14,
  },
  detailProgressValue: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  detailProgressBarBg: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 5,
    marginTop: 8,
    overflow: 'hidden',
  },
  detailProgressBarFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 5,
  },
  detailScrollContent: {
    padding: 20,
  },
  motivationCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  motivationText: {
    color: 'white',
    fontSize: 14,
    fontStyle: 'italic',
    flex: 1,
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
    borderWidth: 1,
    borderColor: '#f3f4f6',
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dateBadgeText: {
    fontSize: 12,
    color: '#374151',
  },
  milestonesList: {
    gap: 16,
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
    paddingVertical: 2,
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

  // Modal Styles
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1f2937',
  },
  modalInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 24,
    color: '#1f2937',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
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
  emptyStateText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
});
