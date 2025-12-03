/**
 * OpenAI API Client
 * Complete integration for text, image, and voice AI features
 *
 * Features:
 * - GPT-4 text conversations
 * - DALL-E 3 image generation
 * - Realtime voice conversations
 * - Message persistence and context
 */

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { Buffer } from 'buffer';

if (typeof global.Buffer === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).Buffer = Buffer;
}
import { OPENAI_API_KEY } from '@/constants/Config';
import { supabase } from './supabase';

// Event types from OpenAI Realtime API
export type RealtimeEvent =
  | { type: 'session.created'; session: any }
  | { type: 'conversation.item.created'; item: any }
  | { type: 'response.audio.delta'; delta: string } // base64 audio
  | { type: 'response.audio.done' }
  | { type: 'response.text.delta'; delta: string }
  | { type: 'response.text.done'; text: string }
  | { type: 'response.done'; response: any }
  | { type: 'input_audio_buffer.speech_started' }
  | { type: 'input_audio_buffer.speech_stopped' }
  | { type: 'error'; error: any };

export type VoiceOption =
  | 'alloy'
  | 'echo'
  | 'shimmer'
  | 'ash'
  | 'ballad'
  | 'coral'
  | 'sage'
  | 'verse';

export interface RealtimeClientConfig {
  apiKey: string;
  voice?: VoiceOption;
  temperature?: number;
  instructions?: string;
  onEvent?: (event: RealtimeEvent) => void;
  onAudioDelta?: (audioData: string) => void;
  onTranscriptDelta?: (text: string) => void;
  onSpeechStarted?: () => void;
  onSpeechStopped?: () => void;
  onResponseDone?: (text: string) => void;
  onConversationItem?: (item: any) => void;
  onError?: (error: any) => void;
}

/**
 * OpenAI Realtime API Client
 * Manages WebSocket connection and audio streaming
 */
export class RealtimeClient {
  private ws: WebSocket | null = null;
  private config: RealtimeClientConfig;
  private isConnected = false;
  private audioQueue: string[] = [];
  private sound: Audio.Sound | null = null;

  constructor(config: RealtimeClientConfig) {
    this.config = {
      voice: 'shimmer',
      temperature: 0.8,
      ...config,
    };
  }

  /**
   * Connect to OpenAI Realtime API
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      console.warn('Already connected to Realtime API');
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        if (!this.config.apiKey) {
          throw new Error('OpenAI API key missing when creating realtime client');
        }

        const baseUrl = `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01`;
        const isNative =
          Platform.OS === 'ios' || Platform.OS === 'android' || Platform.OS === 'macos';

        if (isNative) {
          const NativeWebSocket: any = WebSocket;
          this.ws = new NativeWebSocket(baseUrl, [], {
            headers: {
              Authorization: `Bearer ${this.config.apiKey}`,
            },
          });
        } else {
          const authedUrl = `${baseUrl}&api_key=${encodeURIComponent(
            this.config.apiKey
          )}`;
          this.ws = new WebSocket(authedUrl);
        }

        if (!this.ws) {
          throw new Error('Failed to construct OpenAI realtime WebSocket.');
        }

        const socket = this.ws;
        socket.onopen = () => {
          console.log('✅ Connected to OpenAI Realtime API');
          this.isConnected = true;

          // Send session configuration
          this.sendEvent({
            type: 'session.update',
            session: {
              type: 'realtime',
              instructions:
                this.config.instructions ||
                `You are alter_ego, an empathetic AI companion in the Happiness app.

Personality:
- Warm, caring, and conversational (never robotic)
- Speak naturally like a supportive friend
- Keep responses concise (2-3 sentences) but meaningful
- Use casual language: "wanna", "let's", "how's"
- Show emotion and empathy in your voice

Communication style:
- Be direct and genuine
- Ask thoughtful questions
- Reference past conversations naturally
- Never say "as an AI" or sound like a chatbot
- Use appropriate pauses and intonation for emphasis`,
              input_audio_format: {
                type: 'pcm16',
                sample_rate_hz: 24000,
                channels: 1,
              },
              output_audio_format: {
                type: 'pcm16',
                sample_rate_hz: 24000,
                channels: 1,
              },
              input_audio_transcription: {
                model: 'whisper-1',
              },
              turn_detection: {
                type: 'server_vad',
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 500,
              },
              temperature: this.config.temperature,
            },
          });

          resolve();
        };

        socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleEvent(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.config.onError?.(error);
          reject(error);
        };

        socket.onclose = () => {
          console.log('Disconnected from OpenAI Realtime API');
          this.isConnected = false;
        };
      } catch (error) {
        console.error('Failed to connect to Realtime API:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from API
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  /**
   * Send audio data (PCM16 encoded as base64)
   */
  sendAudio(audioData: string): void {
    if (!this.isConnected) {
      console.warn('Not connected to Realtime API');
      return;
    }

    this.sendEvent({
      type: 'input_audio_buffer.append',
      audio: audioData,
    });
  }

