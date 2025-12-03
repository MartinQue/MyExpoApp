/**
 * Media and library types
 */

export type MediaType = 'photo' | 'video' | 'audio' | 'document';

export interface MediaItem {
  id: string;
  userId: string;
  type: MediaType;
  uri: string;
  thumbnailUri?: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
  duration?: number; // for video/audio in seconds
  createdAt: Date;
  updatedAt: Date;
  
  // Metadata
  tags: string[];
  aiCaption?: string;
  aiTags?: string[];
  location?: {
    latitude: number;
    longitude: number;
    placeName?: string;
  };
  
  // Relationships
  linkedGoalId?: string;
  linkedNoteId?: string;
}

export interface Note {
  id: string;
  userId: string;
  title?: string;
  content: string;
  type: 'text' | 'voice' | 'meeting';
  
  // For meeting notes
  participants?: string[];
  duration?: number;
  transcript?: string;
  summary?: string;
  actionItems?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral' | 'anxious';
  
  // Metadata
  tags: string[];
  linkedMediaIds?: string[];
  linkedGoalId?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaFilter {
  type?: MediaType | 'all';
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  linkedGoalId?: string;
}

export interface NoteFilter {
  type?: Note['type'] | 'all';
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  hasTranscript?: boolean;
}
