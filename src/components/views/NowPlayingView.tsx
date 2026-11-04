import React, { useState, useEffect, useRef } from 'react';
import { useAudioPlayer, formatTime } from '../../hooks/useAudioPlayer';
import {
  PlayIcon,
  PauseIcon,
  SkipBack30Icon,
  SkipForward30Icon,
  SkipPrevIcon,
  SkipNextIcon,
  ChaptersIcon,
  BookmarkIcon,
  MaximizeIcon,
  Volume2Icon,
  VolumeXIcon,
  TrashIcon,
} from '../common/Icons';

interface NowPlayingViewProps {
  onOpenLibrary: () => void;
}

export const NowPlayingView: React.FC<NowPlayingViewProps> = ({ onOpenLibrary }) => {
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
    toggleChapters,
    setSpeed,
    setVolume,
    toggleMute,
    toggleFullScreen,
    addBookmark,
    deleteBookmark,
  } = useAudioPlayer();

  const [bmTitle, setBmTitle] = useState('');
  const [bmNote, setBmNote] = useState('');
  const [showBmForm, setShowBmForm] = useState(false);

  // Local scrubbing state to ensure silky-smooth dragging without fighting audio updates
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);
  const scrubValueRef = useRef(scrubValue);
  scrubValueRef.current = scrubValue;

  const displayTime = isScrubbing ? scrubValue : currentTime;
  const displayFormattedCurrentTime = formatTime(displayTime);

  useEffect(() => {
    if (!isScrubbing) return;
    const handleGlobalPointerUp = () => {
      setIsScrubbing(false);
      seek(scrubValueRef.current);
    };
    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => window.removeEventListener('pointerup', handleGlobalPointerUp);
  }, [isScrubbing, seek]);

  const SPEED_PRESETS = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5];

  if (!currentBook) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none transition-colors duration-200">
        <div className="w-20 h-20 rounded-2xl bg-white dark:bg-aura-900 border border-slate-200 dark:border-aura-800 flex items-center justify-center mb-5 text-amber-500 shadow-sm">
          <BookmarkIcon className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-serif font-bold text-slate-800 dark:text-slate-200">No Book Currently Playing</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1.5 mb-6">
          Choose an audiobook from your library to start listening, bookmark moments, and track reading progress.
        </p>
        <button
          onClick={onOpenLibrary}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold text-xs shadow-amber-glow hover:scale-105 active:scale-95 transition-all"
        >
          Browse Library
        </button>
      </div>
    );
  }

  const handleAddBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bmTitle.trim()) return;
    await addBookmark(bmTitle.trim(), bmNote.trim() || undefined);
    setBmTitle('');
    setBmNote('');
    setShowBmForm(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 select-none transition-colors duration-200">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Cover & Main Controls (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center text-center space-y-6">
          {/* Cover */}
          <div className="relative group">
            <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-2xl overflow-hidden shadow-md dark:shadow-book-hover border border-slate-200 dark:border-aura-700/60 bg-white dark:bg-aura-900">
              {currentBook.cover_image ? (
                <img
                  src={currentBook.cover_image}
                  alt={currentBook.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-600/30 via-slate-100 to-slate-200 dark:from-amber-950/80 dark:via-aura-900 dark:to-aura-950 p-6">
                  <span className="text-5xl font-serif text-amber-600 dark:text-amber-400 font-bold mb-2">
                    {currentBook.title.charAt(0)}
                  </span>
                  <span className="text-xs font-serif text-slate-600 dark:text-slate-400">{currentBook.title}</span>
                </div>
              )}
            </div>

            <button
              onClick={toggleFullScreen}
              className="absolute bottom-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity"
              title="Fullscreen Mode"
            >
              <MaximizeIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Book Info */}
          <div className="space-y-1.5 max-w-lg">
            <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {currentBook.title}
            </h2>
            <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
              {currentBook.author || 'Unknown Author'}
            </p>
            {currentBook.narrator && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Narrated by <span className="text-slate-700 dark:text-slate-300 font-medium">{currentBook.narrator}</span>
              </p>
            )}
            {currentBook.tracks && currentBook.tracks.length > 1 && (
              <div className="pt-1">
                <button
                  onClick={() => toggleChapters(currentBook)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-medium transition-all group max-w-full"
                  title="View all chapters in sequence"
                >
                  <ChaptersIcon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">
                    Part {currentTrackIndex + 1} of {currentBook.tracks.length}
                    {currentTrackTitle ? `: ${currentTrackTitle}` : ''}
                  </span>
                  <span className="text-[10px] text-amber-500/70 group-hover:text-amber-500 font-mono underline ml-1 flex-shrink-0">
                    Chapters
                  </span>
                </button>
              </div>
            )}
            <div className="pt-1">
              <span className="text-xs font-mono text-amber-600 dark:text-amber-400/90 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                {timeRemaining}
              </span>
            </div>
          </div>

          {/* Scrubber */}
          <div className="w-full max-w-lg space-y-1.5">
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
              className="w-full h-2 bg-slate-200 dark:bg-aura-800 rounded-lg cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
              <span>{displayFormattedCurrentTime}</span>
              <span>{formattedDuration}</span>
            </div>
          </div>

          {/* Big Buttons */}
          <div className="flex items-center space-x-4">
            {currentBook.tracks && currentBook.tracks.length > 1 && (
              <button
                onClick={previousChapter}
                disabled={currentTrackIndex <= 0}
                className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-aura-850 rounded-full transition-all disabled:opacity-30 disabled:pointer-events-none"
                title="Previous Chapter"
              >
                <SkipPrevIcon className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={() => skipBackward(30)}
              className="p-3 text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-aura-850 rounded-full transition-all"
              title="Skip back 30s"
            >
              <SkipBack30Icon className="w-6 h-6" />
            </button>

            <button
              onClick={togglePlay}
              className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center shadow-amber-glow hover:scale-105 active:scale-95 transition-all"
            >
              {isPlaying ? <PauseIcon className="w-7 h-7" /> : <PlayIcon className="w-7 h-7 ml-0.5" />}
            </button>

            <button
              onClick={() => skipForward(30)}
              className="p-3 text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-aura-850 rounded-full transition-all"
              title="Skip forward 30s"
            >
              <SkipForward30Icon className="w-6 h-6" />
            </button>

            {currentBook.tracks && currentBook.tracks.length > 1 && (
              <button
                onClick={nextChapter}
                disabled={currentTrackIndex >= currentBook.tracks.length - 1}
                className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-aura-850 rounded-full transition-all disabled:opacity-30 disabled:pointer-events-none"
                title="Next Chapter"
              >
                <SkipNextIcon className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Speed Presets */}
          <div className="flex items-center space-x-2 pt-2">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono uppercase">Speed:</span>
            {SPEED_PRESETS.map((rate) => (
              <button
                key={rate}
                onClick={() => setSpeed(rate)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                  Math.abs(playbackRate - rate) < 0.05
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-white dark:bg-aura-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-aura-800'
                }`}
              >
                {rate.toFixed(2).replace(/\.00$/, '')}x
              </button>
            ))}
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-3 pt-2">
            <button
              onClick={toggleMute}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeXIcon className="w-4 h-4 text-rose-500" />
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
              className="w-28 h-1.5 bg-slate-200 dark:bg-aura-800 accent-amber-500 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Right Column: Bookmarks & File Info (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          {/* Bookmarks Section */}
          <div className="bg-white dark:bg-aura-900 border border-slate-200 dark:border-aura-800 rounded-2xl p-5 flex flex-col h-[400px] shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-aura-800/80 pb-3 mb-3">
              <div className="flex items-center space-x-2">
                <BookmarkIcon className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <h3 className="text-xs uppercase font-bold tracking-wider text-slate-800 dark:text-slate-200">
                  Bookmarks & Quotes ({bookmarks.length})
                </h3>
              </div>
              <button
                onClick={() => setShowBmForm((prev) => !prev)}
                className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
              >
                {showBmForm ? 'Close' : '+ Add Bookmark'}
              </button>
            </div>

            {showBmForm && (
              <form onSubmit={handleAddBookmark} className="mb-4 p-3 bg-slate-50 dark:bg-aura-850 rounded-xl space-y-2 border border-slate-200 dark:border-transparent">
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Timestamp:</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{formattedCurrentTime}</span>
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Bookmark Title..."
                  value={bmTitle}
                  onChange={(e) => setBmTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-aura-900 border border-slate-300 dark:border-aura-700 rounded-lg text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-amber-500 shadow-sm"
                />
                <textarea
                  rows={2}
                  placeholder="Optional notes or memorable quote..."
                  value={bmNote}
                  onChange={(e) => setBmNote(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-aura-900 border border-slate-300 dark:border-aura-700 rounded-lg text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-amber-500 resize-none shadow-sm"
                />
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBmForm(false)}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-aura-800 text-slate-600 dark:text-slate-400 text-xs rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {bookmarks.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400 dark:text-slate-500 text-xs">
                  <p>No bookmarks yet.</p>
                  <p className="mt-1">Add your favorite quotes or timestamps while listening.</p>
                </div>
              ) : (
                bookmarks.map((bm) => (
                  <div
                    key={bm.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-aura-850/60 hover:bg-slate-100 dark:hover:bg-aura-850 border border-slate-200 dark:border-aura-800 transition-all flex items-start justify-between group shadow-sm"
                  >
                    <div
                      onClick={() => seek(bm.timestamp_seconds)}
                      className="cursor-pointer flex-1 min-w-0"
                    >
                      <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 block">
                        {formatTime(bm.timestamp_seconds)}
                      </span>
                      <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                        {bm.title}
                      </h4>
                      {bm.note && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-2 mt-0.5">
                          "{bm.note}"
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteBookmark(bm.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity ml-2"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* File & Codec Details */}
          <div className="bg-white dark:bg-aura-900 border border-slate-200 dark:border-aura-800 rounded-2xl p-5 space-y-3 shadow-sm">
            <h3 className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
              Audio File Metadata
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-aura-800/60">
                <span className="text-slate-500 dark:text-slate-400">Format</span>
                <span className="font-mono text-amber-600 dark:text-amber-400 uppercase font-semibold">{currentBook.format}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-aura-800/60">
                <span className="text-slate-500 dark:text-slate-400">File Size</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {(currentBook.file_size / (1024 * 1024)).toFixed(1)} MB
                </span>
              </div>
              <div className="py-1">
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Local File Path</span>
                <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 break-all bg-slate-100 dark:bg-aura-950 p-2 rounded-lg block border border-slate-200 dark:border-transparent">
                  {currentBook.file_path}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
