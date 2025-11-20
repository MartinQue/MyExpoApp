/**
 * Imagination tab types (Image/Video generation)
 */

export type GenerationType = 'image' | 'video' | 'edit';

export type GenerationStatus = 
  | 'idle'
  | 'uploading'
  | 'processing'
  | 'completed'
  | 'failed';

export interface ImageGenerationRequest {
  prompt: string;
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  style?: 'vivid' | 'natural';
  quality?: 'standard' | 'hd';
}

export interface VideoGenerationRequest {
  imageUris: string[]; // 1-3 images
  prompt: string;
  duration?: 5 | 10 | 15; // seconds
  style?: 'realistic' | 'anime' | 'cinematic';
  motionIntensity?: 'low' | 'medium' | 'high';
}

export interface ImageEditRequest {
  imageUri: string;
  mask?: string; // base64 mask image
  prompt: string;
}

export interface GenerationResult {
  id: string;
  userId: string;
  type: GenerationType;
  status: GenerationStatus;
  
  // Request data
  request: ImageGenerationRequest | VideoGenerationRequest | ImageEditRequest;
  
  // Result data
  resultUri?: string;
  thumbnailUri?: string;
  
  // Metadata
  creditsUsed: number;
  processingTime?: number; // in seconds
  error?: string;
  
  createdAt: Date;
  completedAt?: Date;
}

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  prompt: string;
}
