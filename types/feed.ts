/**
 * Feed types for Profile/Home tab
 */

export type FeedCardType = 
  | 'motivational'
  | 'progress'
  | 'next-step'
  | 'content'
  | 'media'
  | 'reminder';

export interface BaseFeedCard {
  id: string;
  type: FeedCardType;
  createdAt: Date;
  priority: number;
}

export interface MotivationalCard extends BaseFeedCard {
  type: 'motivational';
  quote: string;
  author?: string;
  imageUrl?: string;
}

export interface ProgressCard extends BaseFeedCard {
  type: 'progress';
  goalId: string;
  goalTitle: string;
  progress: number; // 0-100
  milestone?: string;
}

export interface NextStepCard extends BaseFeedCard {
  type: 'next-step';
  taskId: string;
  taskTitle: string;
  goalId: string;
  goalTitle: string;
  dueDate?: Date;
}

export interface ContentCard extends BaseFeedCard {
  type: 'content';
  title: string;
  summary: string;
  url?: string;
  source: string;
  imageUrl?: string;
}

export interface MediaCard extends BaseFeedCard {
  type: 'media';
  title: string;
  description: string;
  mediaType: 'music' | 'video' | 'podcast';
  url: string;
  thumbnailUrl?: string;
}

export interface ReminderCard extends BaseFeedCard {
  type: 'reminder';
  title: string;
  message: string;
  actionLabel?: string;
  actionRoute?: string;
}

export type FeedCard = 
  | MotivationalCard
  | ProgressCard
  | NextStepCard
  | ContentCard
  | MediaCard
  | ReminderCard;

export interface UserContext {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  isAtHome: boolean;
  location?: {
    latitude: number;
    longitude: number;
    placeName?: string;
  };
  mood?: 'positive' | 'neutral' | 'negative' | 'anxious';
}
