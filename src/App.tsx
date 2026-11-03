import React, { useState, useEffect, useCallback } from 'react';
import { Audiobook } from './types/audiobook';
import { tauriBridge } from './services/tauriBridge';
import { AudioPlayerProvider, useAudioPlayer } from './contexts/AudioPlayerContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { MainLayout } from './components/layout/MainLayout';
import { SplashScreen } from './components/common/SplashScreen';

const AppContent: React.FC = () => {
  const [books, setBooks] = useState<Audiobook[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const {
    togglePlay,
    skipForward,
    skipBackward,
    clearPlayer,
    isMiniPlayer,
    toggleMiniPlayer,
  } = useAudioPlayer();

  // Load initial data from SQLite via Tauri Bridge
  const refreshLibrary = useCallback(async () => {
    const startTime = Date.now();
    try {
      const [fetchedBooks, fetchedFolders] = await Promise.all([
        tauriBridge.getLibraryBooks(),
        tauriBridge.getLibraryFolders(),
      ]);

      // If no folders exist in settings, library should be empty
      if (fetchedFolders.length === 0) {
        setBooks([]);
        setFolders([]);
        clearPlayer();
      } else {
        setBooks(fetchedBooks);
        setFolders(fetchedFolders);
      }
    } catch (err) {
      console.error('Failed to load library:', err);
    } finally {
      // Ensure splash screen displays gracefully with full progress animation
      const elapsed = Date.now() - startTime;
      const minDisplayMs = 1500;
      const remaining = Math.max(0, minDisplayMs - elapsed);
      setTimeout(() => {
        setIsInitialLoading(false);
      }, remaining);
    }
  }, []);

  useEffect(() => {
    refreshLibrary();
    // Safety fallback to guarantee loading flag never hangs
    const safetyTimer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 2000);
    return () => clearTimeout(safetyTimer);
  }, [refreshLibrary]);

  // Scan folders
  const handleScan = async () => {
    setIsScanning(true);
    try {
      const updatedBooks = await tauriBridge.scanLibraryFolders();
      setBooks(updatedBooks);
    } catch (err) {
      console.error('Directory scan failed:', err);
    } finally {
      setIsScanning(false);
    }
  };

  // Add folder
  const handleAddFolder = async () => {
    try {
      const selected = await tauriBridge.selectFolderDialog();
      if (selected) {
        const updatedFolders = await tauriBridge.addLibraryFolder(selected);
        setFolders(updatedFolders);
        // Rescan after adding folder
        handleScan();
      }
    } catch (err) {
      console.error('Failed to add folder:', err);
    }
  };

  // Remove folder
  const handleRemoveFolder = async (folder: string) => {
    try {
      const updatedFolders = await tauriBridge.removeLibraryFolder(folder);
      setFolders(updatedFolders);
      // Immediately refresh books from database so removed folder's books disappear
      const updatedBooks = await tauriBridge.getLibraryBooks();
      setBooks(updatedBooks);
      if (updatedFolders.length === 0 || updatedBooks.length === 0) {
        clearPlayer();
      }
    } catch (err) {
      console.error('Failed to remove folder:', err);
    }
  };

  // Clear entire library
  const handleClearLibrary = async () => {
    try {
      await tauriBridge.clearLibrary();
      setFolders([]);
      setBooks([]);
      clearPlayer();
    } catch (err) {
      console.error('Failed to clear library:', err);
    }
  };

  // Global Desktop Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        skipForward(30);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        skipBackward(30);
      } else if (e.code === 'KeyM' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        toggleMiniPlayer();
      } else if (e.code === 'Escape' && isMiniPlayer) {
        e.preventDefault();
        toggleMiniPlayer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, skipForward, skipBackward, isMiniPlayer, toggleMiniPlayer]);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  const handlePreviewSplash = useCallback(() => {
    setIsInitialLoading(true);
    setShowSplash(true);
    setTimeout(() => {
      setIsInitialLoading(false);
    }, 1500);
  }, []);

  return (
    <>
      {showSplash && (
        <SplashScreen
          isLoading={isInitialLoading}
          bookCount={books.length}
          onFinish={handleSplashFinish}
        />
      )}
      <MainLayout
        books={books}
        folders={folders}
        isScanning={isScanning}
        onScan={handleScan}
        onAddFolder={handleAddFolder}
        onRemoveFolder={handleRemoveFolder}
        onPreviewSplash={handlePreviewSplash}
        onClearLibrary={handleClearLibrary}
      />
    </>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AudioPlayerProvider>
        <AppContent />
      </AudioPlayerProvider>
    </ThemeProvider>
  );
};

export default App;
