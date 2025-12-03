import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { analyzeNote } from '@/lib/think';
import {
  db,
  type Message as DbMessage,
  type Conversation,
} from '@/lib/database';

export interface Message {
  id: string;
  role: 'user' | 'ai' | 'system';
  content: string;
  timestamp: number;
  type?: 'text' | 'image' | 'audio';
  mediaUrl?: string;
  agentName?: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: number;
  activeAgent: string;
}

interface ChatState {
  // Current session
  messages: Message[];
  isTyping: boolean;
  mode: 'chat' | 'avatar';
  voiceMode: boolean;
  activeSessionId: string | null;
  error: string | null;

  // Session history
  sessions: ChatSession[];

  // User context
  userId: string | null;

  // Actions
  sendMessage: (
    content: string,
    role?: 'user' | 'ai',
    options?: { userId?: string; agentName?: string }
  ) => Promise<void>;
  setTyping: (typing: boolean) => void;
  setMode: (mode: 'chat' | 'avatar') => void;
  setVoiceMode: (enabled: boolean) => void;
  setError: (message: string | null) => void;
  clearHistory: () => void;

  // Session management
  createNewSession: () => void;
  loadSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;

  // Supabase sync
  setUserId: (userId: string | null) => void;
  syncWithSupabase: () => Promise<void>;
  loadFromSupabase: () => Promise<void>;
}

