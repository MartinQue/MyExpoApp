export const mockFeedCards = [
  {
    id: '1',
    type: 'motivation',
    title: 'Gym Session: Leg Day',
    content:
      'You planned to hit the gym today. Remember your last PR? Time to beat it!',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48',
    time: 'Morning',
    context: 'gym',
    // Rich Content for Expansion
    details: {
      whyStarted:
        'Remember: You started this journey to feel stronger and run that marathon next year.',
      comparison: {
        before: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438', // Placeholder for "Before"
        goal: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b', // Placeholder for "Goal/AI Gen"
      },
      videoSnippet:
        'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff', // Video thumbnail
      videoTitle: 'Perfect Squat Form - 30s Guide',
    },
  },
  {
    id: '2',
    type: 'news',
    title: 'Market Pulse: AI & Tech',
    content: 'Tech sector rallying. AI stocks up 4.5% pre-market.',
    image:
      'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80', // Main card image
    icon: 'trending-up',
    time: 'Morning',
    context: 'finance',
    // Rich Content for Expansion
    details: {
      graphImage:
        'https://images.unsplash.com/photo-1611974765270-ca1258634369', // Stock chart placeholder
      mustKnow:
        'NVIDIA and AMD are leading the charge today as demand for data center chips skyrockets.',
      trending: [
        { topic: 'Artificial Intelligence', change: '+4.5%', color: '#4ADE80' },
        { topic: 'Data Warehousing', change: '+2.1%', color: '#60A5FA' },
        { topic: 'Predictive Analytics', change: '+1.8%', color: '#A78BFA' },
      ],
      expertAdvice:
        "Analyst Consensus: 'Strong Buy' on infrastructure providers. The AI wave is just beginning.",
      links: [
        { label: 'Read on Bloomberg', url: 'https://www.bloomberg.com' },
        { label: 'View on X', url: 'https://twitter.com' },
      ],
    },
  },
  {
    id: '3',
    type: 'quote',
    content:
      "Progress is not about the destination. It's about the process that shapes who you become.",
    author: 'Your AI Companion',
    time: 'Anytime',
  },
  {
    id: '4',
    type: 'achievement',
    title: '7-Day Streak! 🔥',
    content: "You've completed your morning routine for 7 days straight.",
    image: 'https://images.unsplash.com/photo-1496016943515-7d33598c11e6',
    time: 'Evening',
  },
];

export const mockPlans = [
  {
    id: '1',
    title: 'Fitness Journey',
    description: 'Get fit and healthy',
    progress: 0.45,
    nextTask: 'Gym session - Leg day',
    dueDate: 'Today, 6:00 PM',
  },
  {
    id: '2',
    title: 'Learn Spanish',
    description: 'Become conversationally fluent',
    progress: 0.3,
    nextTask: '15-minute practice session',
    dueDate: 'Today, 8:00 PM',
  },
];
