// lib/homeFeed.ts
// Enhanced Home Feed Service - Rich cards with images, videos, and deep reflection

import { OPENAI_API_KEY } from '../constants/Config';
import { supabase } from './supabase';
import { Plan } from '@/stores/plannerStore';

// Placeholder images from Unsplash for different card types
const PLACEHOLDER_IMAGES = {
  finance: [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800', // Stock chart
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800', // Trading
    'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800', // Crypto
  ],
  fitness: [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800', // Gym
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800', // Workout
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800', // Training
  ],
  wellness: [
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800', // Meditation
    'https://images.unsplash.com/photo-1545389336-cf090694435e?w=800', // Yoga
    'https://images.unsplash.com/photo-1528715471579-d1bcf0ba5e83?w=800', // Nature
  ],
  reflection: [
    'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=800', // Workspace
    'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=800', // Journal
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', // Thinking
  ],
  motivation: [
    'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800', // Running
    'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800', // Achievement
    'https://images.unsplash.com/photo-1504805572947-34fad45aed93?w=800', // Do more
  ],
};

// Sample YouTube video thumbnails for motivation
const YOUTUBE_VIDEOS = {
  fitness: [
    {
      id: 'mgmVOuLgFB0',
      title: 'David Goggins - Stay Hard',
      thumbnail: 'https://img.youtube.com/vi/mgmVOuLgFB0/maxresdefault.jpg',
      duration: '12:34',
    },
    {
      id: '5tSTk1083VY',
      title: 'Arnold Schwarzenegger - 6 Rules of Success',
      thumbnail: 'https://img.youtube.com/vi/5tSTk1083VY/maxresdefault.jpg',
      duration: '8:45',
    },
    {
      id: 'IdTMDpizis8',
      title: 'Jocko Willink - Discipline Equals Freedom',
      thumbnail: 'https://img.youtube.com/vi/IdTMDpizis8/maxresdefault.jpg',
      duration: '15:23',
    },
  ],
  productivity: [
    {
      id: 'J1yIApZq9T0',
      title: 'How to Stay Focused',
      thumbnail: 'https://img.youtube.com/vi/J1yIApZq9T0/maxresdefault.jpg',
      duration: '10:15',
    },
  ],
};

export interface FeedCardDetails {
  // Finance specific
  graphImage?: string;
  mustKnow?: string;
  trending?: { topic: string; change: string; color: string }[];
  expertAdvice?: string;
  links?: { label: string; url: string }[];

  // Fitness specific
  whyStarted?: string;
  comparison?: {
    before: string;
    goal: string;
  };
  videoSnippet?: string;
  videoTitle?: string;
  videoId?: string;
  todayRoutine?: string[];

  // Reflection specific
  deepQuestion?: string;
  suggestedActions?: string[];
  relatedGoals?: string[];
}

export interface FeedCard {
  id: string;
  type:
    | 'insight'
    | 'motivation'
    | 'news'
    | 'quote'
    | 'achievement'
    | 'task'
    | 'wellness'
    | 'finance'
    | 'fitness'
    | 'reflection';
  title?: string;
  content: string;
  image?: string;
  icon?: string;
  time: string;
  context?: string;
  agent?: string;
  priority?: number;
  details?: FeedCardDetails;
  isExpandable?: boolean;
  isSensitive?: boolean;
}

export interface DailyStats {
  tasksCompleted: number;
  totalTasks: number;
  energyLevel: number;
  focusMinutes: number;
  streak: number;
  moodTrend: 'up' | 'down' | 'stable';
}

/**
 * Get time of day greeting and context
 */
export function getTimeContext(): {
  greeting: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  suggestedContext: string;
} {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return {
      greeting: 'Good Morning',
      timeOfDay: 'morning',
      suggestedContext: 'Start strong today',
    };
  } else if (hour >= 12 && hour < 17) {
    return {
      greeting: 'Good Afternoon',
      timeOfDay: 'afternoon',
      suggestedContext: 'Keep the momentum going',
    };
  } else if (hour >= 17 && hour < 21) {
    return {
      greeting: 'Good Evening',
      timeOfDay: 'evening',
      suggestedContext: 'Wind down and reflect',
    };
  } else {
    return {
      greeting: 'Hello',
      timeOfDay: 'night',
      suggestedContext: 'Rest and recharge',
    };
  }
}

