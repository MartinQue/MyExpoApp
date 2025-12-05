// lib/homeFeed.ts
// Enhanced Home Feed Service - Rich cards with images, videos, and deep reflection
// Now with GPS location context, real-time weather, and highly personalized AI suggestions

import { OPENAI_API_KEY } from '../constants/Config';
import { supabase } from './supabase';
import { Plan } from '@/stores/plannerStore';
import {
  getLocationContext,
  UserLocation,
  WeatherContext,
  LocationContext,
} from './locationService';

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
    | 'reflection'
    | 'weather'
    | 'location'
    | 'personalized';
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
  externalUrl?: string;
  location?: string;
  weatherIcon?: string;
  accentColor?: string;
  navigationRoute?: string;
  navigationParams?: Record<string, any>;
  sourceType?: 'internal' | 'external';
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
    externalUrl: 'https://finance.yahoo.com',
    sourceType: 'external',
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
    navigationRoute: '/(tabs)/planner',
    sourceType: 'internal',
    details: {
      whyStarted,
      comparison: {
        before:
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
        goal: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
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
    navigationRoute: '/(tabs)/chat',
    sourceType: 'internal',
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
    navigationRoute: '/(tabs)/planner',
    sourceType: 'internal',
  };
}

/**
 * Generate a weather-based card for the current location
 */
export function generateWeatherCard(
  location: UserLocation | null,
  weather: WeatherContext | null
): FeedCard | null {
  if (!weather) return null;

  const weatherImages: Record<string, string> = {
    sunny: 'https://images.unsplash.com/photo-1601297183305-6df142704ea2?w=800',
    cloudy:
      'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=800',
    rainy: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=800',
    snowy: 'https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=800',
    stormy:
      'https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?w=800',
    foggy: 'https://images.unsplash.com/photo-1487621167305-5d248087c724?w=800',
    clear: 'https://images.unsplash.com/photo-1532978379173-523e16f371f2?w=800',
  };

  const weatherTips: Record<string, string[]> = {
    sunny: [
      'Perfect day for outdoor activities! ☀️',
      "Don't forget sunscreen if going out",
      'Great weather for a walk or run',
    ],
    cloudy: [
      'Mild weather - great for focused work',
      'Good day for errands without the heat',
      'Comfortable conditions for outdoor exercise',
    ],
    rainy: [
      'Perfect day for indoor productivity 🌧️',
      'Cozy up with a good book or project',
      'Great weather for reflection and planning',
    ],
    snowy: [
      'Bundle up if going outside! ❄️',
      'Perfect for hot drinks and warm meals',
      'Take it slow on the roads',
    ],
    stormy: [
      'Stay safe indoors today ⛈️',
      'Good time for indoor activities',
      'Check on loved ones',
    ],
    foggy: [
      'Take extra care when driving 🌫️',
      'Atmospheric day for creative work',
      'Visibility may be limited',
    ],
    clear: [
      'Beautiful clear skies today! ✨',
      'Perfect conditions for stargazing tonight',
      'Enjoy the visibility',
    ],
  };

  const tips = weatherTips[weather.condition] || weatherTips.sunny;
  const tip = tips[Math.floor(Math.random() * tips.length)];

  return {
    id: `weather_${Date.now()}`,
    type: 'weather',
    title: `${weather.temperature}°C in ${location?.city || 'Your Area'}`,
    content: `${weather.description}. ${tip}`,
    image: weatherImages[weather.condition] || weatherImages.sunny,
    time: 'Updated just now',
    icon: weather.icon,
    agent: 'local',
    priority: 2,
    isExpandable: false,
    location: location?.city || undefined,
    weatherIcon: weather.icon,
    accentColor:
      weather.condition === 'sunny'
        ? '#F59E0B'
        : weather.condition === 'rainy'
        ? '#3B82F6'
        : weather.condition === 'snowy'
        ? '#E0F2FE'
        : '#6B7280',
  };
}

/**
 * Generate a location-based suggestion card
 */
export function generateLocationSuggestionCard(
  locationContext: LocationContext,
  userName: string
): FeedCard | null {
  if (
    !locationContext.suggestions ||
    locationContext.suggestions.length === 0
  ) {
    return null;
  }

  const suggestion = locationContext.suggestions[0];

  return {
    id: `location_${Date.now()}`,
    type: 'location',
    title: 'Local Suggestion',
    content: suggestion,
    time: 'Based on your location',
    icon: 'location-outline',
    agent: 'local',
    priority: 2,
    isExpandable: false,
    location: locationContext.location?.city || undefined,
  };
}

/**
 * Generate a personalized AI card based on all context (location, mood, goals, time)
 */
