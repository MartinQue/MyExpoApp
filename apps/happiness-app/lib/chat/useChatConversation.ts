import { useState, useCallback, useRef, useEffect } from 'react';
import { FlatList } from 'react-native';
import { ChatMessage, sendMessageToAI } from '@/components/chat/ChatHelpers';
import { useVoiceContext } from '@/contexts/VoiceContext';
import * as haptics from '@/lib/haptics';

interface UseChatConversationOptions {
  initialMessages?: ChatMessage[];
  enableVoice?: boolean;
  onMessageSent?: (message: ChatMessage) => void;
  onResponseReceived?: (message: ChatMessage) => void;
}

export function useChatConversation(options: UseChatConversationOptions = {}) {
  const {
    initialMessages = [],
    enableVoice = false,
    onMessageSent,
    onResponseReceived,
  } = options;
  
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isThinking, setIsThinking] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  
  const {
    isListening,
    isTranscribing,
    duration,
    startRecording,
    stopRecording,
    cancelRecording,
    error: voiceError,
  } = useVoiceContext();
  
  // Scroll to bottom helper
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);
  
  // Send message
  const handleSend = useCallback(async (text: string) => {
    if (!text.trim()) return;
    
    haptics.send();
    
    const userMsg: ChatMessage = {
      _id: `user_${Date.now()}`,
      text: text.trim(),
      createdAt: new Date(),
      user: { _id: 1, name: 'You' },
    };
    
    setMessages((prev) => [...prev, userMsg]);
    onMessageSent?.(userMsg);
    scrollToBottom();
    setIsThinking(true);
    
    try {
      const response = await sendMessageToAI(text);
      
      haptics.success();
      setMessages((prev) => [...prev, response]);
      onResponseReceived?.(response);
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMsg: ChatMessage = {
        _id: `error_${Date.now()}`,
        text: "Something went wrong. Let's try that again.",
        createdAt: new Date(),
        user: { _id: 2, name: 'Alter Ego' },
        error: true,
      };
      
      setMessages((prev) => [...prev, errorMsg]);
      haptics.error();
    } finally {
      setIsThinking(false);
    }
  }, [enableVoice, onMessageSent, onResponseReceived, scrollToBottom]);
  
  // Voice toggle
  const handleVoiceToggle = useCallback(async (recording: boolean) => {
    if (recording) {
      const started = await startRecording();
      if (!started) {
        const errorMsg: ChatMessage = {
          _id: `error_${Date.now()}`,
          text: "Couldn't start recording. Check your microphone permissions.",
          createdAt: new Date(),
          user: { _id: 2, name: 'Alter Ego' },
          error: true,
        };
        setMessages((prev) => [...prev, errorMsg]);
        haptics.error();
      }
    } else {
      try {
        const text = await stopRecording();
        if (text && text.trim()) {
          handleSend(text);
        } else if (text === '') {
          const errorMsg: ChatMessage = {
            _id: `error_${Date.now()}`,
            text: "I didn't catch that. Could you try speaking again?",
            createdAt: new Date(),
            user: { _id: 2, name: 'Alter Ego' },
            error: true,
          };
          setMessages((prev) => [...prev, errorMsg]);
          haptics.warning();
        }
      } catch (error) {
        console.error('Voice error:', error);
        const errorMsg: ChatMessage = {
          _id: `error_${Date.now()}`,
          text: "Something went wrong with voice input. Let's try typing instead.",
          createdAt: new Date(),
          user: { _id: 2, name: 'Alter Ego' },
          error: true,
        };
        setMessages((prev) => [...prev, errorMsg]);
        haptics.error();
      }
    }
  }, [startRecording, stopRecording, handleSend]);
  
  // Handle voice errors
  useEffect(() => {
    if (voiceError) {
      const errorMsg: ChatMessage = {
        _id: `error_${Date.now()}`,
        text: `Voice error: ${voiceError}. Please try again or type your message.`,
        createdAt: new Date(),
        user: { _id: 2, name: 'Alter Ego' },
        error: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
      haptics.error();
    }
  }, [voiceError]);
  
  return {
    // State
    messages,
    setMessages,
    isThinking,
    isListening,
    isTranscribing,
    duration,
    voiceError,
    flatListRef,
    
    // Actions
    handleSend,
    handleVoiceToggle,
    cancelRecording,
    scrollToBottom,
  };
}
