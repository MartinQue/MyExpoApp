/**
 * useChat hook for chat functionality
 */

import { useState, useCallback } from 'react';
import { Message, QuickAction } from '@/types/chat';
import { analyzeNote } from '@/lib/think';
import { saveToMemory } from '@/lib/memory';
import { assessRisk } from '@/lib/safety';
import { useUser } from './useUser';
import { useChatStore } from '@/stores/chatStore';

export function useChat() {
  const { user } = useUser();
  const { messages, isLoading, error, selectedImage, addMessage, setLoading, setError, setSelectedImage } = useChatStore();

  const sendMessage = useCallback(
    async (text: string, imageUri?: string) => {
      if (!text.trim() && !imageUri) return;

      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        content: text,
        role: 'user',
        timestamp: new Date(),
        imageUri,
      };
      addMessage(userMessage);
      setSelectedImage(null);
      setLoading(true);
      setError(null);

      try {
        // Safety check
        const { level, reasons } = assessRisk(text);
        if (level === 'high') {
          console.warn('Crisis detected:', reasons);
          // TODO: Show crisis resources modal
        }

        // Get AI response with RAG memory
        const response = await analyzeNote({
          noteId: Date.now().toString(),
          text: text,
          userId: user?.id,
        });

        // Add AI response
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: response.summary || 'I apologize, something went wrong.',
          role: 'assistant',
          timestamp: new Date(),
        };
        addMessage(aiMessage);

        // Save to memory (background, non-blocking)
        if (user?.id) {
          saveToMemory({
            userId: user.id,
            text: text,
            kind: 'text',
          }).catch((err) => console.error('Memory save failed:', err));
        }
      } catch (err) {
        console.error('Send message error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMessage);

        // Add error message
        const errorMsg: Message = {
          id: (Date.now() + 2).toString(),
          content: 'Sorry, I encountered an error. Please try again.',
          role: 'assistant',
          timestamp: new Date(),
          error: errorMessage,
        };
        addMessage(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [user, addMessage, setLoading, setError, setSelectedImage]
  );

  const quickActions: QuickAction[] = [
    { id: '1', label: 'Plan my day', prompt: 'Help me plan my day' },
    { id: '2', label: 'Set a goal', prompt: 'I want to set a new goal' },
    { id: '3', label: 'How am I doing?', prompt: 'Show me my progress' },
    { id: '4', label: 'Motivate me', prompt: 'I need some motivation' },
  ];

  return {
    messages,
    isLoading,
    error,
    selectedImage,
    sendMessage,
    setSelectedImage,
    quickActions,
  };
}