export async function generatePersonalizedContextCard(params: {
  userName: string;
  plans: Plan[];
  locationContext: LocationContext;
  timeOfDay: string;
}): Promise<FeedCard> {
  const { userName, plans, locationContext, timeOfDay } = params;

  // Default card if no API key
  if (!OPENAI_API_KEY) {
    return {
      id: `personalized_${Date.now()}`,
      type: 'personalized',
      title: `Good ${timeOfDay}, ${userName}!`,
      content: locationContext.weather
        ? `It's ${
            locationContext.weather.temperature
          }°C and ${locationContext.weather.description.toLowerCase()}. ${
            locationContext.suggestions[0] || 'Make the most of your day!'
          }`
        : 'Ready to make progress on your goals today?',
      time: 'Just for you',
      icon: 'sparkles',
      agent: 'alter_ego',
      priority: 3,
      isExpandable: false,
    };
  }

  try {
    const contextInfo = {
      time: timeOfDay,
      location: locationContext.location?.city || 'unknown',
      weather: locationContext.weather
        ? {
            temp: locationContext.weather.temperature,
            condition: locationContext.weather.condition,
          }
        : null,
      goals: plans.slice(0, 3).map((p) => ({
        title: p.title,
        progress: p.progress,
        nextTask: p.nextTask,
      })),
    };

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
            content: `You are a supportive AI companion. Generate a brief, personalized message (2-3 sentences) for ${userName} based on their current context. Be warm, practical, and specific. Consider their location, weather, time of day, and goals. Return JSON: { "title": "...", "content": "..." }`,
          },
          {
            role: 'user',
            content: JSON.stringify(contextInfo),
          },
        ],
      }),
    });

    if (response.ok) {
      const data = await response.json();
      try {
        const parsed = JSON.parse(data.choices[0]?.message?.content || '{}');
        return {
          id: `personalized_${Date.now()}`,
          type: 'personalized',
          title: parsed.title || `Good ${timeOfDay}!`,
          content: parsed.content || 'Ready to make progress today?',
          time: 'Just for you',
          icon: 'sparkles',
          agent: 'alter_ego',
          priority: 3,
          isExpandable: false,
        };
      } catch {
        // Fall through to default
      }
    }
  } catch (error) {
    console.error('Failed to generate personalized card:', error);
  }

  return {
    id: `personalized_${Date.now()}`,
    type: 'personalized',
    title: `Good ${timeOfDay}, ${userName}!`,
    content: 'Ready to make progress on your goals today?',
    time: 'Just for you',
    icon: 'sparkles',
    agent: 'alter_ego',
    priority: 3,
    isExpandable: false,
  };
}

/**
 * Build the complete enhanced home feed with location context
 * Optimized to prevent duplicate cards and ensure uniqueness
 */
export async function buildHomeFeed(params: {
  userName: string;
  plans: Plan[];
  userId?: string;
  useLocation?: boolean;
}): Promise<FeedCard[]> {
  const { userName, plans, useLocation = true } = params;
  const { timeOfDay } = getTimeContext();

  const feed: FeedCard[] = [];
  const seenTypes = new Set<string>();

  let locationContext: LocationContext | null = null;
  if (useLocation) {
    try {
      console.log('📍 Getting location context for feed...');
      locationContext = await getLocationContext();
      console.log('📍 Location context:', locationContext.location?.city);
    } catch (error) {
      console.warn('Failed to get location context:', error);
    }
  }

  if (locationContext?.weather) {
    const weatherCard = generateWeatherCard(
      locationContext.location,
      locationContext.weather
    );
    if (weatherCard && !seenTypes.has('weather')) {
      seenTypes.add('weather');
      feed.push(weatherCard);
    }
  }

  const reflection = await generateDeepReflectionCard({
    userName,
    plans,
    timeOfDay,
  });
  if (!seenTypes.has('reflection')) {
    seenTypes.add('reflection');
    reflection.navigationRoute = '/(tabs)/chat';
    reflection.sourceType = 'internal';
    feed.push(reflection);
  }

  if (!seenTypes.has('finance')) {
    seenTypes.add('finance');
    const financeCard = generateFinanceCard();
    feed.push(financeCard);
  }

  const hasFitnessGoal = plans.some(
    (p) =>
      p.title.toLowerCase().includes('fit') ||
      p.title.toLowerCase().includes('gym') ||
      p.title.toLowerCase().includes('health') ||
      p.title.toLowerCase().includes('workout') ||
      p.title.toLowerCase().includes('exercise')
  );
  if (hasFitnessGoal && !seenTypes.has('fitness')) {
    seenTypes.add('fitness');
    const fitnessCard = generateFitnessCard(plans);
    feed.push(fitnessCard);
  }

  const quote = await generatePersonalizedQuote({
    userName,
    mood:
      locationContext?.weather?.condition === 'rainy'
        ? 'reflective'
        : undefined,
    recentActivity: plans[0]?.nextTask,
  });
  if (!seenTypes.has('quote')) {
    seenTypes.add('quote');
    feed.push(quote);
  }

  const insight = await generateDailyInsight({
    userName,
    plans,
    timeOfDay,
  });
  if (!seenTypes.has('insight')) {
    seenTypes.add('insight');
    insight.navigationRoute = '/(tabs)/planner';
    insight.sourceType = 'internal';
    feed.push(insight);
  }

  if (!seenTypes.has('wellness')) {
    seenTypes.add('wellness');
    feed.push(generateWellnessCard(timeOfDay));
  }

  const nonFitnessPlans = plans.filter(
    (p) =>
      !p.title.toLowerCase().includes('fit') &&
      !p.title.toLowerCase().includes('gym') &&
      !p.title.toLowerCase().includes('health') &&
      !p.title.toLowerCase().includes('workout') &&
      !p.title.toLowerCase().includes('exercise')
  );
  
  nonFitnessPlans.slice(0, 2).forEach((plan) => {
    const cardId = `plan_${plan.id}`;
    if (!seenTypes.has(cardId)) {
      seenTypes.add(cardId);
      feed.push({
        id: cardId,
        type: 'task',
        title: plan.title,
        content: `${plan.progress}% complete • Next: ${plan.nextTask}`,
        time: plan.dueDate,
        icon: 'flag-outline',
        agent: 'planner',
        context: 'planner',
        isExpandable: false,
        navigationRoute: '/(tabs)/planner',
        sourceType: 'internal',
      });
    }
  });

  return feed.sort((a, b) => (b.priority || 0) - (a.priority || 0));
}

