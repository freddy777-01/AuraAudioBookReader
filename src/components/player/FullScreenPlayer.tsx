import React, { useState } from 'react';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import {
  PlayIcon,
  PauseIcon,
  SkipBack30Icon,
  SkipForward30Icon,
  MinimizeIcon,
  BookmarkIcon,
  Volume2Icon,
  VolumeXIcon,
  ChaptersIcon,
  SkipPrevIcon,
  SkipNextIcon,
} from '../common/Icons';

export const FullScreenPlayer: React.FC = () => {
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
    formattedCurrentTime,
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
    toggleChapters,
    addBookmark,
  } = useAudioPlayer();

  const [newBookmarkTitle, setNewBookmarkTitle] = useState('');
  const [showAddBookmark, setShowAddBookmark] = useState(false);

  if (!currentBook) return null;

  const SPEED_PRESETS = [0.8, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5];

  const handleSaveBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookmarkTitle.trim()) return;
    await addBookmark(newBookmarkTitle.trim());
    setNewBookmarkTitle('');
    setShowAddBookmark(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-aura-950/98 backdrop-blur-2xl flex flex-col justify-between p-8 overflow-y-auto animate-fade-in">
      {/* Background ambient cover reflection glow */}
      {currentBook.cover_image && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10 filter blur-3xl pointer-events-none scale-125"
          style={{ backgroundImage: `url(${currentBook.cover_image})` }}
        />
      )}

      {/* Top Header bar */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center space-x-3">
          <img
            src="/app-icon.png"
            alt="AuraAudio Icon"
            className="w-8 h-8 object-contain drop-shadow-md shrink-0"
          />
          <div>
            <h3 className="text-xs uppercase tracking-widest text-slate-400 font-bold">
              Now Playing
            </h3>
            <p className="text-xs text-amber-400 font-mono">{timeRemaining}</p>
          </div>
        </div>

        <button
          onClick={toggleFullScreen}
          className="p-2.5 rounded-xl bg-aura-900/80 hover:bg-aura-850 border border-aura-800 text-slate-300 hover:text-white transition-all shadow-lg"
          title="Exit Fullscreen"
        >
          <MinimizeIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Center Stage: Huge Art & Metadata */}
      <div className="flex flex-col items-center justify-center my-auto py-6 max-w-2xl mx-auto w-full relative z-10">
        {/* Cover Art */}
        <div className="relative group mb-8">
          <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-2xl overflow-hidden shadow-book-hover border border-aura-700/60 transition-transform duration-500 group-hover:scale-[1.02] bg-aura-900">
            {currentBook.cover_image ? (
              <img
                src={currentBook.cover_image}
                alt={currentBook.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-900/80 via-aura-900 to-aura-950 p-6 text-center">
                <span className="text-6xl font-serif text-amber-400 font-bold mb-3">
                  {currentBook.title.charAt(0)}
                </span>
                <span className="text-sm font-serif italic text-slate-300">
                  {currentBook.title}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Title & Author */}
        <div className="text-center space-y-2 mb-6">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-100 tracking-tight leading-tight">
            {currentBook.title}
          </h2>
          <p className="text-base text-amber-400/90 font-medium">
            {currentBook.author || 'Unknown Author'}
          </p>
          {currentBook.is_multi_track && currentTrackTitle && (
            <div className="pt-1 flex items-center justify-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 shadow-sm">
                <ChaptersIcon className="w-3.5 h-3.5" />
                Part {currentTrackIndex + 1} of {currentBook.tracks?.length}: {currentTrackTitle}
              </span>
              <button
                onClick={() => toggleChapters(currentBook)}
                className="text-xs text-slate-400 hover:text-amber-400 underline underline-offset-4 transition-colors cursor-pointer"
              >
                All Chapters
              </button>
            </div>
          )}
          {currentBook.narrator && !currentBook.is_multi_track && (
            <p className="text-xs text-slate-400">
              Narrated by <span className="text-slate-300">{currentBook.narrator}</span>
            </p>
          )}
        </div>

        {/* Large Scrubber */}
        <div className="w-full space-y-2 mb-6">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={1}
            value={currentTime}
            onChange={(e) => seek(parseFloat(e.target.value))}
            className="w-full h-2.5 bg-aura-800 rounded-lg cursor-pointer accent-amber-400"
          />
          <div className="flex justify-between text-xs font-mono text-slate-400">
            <span>{formattedCurrentTime}</span>
            <span>{formattedDuration}</span>
          </div>
        </div>

        {/* Primary Playback Controls */}
        <div className="flex items-center space-x-6 mb-8">
          {currentBook.is_multi_track && (
            <button
              onClick={previousChapter}
              disabled={currentTrackIndex === 0 && currentTime < 5}
              className="p-2.5 text-slate-400 hover:text-amber-400 hover:bg-aura-900 rounded-full transition-all disabled:opacity-30"
              title="Previous Chapter"
            >
              <SkipPrevIcon className="w-6 h-6" />
            </button>
          )}

          <button
            onClick={() => skipBackward(30)}
            className="p-3 text-slate-300 hover:text-amber-400 hover:bg-aura-900 rounded-full transition-all"
            title="Rewind 30s"
          >
            <SkipBack30Icon className="w-7 h-7" />
          </button>

          <button
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center shadow-amber-glow hover:scale-105 active:scale-95 transition-all"
          >
            {isPlaying ? (
              <PauseIcon className="w-8 h-8" />
            ) : (
              <PlayIcon className="w-8 h-8 ml-0.5" />
            )}
          </button>

          <button
            onClick={() => skipForward(30)}
            className="p-3 text-slate-300 hover:text-amber-400 hover:bg-aura-900 rounded-full transition-all"
            title="Forward 30s"
          >
            <SkipForward30Icon className="w-7 h-7" />
          </button>

          {currentBook.is_multi_track && (
            <button
              onClick={nextChapter}
              disabled={!currentBook.tracks || currentTrackIndex >= currentBook.tracks.length - 1}
              className="p-2.5 text-slate-400 hover:text-amber-400 hover:bg-aura-900 rounded-full transition-all disabled:opacity-30"
              title="Next Chapter"
            >
              <SkipNextIcon className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Variable Speed Selector Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          <span className="text-xs text-slate-400 uppercase tracking-wider mr-2 font-mono">
            Speed:
          </span>
          {SPEED_PRESETS.map((rate) => (
            <button
              key={rate}
              onClick={() => setSpeed(rate)}
              className={`px-3 py-1 rounded-full text-xs font-mono transition-all ${
                Math.abs(playbackRate - rate) < 0.05
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-amber-glow'
                  : 'bg-aura-900/90 text-slate-300 hover:bg-aura-850 hover:text-amber-400 border border-aura-800'
              }`}
            >
              {rate.toFixed(2).replace(/\.00$/, '')}x
            </button>
          ))}
        </div>

        {/* Add Bookmark Quick Action */}
        <div className="w-full max-w-md">
          {showAddBookmark ? (
            <form onSubmit={handleSaveBookmark} className="flex space-x-2">
              <input
                type="text"
                autoFocus
                placeholder={`Bookmark at ${formattedCurrentTime} (e.g. Favorite Quote)...`}
                value={newBookmarkTitle}
                onChange={(e) => setNewBookmarkTitle(e.target.value)}
                className="flex-1 px-4 py-2 bg-aura-900 border border-aura-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold rounded-xl transition-all"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setShowAddBookmark(false)}
                className="px-3 py-2 bg-aura-850 text-slate-400 hover:text-white rounded-xl text-xs"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowAddBookmark(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-aura-900/60 hover:bg-aura-850 border border-aura-800/80 text-xs font-medium text-slate-300 hover:text-amber-400 flex items-center justify-center space-x-2 transition-all"
            >
              <BookmarkIcon className="w-4 h-4 text-amber-400" />
              <span>Add Bookmark at {formattedCurrentTime}</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Footer Details */}
      <div className="flex items-center justify-between text-xs text-slate-500 border-t border-aura-800/60 pt-4 relative z-10">
        <div className="flex items-center space-x-3">
          <span className="font-mono">{bookmarks.length} Bookmarks saved</span>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleMute}
            className="hover:text-slate-300 transition-colors"
          >
            {isMuted || volume === 0 ? (
              <VolumeXIcon className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2Icon className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-24 h-1 bg-aura-800 accent-amber-400 rounded cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
