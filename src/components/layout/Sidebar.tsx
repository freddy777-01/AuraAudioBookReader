import React, { useState, useEffect } from 'react';
import { ViewMode } from '../../types/audiobook';
import {
  LibraryIcon,
  HeadphonesIcon,
  SettingsIcon,
  RefreshIcon,
  SunIcon,
  MoonIcon,
  MonitorIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InfoIcon,
} from '../common/Icons';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { useTheme } from '../../hooks/useTheme';

interface SidebarProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  bookCount: number;
  onScan: () => void;
  isScanning: boolean;
  onOpenAbout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  bookCount,
  onScan,
  isScanning,
  onOpenAbout,
}) => {
  const { currentBook, isPlaying } = useAudioPlayer();
  const { theme, setTheme } = useTheme();

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('aura_sidebar_collapsed') === 'true';
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('aura_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Keyboard shortcut Ctrl+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Quick theme cycler for collapsed view
  const cycleTheme = () => {
    if (theme === 'light') setTheme('night');
    else if (theme === 'night') setTheme('system');
    else setTheme('light');
  };

  return (
    <aside
      className={`bg-white dark:bg-aura-900 border-r border-slate-200 dark:border-aura-800 flex flex-col justify-between shrink-0 select-none transition-all duration-300 ease-in-out relative ${
        isCollapsed ? 'w-[76px]' : 'w-64'
      }`}
    >
      {/* Top Branding & Toggle */}
      <div>
        <div
          className={`border-b border-slate-200 dark:border-aura-800/60 flex items-center transition-all ${
            isCollapsed
              ? 'p-4 flex-col space-y-3 justify-center'
              : 'p-5 justify-between'
          }`}
        >
          {/* Logo & Title */}
          <div
            onClick={() => onNavigate('library')}
            className={`flex items-center cursor-pointer group ${
              isCollapsed ? 'justify-center' : 'space-x-3'
            }`}
            title="AuraAudio Library"
          >
            <img
              src="/app-icon.png"
              alt="AuraAudio App Icon"
              className="w-10 h-10 object-contain drop-shadow-md shrink-0 group-hover:scale-105 transition-transform"
            />
            {!isCollapsed && (
              <div className="overflow-hidden">
                <h1 className="font-serif font-bold text-lg tracking-wide text-slate-900 dark:text-white leading-tight truncate">
                  AuraAudio
                </h1>
                <p className="text-[11px] uppercase tracking-wider text-amber-600 dark:text-amber-400/90 font-medium truncate">
                  Native Audiobook
                </p>
              </div>
            )}
          </div>

          {/* Minimize / Expand Toggle Button */}
          <button
            onClick={toggleCollapse}
            title={isCollapsed ? 'Expand Sidebar (Ctrl+B)' : 'Minimize Sidebar (Ctrl+B)'}
            className={`p-1.5 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-aura-800 transition-all ${
              isCollapsed ? 'w-full flex items-center justify-center py-1' : ''
            }`}
          >
            {isCollapsed ? (
              <ChevronRightIcon className="w-4 h-4 text-amber-500" />
            ) : (
              <ChevronLeftIcon className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1.5">
          {/* Library */}
          <button
            onClick={() => onNavigate('library')}
            title="Library"
            className={`w-full flex items-center rounded-xl text-sm font-medium transition-all ${
              isCollapsed
                ? 'justify-center p-3 relative'
                : 'justify-between px-3.5 py-2.5'
            } ${
              currentView === 'library'
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-aura-850'
            }`}
          >
            <div className="flex items-center space-x-3">
              <LibraryIcon className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span>Library</span>}
            </div>
            {bookCount > 0 && (
              isCollapsed ? (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500" />
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-aura-800 text-slate-600 dark:text-slate-300 font-mono">
                  {bookCount}
                </span>
              )
            )}
          </button>

          {/* Now Playing */}
          <button
            onClick={() => onNavigate('now-playing')}
            title="Now Playing"
            className={`w-full flex items-center rounded-xl text-sm font-medium transition-all ${
              isCollapsed
                ? 'justify-center p-3 relative'
                : 'justify-between px-3.5 py-2.5'
            } ${
              currentView === 'now-playing'
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-aura-850'
            }`}
          >
            <div className="flex items-center space-x-3">
              <HeadphonesIcon className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span>Now Playing</span>}
            </div>
            {isPlaying && (
              <div className={`flex items-end space-x-0.5 h-3 ${isCollapsed ? 'absolute bottom-1.5' : ''}`}>
                <span className="w-1 bg-amber-500 dark:bg-amber-400 rounded-full eq-bar-1" />
                <span className="w-1 bg-amber-500 dark:bg-amber-400 rounded-full eq-bar-2" />
                <span className="w-1 bg-amber-500 dark:bg-amber-400 rounded-full eq-bar-3" />
              </div>
            )}
          </button>

          {/* Settings */}
          <button
            onClick={() => onNavigate('settings')}
            title="Settings & Folders"
            className={`w-full flex items-center rounded-xl text-sm font-medium transition-all ${
              isCollapsed
                ? 'justify-center p-3'
                : 'space-x-3 px-3.5 py-2.5'
            } ${
              currentView === 'settings'
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-aura-850'
            }`}
          >
            <SettingsIcon className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>Settings & Folders</span>}
          </button>
        </nav>
      </div>

      {/* Bottom Area */}
      <div className={`border-t border-slate-200 dark:border-aura-800/60 ${isCollapsed ? 'p-2 space-y-2' : 'p-4 space-y-3'}`}>
        {/* Theme Selector */}
        {isCollapsed ? (
          <button
            onClick={cycleTheme}
            title={`Current Theme: ${theme.toUpperCase()} (Click to cycle)`}
            className="w-full flex items-center justify-center p-2.5 rounded-xl bg-slate-100 dark:bg-aura-950/80 border border-slate-200 dark:border-aura-800 hover:bg-slate-200 dark:hover:bg-aura-800 transition-all text-amber-500"
          >
            {theme === 'light' && <SunIcon className="w-4 h-4" />}
            {theme === 'night' && <MoonIcon className="w-4 h-4" />}
            {theme === 'system' && <MonitorIcon className="w-4 h-4" />}
          </button>
        ) : (
          <div className="bg-slate-100 dark:bg-aura-950/80 p-1 rounded-xl border border-slate-200 dark:border-aura-800/80 flex items-center justify-between">
            <button
              onClick={() => setTheme('light')}
              title="Light Theme"
              className={`flex-1 flex items-center justify-center py-1.5 rounded-lg text-xs font-medium transition-all ${
                theme === 'light'
                  ? 'bg-white text-amber-600 shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <SunIcon className="w-4 h-4 mr-1" />
              <span>Light</span>
            </button>

            <button
              onClick={() => setTheme('night')}
              title="Night Theme"
              className={`flex-1 flex items-center justify-center py-1.5 rounded-lg text-xs font-medium transition-all ${
                theme === 'night'
                  ? 'bg-aura-800 text-amber-400 shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <MoonIcon className="w-4 h-4 mr-1" />
              <span>Night</span>
            </button>

            <button
              onClick={() => setTheme('system')}
              title="Follow Computer Theme"
              className={`flex-1 flex items-center justify-center py-1.5 rounded-lg text-xs font-medium transition-all ${
                theme === 'system'
                  ? 'bg-white dark:bg-aura-800 text-amber-600 dark:text-amber-400 shadow-sm font-semibold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <MonitorIcon className="w-4 h-4 mr-1" />
              <span>Auto</span>
            </button>
          </div>
        )}

        {/* Scan Button */}
        <button
          onClick={onScan}
          disabled={isScanning}
          title={isCollapsed ? 'Scan Library Folders' : undefined}
          className={`w-full flex items-center justify-center rounded-xl bg-slate-100 dark:bg-aura-850 hover:bg-slate-200 dark:hover:bg-aura-800 border border-slate-200 dark:border-aura-700/50 text-slate-700 dark:text-slate-200 text-xs font-medium transition-all disabled:opacity-50 ${
            isCollapsed ? 'p-2.5' : 'space-x-2 px-3 py-2'
          }`}
        >
          <RefreshIcon className={`w-4 h-4 text-amber-500 dark:text-amber-400 ${isScanning ? 'animate-spin' : ''}`} />
          {!isCollapsed && <span>{isScanning ? 'Scanning Folders...' : 'Scan Library'}</span>}
        </button>

        {/* About App Button */}
        {onOpenAbout && (
          <button
            onClick={onOpenAbout}
            title={isCollapsed ? 'About AuraAudio • FEMAG' : undefined}
            className={`w-full flex items-center rounded-xl bg-slate-50 dark:bg-aura-900/60 hover:bg-slate-100 dark:hover:bg-aura-800 border border-slate-200/80 dark:border-aura-800/80 text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 text-xs font-medium transition-all ${
              isCollapsed ? 'p-2.5 justify-center' : 'justify-between px-3 py-1.5'
            }`}
          >
            <div className="flex items-center space-x-2">
              <InfoIcon className="w-4 h-4 text-amber-500 shrink-0" />
              {!isCollapsed && <span>About App</span>}
            </div>
            {!isCollapsed && (
              <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-semibold">
                FEMAG
              </span>
            )}
          </button>
        )}

        {/* Mini Now Playing Card */}
        {currentBook && (
          <div
            onClick={() => onNavigate('now-playing')}
            title={`Now Playing: ${currentBook.title}`}
            className={`rounded-xl bg-slate-50 dark:bg-aura-950/60 border border-slate-200 dark:border-aura-800/80 cursor-pointer hover:border-amber-500/40 transition-all flex items-center ${
              isCollapsed ? 'p-1.5 justify-center' : 'p-2.5 space-x-3'
            }`}
          >
            <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-slate-200 dark:bg-aura-800 shadow-sm">
              {currentBook.cover_image ? (
                <img
                  src={currentBook.cover_image}
                  alt={currentBook.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-600 to-amber-400 text-white text-xs font-bold">
                  ♫
                </div>
              )}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {currentBook.title}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {currentBook.author || 'Unknown Author'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
