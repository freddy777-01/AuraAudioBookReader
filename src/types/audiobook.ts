export interface PlaybackState {
  book_id: string;
  position_seconds: number;
  duration_seconds: number;
  completion_percentage: number;
  is_completed: boolean;
  last_played_at?: string;
}

export interface Bookmark {
  id: number;
  book_id: string;
  timestamp_seconds: number;
  title: string;
  note?: string;
  created_at?: string;
}

export interface AudiobookTrack {
  id: string;
  book_id: string;
  track_number: number;
  title: string;
  file_path: string;
  duration_seconds: number;
  file_size: number;
  format: string;
  cover_image?: string;
  playback?: PlaybackState;
}

export interface Audiobook {
  id: string;
  title: string;
  author?: string;
  narrator?: string;
  album?: string;
  duration_seconds: number;
  file_path: string;
  file_size: number;
  format: string;
  cover_image?: string;
  last_scanned_at?: string;
  playback?: PlaybackState;
  // Multi-part & Organization
  tracks?: AudiobookTrack[];
  track_count?: number;
  folder_name?: string;
  folder_path?: string;
  is_multi_track?: boolean;
}

export type ViewMode = 'library' | 'now-playing' | 'settings';
export type FilterMode = 'all' | 'in-progress' | 'completed' | 'not-started';
export type SortOption = 'recent' | 'title' | 'author' | 'duration' | 'tracks' | 'progress';
export type OrganizationMode = 'books' | 'author' | 'folder' | 'tracks';

