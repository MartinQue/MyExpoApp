/**
 * Example: Zustand Store Template
 *
 * This is a reference implementation showing the standard pattern
 * for creating Zustand stores in the MyExpoApp monorepo.
 *
 * Key Features:
 * - TypeScript interface
 * - Async actions with error handling
 * - Loading states
 * - Reset method
 * - Service layer integration
 */

import { create } from 'zustand';

// 1. Import Types
interface Item {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  userId: string;
}

interface CreateItemInput {
  title: string;
  description: string;
}

// 2. Define State Interface
interface ExampleStoreState {
  // Data
  items: Item[];
  selectedItem: Item | null;

  // UI State
  isLoading: boolean;
  error: string | null;

  // Sync Actions
  setItems: (items: Item[]) => void;
  selectItem: (item: Item | null) => void;
  clearError: () => void;

  // Async Actions
  fetchItems: (userId: string) => Promise<void>;
  createItem: (userId: string, input: CreateItemInput) => Promise<void>;
  updateItem: (id: string, updates: Partial<Item>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;

  // Utility
  reset: () => void;
}

// 3. Create the Store
export const useExampleStore = create<ExampleStoreState>((set, get) => ({
  // ========================================
  // Initial State
  // ========================================
  items: [],
  selectedItem: null,
  isLoading: false,
  error: null,

  // ========================================
  // Sync Actions
  // ========================================

  setItems: (items) => set({ items }),

  selectItem: (item) => set({ selectedItem: item }),

  clearError: () => set({ error: null }),

  // ========================================
  // Async Actions
  // ========================================

  /**
   * Fetch all items for a user
   */
  fetchItems: async (userId: string) => {
    set({ isLoading: true, error: null });

    try {
      // Call service layer (never call API directly)
      const items = await ExampleService.getItems(userId);

      set({
        items,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch items',
        isLoading: false,
      });
    }
  },

  /**
   * Create a new item
   */
  createItem: async (userId: string, input: CreateItemInput) => {
    set({ isLoading: true, error: null });

    try {
      const newItem = await ExampleService.createItem(userId, input);

      // Optimistically add to list
      set((state) => ({
        items: [newItem, ...state.items],
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create item',
        isLoading: false,
      });
      throw error; // Re-throw for component handling
    }
  },

  /**
   * Update an existing item
   */
  updateItem: async (id: string, updates: Partial<Item>) => {
    // Optimistic update
    const previousItems = get().items;

    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));

    try {
      await ExampleService.updateItem(id, updates);
    } catch (error) {
      // Rollback on error
      set({
        items: previousItems,
        error: error instanceof Error ? error.message : 'Failed to update item',
      });
      throw error;
    }
  },

  /**
   * Delete an item
   */
  deleteItem: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      await ExampleService.deleteItem(id);

      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
        selectedItem: state.selectedItem?.id === id ? null : state.selectedItem,
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete item',
        isLoading: false,
      });
      throw error;
    }
  },

  // ========================================
  // Utility
  // ========================================

  /**
   * Reset store to initial state
   */
  reset: () =>
    set({
      items: [],
      selectedItem: null,
      isLoading: false,
      error: null,
    }),
}));

// ========================================
// Usage Examples (for documentation)
// ========================================

/*
// 1. In a component - fetch items on mount
import { useExampleStore } from '@/stores/exampleStore';

export const ExampleList = () => {
  const items = useExampleStore((state) => state.items);
  const isLoading = useExampleStore((state) => state.isLoading);
  const fetchItems = useExampleStore((state) => state.fetchItems);

  useEffect(() => {
    fetchItems(userId);
  }, [fetchItems, userId]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <FlatList
      data={items}
      renderItem={({ item }) => <ItemCard item={item} />}
      keyExtractor={(item) => item.id}
    />
  );
};

// 2. Select only what you need (performance)
const items = useExampleStore((state) => state.items);
const isLoading = useExampleStore((state) => state.isLoading);

// 3. Call actions
const createItem = useExampleStore((state) => state.createItem);
const handleCreate = async () => {
  try {
    await createItem(userId, { title: 'New Item', description: 'Description' });
  } catch (error) {
    showError(error.message);
  }
};

// 4. Reset on unmount
useEffect(() => {
  return () => {
    useExampleStore.getState().reset();
  };
}, []);
*/

// ========================================
// Placeholder Service (would be in lib/services/)
// ========================================

class ExampleService {
  static async getItems(userId: string): Promise<Item[]> {
    // Implementation in lib/services/ExampleService.ts
    throw new Error('Not implemented');
  }

  static async createItem(
    userId: string,
    input: CreateItemInput
  ): Promise<Item> {
    throw new Error('Not implemented');
  }

  static async updateItem(id: string, updates: Partial<Item>): Promise<void> {
    throw new Error('Not implemented');
  }

  static async deleteItem(id: string): Promise<void> {
    throw new Error('Not implemented');
  }
}
