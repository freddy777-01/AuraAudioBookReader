import React, { useState, useEffect, useRef } from 'react';
import { useAudioPlayer, formatTime } from '../../hooks/useAudioPlayer';
import {
  PlayIcon,
  PauseIcon,
  SkipBack30Icon,
  SkipForward30Icon,
  Volume2Icon,
  VolumeXIcon,
  BookmarkIcon,
  MaximizeIcon,
  MiniPlayerIcon,
  ChaptersIcon,
  SkipPrevIcon,
  SkipNextIcon,
  CloseIcon,
} from '../common/Icons';

export const PlayerBar: React.FC = () => {
  const {
    currentBook,
    currentTrackIndex,
    currentTrackTitle,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    volume,
    isMuted,
    formattedDuration,
    timeRemaining,
    bookmarks,
    togglePlay,
    seek,
    skipForward,
    skipBackward,
    nextChapter,
    previousChapter,
    setSpeed,
    setVolume,
    toggleMute,
    toggleFullScreen,
    toggleMiniPlayer,
    toggleBookmarks,
    toggleChapters,
    clearPlayer,
  } = useAudioPlayer();

  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const SPEED_PRESETS = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0];

  // Measure container width for gradual progressive disclosure
  const containerRef = useRef<HTMLDivElement>(null);
  const [barWidth, setBarWidth] = useState<number>(() => {
    return typeof window !== 'undefined' ? Math.max(400, window.innerWidth - 64) : 960;
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentBoxSize) {
          const width = Array.isArray(entry.contentBoxSize)
            ? entry.contentBoxSize[0].inlineSize
            : (entry.contentBoxSize as any).inlineSize;
          if (width) setBarWidth(Math.round(width));
        } else {
          setBarWidth(Math.round(entry.contentRect.width));
        }
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Progressive disclosure stages (controls appear one by one as width increases):
  const showVolumeButton = barWidth >= 520;
  const showVolumeSlider = barWidth >= 620;
  const showSpeed = barWidth >= 700;
  const showBookmarks = barWidth >= 780;
  const showChapters = barWidth >= 860;
  const showChapterSkips = barWidth >= 940;
  const showExtraBadges = barWidth >= 1020;

  // Local scrubbing state to ensure silky-smooth dragging without fighting audio updates
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);
  const scrubValueRef = useRef(scrubValue);
  scrubValueRef.current = scrubValue;

  const displayTime = isScrubbing ? scrubValue : currentTime;
  const displayFormattedCurrentTime = formatTime(displayTime);
  const displayProgressPercentage = duration > 0
    ? Math.min(100, Math.max(0, (displayTime / duration) * 100))
    : 0;

  useEffect(() => {
    if (!isScrubbing) return;
    const handleGlobalPointerUp = () => {
      setIsScrubbing(false);
      seek(scrubValueRef.current);
    };
    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => window.removeEventListener('pointerup', handleGlobalPointerUp);
  }, [isScrubbing, seek]);

  if (!currentBook) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="h-24 bg-white/95 dark:bg-aura-900/95 backdrop-blur-md border-t border-slate-200 dark:border-aura-800/80 px-3 sm:px-6 flex items-center justify-between shrink-0 shadow-player z-40 relative transition-colors duration-200 overflow-hidden"
    >
      {/* Top micro progress highlight */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-slate-200 dark:bg-aura-800 pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-150"
          style={{ width: `${displayProgressPercentage}%` }}
        />
      </div>

      {/* Left: Book Meta */}
      <div className="flex items-center space-x-3 min-w-0 max-w-[200px] sm:max-w-[240px] md:max-w-[280px] shrink-0">
        <div
          onClick={toggleFullScreen}
          className="w-12 h-12 md:w-14 md:h-14 rounded-lg overflow-hidden shrink-0 bg-slate-100 dark:bg-aura-800 shadow-md dark:shadow-book cursor-pointer group relative border border-slate-200 dark:border-transparent"
        >
          {currentBook.cover_image ? (
            <img
              src={currentBook.cover_image}
              alt={currentBook.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-600 to-amber-400 text-white font-serif font-bold text-base md:text-lg">
              {currentBook.title.charAt(0)}
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <MaximizeIcon className="w-4 h-4 text-white" />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h4
            onClick={toggleFullScreen}
            className="text-xs md:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate cursor-pointer hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
          >
            {currentBook.title}
          </h4>
          <p className="text-[11px] md:text-xs text-slate-500 dark:text-slate-400 truncate">
            {currentBook.is_multi_track && currentTrackTitle
              ? `Part ${currentTrackIndex + 1}: ${currentTrackTitle}`
              : (currentBook.author || 'Unknown Author')}
          </p>
          <div className="flex items-center space-x-1.5 mt-0.5">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-aura-800 text-amber-600 dark:text-amber-400 font-medium shrink-0">
              {timeRemaining}
            </span>
            {showExtraBadges && currentBook.is_multi_track && (
              <button
                onClick={() => toggleChapters(currentBook)}
                className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 font-medium flex items-center gap-0.5 transition-colors cursor-pointer shrink-0"
                title="View chapter sequence"
              >
                <span>Ch. {currentTrackIndex + 1}/{currentBook.tracks?.length}</span>
              </button>
            )}
            {showExtraBadges && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-mono shrink-0">
                {currentBook.format}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Center: Controls & Scrubber */}
      <div className="flex-1 flex flex-col items-center justify-center min-w-0 max-w-xl px-2 sm:px-4 mx-2">
        {/* Buttons */}
        <div className="flex items-center space-x-2 sm:space-x-3 mb-1">
          {showChapterSkips && currentBook.is_multi_track && (
            <button
              onClick={previousChapter}
              disabled={currentTrackIndex === 0 && currentTime < 5}
              title="Previous Chapter"
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-aura-850 rounded-full transition-all disabled:opacity-30 cursor-pointer"
            >
              <SkipPrevIcon className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => skipBackward(30)}
            title="Rewind 30 seconds"
            className="p-1.5 sm:p-2 text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-aura-850 rounded-full transition-all cursor-pointer"
          >
            <SkipBack30Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            onClick={togglePlay}
            title={isPlaying ? 'Pause' : 'Play'}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center shadow-amber-glow hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            {isPlaying ? (
              <PauseIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : (
              <PlayIcon className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5" />
            )}
          </button>

          <button
            onClick={() => skipForward(30)}
            title="Skip 30 seconds"
            className="p-1.5 sm:p-2 text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-aura-850 rounded-full transition-all cursor-pointer"
          >
            <SkipForward30Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {showChapterSkips && currentBook.is_multi_track && (
            <button
              onClick={nextChapter}
              disabled={!currentBook.tracks || currentTrackIndex >= currentBook.tracks.length - 1}
              title="Next Chapter"
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-aura-850 rounded-full transition-all disabled:opacity-30 cursor-pointer"
            >
              <SkipNextIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Scrubber Range */}
        <div className="w-full flex items-center space-x-2 sm:space-x-3 text-[11px] sm:text-xs font-mono text-slate-500 dark:text-slate-400">
          <span className="w-10 sm:w-12 text-right shrink-0">{displayFormattedCurrentTime}</span>
          <div className="relative flex-1 flex items-center min-w-[80px]">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={1}
              value={displayTime}
              onPointerDown={() => {
                setIsScrubbing(true);
                setScrubValue(currentTime);
              }}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setScrubValue(val);
                if (!isScrubbing) {
                  seek(val);
                }
              }}
              onPointerUp={(e) => {
                setIsScrubbing(false);
                seek(parseFloat((e.target as HTMLInputElement).value));
              }}
              className="w-full h-1.5 bg-slate-200 dark:bg-aura-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
          <span className="w-10 sm:w-12 text-left shrink-0">{formattedDuration}</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center justify-end space-x-1 sm:space-x-1.5 md:space-x-2 shrink-0">
        {/* Speed Selector */}
        {showSpeed && (
          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu((prev) => !prev)}
              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-aura-850 hover:bg-slate-200 dark:hover:bg-aura-800 border border-slate-200 dark:border-aura-700/60 text-xs font-mono font-medium text-amber-600 dark:text-amber-400 transition-all cursor-pointer"
            >
              {playbackRate.toFixed(2).replace(/\.00$/, '')}x
            </button>

            {showSpeedMenu && (
              <div className="absolute bottom-full mb-2 right-0 bg-white dark:bg-aura-900 border border-slate-200 dark:border-aura-750 p-1.5 rounded-xl shadow-xl w-32 flex flex-col space-y-1 z-50">
                <span className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">Speed</span>
                {SPEED_PRESETS.map((rate) => (
                  <button
                    key={rate}
                    onClick={() => {
                      setSpeed(rate);
                      setShowSpeedMenu(false);
                    }}
                    className={`text-xs px-2.5 py-1.5 rounded-lg text-left font-mono transition-colors ${
                      playbackRate === rate
                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-aura-800'
                    }`}
                  >
                    {rate.toFixed(2).replace(/\.00$/, '')}x
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Chapters Drawer Toggle */}
        {showChapters && currentBook.is_multi_track && (
          <button
            onClick={() => toggleChapters(currentBook)}
            title="View Chapters Sequence"
            className="p-1.5 sm:p-2 text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-aura-850 rounded-lg relative transition-all cursor-pointer"
          >
            <ChaptersIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        {/* Bookmarks Drawer Toggle */}
        {showBookmarks && (
          <button
            onClick={toggleBookmarks}
            title="Bookmarks"
            className="p-1.5 sm:p-2 text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-aura-850 rounded-lg relative transition-all cursor-pointer"
          >
            <BookmarkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            {bookmarks.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>
        )}

        {/* Volume & Mute */}
        {showVolumeButton && (
          <div className="flex items-center space-x-1 sm:space-x-1.5 group">
            <button
              onClick={toggleMute}
              title={isMuted || volume === 0 ? 'Unmute' : 'Mute'}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              {isMuted || volume === 0 ? (
                <VolumeXIcon className="w-4 h-4 text-rose-500" />
              ) : (
                <Volume2Icon className="w-4 h-4" />
              )}
            </button>
            {showVolumeSlider && (
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-12 sm:w-16 h-1 bg-slate-200 dark:bg-aura-800 accent-amber-500 rounded cursor-pointer"
                title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
              />
            )}
          </div>
        )}

        {/* Spotify-style Miniplayer */}
        <button
          onClick={toggleMiniPlayer}
          title="Open Miniplayer (Always on Top)"
          className="p-1.5 sm:p-2 text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-aura-850 rounded-lg transition-all cursor-pointer"
        >
          <MiniPlayerIcon className="w-4 h-4" />
        </button>

        {/* Fullscreen Expand */}
        <button
          onClick={toggleFullScreen}
          title="Fullscreen Mode"
          className="p-1.5 sm:p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-aura-850 rounded-lg transition-all cursor-pointer"
        >
          <MaximizeIcon className="w-4 h-4" />
        </button>

        {/* Close / Dismiss Player */}
        <button
          onClick={clearPlayer}
          title="Close / Stop Player"
          className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 dark:hover:bg-rose-500/15 rounded-lg transition-all cursor-pointer"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
