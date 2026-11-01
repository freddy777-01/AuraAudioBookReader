import { Audiobook, Bookmark } from './audiobook';

export interface PlayerState {
  currentBook: Audiobook | null;
  currentTrackIndex: number;
  currentTrackTitle: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  volume: number;
  isMuted: boolean;
  isLoading: boolean;
  error: string | null;
  isFullScreen: boolean;
  isBookmarksOpen: boolean;
  isChaptersOpen: boolean;
  selectedBookForChapters: Audiobook | null;
  bookmarks: Bookmark[];
}

export interface PlayerControls {
  play: () => Promise<void>;
  pause: () => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  skipForward: (seconds?: number) => void;
  skipBackward: (seconds?: number) => void;
  setSpeed: (rate: number) => void;
  setVolume: (level: number) => void;
  toggleMute: () => void;
  loadBook: (book: Audiobook, autoPlay?: boolean) => Promise<void>;
  playTrack: (book: Audiobook, trackIndex: number, autoPlay?: boolean, startTime?: number) => Promise<void>;
  nextChapter: () => Promise<void>;
  previousChapter: () => Promise<void>;
  toggleFullScreen: () => void;
  toggleBookmarks: () => void;
  toggleChapters: (book?: Audiobook | null) => void;
  addBookmark: (title: string, note?: string) => Promise<void>;
  deleteBookmark: (id: number) => Promise<void>;
  clearPlayer: () => void;
}

export type AudioPlayerContextType = PlayerState & PlayerControls;