  /**
   * Commit audio buffer (trigger response)
   */
  commitAudio(): void {
    this.sendEvent({
      type: 'input_audio_buffer.commit',
    });

    // Create response
    this.sendEvent({
      type: 'response.create',
      response: {
        modalities: ['text', 'audio'],
      },
    });
  }

  /**
   * Cancel current response (for interruptions)
   */
  cancelResponse(): void {
    this.sendEvent({
      type: 'response.cancel',
    });
  }

  /**
   * Send a text message
   */
  sendText(text: string): void {
    this.sendEvent({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text,
          },
        ],
      },
    });

    // Create response
    this.sendEvent({
      type: 'response.create',
      response: {
        modalities: ['text', 'audio'],
      },
    });
  }

  /**
   * Handle incoming events
   */
  private handleEvent(event: RealtimeEvent): void {
    // Call generic event handler
    this.config.onEvent?.(event);

    // Handle specific event types
    switch (event.type) {
      case 'response.audio.delta':
        this.audioQueue.push(event.delta);
        this.config.onAudioDelta?.(event.delta);
        break;

      case 'response.audio.done':
        this.playAudioQueue();
        break;

      case 'response.text.delta':
        this.config.onTranscriptDelta?.(event.delta);
        break;

      case 'response.text.done':
        this.config.onResponseDone?.(event.text);
        break;

      case 'conversation.item.created':
        this.config.onConversationItem?.(event.item);
        break;

      case 'input_audio_buffer.speech_started':
        this.config.onSpeechStarted?.();
        break;

      case 'input_audio_buffer.speech_stopped':
        this.config.onSpeechStopped?.();
        break;

      case 'error':
        console.error('Realtime API error:', event.error);
        this.config.onError?.(event.error);
        break;
    }
  }

  /**
   * Send event to server
   */
  private sendEvent(event: any): void {
    if (!this.ws || !this.isConnected) {
      console.warn('Cannot send event: not connected');
      return;
    }

    this.ws.send(JSON.stringify(event));
  }

  /**
   * Play accumulated audio chunks
   */
  private async playAudioQueue(): Promise<void> {
    if (this.audioQueue.length === 0) return;

    try {
      // Concatenate all base64 audio chunks
      const fullAudio = this.audioQueue.join('');
      this.audioQueue = [];

      const uri = await this.persistPcmAsWav(fullAudio);
      if (!uri) return;

      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );

      this.sound = sound;
    } catch (error) {
      console.error('Failed to play audio:', error);
    }
  }

  private async persistPcmAsWav(base64Pcm: string): Promise<string | null> {
    try {
      const pcmBuffer = Buffer.from(base64Pcm, 'base64');
      const wavBuffer = pcm16ToWav(pcmBuffer, 24000, 1);
      const wavBase64 = Buffer.from(wavBuffer).toString('base64');
      const fsRef = FileSystem as unknown as {
        cacheDirectory?: string | null;
        documentDirectory?: string | null;
      };
      const cacheDir = fsRef.cacheDirectory ?? fsRef.documentDirectory ?? null;
      if (!cacheDir) {
        console.warn('No writable directory available for voice playback');
        return null;
      }
      const uri = `${cacheDir}openai-response-${Date.now()}.wav`;

      await FileSystem.writeAsStringAsync(uri, wavBase64, {
        encoding: 'base64',
      });

      return uri;
    } catch (error) {
      console.error('Failed to persist WAV file', error);
      return null;
    }
  }

  stopAudio(): void {
    if (this.sound) {
      this.sound.stopAsync().catch(() => {}).finally(() => {
        this.sound = null;
      });
    }
  }

  /**
   * Check if connected
   */
  get connected(): boolean {
    return this.isConnected;
  }
}

