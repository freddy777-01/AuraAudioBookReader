import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import { Audiobook, Bookmark } from '../types/audiobook';
import { AudioPlayerContextType } from '../types/player';
import { tauriBridge } from '../services/tauriBridge';

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null);

const AUTOSAVE_INTERVAL_MS = 5000;
const DEFAULT_SKIP_SECONDS = 30;

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [currentBook, setCurrentBook] = useState<Audiobook | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(() => {
    const saved = localStorage.getItem('aura_playback_rate');
    return saved ? parseFloat(saved) : 1.0;
  });
  const [volume, setVolumeState] = useState<number>(() => {
    const saved = localStorage.getItem('aura_volume');
    return saved ? parseFloat(saved) : 1.0;
  });
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState<boolean>(false);
  const [isChaptersOpen, setIsChaptersOpen] = useState<boolean>(false);
  const [selectedBookForChapters, setSelectedBookForChapters] = useState<Audiobook | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  // Refs for tracking latest values in asynchronous callbacks and unloads
  const latestPositionRef = useRef<number>(0);
  const latestDurationRef = useRef<number>(0);
  const currentBookRef = useRef<Audiobook | null>(null);
  const currentTrackIndexRef = useRef<number>(0);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync refs
  latestPositionRef.current = currentTime;
  latestDurationRef.current = duration;
  currentBookRef.current = currentBook;
  currentTrackIndexRef.current = currentTrackIndex;

  // Track title
  const currentTrackTitle = currentBook?.tracks?.[currentTrackIndex]?.title || currentBook?.title || null;

  // Flush playback state to SQLite backend
  const flushPlaybackState = useCallback(() => {
    const book = currentBookRef.current;
    const trackIdx = currentTrackIndexRef.current;
    const pos = latestPositionRef.current;
    const dur = latestDurationRef.current;

    if (book && dur > 0) {
      const targetTrack = book.tracks?.[trackIdx];
      const targetId = targetTrack?.id || book.id;
      const isCompleted = pos >= dur - 5;
      tauriBridge.savePlaybackState(targetId, pos, dur, isCompleted);

      // Keep in-memory track state up-to-date so library UI reflects immediate progress
      if (targetTrack) {
        targetTrack.playback = {
          book_id: targetId,
          position_seconds: pos,
          duration_seconds: dur,
          completion_percentage: (pos / dur) * 100,
          is_completed: isCompleted,
          last_played_at: new Date().toISOString(),
        };
      }

      // Also save overall book progress if multi-track
      if (book.is_multi_track && book.tracks) {
        const totalDuration = book.duration_seconds || 1;
        const elapsedPrior = book.tracks.slice(0, trackIdx).reduce((acc, t) => acc + (t.duration_seconds || 0), 0);
        const totalElapsed = elapsedPrior + pos;
        const bookCompleted = trackIdx === book.tracks.length - 1 && isCompleted;
        tauriBridge.savePlaybackState(book.id, totalElapsed, totalDuration, bookCompleted);

        book.playback = {
          book_id: book.id,
          position_seconds: totalElapsed,
          duration_seconds: totalDuration,
          completion_percentage: (totalElapsed / totalDuration) * 100,
          is_completed: bookCompleted,
          last_played_at: new Date().toISOString(),
        };
      }
    }
  }, []);

  // Forward declaration of playTrack ref so event listeners can trigger it
  const playTrackRef = useRef<(book: Audiobook, trackIndex: number, autoPlay?: boolean, startTime?: number) => Promise<void>>();

  // Initialize HTML5 Audio instance
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    // Preserve pitch during variable speed playback (prevent chipmunk effect)
    if ('preservesPitch' in audio) {
      (audio as any).preservesPitch = true;
    }
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleDurationChange = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handlePlaying = () => {
      setIsPlaying(true);
      setIsLoading(false);
      setError(null);
    };

    const handlePause = () => {
      setIsPlaying(false);
      flushPlaybackState();
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handleEnded = () => {
      const book = currentBookRef.current;
      const trackIdx = currentTrackIndexRef.current;

      flushPlaybackState();

      // Multi-track auto-advance to next chapter/track!
      if (book && book.tracks && trackIdx + 1 < book.tracks.length) {
        if (playTrackRef.current) {
          playTrackRef.current(book, trackIdx + 1);
        }
      } else {
        setIsPlaying(false);
      }
    };

    const handleError = () => {
      setIsLoading(false);
      setIsPlaying(false);
      setError('Unable to stream or decode audio file');
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // Save state on window beforeunload
    const handleBeforeUnload = () => {
      flushPlaybackState();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      audio.pause();
      audio.src = '';
    };
  }, [flushPlaybackState]);

  // Periodic autosave to SQLite every 5 seconds while playing
  useEffect(() => {
    if (isPlaying) {
      autoSaveTimerRef.current = setInterval(() => {
        flushPlaybackState();
      }, AUTOSAVE_INTERVAL_MS);
    } else {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [isPlaying, flushPlaybackState]);

  // Play specific track in book
  const playTrack = useCallback(
    async (book: Audiobook, trackIndex: number, autoPlay: boolean = true, startTime?: number) => {
      const audio = audioRef.current;
      if (!audio) return;

      flushPlaybackState();

      setIsLoading(true);
      setError(null);
      setCurrentBook(book);
      setCurrentTrackIndex(trackIndex);

      const tracks = book.tracks || [];
      const targetTrack = tracks[trackIndex] || {
        file_path: book.file_path,
        duration_seconds: book.duration_seconds,
        id: book.id,
      };

      // Set initial duration from metadata/database immediately so the UI doesn't sit at 0:00!
      const initialDuration = targetTrack.duration_seconds || book.duration_seconds || 0;
      if (initialDuration > 0) {
        setDuration(initialDuration);
      }

      try {
        const streamUrl = await tauriBridge.getAudioUrl(targetTrack.file_path);

        // Fetch bookmarks for this track or book
        const bms = await tauriBridge.getBookmarks(targetTrack.id);
        setBookmarks(bms);

        // Resume position (if startTime specified, e.g. 0 for beginning, use it)
        let resumePosition = 0;
        if (startTime !== undefined) {
          resumePosition = startTime;
          tauriBridge.savePlaybackState(targetTrack.id, startTime, initialDuration, false);
          if (targetTrack.playback) {
            targetTrack.playback.position_seconds = startTime;
            targetTrack.playback.is_completed = false;
          }
        } else {
          const savedPlayback = await tauriBridge.getPlaybackState(targetTrack.id);
          resumePosition = savedPlayback?.position_seconds || targetTrack.playback?.position_seconds || 0;
        }
        setCurrentTime(resumePosition);

        audio.playbackRate = playbackRate;
        audio.volume = isMuted ? 0 : volume;

        // Hook up metadata handler before assigning src
        const applyResumePosition = () => {
          const totalDur = audio.duration || initialDuration;
          if (totalDur > 0) {
            setDuration(totalDur);
          }
          if (resumePosition > 0 && resumePosition < (totalDur > 0 ? totalDur : Infinity)) {
            try {
              audio.currentTime = resumePosition;
              setCurrentTime(resumePosition);
            } catch (err) {
              console.warn('Seek failed on metadata:', err);
            }
          } else if (startTime === 0) {
            try {
              audio.currentTime = 0;
              setCurrentTime(0);
            } catch (err) {}
          }
        };

        audio.onloadedmetadata = applyResumePosition;
        audio.oncanplay = () => {
          if (startTime === 0 && audio.currentTime !== 0) {
            try {
              audio.currentTime = 0;
              setCurrentTime(0);
            } catch (err) {}
          } else if (resumePosition > 0 && Math.abs(audio.currentTime - resumePosition) > 1.5) {
            try {
              audio.currentTime = resumePosition;
              setCurrentTime(resumePosition);
            } catch (err) {}
          }
        };

        audio.src = streamUrl;
        audio.load();

        if (autoPlay) {
          try {
            await audio.play();
            setIsPlaying(true);
            setIsLoading(false);
          } catch (err: any) {
            console.warn('Playback deferred or autoplay prevented:', err);
            setIsPlaying(false);
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load audio source');
        setIsLoading(false);
        setIsPlaying(false);
      }
    },
    [flushPlaybackState, playbackRate, isMuted, volume]
  );

  playTrackRef.current = playTrack;

  // Load Book (resumes the exact in-progress track or starts at track 0)
  const loadBook = useCallback(
    async (book: Audiobook, autoPlay: boolean = true) => {
      let startTrackIndex = 0;
      if (book.tracks && book.tracks.length > 0) {
        // 1. Look for the track that was played most recently
        let mostRecentTrackIdx = -1;
        let mostRecentTime = 0;

        book.tracks.forEach((t, idx) => {
          if (t.playback?.last_played_at) {
            const time = new Date(t.playback.last_played_at).getTime();
            if (time > mostRecentTime) {
              mostRecentTime = time;
              mostRecentTrackIdx = idx;
            }
          }
        });

        if (mostRecentTrackIdx !== -1) {
          const recentTrack = book.tracks[mostRecentTrackIdx];
          // If the most recently played track is completed, advance to next track
          if (recentTrack.playback?.is_completed && mostRecentTrackIdx + 1 < book.tracks.length) {
            startTrackIndex = mostRecentTrackIdx + 1;
          } else {
            startTrackIndex = mostRecentTrackIdx;
          }
        } else {
          // 2. Otherwise find the first uncompleted track with progress
          const inProgressIdx = book.tracks.findIndex(
            (t) => t.playback && !t.playback.is_completed && t.playback.position_seconds > 0
          );
          if (inProgressIdx !== -1) {
            startTrackIndex = inProgressIdx;
          } else {
            // Or find first uncompleted track
            const uncompletedIdx = book.tracks.findIndex((t) => !t.playback?.is_completed);
            if (uncompletedIdx !== -1) {
              startTrackIndex = uncompletedIdx;
            }
          }
        }
      }
      await playTrack(book, startTrackIndex, autoPlay);
    },
    [playTrack]
  );

  const nextChapter = useCallback(async () => {
    if (currentBook && currentBook.tracks && currentTrackIndex + 1 < currentBook.tracks.length) {
      await playTrack(currentBook, currentTrackIndex + 1, true);
    }
  }, [currentBook, currentTrackIndex, playTrack]);

  const previousChapter = useCallback(async () => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 5) {
      audio.currentTime = 0;
      setCurrentTime(0);
    } else if (currentBook && currentBook.tracks && currentTrackIndex > 0) {
      await playTrack(currentBook, currentTrackIndex - 1, true);
    }
  }, [currentBook, currentTrackIndex, playTrack]);

  const toggleChapters = useCallback((book?: Audiobook | null) => {
    if (book) {
      setSelectedBookForChapters(book);
      setIsChaptersOpen(true);
    } else {
      setSelectedBookForChapters((prev) => prev || currentBook);
      setIsChaptersOpen((prev) => !prev);
    }
  }, [currentBook]);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.src && audio.src !== window.location.href && !audio.error) {
      try {
        setIsLoading(true);
        await audio.play();
        setIsPlaying(true);
        setIsLoading(false);
      } catch (err: any) {
        console.warn('Direct audio.play() failed, re-loading track:', err);
        setIsLoading(false);
        if (currentBook) {
          await playTrack(currentBook, currentTrackIndex, true);
        }
      }
    } else if (currentBook) {
      await playTrack(currentBook, currentTrackIndex, true);
    }
  }, [currentBook, currentTrackIndex, playTrack]);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, pause, play]);

  const seek = useCallback(
    (seconds: number) => {
      const audio = audioRef.current;
      if (audio) {
        const target = Math.max(0, Math.min(seconds, duration));
        audio.currentTime = target;
        setCurrentTime(target);
        flushPlaybackState();
      }
    },
    [duration, flushPlaybackState]
  );

  const skipForward = useCallback(
    (seconds: number = DEFAULT_SKIP_SECONDS) => {
      seek(currentTime + seconds);
    },
    [currentTime, seek]
  );

  const skipBackward = useCallback(
    (seconds: number = DEFAULT_SKIP_SECONDS) => {
      seek(currentTime - seconds);
    },
    [currentTime, seek]
  );

  const setSpeed = useCallback((rate: number) => {
    const audio = audioRef.current;
    const clamped = Math.max(0.5, Math.min(rate, 3.0));
    setPlaybackRate(clamped);
    localStorage.setItem('aura_playback_rate', clamped.toString());
    if (audio) {
      audio.playbackRate = clamped;
    }
  }, []);

  const setVolume = useCallback((level: number) => {
    const audio = audioRef.current;
    const clamped = Math.max(0, Math.min(level, 1.0));
    setVolumeState(clamped);
    setIsMuted(clamped === 0);
    localStorage.setItem('aura_volume', clamped.toString());
    if (audio) {
      audio.volume = clamped;
    }
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      if (isMuted) {
        audio.volume = volume > 0 ? volume : 0.8;
        setIsMuted(false);
      } else {
        audio.volume = 0;
        setIsMuted(true);
      }
    }
  }, [isMuted, volume]);

  const toggleFullScreen = useCallback(() => {
    setIsFullScreen((prev) => !prev);
  }, []);

  const toggleBookmarks = useCallback(() => {
    setIsBookmarksOpen((prev) => !prev);
  }, []);

  const addBookmark = useCallback(
    async (title: string, note?: string) => {
      if (!currentBook) return;
      const targetId = currentBook.tracks?.[currentTrackIndex]?.id || currentBook.id;
      const created = await tauriBridge.createBookmark(
        targetId,
        currentTime,
        title,
        note
      );
      setBookmarks((prev) => [...prev, created].sort((a, b) => a.timestamp_seconds - b.timestamp_seconds));
    },
    [currentBook, currentTrackIndex, currentTime]
  );

  const deleteBookmark = useCallback(async (id: number) => {
    await tauriBridge.deleteBookmark(id);
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const clearPlayer = useCallback(() => {
    // Flush current listening position before closing player bar
    flushPlaybackState();
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = '';
    }
    setCurrentBook(null);
    setCurrentTrackIndex(0);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setBookmarks([]);
  }, [flushPlaybackState]);

  const value: AudioPlayerContextType = {
    currentBook,
    currentTrackIndex,
    currentTrackTitle,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    volume,
    isMuted,
    isLoading,
    error,
    isFullScreen,
    isBookmarksOpen,
    isChaptersOpen,
    selectedBookForChapters,
    bookmarks,
    play,
    pause,
    togglePlay,
    seek,
    skipForward,
    skipBackward,
    setSpeed,
    setVolume,
    toggleMute,
    loadBook,
    playTrack,
    nextChapter,
    previousChapter,
    toggleFullScreen,
    toggleBookmarks,
    toggleChapters,
    addBookmark,
    deleteBookmark,
    clearPlayer,
  };

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = (): AudioPlayerContextType => {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
};
