import { create } from 'zustand';

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
  themeColor?: string; // For the specific goal card color
}

interface PlannerState {
  plans: Plan[];
  activePlanId: string | null;

  // Actions
  addPlan: (plan: Plan) => void;
  updateProgress: (id: string, progress: number) => void;
  completeMilestone: (planId: string, milestoneId: string) => void;
  deletePlan: (id: string) => void;
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
  },
];

export const usePlannerStore = create<PlannerState>((set) => ({
  plans: mockPlans,
  activePlanId: null,

  addPlan: (plan) =>
    set((state) => ({
      plans: [plan, ...state.plans],
    })),

  updateProgress: (id, progress) =>
    set((state) => ({
      plans: state.plans.map((p) => (p.id === id ? { ...p, progress } : p)),
    })),

  completeMilestone: (planId, milestoneId) =>
    set((state) => ({
      plans: state.plans.map((p) => {
        if (p.id !== planId) return p;
        const updatedMilestones = p.milestones.map((m) =>
          m.id === milestoneId ? { ...m, status: 'completed' as const } : m
        );
        // Auto-calculate progress based on milestones could go here
        return { ...p, milestones: updatedMilestones };
      }),
    })),

  deletePlan: (id) =>
    set((state) => ({
      plans: state.plans.filter((p) => p.id !== id),
    })),
}));
