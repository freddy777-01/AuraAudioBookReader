import React, { useState, useEffect } from 'react';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { tauriBridge } from '../../services/tauriBridge';
import {
  PlayIcon,
  PauseIcon,
  SkipBack30Icon,
  SkipForward30Icon,
  MaximizeIcon,
  PinIcon,
  SkipPrevIcon,
  SkipNextIcon,
  CloseIcon,
  GripIcon,
  CheckCircleIcon,
  StripModeIcon,
  CardModeIcon,
} from '../common/Icons';

export const MiniPlayer: React.FC = () => {
  const {
    currentBook,
    currentTrackIndex,
    currentTrackTitle,
    isPlaying,
    duration,
    playbackRate,
    progressPercentage,
    formattedCurrentTime,
    formattedDuration,
    timeRemaining,
    togglePlay,
    seek,
    skipForward,
    skipBackward,
    nextChapter,
    previousChapter,
    setSpeed,
    toggleMiniPlayer,
    addBookmark,
  } = useAudioPlayer();

  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [windowHeight, setWindowHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 220
  );
  const [bookmarkedRecently, setBookmarkedRecently] = useState(false);

  const SPEED_PRESETS = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

  // Dynamically track window dimensions so dragging window edges transitions smoothly
  useEffect(() => {
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // If height < 145px or isCompact is explicitly toggled, use the Spotify-style horizontal strip mode
  const effectiveCompact = isCompact || windowHeight < 145;

  const handleTogglePin = async () => {
    const next = !isAlwaysOnTop;
    setIsAlwaysOnTop(next);
    await tauriBridge.setAlwaysOnTop(next);
  };

  const handleToggleCompact = async () => {
    const nextCompact = !effectiveCompact;
    setIsCompact(nextCompact);
    await tauriBridge.setMiniPlayerCompactMode(nextCompact);
  };

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    seek(percentage * duration);
  };

  const handleQuickBookmark = async () => {
    if (!currentBook) return;
    try {
      await addBookmark(`Bookmark at ${formattedCurrentTime}`);
      setBookmarkedRecently(true);
      setTimeout(() => setBookmarkedRecently(false), 2000);
    } catch (err) {
      console.warn('Failed to add quick bookmark:', err);
    }
  };

  if (!currentBook) {
    return (
      <div
        data-tauri-drag-region
        className="h-screen w-screen bg-aura-950 text-slate-200 flex flex-col items-center justify-center p-4 select-none cursor-move"
      >
        <span className="text-xs text-slate-400">No audiobook active</span>
        <button
          onClick={toggleMiniPlayer}
          className="mt-2 px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-xs font-medium hover:bg-amber-500/30 transition-colors"
        >
          Open AuraAudio
        </button>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 1. SLIM HORIZONTAL STRIP / PILL VIEW (Spotify style - Image 1)
  // -------------------------------------------------------------
  if (effectiveCompact) {
    return (
      <div
        data-tauri-drag-region
        className="h-screen w-screen bg-aura-950 text-slate-100 flex items-center justify-between px-2.5 py-1 select-none overflow-hidden relative border border-aura-800/90 cursor-move"
      >
        {/* Left: Close/Drag & Artwork & Title */}
        <div data-tauri-drag-region className="flex items-center space-x-2 min-w-0 flex-1 mr-2 cursor-move">
          {/* Close mini player / return to full app */}
          <div className="flex flex-col items-center justify-center space-y-0.5 shrink-0">
            <button
              onClick={toggleMiniPlayer}
              title="Close mini player (Return to AuraAudio)"
              className="text-slate-400 hover:text-white transition-colors p-0.5 rounded hover:bg-aura-800"
            >
              <CloseIcon className="w-3.5 h-3.5" />
            </button>
            <GripIcon className="w-3.5 h-3.5 text-slate-600 cursor-move" />
          </div>

          {/* Artwork Thumbnail */}
          <div
            onClick={handleToggleCompact}
            title="Click to expand to card view"
            className="w-9 h-9 rounded-md overflow-hidden shrink-0 bg-aura-900 border border-aura-800 shadow cursor-pointer hover:border-amber-500/50 transition-colors"
          >
            {currentBook.cover_image ? (
              <img
                src={currentBook.cover_image}
                alt={currentBook.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-600 to-amber-400 text-white font-serif font-bold text-xs">
                {currentBook.title.charAt(0)}
              </div>
            )}
          </div>

          {/* Track Details */}
          <div data-tauri-drag-region className="min-w-0 flex-1 cursor-move pr-1">
            <h4
              className="text-xs font-semibold text-slate-100 truncate leading-tight"
              title={currentBook.title}
            >
              {currentBook.title}
            </h4>
            <p
              className="text-[10px] text-slate-400 truncate leading-tight mt-0.5"
              title={currentTrackTitle || currentBook.author || ''}
            >
              {currentBook.is_multi_track && currentTrackTitle
                ? `Ch. ${currentTrackIndex + 1}: ${currentTrackTitle}`
                : currentBook.author || 'Audiobook'}
            </p>
          </div>
        </div>

        {/* Subtle Vertical Divider */}
        <div className="h-5 w-[1px] bg-aura-800 shrink-0 mx-1" />

        {/* Right: Quick Bookmark, Controls, Always-on-Top, Card Mode */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {/* Quick Bookmark (Green Checkmark like Spotify!) */}
          <button
            onClick={handleQuickBookmark}
            title={bookmarkedRecently ? 'Bookmark saved!' : 'Save quick bookmark'}
            className={`p-1 rounded-full transition-all ${
              bookmarkedRecently
                ? 'text-emerald-400 bg-emerald-500/20 scale-105'
                : 'text-slate-400 hover:text-emerald-400 hover:bg-aura-850'
            }`}
          >
            <CheckCircleIcon className="w-4 h-4" />
          </button>

          {/* Rewind 30s or Previous Chapter */}
          <button
            onClick={currentBook.is_multi_track ? previousChapter : () => skipBackward(30)}
            className="p-1 text-slate-300 hover:text-white transition-colors"
            title={currentBook.is_multi_track ? 'Previous Chapter' : 'Rewind 30s'}
          >
            <SkipPrevIcon className="w-4 h-4" />
          </button>

          {/* High-Contrast Play / Pause Button (Crisp White Circle with Dark Icon) */}
          <button
            onClick={togglePlay}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white hover:bg-slate-200 active:scale-95 text-slate-950 shadow-md transition-all flex items-center justify-center font-bold"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <PauseIcon className="w-3.5 h-3.5 text-slate-950" />
            ) : (
              <PlayIcon className="w-3.5 h-3.5 ml-0.5 text-slate-950" />
            )}
          </button>

          {/* Fast Forward 30s or Next Chapter */}
          <button
            onClick={currentBook.is_multi_track ? nextChapter : () => skipForward(30)}
            className="p-1 text-slate-300 hover:text-white transition-colors"
            title={currentBook.is_multi_track ? 'Next Chapter' : 'Fast Forward 30s'}
          >
            <SkipNextIcon className="w-4 h-4" />
          </button>

          {/* Always on top pin */}
          <button
            onClick={handleTogglePin}
            title={isAlwaysOnTop ? 'Always on Top: Active' : 'Always on Top: Inactive'}
            className={`p-1 rounded-md transition-colors ${
              isAlwaysOnTop ? 'text-amber-400 bg-amber-500/15' : 'text-slate-500 hover:text-slate-200'
            }`}
          >
            <PinIcon className="w-3.5 h-3.5" pinned={isAlwaysOnTop} />
          </button>

          {/* Switch to Card Mode */}
          <button
            onClick={handleToggleCompact}
            title="Expand to Card View"
            className="p-1 rounded-md text-slate-400 hover:text-amber-400 hover:bg-aura-800 transition-colors"
          >
            <CardModeIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Hairline Interactive Scrubber along bottom edge */}
        <div
          onClick={handleScrub}
          title={`Progress: ${formattedCurrentTime} / ${formattedDuration} (${Math.round(progressPercentage)}%)`}
          className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-aura-850 hover:h-1 cursor-pointer transition-all"
        >
          <div
            className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-300 transition-all duration-100"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. CARD VIEW (Optimized with zero cutoff - Image 2 fixed)
  // -------------------------------------------------------------
  return (
    <div className="h-screen w-screen bg-aura-950 text-slate-100 flex flex-col justify-between p-2.5 sm:p-3 select-none overflow-hidden border border-aura-800/80 shadow-2xl relative">
      {/* Top Drag Bar & Action Controls */}
      <div
        data-tauri-drag-region
        className="flex items-center justify-between cursor-move pb-1 shrink-0"
      >
        <div data-tauri-drag-region className="flex items-center space-x-1.5 min-w-0">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-500/90 font-mono truncate">
            AuraAudio Mini
          </span>
        </div>

        <div className="flex items-center space-x-1 shrink-0">
          {/* Switch to Slim Spotify Pill Bar */}
          <button
            onClick={handleToggleCompact}
            title="Switch to Slim Strip Mode (Spotify style)"
            className="p-1 rounded-md text-slate-400 hover:text-amber-400 hover:bg-aura-800 transition-colors"
          >
            <StripModeIcon className="w-3.5 h-3.5" />
          </button>

          {/* Always on top toggle pin */}
          <button
            onClick={handleTogglePin}
            title={isAlwaysOnTop ? 'Always on Top: Active (Click to unpin)' : 'Always on Top: Inactive'}
            className={`p-1 rounded-md transition-colors ${
              isAlwaysOnTop
                ? 'text-amber-400 bg-amber-500/15'
                : 'text-slate-400 hover:text-slate-200 hover:bg-aura-800'
            }`}
          >
            <PinIcon className="w-3.5 h-3.5" pinned={isAlwaysOnTop} />
          </button>

          {/* Expand to Main Desktop Window */}
          <button
            onClick={toggleMiniPlayer}
            title="Expand to Full Application"
            className="p-1 rounded-md text-slate-400 hover:text-amber-400 hover:bg-aura-800 transition-colors"
          >
            <MaximizeIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Middle: Audiobook Metadata & Cover Art */}
      <div data-tauri-drag-region className="flex items-center space-x-2.5 my-auto py-1 min-h-0 flex-1 cursor-move">
        {/* Thumbnail Artwork */}
        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg overflow-hidden shrink-0 bg-aura-900 border border-aura-800 shadow-md">
          {currentBook.cover_image ? (
            <img
              src={currentBook.cover_image}
              alt={currentBook.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-600 to-amber-400 text-white font-serif font-bold text-sm">
              {currentBook.title.charAt(0)}
            </div>
          )}
        </div>

        {/* Title & Chapter Details */}
        <div className="min-w-0 flex-1">
          <h4
            className="text-xs font-semibold text-slate-100 truncate"
            title={currentBook.title}
          >
            {currentBook.title}
          </h4>
          <p
            className="text-[11px] text-slate-400 truncate mt-0.5"
            title={currentTrackTitle || currentBook.author || ''}
          >
            {currentBook.is_multi_track && currentTrackTitle
              ? `Ch. ${currentTrackIndex + 1}: ${currentTrackTitle}`
              : currentBook.author || 'Audiobook'}
          </p>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-aura-800 text-amber-400">
              {timeRemaining}
            </span>
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-aura-800 hover:bg-aura-750 text-slate-300 transition-colors"
              >
                {playbackRate.toFixed(2).replace(/\.00$/, '')}x
              </button>
              {showSpeedMenu && (
                <div className="absolute bottom-full left-0 mb-1 bg-aura-900 border border-aura-750 rounded-lg p-1 shadow-2xl flex flex-col space-y-0.5 z-50">
                  {SPEED_PRESETS.map((rate) => (
                    <button
                      key={rate}
                      onClick={() => {
                        setSpeed(rate);
                        setShowSpeedMenu(false);
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded text-left font-mono ${
                        playbackRate === rate
                          ? 'bg-amber-500/20 text-amber-400 font-bold'
                          : 'text-slate-300 hover:bg-aura-800'
                      }`}
                    >
                      {rate.toFixed(2).replace(/\.00$/, '')}x
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Interactive Scrubber & Controls - LOCKED with shrink-0 so NEVER hidden! */}
      <div className="space-y-1 shrink-0 pt-0.5">
        {/* Interactive Scrub Bar */}
        <div className="space-y-0.5">
          <div
            onClick={handleScrub}
            className="h-1.5 bg-aura-800/90 hover:h-2 rounded-full cursor-pointer relative overflow-hidden transition-all group"
          >
            <div
              className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-100"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono px-0.5">
            <span>{formattedCurrentTime}</span>
            <span>{formattedDuration}</span>
          </div>
        </div>

        {/* Playback Buttons - Guaranteed full visibility */}
        <div className="flex items-center justify-center space-x-2 py-0.5">
          {currentBook.is_multi_track && (
            <button
              onClick={previousChapter}
              disabled={currentTrackIndex === 0}
              className="p-1 text-slate-400 hover:text-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Previous Chapter"
            >
              <SkipPrevIcon className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => skipBackward(30)}
            className="p-1 text-slate-300 hover:text-amber-400 transition-colors"
            title="Rewind 30s"
          >
            <SkipBack30Icon className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlay}
            className="w-8 h-8 rounded-full bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 shadow-md transition-all flex items-center justify-center"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <PauseIcon className="w-4 h-4" />
            ) : (
              <PlayIcon className="w-4 h-4 ml-0.5" />
            )}
          </button>

          <button
            onClick={() => skipForward(30)}
            className="p-1 text-slate-300 hover:text-amber-400 transition-colors"
            title="Fast Forward 30s"
          >
            <SkipForward30Icon className="w-4 h-4" />
          </button>

          {currentBook.is_multi_track && (
            <button
              onClick={nextChapter}
              disabled={currentTrackIndex >= (currentBook.tracks?.length || 1) - 1}
              className="p-1 text-slate-400 hover:text-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Next Chapter"
            >
              <SkipNextIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