/**
 * Generate a deep reflection card for morning introspection
 */
export async function generateDeepReflectionCard(context: {
  userName: string;
  plans: Plan[];
  timeOfDay: string;
}): Promise<FeedCard> {
  const randomImage =
    PLACEHOLDER_IMAGES.reflection[
      Math.floor(Math.random() * PLACEHOLDER_IMAGES.reflection.length)
    ];

  // Deep reflection prompts that evoke self-reflection
  const deepPrompts = [
    {
      question:
        'What is the ONE thing today that, if accomplished, would make everything else easier or unnecessary?',
      context: 'Focus on leverage, not effort',
    },
    {
      question:
        'If today were your last day working toward this goal, what would you regret not doing?',
      context: 'Urgency reveals priority',
    },
    {
      question:
        'What fear is holding you back right now? Name it. Then ask: is it real?',
      context: 'Fear loses power when named',
    },
    {
      question:
        'Who are you becoming through this journey? Not just what are you achieving?',
      context: 'The process shapes the person',
    },
    {
      question:
        "What would you attempt if you knew you couldn't fail? Why aren't you attempting it?",
      context: 'Limits are often self-imposed',
    },
  ];

  const prompt = deepPrompts[Math.floor(Math.random() * deepPrompts.length)];

  // If we have plans, relate the reflection to them
  const relatedGoals = context.plans.slice(0, 2).map((p) => p.title);

  if (OPENAI_API_KEY && context.plans.length > 0) {
    try {
      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            temperature: 0.9,
            max_tokens: 200,
            messages: [
              {
                role: 'system',
                content: `You are a thoughtful life coach. Generate a deeply personal reflection question for ${
                  context.userName
                } based on their goals: ${context.plans
                  .map((p) => p.title)
                  .join(', ')}.
              
              The question should:
              - Evoke deep self-reflection
              - Be specific to their journey
              - Challenge them to think differently
              - Be concise (1-2 sentences max)
              
              Return JSON: { "question": "...", "insight": "..." }`,
              },
              {
                role: 'user',
                content: `Generate a ${context.timeOfDay} reflection`,
              },
            ],
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0]?.message?.content;
        try {
          const parsed = JSON.parse(content);
          return {
            id: `reflection_${Date.now()}`,
            type: 'reflection',
            title: `${
              context.timeOfDay.charAt(0).toUpperCase() +
              context.timeOfDay.slice(1)
            } Reflection`,
            content: parsed.question || prompt.question,
            image: randomImage,
            time: 'Now',
            icon: 'leaf-outline',
            agent: 'alter_ego',
            priority: 3,
            isExpandable: true,
            details: {
              deepQuestion: parsed.question || prompt.question,
              suggestedActions: [
                'Write in your journal',
                'Share with someone you trust',
                'Take one small action',
              ],
              relatedGoals,
            },
          };
        } catch {
          // Fall through to default
        }
      }
    } catch (error) {
      console.error('Failed to generate reflection:', error);
    }
  }

  return {
    id: `reflection_${Date.now()}`,
    type: 'reflection',
    title: `${
      context.timeOfDay.charAt(0).toUpperCase() + context.timeOfDay.slice(1)
    } Reflection`,
    content: prompt.question,
    image: randomImage,
    time: 'Now',
    icon: 'leaf-outline',
    agent: 'alter_ego',
    priority: 3,
    isExpandable: true,
    details: {
      deepQuestion: prompt.question,
      suggestedActions: [
        'Write in your journal',
        'Meditate on this question',
        'Take one small action today',
      ],
      relatedGoals,
    },
  };
}

/**
 * Generate a financial insights card
 */
