# Multi-Agent System - MyExpoApp

Documentation for the LangGraph-powered multi-agent system in the Happiness App.

---

## 🤖 System Overview

The Happiness App uses a **multi-agent architecture** where a supervisor agent routes user messages to specialized agents based on the conversation topic.

### Architecture

```
User Message
    ↓
Supervisor Agent (LangGraph)
    ↓
Routes to appropriate specialist:
├── Finance Agent
├── Health Agent
├── Relationships Agent
├── Career Agent
├── Mindfulness Agent
├── Creativity Agent
├── Goals Agent
└── General Agent (fallback)
    ↓
Response back to user
```

---

## 🧠 Agent Descriptions

### Supervisor Agent
**Role:** Router and orchestrator
**Responsibility:** Analyzes user input and routes to the most appropriate specialist agent

**Logic:**
```python
if "money" or "budget" or "invest" in message:
    → Finance Agent
elif "health" or "fitness" or "diet" in message:
    → Health Agent
elif "relationship" or "family" or "friends" in message:
    → Relationships Agent
# ... etc
else:
    → General Agent
```

### Finance Agent
**Expertise:** Financial advice, budgeting, investing
**Topics:**
- Personal budgeting
- Saving strategies
- Investment basics
- Debt management
- Financial planning

**Example Prompts:**
- "Help me create a budget"
- "Should I invest in stocks?"
- "How can I save more money?"

### Health Agent
**Expertise:** Health, fitness, nutrition, wellness
**Topics:**
- Exercise routines
- Nutrition advice
- Sleep optimization
- Mental health
- Healthy habits

**Example Prompts:**
- "Create a workout plan for me"
- "What should I eat for better energy?"
- "How can I sleep better?"

### Relationships Agent
**Expertise:** Interpersonal relationships, communication
**Topics:**
- Family dynamics
- Friendships
- Romantic relationships
- Communication skills
- Conflict resolution

**Example Prompts:**
- "How do I handle conflict with my partner?"
- "Tips for making new friends"
- "Improving family relationships"

### Career Agent
**Expertise:** Career development, professional growth
**Topics:**
- Career planning
- Job search strategies
- Interview preparation
- Skill development
- Work-life balance

**Example Prompts:**
- "Help me prepare for a job interview"
- "How do I negotiate a salary?"
- "Career change advice"

### Mindfulness Agent
**Expertise:** Meditation, mindfulness, mental wellness
**Topics:**
- Meditation techniques
- Stress management
- Mindfulness practices
- Emotional regulation
- Present moment awareness

**Example Prompts:**
- "Guide me through a meditation"
- "How do I reduce stress?"
- "Mindfulness for beginners"

### Creativity Agent
**Expertise:** Creative pursuits, artistic expression
**Topics:**
- Creative hobbies
- Artistic inspiration
- Creative blocks
- Self-expression
- Innovation

**Example Prompts:**
- "Help me overcome creative block"
- "Ideas for a creative project"
- "How to develop creativity"

### Goals Agent
**Expertise:** Goal setting, habit formation, productivity
**Topics:**
- SMART goals
- Habit tracking
- Productivity systems
- Time management
- Progress tracking

**Example Prompts:**
- "Help me set a goal"
- "How do I build a new habit?"
- "Productivity tips"

### General Agent
**Expertise:** Fallback for miscellaneous topics
**Topics:**
- General conversation
- Topics not covered by specialists
- Small talk
- Exploratory questions

**Example Prompts:**
- "Tell me a joke"
- "What's the meaning of life?"
- "Random conversation"

---

## 🔌 Integration Pattern

### Frontend Integration

```typescript
// lib/agents/AgentManager.ts
import { Client } from '@langchain/langgraph-sdk';
import config from '@myexpoapp/shared-config';

// Initialize LangGraph client
export const langgraphClient = new Client({
  apiUrl: config.LANGGRAPH_URL,
});

// Agent interaction function
export const invokeAgent = async (
  message: string,
  userId: string
): Promise<AgentResponse> => {
  const result = await langgraphClient.invoke({
    input: message,
    config: {
      configurable: {
        thread_id: userId, // Conversation context
      },
    },
  });

  return {
    agent: result.agent_used,
    response: result.response,
    confidence: result.confidence,
  };
};
```

### React Hook Pattern