/**
 * Refresh specific cards based on context changes
 */
export async function refreshContextCards(params: {
  userName: string;
  plans: Plan[];
}): Promise<FeedCard[]> {
  const { userName, plans } = params;
  const { timeOfDay } = getTimeContext();

  // Get fresh location context
  const locationContext = await getLocationContext();

  const cards: FeedCard[] = [];

  // Weather card
  if (locationContext?.weather) {
    const weatherCard = generateWeatherCard(
      locationContext.location,
      locationContext.weather
    );
    if (weatherCard) cards.push(weatherCard);
  }

  // Personalized context card
  const personalizedCard = await generatePersonalizedContextCard({
    userName,
    plans,
    locationContext,
    timeOfDay,
  });
  cards.push(personalizedCard);

  return cards;
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
 * Generate instant static feed for fast initial load (no async calls)
 * This provides immediate content while the full AI-powered feed loads
 */
export function generateInstantFeed(params: {
  userName: string;
  plans: Plan[];
}): FeedCard[] {
  const { userName, plans } = params;
  const { timeOfDay } = getTimeContext();
  const feed: FeedCard[] = [];

  feed.push(generateFinanceCard());

  const hasFitnessGoal = plans.some(
    (p) =>
      p.title.toLowerCase().includes('fit') ||
      p.title.toLowerCase().includes('gym') ||
      p.title.toLowerCase().includes('health')
  );
  if (hasFitnessGoal) {
    feed.push(generateFitnessCard(plans));
  }

  feed.push(generateWellnessCard(timeOfDay));

  const randomImage =
    PLACEHOLDER_IMAGES.reflection[
      Math.floor(Math.random() * PLACEHOLDER_IMAGES.reflection.length)
    ];
  const deepPrompts = [
    'What is the ONE thing today that, if accomplished, would make everything else easier?',
    'If today were your last day working toward this goal, what would you regret not doing?',
    'What fear is holding you back right now? Name it.',
  ];
  feed.push({
    id: `reflection_instant_${Date.now()}`,
    type: 'reflection',
    title: `${timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)} Reflection`,
    content: deepPrompts[Math.floor(Math.random() * deepPrompts.length)],
    image: randomImage,
    time: 'Now',
    icon: 'leaf-outline',
    agent: 'alter_ego',
    priority: 3,
    isExpandable: true,
    navigationRoute: '/(tabs)/chat',
    sourceType: 'internal',
    details: {
      deepQuestion: deepPrompts[0],
      suggestedActions: [
        'Write in your journal',
        'Share with someone you trust',
        'Take one small action',
      ],
      relatedGoals: plans.slice(0, 2).map((p) => p.title),
    },
  });

  const fallbackQuotes = [
    "Progress is not about the destination. It's about the process that shapes who you become.",
    'Every small step forward is still progress. Keep moving.',
    'Today is a new opportunity to become the best version of yourself.',
  ];
  const motivationImage =
    PLACEHOLDER_IMAGES.motivation[
      Math.floor(Math.random() * PLACEHOLDER_IMAGES.motivation.length)
    ];
  feed.push({
    id: `quote_instant_${Date.now()}`,
    type: 'quote',
    content: fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)],
    image: motivationImage,
    time: 'Now',
    agent: 'alter_ego',
    isExpandable: false,
  });

  plans.slice(0, 2).forEach((plan) => {
    feed.push({
      id: `plan_instant_${plan.id}`,
      type: 'task',
      title: plan.title,
      content: `${plan.progress}% complete • Next: ${plan.nextTask}`,
      time: plan.dueDate,
      icon: 'flag-outline',
      agent: 'planner',
      context: 'planner',
      isExpandable: false,
      navigationRoute: '/(tabs)/planner',
      sourceType: 'internal',
    });
  });

  return feed.sort((a, b) => (b.priority || 0) - (a.priority || 0));
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