export function generateFinanceCard(): FeedCard {
  const randomImage =
    PLACEHOLDER_IMAGES.finance[
      Math.floor(Math.random() * PLACEHOLDER_IMAGES.finance.length)
    ];

  // Simulated market data (would come from API in production)
  const trending = [
    { topic: 'NVDA', change: '+4.2%', color: '#22c55e' },
    { topic: 'AAPL', change: '+1.8%', color: '#22c55e' },
    { topic: 'BTC', change: '-2.1%', color: '#ef4444' },
    { topic: 'AI ETF', change: '+3.5%', color: '#22c55e' },
  ];

  return {
    id: `finance_${Date.now()}`,
    type: 'finance',
    title: 'Market Pulse',
    content:
      'AI stocks continue to surge as enterprise adoption accelerates. NVIDIA reports record data center revenue, signaling sustained demand for AI infrastructure.',
    image: randomImage,
    time: 'Updated just now',
    icon: 'trending-up',
    agent: 'financial',
    priority: 2,
    isExpandable: true,
    isSensitive: true,
    details: {
      graphImage:
        'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800',
      mustKnow:
        "The AI boom is reshaping markets. Companies with strong AI integration are outperforming traditional tech. Key insight: It's not about owning AI stocks, but understanding which businesses will be transformed by AI.",
      trending,
      expertAdvice:
        'Consider diversifying across AI infrastructure (chips), AI platforms (cloud), and AI-enhanced businesses. The second wave of AI investing is about applications, not just technology.',
      links: [
        { label: 'Bloomberg', url: 'https://bloomberg.com' },
        { label: 'Yahoo Finance', url: 'https://finance.yahoo.com' },
        { label: 'r/investing', url: 'https://reddit.com/r/investing' },
      ],
    },
  };
}

/**
 * Generate a fitness motivation card with video
 */
export function generateFitnessCard(plans: Plan[]): FeedCard {
  const fitnessGoal = plans.find(
    (p) =>
      p.title.toLowerCase().includes('fit') ||
      p.title.toLowerCase().includes('gym') ||
      p.title.toLowerCase().includes('health') ||
      p.title.toLowerCase().includes('workout') ||
      p.title.toLowerCase().includes('exercise')
  );

  const randomVideo =
    YOUTUBE_VIDEOS.fitness[
      Math.floor(Math.random() * YOUTUBE_VIDEOS.fitness.length)
    ];
  const randomImage =
    PLACEHOLDER_IMAGES.fitness[
      Math.floor(Math.random() * PLACEHOLDER_IMAGES.fitness.length)
    ];

  // User's "why" - would come from onboarding in production
  const whyStarted =
    fitnessGoal?.motivationQuote ||
    'I want to feel strong, confident, and have energy for the people I love.';

  return {
    id: `fitness_${Date.now()}`,
    type: 'fitness',
    title: fitnessGoal ? fitnessGoal.title : "Today's Movement",
    content: fitnessGoal
      ? `${fitnessGoal.progress}% toward your goal. ${fitnessGoal.nextTask}`
      : 'Your body is capable of amazing things. Move it today.',
    image: randomImage,
    time: 'Ready when you are',
    icon: 'fitness',
    agent: 'wellness',
    priority: 2,
    isExpandable: true,
    details: {
      whyStarted,
      comparison: {
        before:
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400', // Placeholder before
        goal: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400', // Placeholder goal
      },
      videoSnippet: randomVideo.thumbnail,
      videoTitle: randomVideo.title,
      videoId: randomVideo.id,
      todayRoutine: [
        'Warm-up: 5 min light cardio',
        'Main workout: Follow your plan',
        'Cool-down: Stretch 10 min',
        'Log your session',
      ],
    },
  };
}

/**
 * Generate a personalized motivational quote using AI
 */
