import React, { useState } from 'react';
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
  } = useAudioPlayer();

  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const SPEED_PRESETS = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

  const handleTogglePin = async () => {
    const next = !isAlwaysOnTop;
    setIsAlwaysOnTop(next);
    await tauriBridge.setAlwaysOnTop(next);
  };

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    seek(percentage * duration);
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

  return (
    <div className="h-screen w-screen bg-aura-950 text-slate-100 flex flex-col justify-between p-3 select-none overflow-hidden border border-aura-800/80 shadow-2xl">
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
      <div data-tauri-drag-region className="flex items-center space-x-3 my-auto py-1 cursor-move">
        {/* Thumbnail Artwork */}
        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-aura-900 border border-aura-800 shadow-md">
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

      {/* Bottom: Interactive Scrubber & Controls */}
      <div className="space-y-1.5 shrink-0 pt-1">
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

        {/* Playback Buttons */}
        <div className="flex items-center justify-center space-x-2">
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
            className="p-2 rounded-full bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 shadow-md transition-all flex items-center justify-center"
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
