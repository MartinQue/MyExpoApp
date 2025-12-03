import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  db,
  type Plan as DbPlan,
  type Milestone as DbMilestone,
} from '@/lib/database';

export interface Milestone {
  id: string;
  title: string;
  status: 'completed' | 'in-progress' | 'upcoming';
}

export interface Plan {
  id: string;
  title: string;
  description: string;
  progress: number;
  nextTask: string;
  dueDate: string;
  motivationQuote: string;
  milestones: Milestone[];
  themeColor?: string;
  status?: 'active' | 'completed' | 'archived';
}

interface PlannerState {
  plans: Plan[];
  activePlanId: string | null;
  userId: string | null;
  isLoading: boolean;

  // Actions
  addPlan: (plan: Omit<Plan, 'id'>) => Promise<void>;
  updateProgress: (id: string, progress: number) => void;
  completeMilestone: (planId: string, milestoneId: string) => void;
  startMilestone: (planId: string, milestoneId: string) => void;
  addMilestone: (planId: string, title: string) => Promise<void>;
  deletePlan: (id: string) => void;
  setActivePlan: (id: string | null) => void;

  // Supabase sync
  setUserId: (userId: string | null) => void;
  loadFromSupabase: () => Promise<void>;
  syncPlanToSupabase: (plan: Plan) => Promise<void>;
}

