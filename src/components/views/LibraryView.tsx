import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
  useLayoutEffect,
} from 'react';
import { Audiobook, FilterMode, SortOption, OrganizationMode } from '../../types/audiobook';
import { useAudioPlayer, formatTime } from '../../hooks/useAudioPlayer';
import {
  SearchIcon,
  PlayIcon,
  FolderIcon,
  RefreshIcon,
  GridIcon,
  UserIcon,
  FolderTreeIcon,
  ChaptersIcon,
  EqualizerIcon,
} from '../common/Icons';
import {
  organizeAudiobooks,
  groupByAuthor,
  groupByFolder,
  filterAndSortAudiobooks,
} from '../../services/audiobookOrganizer';

interface LibraryViewProps {
  books: Audiobook[];
  folders?: string[];
  onScan: () => void;
  isScanning: boolean;
  onOpenSettings: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  books,
  folders = [],
  onScan,
  isScanning,
  onOpenSettings,
}) => {
  const { currentBook, isPlaying, togglePlay, loadBook, toggleChapters } = useAudioPlayer();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [orgMode, setOrgMode] = useState<OrganizationMode>('books');

  // Sliding bouncy pill animation for Organization Mode tabs
  const orgContainerRef = useRef<HTMLDivElement>(null);
  const orgTabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [orgPillStyle, setOrgPillStyle] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

  const updateOrgPill = useCallback(() => {
    const container = orgContainerRef.current;
    const activeTab = orgTabRefs.current[orgMode];
    if (container && activeTab) {
      const containerRect = container.getBoundingClientRect();
      const tabRect = activeTab.getBoundingClientRect();
      setOrgPillStyle({
        left: tabRect.left - containerRect.left,
        width: tabRect.width,
        ready: true,
      });
    }
  }, [orgMode]);

  useLayoutEffect(() => {
    updateOrgPill();
  }, [updateOrgPill]);

  useEffect(() => {
    window.addEventListener('resize', updateOrgPill);
    return () => window.removeEventListener('resize', updateOrgPill);
  }, [updateOrgPill]);

  // Sliding bouncy pill animation for Status Filter tabs
  const filterContainerRef = useRef<HTMLDivElement>(null);
  const filterTabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [filterPillStyle, setFilterPillStyle] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

  const updateFilterPill = useCallback(() => {
    const container = filterContainerRef.current;
    const activeTab = filterTabRefs.current[filterMode];
    if (container && activeTab) {
      const containerRect = container.getBoundingClientRect();
      const tabRect = activeTab.getBoundingClientRect();
      setFilterPillStyle({
        left: tabRect.left - containerRect.left,
        width: tabRect.width,
        ready: true,
      });
    }
  }, [filterMode]);

  useLayoutEffect(() => {
    updateFilterPill();
  }, [updateFilterPill]);

  useEffect(() => {
    window.addEventListener('resize', updateFilterPill);
    return () => window.removeEventListener('resize', updateFilterPill);
  }, [updateFilterPill]);

  // Group raw audio files into organized audiobooks
  const organizedBooks = useMemo(() => {
    return organizeAudiobooks(books, folders);
  }, [books, folders]);

  // Which list to filter/sort: grouped books or flat raw tracks
  const sourceList = orgMode === 'tracks' ? books : organizedBooks;

  // Filter and sort
  const displayBooks = useMemo(() => {
    return filterAndSortAudiobooks(sourceList, searchQuery, filterMode, sortBy);
  }, [sourceList, searchQuery, filterMode, sortBy]);

  // Groupings for Author and Folder view modes
  const authorGroups = useMemo(() => {
    if (orgMode !== 'author') return {};
    return groupByAuthor(displayBooks);
  }, [displayBooks, orgMode]);

  const folderGroups = useMemo(() => {
    if (orgMode !== 'folder') return {};
    return groupByFolder(displayBooks);
  }, [displayBooks, orgMode]);

  const handleBookClick = (book: Audiobook) => {
    if (currentBook?.id === book.id) {
      togglePlay();
    } else {
      loadBook(book, true);
    }
  };

  const renderBookCard = (book: Audiobook) => {
    const isThisBookPlaying = currentBook?.id === book.id && isPlaying;
    const completionPct = book.playback?.completion_percentage || 0;
    const isCompleted = book.playback?.is_completed || completionPct >= 99;

    return (
      <div
        key={book.id}
        className="group flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-1.5"
      >
        {/* Book Cover Container */}
        <div
          onClick={() => handleBookClick(book)}
          className="relative aspect-[1/1] w-full rounded-2xl overflow-hidden bg-white dark:bg-aura-900 border border-slate-200/80 dark:border-aura-800 shadow-sm dark:shadow-book group-hover:shadow-md dark:group-hover:shadow-book-hover group-hover:border-amber-500/50 transition-all"
        >
          {book.cover_image ? (
            <img
              src={book.cover_image}
              alt={book.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex flex-col justify-between p-4 bg-gradient-to-br from-amber-600/30 via-slate-100 to-slate-200 dark:from-amber-950/70 dark:via-aura-900 dark:to-aura-950">
              <span className="text-3xl font-serif text-amber-600 dark:text-amber-400 font-bold">
                {book.title.charAt(0)}
              </span>
              <span className="text-xs font-serif italic text-slate-600 dark:text-slate-400 line-clamp-3">
                {book.title}
              </span>
            </div>
          )}

          {/* Chapter / Multi-part Badge */}
          {book.is_multi_track && (
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/90 text-slate-950 shadow-md flex items-center gap-1 backdrop-blur-sm">
              <ChaptersIcon className="w-3 h-3" />
              {book.track_count} Parts
            </span>
          )}

          {/* Format Pill */}
          <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-black/60 text-white backdrop-blur-sm border border-white/10">
            {book.is_multi_track ? 'Multi' : book.format}
          </span>

          {/* Completion Check Badge */}
          {isCompleted && (
            <div className={`absolute ${book.is_multi_track ? 'bottom-3 right-2' : 'top-2 left-2'} px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950 flex items-center space-x-1 shadow-md`}>
              <span>✓</span>
              <span>Done</span>
            </div>
          )}

          {/* Play Button Overlay */}
          <div
            className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center transition-opacity duration-200 ${
              isThisBookPlaying
                ? 'opacity-100'
                : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center shadow-amber-glow group-hover:scale-110 active:scale-95 transition-transform">
              {isThisBookPlaying ? (
                <EqualizerIcon className="w-5 h-5 text-slate-950" />
              ) : (
                <PlayIcon className="w-6 h-6 ml-0.5" />
              )}
            </div>
          </div>

          {/* Card Bottom Progress Line */}
          {completionPct > 0 && !isCompleted && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-200/90 dark:bg-aura-950/80">
              <div
                className="h-full bg-gradient-to-r from-amber-600 to-amber-400"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          )}
        </div>

        {/* Book Details */}
        <div className="mt-3 space-y-1">
          <div className="flex items-start justify-between gap-1">
            <h4
              onClick={() => handleBookClick(book)}
              className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors flex-1"
              title={book.title}
            >
              {book.title}
            </h4>

            {/* Quick Chapter Drawer Preview Button */}
            {book.is_multi_track && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleChapters(book);
                }}
                className="p-1 rounded text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                title="View sequence of chapters"
              >
                <ChaptersIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 truncate" title={book.author}>
            {book.author || 'Unknown Author'}
          </p>

          <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 font-mono pt-0.5">
            <span>{formatTime(book.duration_seconds)}</span>
            {book.is_multi_track ? (
              <span className="text-[10px] text-amber-600/90 dark:text-amber-400/80 font-medium">
                {book.track_count} parts
              </span>
            ) : completionPct > 0 ? (
              <span className="text-amber-600 dark:text-amber-400/90 font-medium">
                {Math.round(completionPct)}%
              </span>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6 select-none transition-colors duration-200">
      {/* Top Banner / Search & Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            My Audiobook Library
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              {organizedBooks.length} {organizedBooks.length === 1 ? 'Audiobook' : 'Audiobooks'}
            </span>
            <span>•</span>
            <span>{books.length} chapter files indexed locally</span>
          </p>
        </div>

        {/* Organization Mode Switcher & Search Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Organization Switcher Tabs with Animated Bouncy Pill */}
          <div
            ref={orgContainerRef}
            className="relative flex items-center p-1 rounded-xl bg-slate-200/70 dark:bg-aura-900 border border-slate-300/60 dark:border-aura-800 text-xs shadow-inner"
          >
            {/* Smooth Bouncing Sliding Pill */}
            <div
              className={`absolute top-1 bottom-1 left-0 bg-amber-500 rounded-lg shadow-sm shadow-amber-500/25 pointer-events-none ${
                orgPillStyle.ready ? 'transition-spring-pill opacity-100' : 'opacity-0'
              }`}
              style={{
                transform: `translateX(${orgPillStyle.left}px)`,
                width: `${orgPillStyle.width}px`,
              }}
            />

            <button
              ref={(el) => { orgTabRefs.current['books'] = el; }}
              onClick={() => setOrgMode('books')}
              className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors duration-200 select-none ${
                orgMode === 'books'
                  ? 'text-slate-950 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
              title="Organized Books (Grouped by Album / Book Folder)"
            >
              <GridIcon className="w-3.5 h-3.5" />
              <span>Books</span>
            </button>

            <button
              ref={(el) => { orgTabRefs.current['author'] = el; }}
              onClick={() => setOrgMode('author')}
              className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors duration-200 select-none ${
                orgMode === 'author'
                  ? 'text-slate-950 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
              title="Organize by Author"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>By Author</span>
            </button>

            <button
              ref={(el) => { orgTabRefs.current['folder'] = el; }}
              onClick={() => setOrgMode('folder')}
              className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors duration-200 select-none ${
                orgMode === 'folder'
                  ? 'text-slate-950 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
              title="Organize by Folder (Matches your disk folders)"
            >
              <FolderTreeIcon className="w-3.5 h-3.5" />
              <span>By Folder</span>
            </button>

            <button
              ref={(el) => { orgTabRefs.current['tracks'] = el; }}
              onClick={() => setOrgMode('tracks')}
              className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors duration-200 select-none ${
                orgMode === 'tracks'
                  ? 'text-slate-950 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
              title="All Chapter Tracks (Unpacked View)"
            >
              <ChaptersIcon className="w-3.5 h-3.5" />
              <span>All Tracks</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-64">
            <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search books, authors, chapters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-aura-900 border border-slate-200 dark:border-aura-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400/80 transition-all shadow-sm"
            />
          </div>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-1.5 bg-white dark:bg-aura-900 border border-slate-200 dark:border-aura-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer shadow-sm"
          >
            <option value="recent">Recently Played</option>
            <option value="title">Title (A-Z)</option>
            <option value="author">Author (A-Z)</option>
            <option value="duration">Longest First</option>
            <option value="tracks">Most Chapters</option>
            <option value="progress">Most Completed</option>
          </select>

          {/* Rescan Button */}
          <button
            onClick={onScan}
            disabled={isScanning}
            title="Rescan library folders"
            className="p-2 bg-white dark:bg-aura-900 hover:bg-slate-100 dark:hover:bg-aura-850 border border-slate-200 dark:border-aura-800 text-slate-600 dark:text-slate-300 hover:text-amber-500 rounded-xl transition-all disabled:opacity-50 shadow-sm"
          >
            <RefreshIcon className={`w-4 h-4 ${isScanning ? 'animate-spin text-amber-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs with Sliding Bouncy Pill */}
      <div className="border-b border-slate-200 dark:border-aura-800/60 pb-3">
        <div
          ref={filterContainerRef}
          className="relative inline-flex items-center p-1 rounded-xl bg-slate-200/60 dark:bg-aura-900/60 border border-slate-300/40 dark:border-aura-800/60 text-xs shadow-inner"
        >
          {/* Animated Bouncy Pill */}
          <div
            className={`absolute top-1 bottom-1 left-0 bg-amber-500 rounded-lg shadow-sm shadow-amber-500/25 pointer-events-none ${
              filterPillStyle.ready ? 'transition-spring-pill opacity-100' : 'opacity-0'
            }`}
            style={{
              transform: `translateX(${filterPillStyle.left}px)`,
              width: `${filterPillStyle.width}px`,
            }}
          />

          {(['all', 'in-progress', 'completed', 'not-started'] as FilterMode[]).map((tab) => (
            <button
              key={tab}
              ref={(el) => { filterTabRefs.current[tab] = el; }}
              onClick={() => setFilterMode(tab)}
              className={`relative z-10 px-3.5 py-1.5 rounded-lg text-xs capitalize transition-colors duration-200 select-none ${
                filterMode === tab
                  ? 'text-slate-950 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium'
              }`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {displayBooks.length === 0 ? (
        <div className="min-h-[350px] border border-dashed border-slate-300 dark:border-aura-800 rounded-2xl flex flex-col items-center justify-center p-8 text-center bg-slate-100/60 dark:bg-aura-900/20">
          <FolderIcon className="w-16 h-16 text-amber-500/50 mb-4" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            {books.length === 0 ? 'No Audiobooks Found' : 'No Matching Titles'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1.5 mb-5">
            {books.length === 0
              ? 'Add your local audiobook folder (.mp3, .m4b) to index and track your reading progress.'
              : 'Try clearing your search query or switching filters.'}
          </p>
          {books.length === 0 ? (
            <button
              onClick={onOpenSettings}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold text-xs shadow-amber-glow hover:scale-105 active:scale-95 transition-all"
            >
              Configure Folders
            </button>
          ) : (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterMode('all');
              }}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-aura-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:text-white text-xs font-medium transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : orgMode === 'author' ? (
        /* Author Grouped View */
        <div className="space-y-10">
          {Object.entries(authorGroups)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([author, groupBooks]) => (
              <div key={author} className="space-y-4">
                <div className="flex items-center gap-3 border-b border-amber-500/15 pb-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif font-bold text-slate-900 dark:text-slate-100">
                      {author}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {groupBooks.length} {groupBooks.length === 1 ? 'Audiobook' : 'Audiobooks'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                  {groupBooks.map((book) => renderBookCard(book))}
                </div>
              </div>
            ))}
        </div>
      ) : orgMode === 'folder' ? (
        /* Folder Grouped View */
        <div className="space-y-10">
          {Object.entries(folderGroups)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([folder, groupBooks]) => (
              <div key={folder} className="space-y-4">
                <div className="flex items-center gap-3 border-b border-amber-500/15 pb-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <FolderTreeIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 font-mono">
                      {folder}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {groupBooks.length} {groupBooks.length === 1 ? 'Title' : 'Titles'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                  {groupBooks.map((book) => renderBookCard(book))}
                </div>
              </div>
            ))}
        </div>
      ) : (
        /* Standard Books Grid or Flat Tracks Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {displayBooks.map((book) => renderBookCard(book))}
        </div>
      )}
    </div>
  );
};