export async function generatePersonalizedQuote(context: {
  userName: string;
  mood?: string;
  recentActivity?: string;
}): Promise<FeedCard> {
  const randomImage =
    PLACEHOLDER_IMAGES.motivation[
      Math.floor(Math.random() * PLACEHOLDER_IMAGES.motivation.length)
    ];

  if (!OPENAI_API_KEY) {
    const fallbackQuotes = [
      "Progress is not about the destination. It's about the process that shapes who you become.",
      'Every small step forward is still progress. Keep moving.',
      'Today is a new opportunity to become the best version of yourself.',
      'Believe in your ability to grow and change.',
    ];

    return {
      id: `quote_${Date.now()}`,
      type: 'quote',
      content:
        fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)],
      image: randomImage,
      time: 'Now',
      agent: 'alter_ego',
      isExpandable: false,
    };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.9,
        max_tokens: 100,
        messages: [
          {
            role: 'system',
            content: `Generate a short, personalized motivational quote (1-2 sentences) for ${
              context.userName
            }. 
            ${context.mood ? `Their current mood is: ${context.mood}` : ''}
            ${
              context.recentActivity
                ? `Recent activity: ${context.recentActivity}`
                : ''
            }
            Make it warm, genuine, and inspiring. No labels or attribution - just the quote itself.`,
          },
          {
            role: 'user',
            content: 'Generate a quote',
          },
        ],
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const quote =
        data.choices[0]?.message?.content?.trim().replace(/^["']|["']$/g, '') ||
        '';

      return {
        id: `quote_${Date.now()}`,
        type: 'quote',
        content: quote,
        image: randomImage,
        time: 'Now',
        agent: 'alter_ego',
        isExpandable: false,
      };
    }
  } catch (error) {
    console.error('Failed to generate quote:', error);
  }

  return {
    id: `quote_${Date.now()}`,
    type: 'quote',
    content: 'Every moment is a fresh beginning. Make this one count.',
    image: randomImage,
    time: 'Now',
    agent: 'alter_ego',
    isExpandable: false,
  };
}

/**
 * Generate AI insight based on user's goals and activity
 */
export async function generateDailyInsight(context: {
  userName: string;
  plans: Plan[];
  timeOfDay: string;
}): Promise<FeedCard> {
  if (!OPENAI_API_KEY || context.plans.length === 0) {
    return {
      id: `insight_${Date.now()}`,
      type: 'insight',
      title: 'Your Journey',
      content:
        "Set some goals in the Planner tab, and I'll help you stay on track with personalized insights!",
      time: 'Now',
      icon: 'bulb-outline',
      agent: 'planner',
      isExpandable: false,
    };
  }

  try {
    const plansSummary = context.plans
      .map((p) => `${p.title}: ${p.progress}% complete, next: ${p.nextTask}`)
      .join('; ');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.8,
        max_tokens: 150,
        messages: [
          {
            role: 'system',
            content: `You're a supportive life coach. Generate a brief, actionable insight (2-3 sentences) for ${context.userName} based on their goals.
            Keep it encouraging but practical. Focus on one specific observation or suggestion.
            Return JSON: { "title": "...", "content": "..." }`,
          },
          {
            role: 'user',
            content: `Time: ${context.timeOfDay}. Goals: ${plansSummary}`,
          },
        ],
      }),
    });

    if (response.ok) {
      const data = await response.json();
      try {
        const parsed = JSON.parse(data.choices[0]?.message?.content || '{}');
        return {
          id: `insight_${Date.now()}`,
          type: 'insight',
          title: parsed.title || 'Daily Insight',
          content: parsed.content || parsed.insight || parsed.message || '',
          time: 'Now',
          icon: 'sparkles',
          agent: 'planner',
          priority: 1,
          isExpandable: false,
        };
      } catch {
        // Fallthrough
      }
    }
  } catch (error) {
    console.error('Failed to generate insight:', error);
  }

  const plan = context.plans[0];
  return {
    id: `insight_${Date.now()}`,
    type: 'insight',
    title: `Focus on: ${plan.title}`,
    content: `Your next step: ${plan.nextTask}. You're ${plan.progress}% there - keep going!`,
    time: 'Now',
    icon: 'rocket-outline',
    agent: 'planner',
    isExpandable: false,
  };
}

/**
 * Generate wellness check-in card
 */
