import { projectId, publicAnonKey } from './supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-9de96250`;

export async function apiCall(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API Error on ${endpoint}:`, errorText);
    throw new Error(`API request failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

// Agent-specific API calls
export const agentAPI = {
  // Get contextual feed based on time, location, mood
  getContextualFeed: async (context: {
    time?: string;
    location?: string;
    mood?: string;
  }) => {
    return apiCall('/feed', {
      method: 'POST',
      body: JSON.stringify(context),
    });
  },

  // Chat with AI
  sendMessage: async (message: string, conversationId?: string) => {
    return apiCall('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, conversationId }),
    });
  },

  // Get user memory/profile
  getUserMemory: async () => {
    return apiCall('/memory');
  },

  // Update user memory
  updateMemory: async (updates: any) => {
    return apiCall('/memory', {
      method: 'POST',
      body: JSON.stringify(updates),
    });
  },

  // Get plans and goals
  getPlans: async () => {
    return apiCall('/plans');
  },

  // Create or update a plan
  savePlan: async (plan: any) => {
    return apiCall('/plans', {
      method: 'POST',
      body: JSON.stringify(plan),
    });
  },

  // Get library items
  getLibraryItems: async (type?: string) => {
    const query = type ? `?type=${type}` : '';
    return apiCall(`/library${query}`);
  },

  // Generate image/video (imagination tab)
  generateMedia: async (prompt: string, type: 'image' | 'video', images?: string[]) => {
    return apiCall('/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt, type, images }),
    });
  },
};