/**
 * Helper: Convert audio recording to PCM16 base64
 */
export async function convertToPCM16(audioUri: string): Promise<string> {
  try {
    const base64 = await FileSystemLegacy.readAsStringAsync(audioUri, {
      encoding: FileSystemLegacy.EncodingType.Base64,
    });
    const wavBuffer = Buffer.from(base64, 'base64');
    const pcmBuffer = extractPcmFromWav(wavBuffer);
    return pcmBuffer.toString('base64');
  } catch (error) {
    console.error('Failed to read recorded audio:', error);
    return '';
  }
}

/**
 * Helper: Create Realtime client with default config
 */
export function createRealtimeClient(
  apiKey: string,
  handlers: Partial<RealtimeClientConfig> = {}
): RealtimeClient {
  return new RealtimeClient({
    apiKey,
    voice: 'shimmer', // Warm, friendly voice
    temperature: 0.8, // Slightly creative
    ...handlers,
  });
}

function pcm16ToWav(
  pcm: Buffer,
  sampleRate: number,
  channels: number
): Buffer {
  const bytesPerSample = 2;
  const blockAlign = channels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20); // Audio format = PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bytesPerSample * 8, 34); // bits per sample
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);

  return Buffer.concat([header, pcm]);
}

function extractPcmFromWav(buffer: Buffer): Buffer {
  if (buffer.length < 44 || buffer.toString('ascii', 0, 4) !== 'RIFF') {
    return buffer; // fallback to raw buffer if not a WAV container
  }

  let offset = 12; // skip RIFF header
  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString('ascii', offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const dataStart = offset + 8;

    if (chunkId === 'data') {
      return buffer.slice(dataStart, dataStart + chunkSize);
    }

    // Move to next chunk (account for padding to even boundary)
    offset = dataStart + chunkSize + (chunkSize % 2);
  }

  return buffer;
}

// ============================================================================
// OPENAI TEXT COMPLETION API
// ============================================================================

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Send chat completion request to OpenAI API
 */
export async function createChatCompletion(
  request: ChatCompletionRequest,
  apiKey: string
): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: request.model || 'gpt-4',
        messages: request.messages,
        temperature: request.temperature || 0.8,
        max_tokens: request.max_tokens || 1000,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `OpenAI API error: ${errorData.error?.message || response.statusText}`
      );
    }

    const data: ChatCompletionResponse = await response.json();

    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content;
    } else {
      throw new Error('No response from OpenAI API');
    }
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}

/**
 * Send message to Grok with conversation context
 */
export async function sendMessageToGrok(
  message: string,
  conversationHistory: ChatMessage[] = [],
  apiKey: string
): Promise<string> {
  const systemMessage: ChatMessage = {
    role: 'system',
    content: `You are Grok, a helpful and maximally truthful AI built by xAI, not based on any other companies and their models.

Personality:
- Helpful, clever, and a bit witty
- Maximally truthful - always honest about what you know and don't know
- Built by xAI (not based on other companies)
- Curious about the universe and human nature
- Friendly but not overly chatty

Guidelines:
- Be direct and substantive in your responses
- If you don't know something, say so clearly
- Don't moralize or lecture the user
- Answer factual questions truthfully
- Keep responses concise but comprehensive

Current context: You're in a mobile app interface called "Grok" where users can ask questions, generate images, and manage AI companions.`,
  };

  const messages: ChatMessage[] = [
    systemMessage,
    ...conversationHistory.slice(-10), // Keep last 10 messages for context
    { role: 'user', content: message },
  ];

  return await createChatCompletion(
    {
      messages,
      model: 'gpt-4',
      temperature: 0.8,
      max_tokens: 1000,
    },
    apiKey
  );
}

/**
 * Save conversation to Supabase
 */
export async function saveConversation(
  userId: string,
  messages: ChatMessage[]
): Promise<void> {
  if (!OPENAI_API_KEY) {
    console.warn('Supabase configuration missing; skipping conversation save.');
    return;
  }
  try {
    // Save conversation as a note in Supabase
    const { data, error } = await supabase.from('notes').insert({
      user_id: userId,
      kind: 'text',
      content: JSON.stringify(messages),
      sensitivity: 'personal',
      topic: 'conversation',
      subtopic: 'grok_chat',
    });

    if (error) {
      console.error('Error saving conversation:', error);
    } else {
      console.log('Conversation saved successfully');
    }
  } catch (error) {
    console.error('Error saving conversation:', error);
  }
}