```typescript
// hooks/useAgentChat.ts
import { useState } from 'react';
import { invokeAgent } from '@/lib/agents/AgentManager';

export const useAgentChat = () => {
  const [response, setResponse] = useState<string>('');
  const [activeAgent, setActiveAgent] = useState<string>('');
  const [isThinking, setIsThinking] = useState(false);

  const sendMessage = async (message: string, userId: string) => {
    setIsThinking(true);

    try {
      const result = await invokeAgent(message, userId);

      setActiveAgent(result.agent);
      setResponse(result.response);

      return result;
    } catch (error) {
      console.error('Agent error:', error);
      throw error;
    } finally {
      setIsThinking(false);
    }
  };

  return {
    sendMessage,
    response,
    activeAgent,
    isThinking,
  };
};
```

### Component Usage

```typescript
import { useAgentChat } from '@/hooks/useAgentChat';
import { useChatStore } from '@/stores/chatStore';

export const ChatScreen = () => {
  const { sendMessage, activeAgent, isThinking } = useAgentChat();
  const userId = useChatStore((state) => state.userId);

  const handleSend = async (message: string) => {
    try {
      const result = await sendMessage(message, userId);

      // Display which agent responded
      console.log(`Response from ${result.agent}`);

      // Show response to user
      addMessageToChat({
        content: result.response,
        agent: result.agent,
        timestamp: new Date(),
      });
    } catch (error) {
      // Handle error
    }
  };

  return (
    <View>
      {isThinking && <ThinkingIndicator agent={activeAgent} />}
      <ChatMessages />
      <ChatInput onSend={handleSend} />
    </View>
  );
};
```

---

## 🎨 UI Integration

### Displaying Active Agent

```typescript
// components/chat/AgentIndicator.tsx
interface AgentIndicatorProps {
  agent: string;
}

export const AgentIndicator = ({ agent }: AgentIndicatorProps) => {
  const agentInfo = {
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
    <View style={[styles.container, { borderColor: info.color }]}>
      <Text style={styles.icon}>{info.icon}</Text>
      <Text style={[styles.name, { color: info.color }]}>
        {info.name} Agent
      </Text>
    </View>
  );
};
```

### Thinking Indicator

```typescript
// components/chat/ThinkingIndicator.tsx
export const ThinkingIndicator = ({ agent }: { agent: string }) => {
  return (
    <View style={styles.container}>
      <AgentIndicator agent={agent} />
      <Text style={styles.text}>Thinking...</Text>
      <LoadingDots />
    </View>
  );
};
```

---

## 🔄 Conversation Context

### Thread Management

Each user has a **thread_id** that maintains conversation context:

```typescript
// Conversation history is maintained server-side
const result = await langgraphClient.invoke({
  input: message,
  config: {
    configurable: {
      thread_id: userId, // Persists context
    },
  },
});
```

**Benefits:**
- Agent remembers previous messages
- Maintains context across sessions
- Can reference earlier conversation points
- Personalized responses based on history

### Clearing Context

```typescript
// Clear conversation history
export const clearAgentHistory = async (userId: string) => {
  await langgraphClient.invoke({
    input: '/clear',
    config: {
      configurable: {
        thread_id: userId,
      },
    },
  });
};
```

---

## 📊 Agent Response Format

### Standard Response

```typescript
interface AgentResponse {
  agent_used: string;         // Which agent responded
  response: string;            // Agent's message
  confidence: number;          // Routing confidence (0-1)
  suggestions?: string[];      // Follow-up suggestions
  metadata?: {
    reasoning: string;         // Why this agent was chosen
    alternatives: string[];    // Other considered agents
  };
}
```

### Example Response

```json
{
  "agent_used": "finance",
  "response": "I can help you create a budget! Let's start by...",
  "confidence": 0.95,
  "suggestions": [
    "Show me budgeting apps",
    "How much should I save?",
    "Investment basics"
  ],
  "metadata": {
    "reasoning": "Message contains 'budget' keyword",
    "alternatives": ["goals", "general"]
  }
}
```

---

## 🎯 Routing Logic

### Keyword-Based Routing

```python
# Simplified routing logic (Python backend)

def route_to_agent(message: str) -> str:
    message_lower = message.lower()

    # Finance
    if any(word in message_lower for word in ['money', 'budget', 'invest', 'save', 'debt']):
        return 'finance'

    # Health
    if any(word in message_lower for word in ['health', 'fitness', 'exercise', 'diet', 'workout']):
        return 'health'

    # Relationships
    if any(word in message_lower for word in ['relationship', 'partner', 'family', 'friend']):
        return 'relationships'

    # Career
    if any(word in message_lower for word in ['career', 'job', 'work', 'interview', 'salary']):
        return 'career'

    # Mindfulness
    if any(word in message_lower for word in ['meditate', 'stress', 'mindful', 'calm', 'relax']):
        return 'mindfulness'

    # Creativity
    if any(word in message_lower for word in ['creative', 'art', 'create', 'inspiration']):
        return 'creativity'

    # Goals
    if any(word in message_lower for word in ['goal', 'habit', 'productivity', 'plan']):
        return 'goals'

    # Default
    return 'general'
```

