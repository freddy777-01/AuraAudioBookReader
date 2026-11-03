import React, { useState } from 'react';
import { ViewMode, Audiobook } from '../../types/audiobook';
import { Sidebar } from './Sidebar';
import { LibraryView } from '../views/LibraryView';
import { NowPlayingView } from '../views/NowPlayingView';
import { SettingsView } from '../views/SettingsView';
import { PlayerBar } from '../player/PlayerBar';
import { FullScreenPlayer } from '../player/FullScreenPlayer';
import { MiniPlayer } from '../player/MiniPlayer';
import { BookmarksDrawer } from '../player/BookmarksDrawer';
import { ChapterDrawer } from '../player/ChapterDrawer';
import { AboutModal } from '../common/AboutModal';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';

interface MainLayoutProps {
  books: Audiobook[];
  folders: string[];
  isScanning: boolean;
  onScan: () => void;
  onAddFolder: () => void;
  onRemoveFolder: (folder: string) => void;
  onPreviewSplash?: () => void;
  onClearLibrary?: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  books,
  folders,
  isScanning,
  onScan,
  onAddFolder,
  onRemoveFolder,
  onPreviewSplash,
  onClearLibrary,
}) => {
  const [currentView, setCurrentView] = useState<ViewMode>('library');
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const { isFullScreen, isMiniPlayer } = useAudioPlayer();

  if (isMiniPlayer) {
    return <MiniPlayer />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-aura-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        bookCount={books.length}
        onScan={onScan}
        isScanning={isScanning}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-aura-950 relative transition-colors duration-200">
        <div className="flex-1 flex flex-col overflow-hidden">
          {currentView === 'library' && (
            <LibraryView
              books={books}
              folders={folders}
              onScan={onScan}
              isScanning={isScanning}
              onOpenSettings={() => setCurrentView('settings')}
            />
          )}

          {currentView === 'now-playing' && (
            <NowPlayingView onOpenLibrary={() => setCurrentView('library')} />
          )}

          {currentView === 'settings' && (
            <SettingsView
              folders={folders}
              onAddFolder={onAddFolder}
              onRemoveFolder={onRemoveFolder}
              onScan={onScan}
              isScanning={isScanning}
              bookCount={books.length}
              onPreviewSplash={onPreviewSplash}
              onClearLibrary={onClearLibrary}
              onOpenAbout={() => setIsAboutOpen(true)}
            />
          )}
        </div>

        {/* Persistent Bottom Player Bar */}
        <PlayerBar />
      </main>

      {/* Slide-out Bookmarks Drawer */}
      <BookmarksDrawer />

      {/* Slide-out Chapters Sequence Drawer */}
      <ChapterDrawer />

      {/* Immersive Full Screen Player Modal */}
      {isFullScreen && <FullScreenPlayer />}

      {/* About AuraAudio Modal */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />
    </div>
  );
};
