import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, type LibraryItem as DbLibraryItem } from '@/lib/database';

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
  userId: string | null;
  isLoading: boolean;

  // Actions
  addItem: (
    item: Omit<MediaItem, 'id'>,
    category: 'personal' | 'notes'
  ) => Promise<void>;
  setFilter: (filter: LibraryState['filter']) => void;
  setSearchQuery: (query: string) => void;
  deleteItem: (id: string, category: 'personal' | 'notes') => void;
  updateItem: (
    id: string,
    updates: Partial<MediaItem>,
    category: 'personal' | 'notes'
  ) => void;

  // Supabase sync
  setUserId: (userId: string | null) => void;
  loadFromSupabase: () => Promise<void>;
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

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      personalItems: mockPersonal,
      noteItems: mockNotes,
      filter: 'all',
      searchQuery: '',
      userId: null,
      isLoading: false,

      addItem: async (itemData, category) => {
        const state = get();
        const newItem: MediaItem = {
          ...itemData,
          id: `item-${Date.now()}`,
        };

        if (category === 'personal') {
          set((s) => ({ personalItems: [newItem, ...s.personalItems] }));
        } else {
          set((s) => ({ noteItems: [newItem, ...s.noteItems] }));
        }

        // Sync to Supabase
        if (state.userId) {
          try {
            const dbItem = await db.library.create({
              user_id: state.userId,
              category,
              type: newItem.type,
              title: newItem.title,
              url: newItem.url ?? null,
              thumbnail: newItem.thumbnail ?? null,
              duration: newItem.duration ?? null,
              summary: newItem.summary ?? null,
              transcript: newItem.transcript ?? null,
              action_items: newItem.actionItems || [],
              participants: newItem.participants || [],
              tags: newItem.tags || [],
            });

            if (dbItem) {
              // Update local item with DB ID
              if (category === 'personal') {
                set((s) => ({
                  personalItems: s.personalItems.map((item) =>
                    item.id === newItem.id ? { ...item, id: dbItem.id } : item
                  ),
                }));
              } else {
                set((s) => ({
                  noteItems: s.noteItems.map((item) =>
                    item.id === newItem.id ? { ...item, id: dbItem.id } : item
                  ),
                }));
              }
            }
          } catch (e) {
            console.error('Failed to sync library item to Supabase:', e);
          }
        }
      },

      setFilter: (filter) => set({ filter }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),

      deleteItem: (id, category) => {
        if (category === 'personal') {
          set((s) => ({
            personalItems: s.personalItems.filter((item) => item.id !== id),
          }));
        } else {
          set((s) => ({
            noteItems: s.noteItems.filter((item) => item.id !== id),
          }));
        }

        // Delete from Supabase
        const userId = get().userId;
        if (userId) {
          db.library.delete(id).catch(console.error);
        }
      },

      updateItem: (id, updates, category) => {
        if (category === 'personal') {
          set((s) => ({
            personalItems: s.personalItems.map((item) =>
              item.id === id ? { ...item, ...updates } : item
            ),
          }));
        } else {
          set((s) => ({
            noteItems: s.noteItems.map((item) =>
              item.id === id ? { ...item, ...updates } : item
            ),
          }));
        }

        // Update in Supabase
        const userId = get().userId;
        if (userId) {
          db.library
            .update(id, {
              title: updates.title,
              url: updates.url ?? null,
              thumbnail: updates.thumbnail ?? null,
              summary: updates.summary ?? null,
              transcript: updates.transcript ?? null,
              tags: updates.tags || [],
            })
            .catch(console.error);
        }
      },

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
          const [personalItems, noteItems] = await Promise.all([
            db.library.list(state.userId, 'personal'),
            db.library.list(state.userId, 'notes'),
          ]);

          const mapItem = (item: DbLibraryItem): MediaItem => ({
            id: item.id,
            type: item.type,
            title: item.title,
            url: item.url ?? undefined,
            thumbnail: item.thumbnail ?? undefined,
            date: new Date(item.created_at).toLocaleDateString(),
            tags: item.tags,
            duration: item.duration ?? undefined,
            summary: item.summary ?? undefined,
            transcript: item.transcript ?? undefined,
            actionItems: item.action_items,
            participants: item.participants,
          });

          set({
            personalItems:
              personalItems.length > 0
                ? personalItems.map(mapItem)
                : state.personalItems,
            noteItems:
              noteItems.length > 0 ? noteItems.map(mapItem) : state.noteItems,
            isLoading: false,
          });
        } catch (e) {
          console.error('Failed to load library from Supabase:', e);
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'library-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        personalItems: state.personalItems,
        noteItems: state.noteItems,
        filter: state.filter,
      }),
    }
  )
);