const createNewSessionData = (): ChatSession => ({
  id: `session-${Date.now()}`,
  title: 'New Chat',
  messages: [],
  lastUpdated: Date.now(),
  activeAgent: 'alter_ego',
});

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      isTyping: false,
      mode: 'chat',
      voiceMode: false,
      activeSessionId: null,
      error: null,
      sessions: [],
      userId: null,

      sendMessage: async (content, role = 'user', options) => {
        const text = content.trim();
        if (!text) return;

        const state = get();
        let sessionId = state.activeSessionId;

        // Create new session if needed
        if (!sessionId) {
          const newSession = createNewSessionData();
          sessionId = newSession.id;
          set({
            activeSessionId: sessionId,
            sessions: [newSession, ...state.sessions],
          });
        }

        const newMessage: Message = {
          id: Date.now().toString(),
          role,
          content: text,
          timestamp: Date.now(),
          agentName: options?.agentName,
        };

        // Add message to current session
        set((s) => {
          const updatedMessages = [...s.messages, newMessage];
          const updatedSessions = s.sessions.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  messages: updatedMessages,
                  lastUpdated: Date.now(),
                  title:
                    session.messages.length === 0
                      ? text.slice(0, 30)
                      : session.title,
                }
              : session
          );

          return {
            messages: updatedMessages,
            sessions: updatedSessions,
            isTyping: role === 'user' ? true : s.isTyping,
            error: null,
          };
        });

        // Save to Supabase if user is logged in
        const userId = options?.userId || state.userId;
        if (userId && sessionId) {
          try {
            // Create conversation in DB if this is first message
            const session = get().sessions.find((s) => s.id === sessionId);
            if (session?.messages.length === 1) {
              const dbConversation = await db.conversations.create(
                userId,
                text.slice(0, 50)
              );
              if (dbConversation) {
                // Update session with DB ID
                set((s) => ({
                  sessions: s.sessions.map((sess) =>
                    sess.id === sessionId
                      ? { ...sess, id: dbConversation.id }
                      : sess
                  ),
                  activeSessionId: dbConversation.id,
                }));
                sessionId = dbConversation.id;
              }
            }

            // Save message to DB
            await db.messages.create({
              conversation_id: sessionId,
              user_id: userId,
              role: newMessage.role,
              content: newMessage.content,
              agent_name: newMessage.agentName ?? null,
              media_url: newMessage.mediaUrl ?? null,
              media_type: null,
            });
          } catch (e) {
            console.error('Failed to sync message to Supabase:', e);
          }
        }

        // Trigger AI response if user sent message
        if (role === 'user') {
          try {
            const response = await analyzeNote({
              noteId: newMessage.id,
              text,
              userId: userId ?? undefined,
            });

            const aiResponse: Message = {
              id: (Date.now() + 1).toString(),
              role: 'ai',
              content:
                response.summary?.trim() ||
                'I hear you. That sounds interesting. Tell me more.',
              timestamp: Date.now(),
              agentName: response.agent || 'alter_ego',
            };

            set((s) => {
              const updatedMessages = [...s.messages, aiResponse];
              const updatedSessions = s.sessions.map((session) =>
                session.id === sessionId
                  ? {
                      ...session,
                      messages: updatedMessages,
                      lastUpdated: Date.now(),
                    }
                  : session
              );

              return {
                messages: updatedMessages,
                sessions: updatedSessions,
                isTyping: false,
              };
            });

            // Save AI response to Supabase
            if (userId && sessionId) {
              await db.messages.create({
                conversation_id: sessionId,
                user_id: userId,
                role: 'ai',
                content: aiResponse.content,
                agent_name: aiResponse.agentName || null,
                media_url: null,
                media_type: null,
              });
            }
          } catch (error) {
            const fallbackMessage =
              error instanceof Error ? error.message : 'Unknown error';

            set((s) => ({
              messages: [
                ...s.messages,
                {
                  id: (Date.now() + 2).toString(),
                  role: 'ai' as const,
                  content:
                    "I'm having trouble connecting right now, but I'm still here. Let's try again in a moment.",
                  timestamp: Date.now(),
                },
              ],
              isTyping: false,
              error: fallbackMessage,
            }));
          }
        }
      },

      setTyping: (isTyping) => set({ isTyping }),
      setMode: (mode) => set({ mode }),
      setVoiceMode: (voiceMode) => set({ voiceMode }),
      setError: (error) => set({ error }),

      clearHistory: () => {
        const state = get();
        // Clear current session messages
        set((s) => ({
          messages: [],
          isTyping: false,
          error: null,
          sessions: s.sessions.map((session) =>
            session.id === s.activeSessionId
              ? { ...session, messages: [], lastUpdated: Date.now() }
              : session
          ),
        }));
      },

      createNewSession: () => {
        const newSession = createNewSessionData();
        set((s) => ({
          activeSessionId: newSession.id,
          messages: [],
          sessions: [newSession, ...s.sessions],
          isTyping: false,
          error: null,
        }));
      },

      loadSession: (sessionId) => {
        const state = get();
        const session = state.sessions.find((s) => s.id === sessionId);
        if (session) {
          set({
            activeSessionId: sessionId,
            messages: session.messages,
            isTyping: false,
            error: null,
          });
        }
      },

      deleteSession: (sessionId) => {
        const state = get();
        const newSessions = state.sessions.filter((s) => s.id !== sessionId);

        // If deleting active session, switch to another or create new
        if (state.activeSessionId === sessionId) {
          if (newSessions.length > 0) {
            set({
              sessions: newSessions,
              activeSessionId: newSessions[0].id,
              messages: newSessions[0].messages,
            });
          } else {
            const newSession = createNewSessionData();
            set({
              sessions: [newSession],
              activeSessionId: newSession.id,
              messages: [],
            });
          }
        } else {
          set({ sessions: newSessions });
        }

        // Delete from Supabase
        if (state.userId) {
          db.conversations.delete(sessionId).catch(console.error);
        }
      },

      setUserId: (userId) => {
        set({ userId });
        if (userId) {
          // Load data from Supabase when user logs in
          get().loadFromSupabase();
        }
      },

      syncWithSupabase: async () => {
        const state = get();
        if (!state.userId) return;

        // Sync all sessions to Supabase
        for (const session of state.sessions) {
          try {
            const existing = await db.conversations.get(session.id);
            if (!existing) {
              // Create new conversation
              const created = await db.conversations.create(
                state.userId,
                session.title
              );
              if (created) {
                // Save all messages
                for (const msg of session.messages) {
                  await db.messages.create({
                    conversation_id: created.id,
                    user_id: state.userId,
                    role: msg.role,
                    content: msg.content,
                    agent_name: msg.agentName || null,
                    media_url: msg.mediaUrl || null,
                    media_type: null,
                  });
                }
              }
            }
          } catch (e) {
            console.error('Failed to sync session:', session.id, e);
          }
        }
      },

      loadFromSupabase: async () => {
        const state = get();
        if (!state.userId) return;

        try {
          const conversations = await db.conversations.list(state.userId);

          const loadedSessions: ChatSession[] = await Promise.all(
            conversations.map(async (conv) => {
              const messages = await db.messages.list(conv.id);
              return {
                id: conv.id,
                title: conv.title,
                messages: messages.map((m) => ({
                  id: m.id,
                  role: m.role,
                  content: m.content,
                  timestamp: new Date(m.created_at).getTime(),
                  agentName: m.agent_name || undefined,
                  mediaUrl: m.media_url || undefined,
                })),
                lastUpdated: new Date(conv.updated_at).getTime(),
                activeAgent: conv.active_agent,
              };
            })
          );

          if (loadedSessions.length > 0) {
            set({
              sessions: loadedSessions,
              activeSessionId: loadedSessions[0].id,
              messages: loadedSessions[0].messages,
            });
          }
        } catch (e) {
          console.error('Failed to load from Supabase:', e);
        }
      },
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
        messages: state.messages,
        mode: state.mode,
        voiceMode: state.voiceMode,
      }),
    }
  )
);