export function generateWellnessCard(timeOfDay: string): FeedCard {
  const randomImage =
    PLACEHOLDER_IMAGES.wellness[
      Math.floor(Math.random() * PLACEHOLDER_IMAGES.wellness.length)
    ];

  const prompts: Record<string, { title: string; content: string }> = {
    morning: {
      title: 'Morning Intention',
      content:
        'Take a breath. What energy do you want to bring into today? Set one intention that will guide your actions.',
    },
    afternoon: {
      title: 'Mindful Pause',
      content:
        'Pause for 60 seconds. Close your eyes. Feel your breath. Notice any tension. Let it go.',
    },
    evening: {
      title: 'Evening Gratitude',
      content:
        "Name three things from today you're grateful for. They don't have to be big.",
    },
    night: {
      title: 'Peaceful Rest',
      content:
        'Release the day. Tomorrow is fresh. You did your best. Rest now.',
    },
  };

  const prompt = prompts[timeOfDay] || prompts.morning;

  return {
    id: `wellness_${Date.now()}`,
    type: 'wellness',
    title: prompt.title,
    content: prompt.content,
    image: randomImage,
    time: 'Now',
    icon: 'heart-outline',
    agent: 'wellness',
    context: 'home',
    isExpandable: true,
    details: {
      suggestedActions: [
        'Take 5 deep breaths',
        'Stretch for 2 minutes',
        'Drink a glass of water',
        'Step outside briefly',
      ],
    },
  };
}

/**
 * Get task card from next due item
 */
export function getNextTaskCard(plans: Plan[]): FeedCard | null {
  const todayPlans = plans.filter(
    (p) =>
      p.dueDate?.toLowerCase().includes('today') ||
      p.dueDate?.toLowerCase().includes('now')
  );

  if (todayPlans.length === 0 && plans.length === 0) {
    return null;
  }

  const nextPlan = todayPlans[0] || plans[0];

  return {
    id: `task_${nextPlan.id}`,
    type: 'task',
    title: nextPlan.title,
    content: nextPlan.nextTask,
    time: nextPlan.dueDate,
    icon: 'checkbox-outline',
    agent: 'planner',
    priority: 2,
    context: 'planner',
    isExpandable: false,
  };
}

/**
 * Build the complete enhanced home feed
 */
export async function buildHomeFeed(params: {
  userName: string;
  plans: Plan[];
  userId?: string;
}): Promise<FeedCard[]> {
  const { userName, plans } = params;
  const { timeOfDay } = getTimeContext();

  const feed: FeedCard[] = [];

  // 1. Deep reflection card (highest priority - self-reflection)
  const reflection = await generateDeepReflectionCard({
    userName,
    plans,
    timeOfDay,
  });
  feed.push(reflection);

  // 2. Financial insights card (if relevant)
  const financeCard = generateFinanceCard();
  feed.push(financeCard);

  // 3. Fitness motivation card (if user has fitness goals)
  const fitnessCard = generateFitnessCard(plans);
  feed.push(fitnessCard);

  // 4. Personalized quote
  const quote = await generatePersonalizedQuote({
    userName,
    recentActivity: plans[0]?.nextTask,
  });
  feed.push(quote);

  // 5. Daily insight
  const insight = await generateDailyInsight({
    userName,
    plans,
    timeOfDay,
  });
  feed.push(insight);

  // 6. Wellness check-in
  feed.push(generateWellnessCard(timeOfDay));

  // 7. Task cards for active plans
  plans.slice(0, 2).forEach((plan) => {
    feed.push({
      id: `plan_${plan.id}`,
      type: 'task',
      title: plan.title,
      content: `${plan.progress}% complete • Next: ${plan.nextTask}`,
      time: plan.dueDate,
      icon: 'flag-outline',
      agent: 'planner',
      context: 'planner',
      isExpandable: false,
    });
  });

  // Sort by priority
  return feed.sort((a, b) => (b.priority || 0) - (a.priority || 0));
}

/**
 * Get or calculate daily stats
 */
export async function getDailyStats(userId?: string): Promise<DailyStats> {
  return {
    tasksCompleted: 4,
    totalTasks: 6,
    energyLevel: 85,
    focusMinutes: 120,
    streak: 7,
    moodTrend: 'up',
  };
}

/**
 * Save daily reflection to Supabase
 */
export async function saveDailyReflection(params: {
  userId: string;
  reflection: string;
  mood: string;
  energyLevel: number;
}): Promise<boolean> {
  try {
    const { error } = await supabase.from('daily_reflections').insert({
      user_id: params.userId,
      reflection: params.reflection,
      mood: params.mood,
      energy_level: params.energyLevel,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Failed to save reflection:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to save reflection:', error);
    return false;
  }
}
