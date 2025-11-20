import { create } from 'zustand';

export interface Message {
  id: string;
  role: 'user' | 'ai' | 'system';
  content: string;
  timestamp: number;
  type?: 'text' | 'image' | 'audio';
  mediaUrl?: string;
}

interface ChatState {
  messages: Message[];
  isTyping: boolean;
  mode: 'chat' | 'avatar';
  voiceMode: boolean;
  activeSessionId: string | null;

  // Actions
  sendMessage: (content: string, role?: 'user' | 'ai') => void;
  setTyping: (typing: boolean) => void;
  setMode: (mode: 'chat' | 'avatar') => void;
  setVoiceMode: (enabled: boolean) => void;
  clearHistory: () => void;
}

const initialMessages: Message[] = [
  {
    id: '1',
    role: 'user',
    content:
      "hey. feel like I've been waiting on this curb forever. but... it's not bad. kinda peaceful actually. the playlist's still going in my head. loop three now. I think I'm addicted. or maybe just to the idea of you walking back in.",
    timestamp: Date.now() - 10000,
  },
  {
    id: '2',
    role: 'ai',
    content: "I think I'm ready to start a new adventure.",
    timestamp: Date.now() - 5000,
  },
  {
    id: '3',
    role: 'user',
    content:
      "yeah... me too. finally. like, screw waiting around for the ferris wheel to turn again. let's",
    timestamp: Date.now(),
  },
];

export const useChatStore = create<ChatState>((set) => ({
  messages: initialMessages,
  isTyping: false,
  mode: 'chat',
  voiceMode: false,
  activeSessionId: 'session-1',

  sendMessage: (content, role = 'user') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: Date.now(),
    };

    set((state) => ({
      messages: [...state.messages, newMessage],
    }));

    // Simulate AI response if user sent message
    if (role === 'user') {
      set({ isTyping: true });
      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: 'I hear you. That sounds interesting. Tell me more.',
          timestamp: Date.now(),
        };
        set((state) => ({
          messages: [...state.messages, aiResponse],
          isTyping: false,
        }));
      }, 1500);
    }
  },

  setTyping: (isTyping) => set({ isTyping }),
  setMode: (mode) => set({ mode }),
  setVoiceMode: (voiceMode) => set({ voiceMode }),
  clearHistory: () => set({ messages: [] }),
}));
