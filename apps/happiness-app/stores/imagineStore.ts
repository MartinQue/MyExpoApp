import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '@/lib/database';

export interface ImageGeneration {
  id: string;
  prompt: string;
  enhancedPrompt?: string;
  imageUrl: string;
  style?: string;
  aspectRatio?: string;
  creditsUsed: number;
  favorited: boolean;
  createdAt: string;
}

interface ImagineState {
  generations: ImageGeneration[];
  favorites: ImageGeneration[];
  isLoading: boolean;
  userId: string | null;

  // Actions
  addGeneration: (
    generation: Omit<ImageGeneration, 'id' | 'createdAt'>
  ) => Promise<void>;
  toggleFavorite: (id: string) => void;
  deleteGeneration: (id: string) => void;

  // Supabase sync
  setUserId: (userId: string | null) => void;
  loadFromSupabase: () => Promise<void>;
}

export const useImagineStore = create<ImagineState>()(
  persist(
    (set, get) => ({
      generations: [],
      favorites: [],
      isLoading: false,
      userId: null,

      addGeneration: async (generationData) => {
        const state = get();
        const newGeneration: ImageGeneration = {
          ...generationData,
          id: `gen-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };

        set((s) => ({
          generations: [newGeneration, ...s.generations],
        }));

        // Sync to Supabase
        if (state.userId) {
          try {
            const dbImage = await db.images.create({
              user_id: state.userId,
              prompt: newGeneration.prompt,
              enhanced_prompt: newGeneration.enhancedPrompt ?? null,
              image_url: newGeneration.imageUrl,
              style: newGeneration.style ?? null,
              aspect_ratio: newGeneration.aspectRatio ?? null,
              credits_used: newGeneration.creditsUsed,
              favorited: false,
            });

            if (dbImage) {
              // Update local generation with DB ID
              set((s) => ({
                generations: s.generations.map((g) =>
                  g.id === newGeneration.id ? { ...g, id: dbImage.id } : g
                ),
              }));
            }
          } catch (e) {
            console.error('Failed to sync image to Supabase:', e);
          }
        }
      },

      toggleFavorite: (id) => {
        const state = get();
        const generation = state.generations.find((g) => g.id === id);
        if (!generation) return;

        const newFavorited = !generation.favorited;

        set((s) => ({
          generations: s.generations.map((g) =>
            g.id === id ? { ...g, favorited: newFavorited } : g
          ),
          favorites: newFavorited
            ? [...s.favorites, { ...generation, favorited: true }]
            : s.favorites.filter((f) => f.id !== id),
        }));

        // Sync to Supabase
        if (state.userId) {
          db.images.toggleFavorite(id, newFavorited).catch(console.error);
        }
      },

      deleteGeneration: (id) => {
        set((s) => ({
          generations: s.generations.filter((g) => g.id !== id),
          favorites: s.favorites.filter((f) => f.id !== id),
        }));

        // Delete from Supabase
        const userId = get().userId;
        if (userId) {
          db.images.delete(id).catch(console.error);
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
          const dbImages = await db.images.list(state.userId, 50);

          if (dbImages.length > 0) {
            const generations: ImageGeneration[] = dbImages.map((img) => ({
              id: img.id,
              prompt: img.prompt,
              enhancedPrompt: img.enhanced_prompt ?? undefined,
              imageUrl: img.image_url,
              style: img.style ?? undefined,
              aspectRatio: img.aspect_ratio ?? undefined,
              creditsUsed: img.credits_used,
              favorited: img.favorited,
              createdAt: img.created_at,
            }));

            const favorites = generations.filter((g) => g.favorited);

            set({ generations, favorites, isLoading: false });
          } else {
            set({ isLoading: false });
          }
        } catch (e) {
          console.error('Failed to load images from Supabase:', e);
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'imagine-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        generations: state.generations.slice(0, 20), // Only persist last 20 locally
        favorites: state.favorites,
      }),
    }
  )
);