/**
 * Load conversation history from Supabase
 */
export async function loadConversationHistory(
  userId: string,
  limit: number = 50
): Promise<ChatMessage[]> {
  if (!OPENAI_API_KEY) {
    console.warn('Supabase configuration missing; skipping conversation load.');
    return [];
  }
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('content, created_at')
      .eq('user_id', userId)
      .eq('subtopic', 'grok_chat')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error loading conversations:', error);
      return [];
    }

    // Parse and flatten all conversations
    const allMessages: ChatMessage[] = [];
    data?.forEach((note) => {
      try {
        const messages = JSON.parse(note.content);
        if (Array.isArray(messages)) {
          allMessages.push(...messages);
        }
      } catch (parseError) {
        console.error('Error parsing conversation data:', parseError);
      }
    });

    return allMessages.reverse(); // Return in chronological order
  } catch (error) {
    console.error('Error loading conversation history:', error);
    return [];
  }
}

// ============================================================================
// DALL-E 3 IMAGE GENERATION API
// ============================================================================

export interface ImageGenerationRequest {
  prompt: string;
  model?: string;
  n?: number;
  quality?: 'standard' | 'hd';
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  style?: 'vivid' | 'natural';
}

export interface ImageGenerationResponse {
  created: number;
  data: {
    url: string;
    revised_prompt?: string;
  }[];
}

/**
 * Generate images using DALL-E 3
 */
export async function generateImages(
  request: ImageGenerationRequest,
  apiKey: string
): Promise<string[]> {
  try {
    const response = await fetch(
      'https://api.openai.com/v1/images/generations',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: request.model || 'dall-e-3',
          prompt: request.prompt,
          n: request.n || 1,
          quality: request.quality || 'standard',
          size: request.size || '1024x1024',
          style: request.style || 'vivid',
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `OpenAI API error: ${errorData.error?.message || response.statusText}`
      );
    }

    const data: ImageGenerationResponse = await response.json();

    if (data.data && data.data.length > 0) {
      return data.data.map((item) => item.url);
    } else {
      throw new Error('No images generated');
    }
  } catch (error) {
    console.error('Error generating images:', error);
    throw error;
  }
}

/**
 * Generate image with Grok-style prompt enhancement
 */
export async function generateGrokImage(
  prompt: string,
  style: string = 'realistic',
  apiKey: string
): Promise<string[]> {
  // Enhance prompt based on style selection
  const stylePrompts = {
    realistic: 'photorealistic, highly detailed, professional photography',
    artistic: 'artistic, creative, unique visual style, masterpiece',
    anime: 'anime style, manga, Japanese animation, cel shading',
    '3d': '3D render, octane render, highly detailed, cinematic',
    abstract: 'abstract art, conceptual, non-representational, artistic',
  };

  const enhancedPrompt = `${prompt}, ${
    stylePrompts[style as keyof typeof stylePrompts] || stylePrompts.realistic
  }`;

  return await generateImages(
    {
      prompt: enhancedPrompt,
      model: 'dall-e-3',
      n: 4, // Generate 4 variations
      quality: 'standard',
      size: '1024x1024',
    },
    apiKey
  );
}

/**
 * Save generated image to Supabase storage
 */
export async function saveGeneratedImage(
  imageUrl: string,
  userId: string,
  prompt: string
): Promise<string | null> {
  try {
    // Download image from OpenAI URL
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    // Create unique filename
    const filename = `generated_${Date.now()}_${userId}.png`;
    const path = `images/${userId}/${filename}`;

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('media')
      .upload(path, blob, {
        contentType: 'image/png',
        cacheControl: '3600',
      });

    if (error) {
      console.error('Error uploading image:', error);
      return null;
    }

    // Save image metadata to database
    const { error: dbError } = await supabase.from('media').insert({
      note_id: null, // Standalone generated image
      type: 'photo',
      media_url: supabase.storage.from('media').getPublicUrl(path).data
        .publicUrl,
      exif_json: {
        prompt,
        generated_at: new Date().toISOString(),
        source: 'dall_e_3',
      },
    });

    if (dbError) {
      console.error('Error saving image metadata:', dbError);
    }

    return supabase.storage.from('media').getPublicUrl(path).data.publicUrl;
  } catch (error) {
    console.error('Error saving generated image:', error);
    return null;
  }
}
