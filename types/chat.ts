/**
 * Chat types
 */

export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  content: string;
  role: MessageRole;
  timestamp: Date;
  imageUri?: string;
  isStreaming?: boolean;
  error?: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface QuickAction {
  id: string;
  label: string;
  prompt: string;
  icon?: string;
}
