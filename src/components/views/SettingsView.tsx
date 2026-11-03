import React, { useState } from 'react';
import {
  FolderIcon,
  TrashIcon,
  PlusIcon,
  RefreshIcon,
  SettingsIcon,
  SunIcon,
  MoonIcon,
  MonitorIcon,
  InfoIcon,
  SparklesIcon,
  ShieldCheckIcon,
  BookOpenIcon,
} from '../common/Icons';
import { useTheme, ThemeMode } from '../../hooks/useTheme';
import { tauriBridge } from '../../services/tauriBridge';

interface SettingsViewProps {
  folders: string[];
  onAddFolder: () => void;
  onRemoveFolder: (path: string) => void;
  onScan: () => void;
  isScanning: boolean;
  bookCount: number;
  onPreviewSplash?: () => void;
  onClearLibrary?: () => void;
  onOpenAbout?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  folders,
  onAddFolder,
  onRemoveFolder,
  onScan,
  isScanning,
  bookCount,
  onPreviewSplash,
  onClearLibrary,
  onOpenAbout,
}) => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [skipInterval, setSkipInterval] = useState<number>(30);
  const [autoRewind, setAutoRewind] = useState<boolean>(true);
  const [pitchCorrection, setPitchCorrection] = useState<boolean>(true);

  // Auto-updater state
  const CURRENT_APP_VERSION = 'v0.2.2';
  const [updateStatus, setUpdateStatus] = useState<
    'idle' | 'checking' | 'available' | 'downloading' | 'up-to-date' | 'error'
  >('idle');
  const [newVersion, setNewVersion] = useState<string | null>(null);
  const [updateMsg, setUpdateMsg] = useState<string>('');

  const handleCheckForUpdates = async () => {
    try {
      setUpdateStatus('checking');
      setUpdateMsg('Connecting to GitHub releases...');
      const data = await tauriBridge.checkGithubUpdate(
        'freddy777-01/AuraAudioBookReader'
      );
      const latestTag = data.tag_name || '';

      if (latestTag && latestTag !== CURRENT_APP_VERSION) {
        setNewVersion(latestTag.replace(/^v/, ''));
        setUpdateStatus('available');
        setUpdateMsg(`New release ${latestTag} is available! Click below to download and update.`);
      } else {
        setUpdateStatus('up-to-date');
        setUpdateMsg(`You are running the latest version (${CURRENT_APP_VERSION}).`);
      }
    } catch (err: any) {
      console.warn('Update check error:', err);
      setUpdateStatus('error');
      setUpdateMsg(
        'Could not reach GitHub Releases. Please check your network connection.'
      );
    }
  };

  const handleInstallUpdate = async () => {
    try {
      await tauriBridge.openExternalUrl(
        'https://github.com/freddy777-01/AuraAudioBookReader/releases/latest'
      );
    } catch {
      window.open(
        'https://github.com/freddy777-01/AuraAudioBookReader/releases/latest',
        '_blank'
      );
    }
  };

  const THEME_OPTIONS: { id: ThemeMode; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'light',
      label: 'Light Mode',
      desc: 'Clean, luminous high-contrast reading layout',
      icon: <SunIcon className="w-5 h-5 text-amber-500" />,
    },
    {
      id: 'night',
      label: 'Night Mode',
      desc: 'Deep obsidian theme for distraction-free listening',
      icon: <MoonIcon className="w-5 h-5 text-amber-400" />,
    },
    {
      id: 'system',
      label: 'Computer Theme',
      desc: 'Automatically synchronizes with your Windows settings',
      icon: <MonitorIcon className="w-5 h-5 text-amber-500 dark:text-amber-400" />,
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-4xl space-y-8 select-none transition-colors duration-200">
      <div>
        <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Settings & Preferences
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Customize your appearance, manage audiobook directories, and tune your listening experience.
        </p>
      </div>

      {/* Section 1: Appearance & Theme Mechanism */}
      <section className="bg-white dark:bg-aura-900 border border-slate-200 dark:border-aura-800 rounded-2xl p-6 space-y-5 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400">
            {resolvedTheme === 'dark' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Appearance & Theme
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select your visual style or have AuraAudio adapt dynamically to your computer
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {THEME_OPTIONS.map((opt) => {
            const isSelected = theme === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setTheme(opt.id)}
                className={`p-4 rounded-xl text-left border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10 shadow-sm dark:shadow-amber-glow'
                    : 'border-slate-200 dark:border-aura-800 bg-slate-50/50 dark:bg-aura-850/50 hover:border-slate-300 dark:hover:border-aura-700'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-white dark:bg-aura-800 shadow-sm border border-slate-200/60 dark:border-transparent">
                    {opt.icon}
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full bg-amber-500/20">
                      Active
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                    {opt.label}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    {opt.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Section 2: Library Directories */}
      <section className="bg-white dark:bg-aura-900 border border-slate-200 dark:border-aura-800 rounded-2xl p-6 space-y-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400">
              <FolderIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Indexed Audiobook Folders
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Folders scanned recursively for audio files (.mp3, .m4b, .m4a)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onScan}
              disabled={isScanning || folders.length === 0}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-aura-850 hover:bg-slate-200 dark:hover:bg-aura-800 border border-slate-200 dark:border-aura-700/60 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center space-x-2 transition-all disabled:opacity-50"
            >
              <RefreshIcon className={`w-4 h-4 text-amber-500 dark:text-amber-400 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning...' : 'Rescan Folders'}</span>
            </button>

            <button
              onClick={onAddFolder}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-2 shadow-amber-glow hover:scale-105 active:scale-95 transition-all"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Add Folder</span>
            </button>
          </div>
        </div>

        {/* Folder List */}
        <div className="space-y-2 pt-2">
          {folders.length === 0 ? (
            <div className="p-6 rounded-xl border border-dashed border-slate-300 dark:border-aura-800 text-center text-slate-500 text-xs">
              No folders added yet. Click "Add Folder" to index your local audiobook collection.
            </div>
          ) : (
            folders.map((folder) => (
              <div
                key={folder}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-aura-850/60 border border-slate-200 dark:border-aura-800 hover:border-slate-300 dark:hover:border-aura-700 transition-colors"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <FolderIcon className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                  <span className="text-xs font-mono text-slate-800 dark:text-slate-200 truncate">
                    {folder}
                  </span>
                </div>
                <button
                  onClick={() => onRemoveFolder(folder)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-200 dark:hover:bg-aura-800 transition-colors"
                  title="Remove folder"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Section 3: Audio Engine Preferences */}
      <section className="bg-white dark:bg-aura-900 border border-slate-200 dark:border-aura-800 rounded-2xl p-6 space-y-6 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Audio Engine & Playback Behavior
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Customize jump duration, pitch preserving, and resume preferences
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-aura-850/50 border border-slate-200 dark:border-aura-800 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">Skip Interval</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Duration for forward / backward jumps</p>
            </div>
            <select
              value={skipInterval}
              onChange={(e) => setSkipInterval(parseInt(e.target.value))}
              className="px-3 py-1.5 bg-white dark:bg-aura-900 border border-slate-200 dark:border-aura-700 rounded-lg text-xs font-mono text-amber-600 dark:text-amber-400 shadow-sm"
            >
              <option value={15}>15 seconds</option>
              <option value={30}>30 seconds</option>
              <option value={45}>45 seconds</option>
              <option value={60}>60 seconds</option>
            </select>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-aura-850/50 border border-slate-200 dark:border-aura-800 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">Pitch Correction</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Maintain natural vocal pitch across speed changes</p>
            </div>
            <input
              type="checkbox"
              checked={pitchCorrection}
              onChange={(e) => setPitchCorrection(e.target.checked)}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-aura-850/50 border border-slate-200 dark:border-aura-800 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">Smart Resume Rewind</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Rewind 5 seconds upon resuming after long pause</p>
            </div>
            <input
              type="checkbox"
              checked={autoRewind}
              onChange={(e) => setAutoRewind(e.target.checked)}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-aura-850/50 border border-slate-200 dark:border-aura-800 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">Supported Formats</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">mp3, m4b, m4a, aac, flac, ogg</p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-aura-900 text-slate-700 dark:text-slate-300">
              Active
            </span>
          </div>
        </div>
      </section>

      {/* Section 4: Library Overview & App Details */}
      <section className="bg-slate-100/60 dark:bg-aura-900/50 border border-slate-200 dark:border-aura-800/80 rounded-2xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
            Library & Storage Overview
          </h3>
          <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-medium">
            Private & Offline
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Discovered Audiobooks Card */}
          <div className="p-4 rounded-xl bg-white dark:bg-aura-900 border border-slate-200 dark:border-aura-800 shadow-sm flex flex-col justify-between space-y-2">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <BookOpenIcon className="w-3.5 h-3.5 text-amber-500" />
              <span>Discovered Audiobooks</span>
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                {bookCount}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {bookCount === 1 ? 'Audiobook' : 'Audiobooks'}
              </span>
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Indexed and ready
            </span>
          </div>

          {/* Local Device Storage Card */}
          <div className="p-4 rounded-xl bg-white dark:bg-aura-900 border border-slate-200 dark:border-aura-800 shadow-sm flex flex-col justify-between space-y-2">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <ShieldCheckIcon className="w-3.5 h-3.5 text-amber-500" />
              <span>Storage & Privacy</span>
            </span>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              100% Offline & Local
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              Kept private on your computer
            </span>
          </div>

          {/* About AuraAudio Card */}
          <div
            onClick={onOpenAbout}
            className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 via-white dark:via-aura-900 to-amber-500/5 border border-amber-500/25 dark:border-amber-500/20 shadow-sm flex flex-col justify-between space-y-2 cursor-pointer hover:border-amber-500/50 hover:shadow-md transition-all group"
            title="Click to view About details"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <SparklesIcon className="w-3.5 h-3.5" />
                <span>About AuraAudio</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 font-semibold">
                v0.2.2
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-amber-500 transition-colors">
              Powered by FEMAG
            </span>
            <span className="text-[10px] text-amber-600/90 dark:text-amber-400/90 font-medium flex items-center gap-1">
              <span>View dedication & story</span>
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </span>
          </div>
        </div>

        {/* Automatic Updates Panel */}
        <div className="mt-2 p-4 rounded-xl bg-white dark:bg-aura-900 border border-slate-200 dark:border-aura-800 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <RefreshIcon
                  className={`w-4 h-4 text-amber-500 ${updateStatus === 'checking' ? 'animate-spin' : ''}`}
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Software Updates
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-aura-800 text-slate-600 dark:text-slate-400 font-medium">
                  Current: v0.2.2
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {updateMsg || 'Checks directly with GitHub Releases for new updates.'}
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {updateStatus === 'available' ? (
                <button
                  onClick={handleInstallUpdate}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-semibold shadow-sm transition-all flex items-center space-x-1.5"
                >
                  <SparklesIcon className="w-3.5 h-3.5" />
                  <span>Download & Upgrade {newVersion ? `(v${newVersion})` : ''}</span>
                </button>
              ) : (
                <button
                  onClick={handleCheckForUpdates}
                  disabled={updateStatus === 'checking'}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-aura-800 hover:bg-slate-200 dark:hover:bg-aura-750 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center space-x-1.5 border border-slate-200/80 dark:border-aura-700/80"
                >
                  <RefreshIcon
                    className={`w-3.5 h-3.5 text-amber-500 ${updateStatus === 'checking' ? 'animate-spin' : ''}`}
                  />
                  <span>
                    {updateStatus === 'checking' ? 'Checking GitHub...' : 'Check for Updates'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="pt-3 flex flex-wrap items-center justify-between gap-3">
          {onClearLibrary && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all indexed audiobooks and folders from your library?')) {
                  onClearLibrary();
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center space-x-2"
            >
              <TrashIcon className="w-3.5 h-3.5" />
              <span>Clear All Books & Reset Library</span>
            </button>
          )}

          <div className="flex items-center space-x-2 ml-auto">
            {onOpenAbout && (
              <button
                onClick={onOpenAbout}
                className="px-3.5 py-2 rounded-xl bg-slate-200/80 dark:bg-aura-800 hover:bg-slate-300 dark:hover:bg-aura-750 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center space-x-1.5"
              >
                <InfoIcon className="w-3.5 h-3.5 text-amber-500" />
                <span>About App</span>
              </button>
            )}

            {/* Development-only preview helper; stripped automatically from production builds */}
            {import.meta.env.DEV && onPreviewSplash && (
              <button
                onClick={onPreviewSplash}
                className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center space-x-2"
                title="Developer preview — hidden in production builds"
              >
                <span>✨ Preview Splash Screen (Dev)</span>
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
