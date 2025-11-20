import { create } from 'zustand';

export interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'voice-memo' | 'meeting';
  title: string;
  url?: string;
  thumbnail?: string;
  date: string;
  tags?: string[];
  duration?: string;
  summary?: string;
  transcript?: string;
  actionItems?: string[];
  participants?: string[];
}

interface LibraryState {
  personalItems: MediaItem[];
  noteItems: MediaItem[];
  filter: 'all' | 'image' | 'video' | 'notes' | 'personal';
  searchQuery: string;

  // Actions
  addItem: (item: MediaItem, category: 'personal' | 'notes') => void;
  setFilter: (filter: LibraryState['filter']) => void;
  setSearchQuery: (query: string) => void;
  deleteItem: (id: string, category: 'personal' | 'notes') => void;
}

// Mock Data
const mockPersonal: MediaItem[] = [
  {
    id: '1',
    type: 'image',
    title: 'Sunset at the Beach',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
    date: '2 hours ago',
    tags: ['Nature', 'Travel'],
  },
  {
    id: '2',
    type: 'video',
    title: 'City Lights',
    thumbnail: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df',
    duration: '0:45',
    date: 'Yesterday',
    tags: ['Urban', 'Night'],
  },
];

const mockNotes: MediaItem[] = [
  {
    id: 'n1',
    type: 'meeting',
    title: 'Project Kickoff',
    date: 'Today, 10:00 AM',
    summary: 'Discussed the new roadmap and assigned tasks.',
    actionItems: ['Create Jira tickets', 'Schedule follow-up'],
    participants: ['Alice', 'Bob'],
  },
];

export const useLibraryStore = create<LibraryState>((set) => ({
  personalItems: mockPersonal,
  noteItems: mockNotes,
  filter: 'all',
  searchQuery: '',

  addItem: (item, category) =>
    set((state) => ({
      [category === 'personal' ? 'personalItems' : 'noteItems']: [
        item,
        ...(category === 'personal' ? state.personalItems : state.noteItems),
      ],
    })),

  setFilter: (filter) => set({ filter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  deleteItem: (id, category) =>
    set((state) => ({
      [category === 'personal' ? 'personalItems' : 'noteItems']: (category ===
      'personal'
        ? state.personalItems
        : state.noteItems
      ).filter((item) => item.id !== id),
    })),
}));
