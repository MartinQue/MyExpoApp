// Mock data for development and demonstration

export const mockFeedCards = [
  {
    id: '1',
    type: 'motivation',
    title: 'Your Gym Session Awaits',
    content: 'You planned to hit the gym today. Remember your last PR? Time to beat it!',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48',
    time: 'Morning',
    context: 'gym',
  },
  {
    id: '2',
    type: 'news',
    title: 'Market Update',
    content: 'Your portfolio is up 2.3% today. Tech sector showing strong performance.',
    icon: 'TrendingUp',
    time: 'Morning',
    context: 'finance',
  },
  {
    id: '3',
    type: 'quote',
    content: 'Progress is not about the destination. It\'s about the process that shapes who you become.',
    author: 'Your AI Companion',
    time: 'Anytime',
  },
  {
    id: '4',
    type: 'achievement',
    title: '7-Day Streak! 🔥',
    content: 'You\'ve completed your morning routine for 7 days straight.',
    image: 'https://images.unsplash.com/photo-1496016943515-7d33598c11e6',
    time: 'Evening',
  },
];

export const mockChatHistory = [
  {
    id: '1',
    role: 'assistant',
    content: 'Good morning! How are you feeling today?',
    timestamp: new Date(Date.now() - 3600000),
  },
  {
    id: '2',
    role: 'user',
    content: 'Feeling a bit tired, but ready to tackle the day',
    timestamp: new Date(Date.now() - 3500000),
  },
  {
    id: '3',
    role: 'assistant',
    content: 'I understand. Let\'s start with something energizing. Have you had your morning workout yet?',
    timestamp: new Date(Date.now() - 3400000),
  },
];

export const mockPlans = [
  {
    id: '1',
    title: 'Fitness Journey',
    description: 'Get fit and healthy',
    progress: 45,
    milestones: [
      { id: 'm1', title: 'Complete first month', status: 'completed' },
      { id: 'm2', title: 'Reach 10lb weight loss', status: 'in-progress' },
      { id: 'm3', title: 'Run 5K in under 30 min', status: 'upcoming' },
    ],
    nextTask: 'Gym session - Leg day',
    dueDate: 'Today, 6:00 PM',
    motivationQuote: 'Every rep counts. Every step matters.',
  },
  {
    id: '2',
    title: 'Learn Spanish',
    description: 'Become conversationally fluent',
    progress: 30,
    milestones: [
      { id: 'm1', title: 'Complete Duolingo basics', status: 'completed' },
      { id: 'm2', title: 'Practice 30 days straight', status: 'in-progress' },
      { id: 'm3', title: 'Have first conversation', status: 'upcoming' },
    ],
    nextTask: '15-minute practice session',
    dueDate: 'Today, 8:00 PM',
    motivationQuote: 'Consistency over perfection.',
  },
  {
    id: '3',
    title: 'Career Growth',
    description: 'Level up professionally',
    progress: 60,
    milestones: [
      { id: 'm1', title: 'Update resume', status: 'completed' },
      { id: 'm2', title: 'Network with 10 professionals', status: 'in-progress' },
      { id: 'm3', title: 'Apply to dream companies', status: 'upcoming' },
    ],
    nextTask: 'Schedule coffee chat with mentor',
    dueDate: 'This week',
    motivationQuote: 'Your future self will thank you.',
  },
];

export const mockLibraryItems = {
  personal: [
    {
      id: '1',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
      title: 'Mountain hike',
      date: '2 days ago',
      tags: ['nature', 'adventure'],
    },
    {
      id: '2',
      type: 'video',
      thumbnail: 'https://images.unsplash.com/photo-1476611338391-6f395a0ebc7b',
      title: 'Workout session',
      date: '1 week ago',
      duration: '2:34',
      tags: ['fitness'],
    },
    {
      id: '3',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1511735111819-9a3f7709049c',
      title: 'Cooking experiment',
      date: '3 days ago',
      tags: ['food', 'cooking'],
    },
  ],
  notes: [
    {
      id: 'n1',
      type: 'meeting',
      title: 'Team standup - Q4 Planning',
      date: 'Today, 10:00 AM',
      summary: 'Discussed Q4 goals and priorities. Action items assigned.',
      actionItems: [
        'Review proposal by Friday',
        'Schedule follow-up with design team',
      ],
      participants: ['You', 'Manager', 'Team Lead'],
    },
    {
      id: 'n2',
      type: 'voice-memo',
      title: 'Ideas for weekend project',
      date: 'Yesterday, 9:30 PM',
      transcript: 'Build a personal dashboard that tracks all my goals...',
      duration: '1:23',
    },
  ],
};

export const motivationalQuotes = [
  'Progress, not perfection.',
  'It\'s never about the destination. Always about the journey.',
  'Small steps every day lead to massive transformations.',
  'Your only competition is who you were yesterday.',
  'The process shapes the person.',
  'Consistency is the bridge between goals and accomplishment.',
];

export const avatarPresets = [
  { id: 'avatar1', name: 'Nova', color: 'from-blue-500 to-purple-500' },
  { id: 'avatar2', name: 'Zen', color: 'from-green-500 to-teal-500' },
  { id: 'avatar3', name: 'Sol', color: 'from-orange-500 to-red-500' },
  { id: 'avatar4', name: 'Luna', color: 'from-purple-500 to-pink-500' },
  { id: 'avatar5', name: 'Echo', color: 'from-cyan-500 to-blue-500' },
];
