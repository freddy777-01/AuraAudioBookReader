import { Audiobook, Bookmark, PlaybackState } from '../types/audiobook';

// Check if app is running inside Tauri v2 Webview
export const isTauri = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

// Mock sample books for browser preview mode
const MOCK_BOOKS: Audiobook[] = [
  {
    id: 'mock-book-1',
    title: 'The Way of Kings',
    author: 'Brandon Sanderson',
    narrator: 'Michael Kramer, Kate Reading',
    album: 'The Stormlight Archive, Book 1',
    duration_seconds: 163800, // 45.5 hours
    file_path: 'C:\\Audiobooks\\The Way of Kings.m4b',
    file_size: 1342177280, // ~1.25 GB
    format: 'm4b',
    cover_image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800',
    last_scanned_at: new Date().toISOString(),
    playback: {
      book_id: 'mock-book-1',
      position_seconds: 42120, // ~11h 42m
      duration_seconds: 163800,
      completion_percentage: 25.7,
      is_completed: false,
      last_played_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
  },
  {
    id: 'mock-book-2',
    title: 'Project Hail Mary',
    author: 'Andy Weir',
    narrator: 'Ray Porter',
    album: 'Project Hail Mary (Unabridged)',
    duration_seconds: 58200, // 16h 10m
    file_path: 'C:\\Audiobooks\\Project Hail Mary.mp3',
    file_size: 589824000,
    format: 'mp3',
    cover_image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800',
    last_scanned_at: new Date().toISOString(),
    playback: {
      book_id: 'mock-book-2',
      position_seconds: 47200,
      duration_seconds: 58200,
      completion_percentage: 81.1,
      is_completed: false,
      last_played_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
  },
  {
    id: 'mock-book-3',
    title: 'Dune',
    author: 'Frank Herbert',
    narrator: 'Scott Brick, Orlagh Cassidy',
    album: 'Dune Chronicles',
    duration_seconds: 75600, // 21h
    file_path: 'C:\\Audiobooks\\Dune.m4b',
    file_size: 734003200,
    format: 'm4b',
    cover_image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=800',
    last_scanned_at: new Date().toISOString(),
    playback: {
      book_id: 'mock-book-3',
      position_seconds: 75600,
      duration_seconds: 75600,
      completion_percentage: 100.0,
      is_completed: true,
      last_played_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    },
  },
  {
    id: 'mock-book-4',
    title: 'Atomic Habits',
    author: 'James Clear',
    narrator: 'James Clear',
    album: 'Atomic Habits: Tiny Changes, Remarkable Results',
    duration_seconds: 19800, // 5.5 hours
    file_path: 'C:\\Audiobooks\\Atomic Habits.mp3',
    file_size: 209715200,
    format: 'mp3',
    cover_image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=800',
    last_scanned_at: new Date().toISOString(),
    playback: {
      book_id: 'mock-book-4',
      position_seconds: 1200,
      duration_seconds: 19800,
      completion_percentage: 6.0,
      is_completed: false,
      last_played_at: new Date(Date.now() - 3600000 * 72).toISOString(),
    },
  },
];

let mockFolders: string[] = ['C:\\Users\\USER\\Audiobooks', 'D:\\Media\\Audiobooks'];
let mockBookmarks: Record<string, Bookmark[]> = {
  'mock-book-1': [
    {
      id: 1,
      book_id: 'mock-book-1',
      timestamp_seconds: 1845,
      title: 'Prologue: To Kill',
      note: 'Introduction of Szeth-son-son-Vallano wearing white',
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      book_id: 'mock-book-1',
      timestamp_seconds: 34200,
      title: 'The Chasm Run',
      note: 'Bridge Four first encounter with the Parshendi',
      created_at: new Date().toISOString(),
    },
  ],
};

export const tauriBridge = {
  // Convert local file path to audio streamable URL
  getAudioUrl: async (filePath: string): Promise<string> => {
    if (isTauri()) {
      try {
        const { convertFileSrc } = await import('@tauri-apps/api/core');
        return convertFileSrc(filePath);
      } catch (err) {
        console.error('Failed to convert file src with Tauri:', err);
      }
    }
    // Return sample browser stream for mock testing (Reliable public audio stream)
    return 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
  },

  // Open native directory selection dialog
  selectFolderDialog: async (): Promise<string | null> => {
    if (isTauri()) {
      try {
        const { open } = await import('@tauri-apps/plugin-dialog');
        const selected = await open({
          directory: true,
          multiple: false,
          title: 'Select Audiobook Folder',
        });
        return typeof selected === 'string' ? selected : null;
      } catch (err) {
        console.error('Failed to open dialog:', err);
      }
    }
    const simulated = prompt('Enter audiobook folder path (Mock Mode):', 'D:\\Audiobooks\\Fantasy');
    return simulated;
  },

  // Fetch all books
  getLibraryBooks: async (): Promise<Audiobook[]> => {
    if (isTauri()) {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<Audiobook[]>('get_library_books');
    }
    return MOCK_BOOKS;
  },

  // Scan library folders
  scanLibraryFolders: async (): Promise<Audiobook[]> => {
    if (isTauri()) {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<Audiobook[]>('scan_library_folders');
    }
    // Return updated mock list
    return [...MOCK_BOOKS];
  },

  // Library folders management
  getLibraryFolders: async (): Promise<string[]> => {
    if (isTauri()) {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<string[]>('get_library_folders');
    }
    return [...mockFolders];
  },

  addLibraryFolder: async (folderPath: string): Promise<string[]> => {
    if (isTauri()) {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<string[]>('add_library_folder', { folderPath });
    }
    if (!mockFolders.includes(folderPath)) {
      mockFolders.push(folderPath);
    }
    return [...mockFolders];
  },

  removeLibraryFolder: async (folderPath: string): Promise<string[]> => {
    if (isTauri()) {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<string[]>('remove_library_folder', { folderPath });
    }
    mockFolders = mockFolders.filter((f) => f !== folderPath);
    if (mockFolders.length === 0) {
      MOCK_BOOKS.length = 0;
    }
    return [...mockFolders];
  },

  clearLibrary: async (): Promise<void> => {
    if (isTauri()) {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('clear_library');
      return;
    }
    MOCK_BOOKS.length = 0;
    mockFolders = [];
  },

  // Playback persistence
  savePlaybackState: async (
    bookId: string,
    positionSeconds: number,
    durationSeconds: number,
    isCompleted: boolean
  ): Promise<void> => {
    if (isTauri()) {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('save_playback_state', {
        bookId,
        positionSeconds,
        durationSeconds,
        isCompleted,
      });
      return;
    }
    // Update in-memory mock book
    const book = MOCK_BOOKS.find((b) => b.id === bookId);
    if (book) {
      book.playback = {
        book_id: bookId,
        position_seconds: positionSeconds,
        duration_seconds: durationSeconds,
        completion_percentage: (positionSeconds / durationSeconds) * 100,
        is_completed: isCompleted,
        last_played_at: new Date().toISOString(),
      };
    }
  },

  getPlaybackState: async (bookId: string): Promise<PlaybackState | null> => {
    if (isTauri()) {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<PlaybackState | null>('get_playback_state', { bookId });
    }
    const book = MOCK_BOOKS.find((b) => b.id === bookId);
    return book?.playback || null;
  },

  // Bookmarks
  getBookmarks: async (bookId: string): Promise<Bookmark[]> => {
    if (isTauri()) {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<Bookmark[]>('get_bookmarks', { bookId });
    }
    return mockBookmarks[bookId] || [];
  },

  createBookmark: async (
    bookId: string,
    timestampSeconds: number,
    title: string,
    note?: string
  ): Promise<Bookmark> => {
    if (isTauri()) {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<Bookmark>('create_bookmark', {
        bookId,
        timestampSeconds,
        title,
        note,
      });
    }
    const newBm: Bookmark = {
      id: Date.now(),
      book_id: bookId,
      timestamp_seconds: timestampSeconds,
      title,
      note,
      created_at: new Date().toISOString(),
    };
    if (!mockBookmarks[bookId]) {
      mockBookmarks[bookId] = [];
    }
    mockBookmarks[bookId].push(newBm);
    return newBm;
  },

  deleteBookmark: async (bookmarkId: number): Promise<void> => {
    if (isTauri()) {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('delete_bookmark', { bookmarkId });
      return;
    }
    Object.keys(mockBookmarks).forEach((bookId) => {
      mockBookmarks[bookId] = mockBookmarks[bookId].filter((b) => b.id !== bookmarkId);
    });
  },

  setMiniPlayerMode: async (mini: boolean): Promise<void> => {
    if (isTauri()) {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('set_mini_player_mode', { mini });
    }
  },

  setAlwaysOnTop: async (alwaysOnTop: boolean): Promise<void> => {
    if (isTauri()) {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('set_always_on_top', { alwaysOnTop });
    }
  },
};