### Intent-Based Routing

For more sophisticated routing, use LLM to understand intent:

```python
from langchain.prompts import ChatPromptTemplate

routing_prompt = ChatPromptTemplate.from_template("""
Analyze this message and determine which specialist should respond:
- finance
- health
- relationships
- career
- mindfulness
- creativity
- goals
- general

Message: {message}

Respond with only the agent name.
""")
```

---

## 🚀 Advanced Features

### Multi-Agent Collaboration

Future enhancement: Multiple agents can collaborate on complex queries.

```python
# Example: Budget + health goals
user: "I want to save money and get fit"
→ Finance Agent: Budgeting advice
→ Health Agent: Fitness plan
→ Goals Agent: Combines into actionable plan
```

### Agent Handoff

Agents can hand off to other agents mid-conversation:

```python
Finance Agent: "For workout recommendations, let me connect you with our Health Agent"
→ Hands off to Health Agent
```

### Custom Agent Prompts

Each agent has a specialized system prompt:

```python
finance_agent_prompt = """
You are a friendly financial advisor helping users with:
- Budgeting and saving
- Investment basics
- Debt management
- Financial planning

Always provide practical, actionable advice.
Never give specific investment recommendations.
Encourage users to consult professionals for major decisions.
"""
```

---

## 📈 Monitoring & Analytics

### LangSmith Integration

```typescript
import config from '@myexpoapp/shared-config';

// LangSmith automatically tracks:
// - Agent invocations
// - Response times
// - Routing decisions
// - Error rates
// - User satisfaction

export const langgraphClient = new Client({
  apiUrl: config.LANGGRAPH_URL,
  apiKey: config.LANGCHAIN_API_KEY,
});
```

### Metrics to Track

- **Agent Usage:** Which agents are most popular?
- **Routing Accuracy:** Is the right agent being selected?
- **Response Quality:** User feedback on responses
- **Latency:** How long do responses take?
- **Error Rate:** How often do agents fail?

---

## 🔐 Safety & Moderation

### Content Filtering

```typescript
import { safety } from '@/lib/safety';

const handleMessage = async (message: string) => {
  // Check for crisis/harmful content
  const isSafe = await safety.checkContent(message);

  if (!isSafe) {
    return {
      response: safety.getCrisisResponse(),
      agent: 'safety',
    };
  }

  // Proceed with agent routing
  return await invokeAgent(message, userId);
};
```

### Agent Guardrails

Each agent has built-in guardrails:
- No medical diagnoses (Health Agent)
- No specific investment advice (Finance Agent)
- No legal advice (Career/General Agents)
- Crisis detection and resources

---

## 🎓 Best Practices

### 1. Always Include thread_id
```typescript
// ✅ CORRECT
await langgraphClient.invoke({
  input: message,
  config: { configurable: { thread_id: userId } },
});

// ❌ WRONG - No context
await langgraphClient.invoke({ input: message });
```

### 2. Show Active Agent
```typescript
// Let users know which specialist is responding
<AgentIndicator agent={activeAgent} />
```

### 3. Handle Errors Gracefully
```typescript
try {
  const result = await invokeAgent(message, userId);
} catch (error) {
  // Fallback to general agent or show error
  showError('Unable to reach agent. Please try again.');
}
```

### 4. Provide Feedback Mechanism
```typescript
// Let users rate agent responses
<AgentFeedback
  onRate={(rating) => trackAgentRating(activeAgent, rating)}
/>
```

### 5. Cache Responses
```typescript
// Cache frequently asked questions
const cacheKey = `agent:${agent}:${messageHash}`;
const cached = await cache.get(cacheKey);

if (cached) return cached;
```

---

## 🔮 Future Enhancements

### Voice Agents
- Voice interaction with specialized agents
- Real-time voice responses
- Voice-specific prompting

### Agent Memory
- Long-term memory across sessions
- User preference learning
- Personalized responses

### Custom Agents
- Users can create custom specialist agents
- Train on personal data
- Domain-specific expertise

### Multi-Modal Agents
- Image understanding
- Video analysis
- Document processing

---

**Version**: 1.0.0
**Last Updated**: December 3, 2025
**Backend**: LangGraph (Python)
**Frontend**: React Native + TypeScript
