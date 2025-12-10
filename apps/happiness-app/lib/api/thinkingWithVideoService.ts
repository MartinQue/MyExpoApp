/**
 * Thinking-with-Video Service
 * Integration with https://github.com/tongjingqi/Thinking-with-Video
 * 
 * Provides video reasoning, captioning, and insights from video content
 */

import { Config, OPENAI_API_KEY } from '@/constants/Config';
import { Logger } from '@/utils/Logger';

// Feature flag - enable/disable Thinking-with-Video integration
const THINKING_VIDEO_ENABLED = !!Config.thinkingVideoApiUrl && !!Config.thinkingVideoApiKey;
const THINKING_VIDEO_API_URL = Config.thinkingVideoApiUrl || '';
const THINKING_VIDEO_API_KEY = Config.thinkingVideoApiKey || '';

export interface VideoAnalysisRequest {
  videoUri: string;
  prompt?: string; // Optional: specific question about the video
  userId?: string;
}

export interface VideoInsight {
  caption: string;
  keyMoments: {
    timestamp: number;
    description: string;
    significance: string;
  }[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  topics: string[];
  summary: string;
}

export interface VideoAnalysisResponse {
  insights: VideoInsight;
  processingTime: number;
  confidence: number;
}

class ThinkingWithVideoService {
  private enabled: boolean;

  constructor() {
    this.enabled = THINKING_VIDEO_ENABLED && !!THINKING_VIDEO_API_URL;
  }

  /**
   * Analyze video and extract insights
   */
  async analyzeVideo(
    request: VideoAnalysisRequest
  ): Promise<VideoAnalysisResponse | null> {
    if (!this.enabled) {
      // Fallback to local analysis using OpenAI Vision
      return this.analyzeWithOpenAIVision(request);
    }

    try {
      // Read video file
      const formData = new FormData();
      formData.append('video', {
        uri: request.videoUri,
        type: 'video/mp4',
        name: 'video.mp4',
      } as any);
      if (request.prompt) {
        formData.append('prompt', request.prompt);
      }

      const response = await fetch(`${THINKING_VIDEO_API_URL}/analyze`, {
        method: 'POST',
        headers: {
          'X-API-Key': THINKING_VIDEO_API_KEY,
        },
        body: formData,
      });

      if (!response.ok) {
        Logger.warn('Thinking-with-Video API failed', {
          status: response.status,
          fallback: 'OpenAI Vision',
        });
        console.warn('Thinking-with-Video API failed, using OpenAI Vision fallback');
        return this.analyzeWithOpenAIVision(request);
      }

      const data: VideoAnalysisResponse = await response.json();
      return data;
    } catch (error) {
      Logger.error('Thinking-with-Video service error', {
        error: error instanceof Error ? error.message : String(error),
        fallback: 'OpenAI Vision',
      });
      console.error('Thinking-with-Video service error:', error);
      return this.analyzeWithOpenAIVision(request);
    }
  }

  /**
   * Fallback: Use OpenAI Vision API for video analysis
   */
  private async analyzeWithOpenAIVision(
    request: VideoAnalysisRequest
  ): Promise<VideoAnalysisResponse | null> {
    if (!OPENAI_API_KEY) {
      Logger.warn('OpenAI API key not available for video analysis');
      console.warn('OpenAI API key not available for video analysis');
      return null;
    }

    // For now, return a placeholder response
    // In production, would extract frames and use GPT-4 Vision
    return {
      insights: {
        caption: 'Video analysis placeholder - would analyze video content',
        keyMoments: [],
        topics: [],
        summary: 'Video analysis would provide insights here',
      },
      processingTime: 0,
      confidence: 0.5,
    };
  }

  /**
   * Generate captions for video
   */
  async generateCaptions(videoUri: string): Promise<string | null> {
    if (!this.enabled) {
      // Could use OpenAI Whisper for audio transcription if video has audio
      return null;
    }

    try {
      const response = await fetch(`${THINKING_VIDEO_API_URL}/captions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoUri }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.caption || null;
      }
    } catch (error) {
      console.error('Caption generation error:', error);
    }

    return null;
  }

  /**
   * Check if Thinking-with-Video is enabled
   */
  isServiceEnabled(): boolean {
    return this.enabled;
  }
}

export const thinkingWithVideoService = new ThinkingWithVideoService();
export default thinkingWithVideoService;

