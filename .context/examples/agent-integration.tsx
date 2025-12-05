/**
 * Example: Agent Integration Template
 *
 * This is a reference implementation showing how to integrate
 * the LangGraph multi-agent system into your components.
 *
 * Key Features:
 * - Agent routing
 * - Conversation context
 * - Loading states
 * - Error handling
 * - Agent indicators
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/contexts/ThemeContext';
import { useHaptics } from '@/hooks/useHaptics';
import { langgraphClient } from '@/lib/agents/AgentManager';

// 1. Types
interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  agent?: string;
  timestamp: Date;
}

interface AgentResponse {
  agent_used: string;
  response: string;
  confidence: number;
  suggestions?: string[];
}

// 2. Component
export const AgentChatExample = () => {
  const { theme, colors } = useTheme();
  const { triggerHaptic } = useHaptics();

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [activeAgent, setActiveAgent] = useState<string>('');
  const userId = 'user_123'; // Get from auth context

  // ========================================
  // Core Agent Interaction
  // ========================================

  /**
   * Send message to agent system
   */
  const sendMessage = async (content: string) => {
    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsThinking(true);

    try {
      // Invoke LangGraph with conversation context
      const result = await langgraphClient.invoke({
        input: content,
        config: {
          configurable: {
            thread_id: userId, // ✅ Maintains conversation context
          },
        },
      });

      // Extract agent and response
      const agentResponse = result as AgentResponse;
      setActiveAgent(agentResponse.agent_used);

      // Add agent response to chat
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: agentResponse.response,
        role: 'assistant',
        agent: agentResponse.agent_used,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Agent error:', error);

      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        role: 'assistant',
        agent: 'error',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  };

  /**
   * Handle send button press
   */
  const handleSend = () => {
    if (!inputValue.trim()) return;

    triggerHaptic('impact', 'light');
    sendMessage(inputValue.trim());
  };

  // ========================================
  // Agent Indicator Component
  // ========================================

  const AgentIndicator = ({ agent }: { agent: string }) => {
    const agentInfo: Record<
      string,
      { icon: string; color: string; name: string }
    > = {
      finance: { icon: '💰', color: '#10B981', name: 'Finance' },
      health: { icon: '💪', color: '#EF4444', name: 'Health' },
      relationships: { icon: '❤️', color: '#F59E0B', name: 'Relationships' },
      career: { icon: '💼', color: '#3B82F6', name: 'Career' },
      mindfulness: { icon: '🧘', color: '#8B5CF6', name: 'Mindfulness' },
      creativity: { icon: '🎨', color: '#EC4899', name: 'Creativity' },
      goals: { icon: '🎯', color: '#14B8A6', name: 'Goals' },
      general: { icon: '💬', color: '#6B7280', name: 'General' },
    };

    const info = agentInfo[agent] || agentInfo.general;

    return (
      <View style={[styles.agentIndicator, { borderColor: info.color }]}>
        <Text style={styles.agentIcon}>{info.icon}</Text>
        <Text style={[styles.agentName, { color: info.color }]}>
          {info.name}
        </Text>
      </View>
    );
  };

  // ========================================
  // Message Bubble Component
  // ========================================

  const MessageBubble = ({ message }: { message: Message }) => {
    const isUser = message.role === 'user';

    return (
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.assistantBubble,
        ]}
      >
        {/* Show agent indicator for assistant messages */}
        {!isUser && message.agent && (
          <AgentIndicator agent={message.agent} />
        )}

        <BlurView
          intensity={60}
          tint={theme}
          style={[
            styles.bubbleGlass,
            isUser && { backgroundColor: 'rgba(59, 130, 246, 0.1)' },
          ]}
        >
          <Text style={[styles.messageText, { color: colors.text }]}>
            {message.content}
          </Text>
        </BlurView>

        <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
          {message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  // ========================================
  // Thinking Indicator
  // ========================================

  const ThinkingIndicator = () => (
    <View style={styles.thinkingContainer}>
      <AgentIndicator agent={activeAgent || 'general'} />
      <Text style={[styles.thinkingText, { color: colors.textSecondary }]}>
        Thinking...
      </Text>
      <View style={styles.dots}>
        <Text style={styles.dot}>●</Text>
        <Text style={styles.dot}>●</Text>
        <Text style={styles.dot}>●</Text>
      </View>
    </View>
  );

  // ========================================
  // Render
  // ========================================

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Messages */}
      <View style={styles.messagesContainer}>
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* Thinking indicator */}
        {isThinking && <ThinkingIndicator />}
      </View>

      {/* Input */}
      <BlurView intensity={80} tint={theme} style={styles.inputContainer}>
        <TextInput
          value={inputValue}
          onChangeText={setInputValue}
          placeholder="Ask anything..."
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { color: colors.text }]}
          onSubmitEditing={handleSend}
          editable={!isThinking}
        />

        <Pressable
          onPress={handleSend}
          disabled={!inputValue.trim() || isThinking}
          style={[
            styles.sendButton,
            (!inputValue.trim() || isThinking) && styles.sendButtonDisabled,
          ]}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </Pressable>
      </BlurView>
    </View>
  );
};

// ========================================
// Styles
// ========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageBubble: {
    marginBottom: 16,
  },
  userBubble: {
    alignItems: 'flex-end',
  },
  assistantBubble: {
    alignItems: 'flex-start',
  },
  bubbleGlass: {
    borderRadius: 16,
    padding: 12,
    maxWidth: '80%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
    marginHorizontal: 8,
  },
  agentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  agentIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  agentName: {
    fontSize: 12,
    fontWeight: '600',
  },
  thinkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  thinkingText: {
    fontSize: 14,
    marginLeft: 8,
  },
  dots: {
    flexDirection: 'row',
    marginLeft: 4,
  },
  dot: {
    fontSize: 8,
    marginHorizontal: 2,
    opacity: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  sendButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

// ========================================
// Usage Notes
// ========================================

/*
Key Integration Points:

1. LangGraph Client Setup:
   - Configure in lib/agents/AgentManager.ts
   - Use thread_id for conversation context

2. Agent Routing:
   - Automatic based on message content
   - Supervisor selects appropriate specialist

3. UI Feedback:
   - Show which agent is responding
   - Display thinking state
   - Handle errors gracefully

4. Context Management:
   - thread_id maintains conversation history
   - Agent remembers previous messages
   - Can reference earlier context

5. Error Handling:
   - Catch network errors
   - Fallback to general agent
   - Show user-friendly error messages

Advanced Features:

1. Suggested Questions:
   - Use result.suggestions for follow-up prompts

2. Agent Confidence:
   - Display confidence score
   - Warn if confidence is low

3. Agent Handoff:
   - Allow manual agent selection
   - Show when agent hands off to another

4. Streaming Responses:
   - Use LangGraph streaming for real-time responses
   - Show text as it's generated

5. Multi-Modal:
   - Send images, voice, video to agents
   - Handle multi-modal responses
*/
