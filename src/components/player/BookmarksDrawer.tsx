import React, { useState } from 'react';
import { useAudioPlayer, formatTime } from '../../hooks/useAudioPlayer';
import { BookmarkIcon, XIcon, TrashIcon, PlayIcon, PlusIcon } from '../common/Icons';

export const BookmarksDrawer: React.FC = () => {
  const {
    currentBook,
    isBookmarksOpen,
    toggleBookmarks,
    bookmarks,
    seek,
    deleteBookmark,
    addBookmark,
    currentTime,
  } = useAudioPlayer();

  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  if (!isBookmarksOpen || !currentBook) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await addBookmark(title.trim(), note.trim() || undefined);
    setTitle('');
    setNote('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-80 sm:w-96 bg-white dark:bg-aura-900 border-l border-slate-200 dark:border-aura-800 shadow-2xl z-50 flex flex-col justify-between animate-slide-left transition-colors duration-200">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 dark:border-aura-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <BookmarkIcon className="w-5 h-5 text-amber-500 dark:text-amber-400" />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Bookmarks & Notes</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-aura-800 text-amber-600 dark:text-amber-400 font-mono">
            {bookmarks.length}
          </span>
        </div>
        <button
          onClick={toggleBookmarks}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-aura-850 transition-colors"
        >
          <XIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Bookmarks List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {bookmarks.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-slate-500">
            <BookmarkIcon className="w-12 h-12 mb-3 text-slate-300 dark:text-aura-700" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-400">No bookmarks saved yet</p>
            <p className="text-xs mt-1 text-slate-500">
              Save key moments or quotes while listening to quickly jump back anytime.
            </p>
          </div>
        ) : (
          bookmarks.map((bm) => (
            <div
              key={bm.id}
              className="group p-3.5 rounded-xl bg-slate-50 dark:bg-aura-850/80 hover:bg-slate-100 dark:hover:bg-aura-800 border border-slate-200 dark:border-aura-700/50 transition-all flex flex-col space-y-1.5 relative shadow-sm"
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={() => seek(bm.timestamp_seconds)}
                  className="inline-flex items-center space-x-1.5 text-xs font-mono font-bold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  <PlayIcon className="w-3.5 h-3.5" />
                  <span>{formatTime(bm.timestamp_seconds)}</span>
                </button>
                <button
                  onClick={() => deleteBookmark(bm.id)}
                  title="Delete bookmark"
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>

              <h4
                onClick={() => seek(bm.timestamp_seconds)}
                className="text-xs font-semibold text-slate-900 dark:text-slate-200 cursor-pointer hover:text-amber-600 dark:hover:text-amber-300"
              >
                {bm.title}
              </h4>

              {bm.note && (
                <p className="text-[11px] text-slate-600 dark:text-slate-400 italic line-clamp-2">
                  "{bm.note}"
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Bottom Bookmark Creator */}
      <div className="p-4 border-t border-slate-200 dark:border-aura-800/80 bg-slate-50 dark:bg-aura-950/40">
        {showAddForm ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 dark:text-slate-400">Add bookmark at:</span>
              <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                {formatTime(currentTime)}
              </span>
            </div>
            <input
              type="text"
              required
              autoFocus
              placeholder="Bookmark Title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-aura-900 border border-slate-300 dark:border-aura-700 rounded-lg text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-amber-500 shadow-sm"
            />
            <textarea
              rows={2}
              placeholder="Optional notes or memorable quote..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-aura-900 border border-slate-300 dark:border-aura-700 rounded-lg text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-amber-500 resize-none shadow-sm"
            />
            <div className="flex space-x-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-all shadow-sm"
              >
                Save Bookmark
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-2 bg-slate-200 dark:bg-aura-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 text-xs rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full py-2.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-sm"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Bookmark at {formatTime(currentTime)}</span>
          </button>
        )}
      </div>
    </div>
  );
};
