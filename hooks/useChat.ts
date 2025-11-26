/**
 * Simplified useChat hook that wraps the chat store.
 * Provides an escape hatch for future components that want
 * the chat quick actions and async send helper.
 */

import { useCallback } from 'react';
import { QuickAction } from '@/types/chat';
import { useChatStore } from '@/stores/chatStore';

export function useChat() {
  const { messages, sendMessage, isTyping, error, clearHistory } =
    useChatStore();

  const handleSend = useCallback(
    (text: string) => {
      return sendMessage(text);
    },
    [sendMessage]
  );

  const quickActions: QuickAction[] = [
    { id: '1', label: 'Plan my day', prompt: 'Help me plan my day' },
    { id: '2', label: 'Set a goal', prompt: 'I want to set a new goal' },
    { id: '3', label: 'How am I doing?', prompt: 'Show me my progress' },
    { id: '4', label: 'Motivate me', prompt: 'I need some motivation' },
  ];

  return {
    messages,
    sendMessage: handleSend,
    isTyping,
    error,
    clearHistory,
    quickActions,
  };
}