const mockPlans: Plan[] = [
  {
    id: '1',
    title: 'Learn Guitar',
    description: 'Master the basics of acoustic guitar',
    progress: 35,
    nextTask: 'Practice chord transitions (G to C)',
    dueDate: 'Tomorrow, 5:00 PM',
    motivationQuote: 'Music is the universal language of mankind.',
    milestones: [
      { id: 'm1', title: 'Learn basic chords', status: 'completed' },
      { id: 'm2', title: 'Learn strumming patterns', status: 'in-progress' },
      { id: 'm3', title: 'Play first song', status: 'upcoming' },
    ],
    status: 'active',
  },
  {
    id: '2',
    title: 'Fitness Journey',
    description: 'Get fit and healthy',
    progress: 45,
    nextTask: 'Gym session - Leg day',
    dueDate: 'Today, 6:00 PM',
    motivationQuote: 'Progress, not perfection.',
    milestones: [
      { id: 'm1', title: 'Sign up for gym', status: 'completed' },
      { id: 'm2', title: 'Go 3 times a week', status: 'in-progress' },
    ],
    status: 'active',
  },
];

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set, get) => ({
      plans: mockPlans,
      activePlanId: null,
      userId: null,
      isLoading: false,

      addPlan: async (planData) => {
        const state = get();
        const newPlan: Plan = {
          ...planData,
          id: `plan-${Date.now()}`,
          status: 'active',
        };

        set((s) => ({
          plans: [newPlan, ...s.plans],
        }));

        // Sync to Supabase
        if (state.userId) {
          try {
            const dbPlan = await db.plans.create({
              user_id: state.userId,
              title: newPlan.title,
              description: newPlan.description,
              progress: newPlan.progress,
              next_task: newPlan.nextTask,
              due_date: newPlan.dueDate
                ? new Date(newPlan.dueDate).toISOString()
                : null,
              motivation_quote: newPlan.motivationQuote,
              theme_color: newPlan.themeColor ?? null,
              status: 'active',
            });

            if (dbPlan) {
              // Update local plan with DB ID
              set((s) => ({
                plans: s.plans.map((p) =>
                  p.id === newPlan.id ? { ...p, id: dbPlan.id } : p
                ),
              }));

              // Add milestones to DB
              for (const milestone of newPlan.milestones) {
                await db.plans.addMilestone(dbPlan.id, milestone.title);
              }
            }
          } catch (e) {
            console.error('Failed to sync plan to Supabase:', e);
          }
        }
      },

      updateProgress: (id, progress) => {
        set((state) => ({
          plans: state.plans.map((p) => (p.id === id ? { ...p, progress } : p)),
        }));

        // Sync to Supabase
        const userId = get().userId;
        if (userId) {
          db.plans.update(id, { progress }).catch(console.error);
        }
      },

      completeMilestone: (planId, milestoneId) => {
        set((state) => ({
          plans: state.plans.map((p) => {
            if (p.id !== planId) return p;
            const updatedMilestones = p.milestones.map((m) =>
              m.id === milestoneId ? { ...m, status: 'completed' as const } : m
            );
            // Recalculate progress
            const completed = updatedMilestones.filter(
              (m) => m.status === 'completed'
            ).length;
            const progress = Math.round(
              (completed / updatedMilestones.length) * 100
            );
            return { ...p, milestones: updatedMilestones, progress };
          }),
        }));

        // Sync to Supabase
        const userId = get().userId;
        if (userId) {
          db.plans
            .updateMilestone(milestoneId, 'completed')
            .catch(console.error);
        }
      },

      startMilestone: (planId, milestoneId) => {
        set((state) => ({
          plans: state.plans.map((p) => {
            if (p.id !== planId) return p;
            const updatedMilestones = p.milestones.map((m) =>
              m.id === milestoneId
                ? { ...m, status: 'in-progress' as const }
                : m
            );
            return { ...p, milestones: updatedMilestones };
          }),
        }));

        // Sync to Supabase
        const userId = get().userId;
        if (userId) {
          db.plans
            .updateMilestone(milestoneId, 'in-progress')
            .catch(console.error);
        }
      },

      addMilestone: async (planId, title) => {
        const state = get();
        const newMilestone: Milestone = {
          id: `m-${Date.now()}`,
          title,
          status: 'upcoming',
        };

        set((s) => ({
          plans: s.plans.map((p) =>
            p.id === planId
              ? { ...p, milestones: [...p.milestones, newMilestone] }
              : p
          ),
        }));

        // Sync to Supabase
        if (state.userId) {
          try {
            const dbMilestone = await db.plans.addMilestone(planId, title);
            if (dbMilestone) {
              // Update local milestone with DB ID
              set((s) => ({
                plans: s.plans.map((p) =>
                  p.id === planId
                    ? {
                        ...p,
                        milestones: p.milestones.map((m) =>
                          m.id === newMilestone.id
                            ? { ...m, id: dbMilestone.id }
                            : m
                        ),
                      }
                    : p
                ),
              }));
            }
          } catch (e) {
            console.error('Failed to add milestone to Supabase:', e);
          }
        }
      },

      deletePlan: (id) => {
        set((state) => ({
          plans: state.plans.filter((p) => p.id !== id),
          activePlanId: state.activePlanId === id ? null : state.activePlanId,
        }));

        // Delete from Supabase
        const userId = get().userId;
        if (userId) {
          db.plans.delete(id).catch(console.error);
        }
      },

      setActivePlan: (id) => set({ activePlanId: id }),

      setUserId: (userId) => {
        set({ userId });
        if (userId) {
          get().loadFromSupabase();
        }
      },

      loadFromSupabase: async () => {
        const state = get();
        if (!state.userId) return;

        set({ isLoading: true });

        try {
          const dbPlans = await db.plans.list(state.userId);

          if (dbPlans.length > 0) {
            const plans: Plan[] = dbPlans.map((p) => ({
              id: p.id,
              title: p.title,
              description: p.description || '',
              progress: p.progress,
              nextTask: p.next_task || '',
              dueDate: p.due_date || '',
              motivationQuote: p.motivation_quote || '',
              themeColor: p.theme_color ?? undefined,
              status: p.status,
              milestones: (p.milestones || []).map((m) => ({
                id: m.id,
                title: m.title,
                status: m.status,
              })),
            }));

            set({ plans, isLoading: false });
          } else {
            set({ isLoading: false });
          }
        } catch (e) {
          console.error('Failed to load plans from Supabase:', e);
          set({ isLoading: false });
        }
      },

      syncPlanToSupabase: async (plan) => {
        const state = get();
        if (!state.userId) return;

        try {
          await db.plans.update(plan.id, {
            title: plan.title,
            description: plan.description,
            progress: plan.progress,
            next_task: plan.nextTask,
            motivation_quote: plan.motivationQuote,
            theme_color: plan.themeColor ?? null,
          });
        } catch (e) {
          console.error('Failed to sync plan:', e);
        }
      },
    }),
    {
      name: 'planner-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        plans: state.plans,
        activePlanId: state.activePlanId,
      }),
    }
  )
);
