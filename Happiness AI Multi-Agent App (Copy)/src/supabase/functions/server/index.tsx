import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// ========================================
// USER MEMORY & PROFILE
// ========================================

// Get user memory/profile
app.get("/make-server-9de96250/memory", async (c) => {
  try {
    const memory = await kv.get("user_memory");
    
    if (!memory) {
      // Initialize default memory
      const defaultMemory = {
        preferences: {},
        context: {
          location: "home",
          timezone: "UTC",
        },
        goals: [],
        achievements: [],
        patterns: {},
        conversationHistory: [],
      };
      await kv.set("user_memory", defaultMemory);
      return c.json(defaultMemory);
    }
    
    return c.json(memory);
  } catch (error) {
    console.error("Error fetching user memory:", error);
    return c.json({ error: "Failed to fetch memory" }, 500);
  }
});

// Update user memory
app.post("/make-server-9de96250/memory", async (c) => {
  try {
    const updates = await c.req.json();
    const currentMemory = await kv.get("user_memory") || {};
    
    const updatedMemory = {
      ...currentMemory,
      ...updates,
      lastUpdated: new Date().toISOString(),
    };
    
    await kv.set("user_memory", updatedMemory);
    return c.json(updatedMemory);
  } catch (error) {
    console.error("Error updating user memory:", error);
    return c.json({ error: "Failed to update memory" }, 500);
  }
});

// ========================================
// CONTEXTUAL FEED
// ========================================

app.post("/make-server-9de96250/feed", async (c) => {
  try {
    const context = await c.req.json();
    const userMemory = await kv.get("user_memory") || {};
    
    // Mock contextual feed generation based on time, location, mood
    const feedCards = [
      {
        id: '1',
        type: 'motivation',
        title: 'Your Day Awaits',
        content: 'Based on your patterns, this is your peak productivity time.',
        context: context.time || 'morning',
      },
      // Add more contextual cards based on user memory and context
    ];
    
    return c.json({ cards: feedCards });
  } catch (error) {
    console.error("Error generating feed:", error);
    return c.json({ error: "Failed to generate feed" }, 500);
  }
});

// ========================================
// CHAT & AI AGENTS
// ========================================

app.post("/make-server-9de96250/chat", async (c) => {
  try {
    const { message, conversationId } = await c.req.json();
    
    // Get conversation history
    const convKey = conversationId || "default_conversation";
    const history = await kv.get(`chat_${convKey}`) || [];
    
    // Add user message
    const userMsg = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };
    
    history.push(userMsg);
    
    // Mock AI response (in production, integrate with LangChain/LangSmith)
    const aiResponse = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "I understand. How can I help you with that?",
      timestamp: new Date().toISOString(),
      agent: "general_agent",
    };
    
    history.push(aiResponse);
    
    // Save updated history
    await kv.set(`chat_${convKey}`, history);
    
    // Update user memory with conversation context
    const memory = await kv.get("user_memory") || {};
    memory.lastInteraction = new Date().toISOString();
    await kv.set("user_memory", memory);
    
    return c.json({ message: aiResponse, conversationId: convKey });
  } catch (error) {
    console.error("Error in chat:", error);
    return c.json({ error: "Chat failed" }, 500);
  }
});

// ========================================
// PLANS & GOALS
// ========================================

app.get("/make-server-9de96250/plans", async (c) => {
  try {
    const plans = await kv.get("user_plans") || [];
    return c.json(plans);
  } catch (error) {
    console.error("Error fetching plans:", error);
    return c.json({ error: "Failed to fetch plans" }, 500);
  }
});

app.post("/make-server-9de96250/plans", async (c) => {
  try {
    const plan = await c.req.json();
    const plans = await kv.get("user_plans") || [];
    
    // Add or update plan
    const existingIndex = plans.findIndex((p: any) => p.id === plan.id);
    if (existingIndex >= 0) {
      plans[existingIndex] = { ...plans[existingIndex], ...plan };
    } else {
      plans.push({ ...plan, id: Date.now().toString(), createdAt: new Date().toISOString() });
    }
    
    await kv.set("user_plans", plans);
    return c.json(plans);
  } catch (error) {
    console.error("Error saving plan:", error);
    return c.json({ error: "Failed to save plan" }, 500);
  }
});

// ========================================
// LIBRARY
// ========================================

app.get("/make-server-9de96250/library", async (c) => {
  try {
    const type = c.req.query("type");
    const library = await kv.get("user_library") || { personal: [], notes: [] };
    
    if (type) {
      return c.json(library[type] || []);
    }
    
    return c.json(library);
  } catch (error) {
    console.error("Error fetching library:", error);
    return c.json({ error: "Failed to fetch library" }, 500);
  }
});

// ========================================
// IMAGINATION / MEDIA GENERATION
// ========================================

app.post("/make-server-9de96250/generate", async (c) => {
  try {
    const { prompt, type, images } = await c.req.json();
    
    // Mock media generation (integrate with real AI services in production)
    const generated = {
      id: Date.now().toString(),
      type,
      prompt,
      url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe",
      thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe",
      createdAt: new Date().toISOString(),
    };
    
    // Store in library
    const library = await kv.get("user_library") || { personal: [], notes: [] };
    library.personal.push(generated);
    await kv.set("user_library", library);
    
    return c.json(generated);
  } catch (error) {
    console.error("Error generating media:", error);
    return c.json({ error: "Media generation failed" }, 500);
  }
});

// Health check endpoint
app.get("/make-server-9de96250/health", (c) => {
  return c.json({ status: "ok" });
});

Deno.serve(app.fetch);