/**
 * Goal and planner types
 */

export type GoalCategory = 
  | 'fitness'
  | 'learning'
  | 'career'
  | 'financial'
  | 'relationships'
  | 'health'
  | 'personal'
  | 'creative';

export type GoalStatus = 'active' | 'completed' | 'paused' | 'abandoned';

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: GoalCategory;
  status: GoalStatus;
  progress: number; // 0-100
  startDate: Date;
  targetDate?: Date;
  completedDate?: Date;
  whyImDoingThis?: string; // Motivational reminder
  createdAt: Date;
  updatedAt: Date;
}

export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  description?: string;
  targetDate?: Date;
  completedDate?: Date;
  order: number;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  goalId: string;
  milestoneId?: string;
  title: string;
  description?: string;
  dueDate?: Date;
  completedDate?: Date;
  isCompleted: boolean;
  order: number;
  estimatedDuration?: number; // in minutes
}

export interface GoalTimeline {
  goal: Goal;
  milestones: Milestone[];
  tasks: Task[];
  weeklyTasks: Task[];
  todayTasks: Task[];
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCompletionDate?: Date;
}
