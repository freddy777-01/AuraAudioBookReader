import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { PlaybackState } from '../../types/audiobook';
import { tauriBridge } from '../../services/tauriBridge';
import {
  XIcon,
  PlayIcon,
  PauseIcon,
  EqualizerIcon,
  SearchIcon,
  ChaptersIcon,
  RotateCcwIcon,
  CheckCircleIcon,
  ClockIcon,
} from '../common/Icons';

export const ChapterDrawer: React.FC = () => {
  const {
    isChaptersOpen,
    toggleChapters,
    selectedBookForChapters,
    currentBook,
    currentTrackIndex,
    currentTime,
    duration,
    isPlaying,
    playTrack,
    togglePlay,
  } = useAudioPlayer();

  const [searchQuery, setSearchQuery] = useState('');
  const [trackPlaybacks, setTrackPlaybacks] = useState<Record<string, PlaybackState>>({});
  const activeRowRef = useRef<HTMLDivElement | null>(null);

  // The book being inspected in this drawer (either selected from card or currently playing)
  const book = selectedBookForChapters || currentBook;
  const tracks = book?.tracks || [];
  const isCurrentlyPlayingThisBook = currentBook?.id === book?.id;

  // Fetch the latest playback state for each track directly from DB whenever the drawer opens
  useEffect(() => {
    if (!isChaptersOpen || !book || !book.tracks || book.tracks.length === 0) return;

    let isCancelled = false;
    Promise.all(
      book.tracks.map(async (t) => {
        try {
          const p = await tauriBridge.getPlaybackState(t.id);
          return { id: t.id, playback: p || t.playback };
        } catch {
          return { id: t.id, playback: t.playback };
        }
      })
    ).then((results) => {
      if (isCancelled) return;
      const map: Record<string, PlaybackState> = {};
      results.forEach((r) => {
        if (r.playback) {
          map[r.id] = r.playback;
        }
      });
      setTrackPlaybacks(map);
    });

    return () => {
      isCancelled = true;
    };
  }, [book, isChaptersOpen]);

  // Format MM:SS or HH:MM:SS
  const formatTimestamp = (seconds: number) => {
    if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format concise total duration: e.g. "27:40" or "1h 15m"
  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hrs}h ${remMins.toString().padStart(2, '0')}m`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format remaining time: e.g. "22m" or "1h 15m"
  const formatRemaining = (seconds: number) => {
    if (!seconds || isNaN(seconds) || seconds <= 0) return '0m';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.ceil((seconds % 3600) / 60);
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Resolve consolidated playback status for all tracks
  const resolvedTracks = useMemo(() => {
    return tracks.map((track, idx) => {
      const isActive = isCurrentlyPlayingThisBook && currentTrackIndex === idx;
      const pb = trackPlaybacks[track.id] || track.playback;

      // If active, use live audio player currentTime and duration for real-time progress
      const pos = isActive ? currentTime : (pb?.position_seconds || 0);
      const dur = isActive && duration > 0 ? duration : (pb?.duration_seconds || track.duration_seconds || 0);
      const isCompleted = pb?.is_completed || (dur > 0 && pos >= dur - 5);
      const hasProgress = pos > 5 && !isCompleted;
      const completionPct = dur > 0 ? Math.min(100, Math.max(0, (pos / dur) * 100)) : 0;
      const lastPlayedAt = pb?.last_played_at;

      return {
        track,
        trackActualIndex: idx,
        isActive,
        pos,
        dur,
        isCompleted,
        hasProgress,
        completionPct,
        lastPlayedAt,
      };
    });
  }, [tracks, trackPlaybacks, isCurrentlyPlayingThisBook, currentTrackIndex, currentTime, duration]);

  // Identify which track is the primary in-progress / previously played track
  const inProgressTrackInfo = useMemo(() => {
    if (resolvedTracks.length === 0) return null;

    // 1. If currently playing this book, use the active track
    if (isCurrentlyPlayingThisBook && currentTrackIndex >= 0 && currentTrackIndex < resolvedTracks.length) {
      return resolvedTracks[currentTrackIndex];
    }

    // 2. Find the track with the most recent last_played_at timestamp
    let mostRecentItem: (typeof resolvedTracks)[0] | null = null;
    let mostRecentTime = 0;

    for (const item of resolvedTracks) {
      if (item.lastPlayedAt) {
        const time = new Date(item.lastPlayedAt).getTime();
        if (time > mostRecentTime) {
          mostRecentTime = time;
          mostRecentItem = item;
        }
      }
    }

    if (mostRecentItem) {
      // If the most recent item is completed, but there is a next track, suggest the next track
      if (mostRecentItem.isCompleted && mostRecentItem.trackActualIndex + 1 < resolvedTracks.length) {
        return resolvedTracks[mostRecentItem.trackActualIndex + 1];
      }
      return mostRecentItem;
    }

    // 3. Otherwise find first uncompleted track with progress (> 5s)
    const withProgress = resolvedTracks.find((item) => item.hasProgress);
    if (withProgress) return withProgress;

    // 4. Otherwise first uncompleted track
    const uncompleted = resolvedTracks.find((item) => !item.isCompleted);
    if (uncompleted) return uncompleted;

    return resolvedTracks[0];
  }, [resolvedTracks, isCurrentlyPlayingThisBook, currentTrackIndex]);

  // Smoothly scroll the in-progress track into view when drawer opens
  useEffect(() => {
    if (isChaptersOpen && activeRowRef.current) {
      const timer = setTimeout(() => {
        activeRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isChaptersOpen]);

  // Filter tracks by search query
  const filteredResolvedTracks = useMemo(() => {
    if (!searchQuery.trim()) return resolvedTracks;
    const q = searchQuery.toLowerCase();
    return resolvedTracks.filter(
      (item) =>
        item.track.title.toLowerCase().includes(q) ||
        item.track.file_path.toLowerCase().includes(q) ||
        item.track.track_number.toString().includes(q)
    );
  }, [resolvedTracks, searchQuery]);

  if (!isChaptersOpen || !book) return null;

  const handleTrackClick = (trackIndex: number) => {
    if (isCurrentlyPlayingThisBook && currentTrackIndex === trackIndex) {
      togglePlay();
    } else {
      playTrack(book, trackIndex, true);
    }
  };

  const handleContinue = (trackIndex: number) => {
    if (isCurrentlyPlayingThisBook && currentTrackIndex === trackIndex) {
      if (!isPlaying) togglePlay();
    } else {
      playTrack(book, trackIndex, true);
    }
  };

  const handlePlayFromBeginning = () => {
    playTrack(book, 0, true, 0);
  };

  const hasAnySavedProgress = resolvedTracks.some((t) => t.pos > 5 || t.isCompleted);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={() => toggleChapters(null)}
      />

      {/* Drawer Panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 border-l border-amber-500/10 dark:border-amber-500/10 shadow-2xl flex flex-col transition-transform duration-300 transform translate-x-0">
          
          {/* Header */}
          <div className="p-5 border-b border-amber-500/10 flex items-start gap-4 bg-slate-50/50 dark:bg-slate-950/40">
            {/* Book Cover Thumbnail */}
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-amber-500/10 border border-amber-500/20 shrink-0 shadow-md">
              {book.cover_image ? (
                <img
                  src={book.cover_image}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-serif text-2xl font-bold text-amber-500">
                  {book.title.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <ChaptersIcon className="w-3 h-3" />
                  {tracks.length} {tracks.length === 1 ? 'Part' : 'Chapters'}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {formatDuration(book.duration_seconds)} total
                </span>
              </div>
              <h3 className="font-serif font-bold text-base text-slate-900 dark:text-slate-100 truncate" title={book.title}>
                {book.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {book.author || 'Unknown Author'}
              </p>
            </div>

            <button
              onClick={() => toggleChapters(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors"
              title="Close chapter sequence"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Search Box */}
          <div className="p-3 border-b border-amber-500/10 bg-slate-100/50 dark:bg-slate-900/50">
            <div className="relative">
              <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter sequence (e.g. 04_05, Chapter 2)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 dark:text-slate-200 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Chapters Sequence List */}
          <div className="flex-1 overflow-y-auto divide-y divide-amber-500/5 p-2 space-y-1">
            {filteredResolvedTracks.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No chapters matching "{searchQuery}"
              </div>
            ) : (
              filteredResolvedTracks.map((item) => {
                const {
                  track,
                  trackActualIndex,
                  isActive,
                  pos,
                  dur,
                  isCompleted,
                  hasProgress,
                  completionPct,
                } = item;

                const isTargetTrack = inProgressTrackInfo?.trackActualIndex === trackActualIndex;
                const isPreviouslyPlayed = !isActive && isTargetTrack && (hasProgress || item.lastPlayedAt);

                return (
                  <div
                    key={track.id || trackActualIndex}
                    ref={isTargetTrack ? activeRowRef : undefined}
                    onClick={() => handleTrackClick(trackActualIndex)}
                    className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                      isActive
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400 shadow-md ring-1 ring-amber-500/20'
                        : isPreviouslyPlayed
                        ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/35 text-slate-900 dark:text-slate-100 shadow-sm'
                        : isCompleted
                        ? 'bg-slate-50/60 dark:bg-slate-900/40 border-transparent hover:border-amber-500/20 text-slate-600 dark:text-slate-400'
                        : 'border-transparent hover:bg-amber-500/5 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 pr-2 flex-1">
                      {/* Track Sequence Number or Play/Pause Equalizer */}
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold transition-all mt-0.5 ${
                          isActive
                            ? 'bg-amber-500 text-slate-950 shadow-md'
                            : isPreviouslyPlayed
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : isCompleted
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-200/60 dark:bg-slate-800/80 group-hover:bg-amber-500 group-hover:text-slate-950 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {isActive ? (
                          isPlaying ? (
                            <EqualizerIcon className="w-4 h-4 text-slate-950" />
                          ) : (
                            <PauseIcon className="w-4 h-4 text-slate-950" />
                          )
                        ) : isPreviouslyPlayed ? (
                          <>
                            <span className="group-hover:hidden font-mono">{track.track_number}</span>
                            <PlayIcon className="w-3.5 h-3.5 hidden group-hover:block fill-current" />
                          </>
                        ) : isCompleted ? (
                          <CheckCircleIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <>
                            <span className="group-hover:hidden">{track.track_number}</span>
                            <PlayIcon className="w-3.5 h-3.5 hidden group-hover:block" />
                          </>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p
                            className={`text-sm font-medium truncate ${
                              isActive || isPreviouslyPlayed ? 'font-bold text-slate-900 dark:text-slate-50' : ''
                            }`}
                            title={track.title}
                          >
                            {track.title}
                          </p>
                        </div>

                        {/* Badges & Subtitle */}
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[11px] text-slate-400 dark:text-slate-500">
                            Part {track.track_number} of {tracks.length}
                          </span>

                          {isActive && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              {isPlaying ? 'Now Playing' : 'Paused'}
                            </span>
                          )}

                          {isPreviouslyPlayed && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Previously Played
                            </span>
                          )}

                          {isCompleted && !isActive && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                              ✓ Completed
                            </span>
                          )}
                        </div>

                        {/* Progress Bar & Exact Minutes Played */}
                        {pos > 5 && !isCompleted && (
                          <div className="mt-2 space-y-1 pr-2">
                            <div className="w-full h-1.5 rounded-full bg-slate-200/90 dark:bg-slate-800 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(100, Math.max(2, completionPct))}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                <ClockIcon className="w-3 h-3 inline-block" />
                                At {formatTimestamp(pos)}
                              </span>
                              <span className="text-slate-400 dark:text-slate-500 font-normal">
                                {formatRemaining(dur - pos)} left ({Math.round(completionPct)}%)
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Side: Duration & Quick Continue Button */}
                    <div className="text-right shrink-0 flex flex-col items-end gap-1.5 ml-2">
                      <span className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
                        {pos > 5 && !isCompleted ? (
                          <span className="text-amber-600 dark:text-amber-400 font-semibold">
                            {formatTimestamp(pos)} / {formatTimestamp(dur)}
                          </span>
                        ) : (
                          formatDuration(dur)
                        )}
                      </span>

                      {/* Explicit "Continue" button on the previously played track row */}
                      {isPreviouslyPlayed && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContinue(trackActualIndex);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm hover:shadow transition-all transform hover:scale-105 active:scale-95"
                          title={`Continue Part ${track.track_number} from ${formatTimestamp(pos)}`}
                        >
                          <PlayIcon className="w-3 h-3 fill-current" />
                          Continue
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Drawer Footer with In-Progress Overview & Resume Options */}
          <div className="border-t border-amber-500/10 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-sm">
            {/* In-Progress Preview Ribbon if previously started */}
            {inProgressTrackInfo && inProgressTrackInfo.pos > 5 && !inProgressTrackInfo.isCompleted && (
              <div className="px-4 py-2.5 bg-amber-500/10 dark:bg-amber-500/15 border-b border-amber-500/15 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                  <div className="truncate text-slate-700 dark:text-slate-200">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      Part {inProgressTrackInfo.track.track_number}:
                    </span>{' '}
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">
                      Paused at {formatTimestamp(inProgressTrackInfo.pos)}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 ml-1">
                      ({formatRemaining(inProgressTrackInfo.dur - inProgressTrackInfo.pos)} left)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Main Action Buttons */}
            <div className="p-4 flex items-center justify-between gap-3 text-xs">
              <button
                onClick={handlePlayFromBeginning}
                className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
                title="Restart audiobook from Part 1, 0:00"
              >
                <RotateCcwIcon className="w-3.5 h-3.5" />
                Play from Beginning
              </button>

              {inProgressTrackInfo && hasAnySavedProgress ? (
                <button
                  onClick={() => handleContinue(inProgressTrackInfo.trackActualIndex)}
                  className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-98"
                  title={`Continue Part ${inProgressTrackInfo.track.track_number} at ${formatTimestamp(inProgressTrackInfo.pos)}`}
                >
                  <PlayIcon className="w-4 h-4 fill-current" />
                  <span>
                    Continue Part {inProgressTrackInfo.track.track_number}
                    {inProgressTrackInfo.pos > 5 ? ` at ${formatTimestamp(inProgressTrackInfo.pos)}` : ''}
                  </span>
                </button>
              ) : (
                <button
                  onClick={handlePlayFromBeginning}
                  className="flex-1 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <PlayIcon className="w-4 h-4 fill-current" />
                  Start Listening
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
