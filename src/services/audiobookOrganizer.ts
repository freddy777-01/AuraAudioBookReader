import { Audiobook, AudiobookTrack, FilterMode, SortOption } from '../types/audiobook';

// Clean clutter from book titles and folder names
export function cleanTitle(raw: string): string {
  if (!raw) return 'Unknown Title';

  let cleaned = raw;

  // Remove common bracketed prefixes/suffixes: [FreeTutorials.Us], [FTU], [AhLaN], etc.
  cleaned = cleaned.replace(/\[.*?\]/g, '');

  // Remove common noise patterns in parentheses: (Unabridged), (Business), (History), (Self-Help), etc.
  cleaned = cleaned.replace(/\((?:unabridged|business|history|self-help|science|health|audio\s*book|audiobook|mp3)\)/gi, '');

  // Remove formats/release tags at the end: ePUB eBOOK-ZAK, AZW3, mp3
  cleaned = cleaned.replace(/\b(?:ePUB|eBOOK-ZAK|AZW3|mp3|flac|m4b|m4a)\b/gi, '');

  // If pattern is "Author - Year - Title" or "Author - Title"
  const dashParts = cleaned.split(' - ').map((s) => s.trim()).filter(Boolean);
  if (dashParts.length >= 3) {
    // If middle part is a 4-digit year like "2015" or "2022"
    if (/^\d{4}$/.test(dashParts[1])) {
      cleaned = dashParts.slice(2).join(' - ');
    } else {
      cleaned = dashParts.slice(1).join(' - ');
    }
  } else if (dashParts.length === 2) {
    // e.g. "Author - Title"
    cleaned = dashParts[1];
  }

  // Remove leading track numbers: "01. ", "01_01 - "
  cleaned = cleaned.replace(/^\d+[\._\-\s]+/, '');

  cleaned = cleaned.trim();
  return cleaned || raw;
}

// Clean author names
export function cleanAuthor(rawAuthor?: string, folderName?: string): string {
  if (rawAuthor && rawAuthor.trim() && !rawAuthor.toLowerCase().includes('unknown')) {
    return rawAuthor.trim();
  }

  if (folderName) {
    // Check if folder starts with author: "Author - Year - Title" or "Author - Title"
    const cleanedFolder = folderName.replace(/\[.*?\]/g, '').trim();
    const dashParts = cleanedFolder.split(' - ').map((s) => s.trim()).filter(Boolean);
    if (dashParts.length >= 2) {
      // First part is typically Author (e.g. "Robert Greene", "Jordan B. Peterson", "Morgan Housel")
      return dashParts[0];
    }
    // "Author by Title" or "Title by Author"
    const byMatch = cleanedFolder.match(/\bby\s+([^,]+)/i);
    if (byMatch && byMatch[1]) {
      return byMatch[1].trim();
    }
  }

  return 'Unknown Author';
}

// Natural alphabetical & numerical sorting (e.g. "01", "02", "10" instead of "01", "10", "02")
export function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

// Normalize path separators to forward slashes for cross-platform consistency
function normalizePath(p: string): string {
  return p.replace(/\\/g, '/');
}

// Group raw individual audio tracks into cohesive Audiobooks
export function organizeAudiobooks(
  rawTracks: Audiobook[],
  libraryFolders: string[] = []
): Audiobook[] {
  if (!rawTracks || rawTracks.length === 0) return [];

  const normalizedRoots = libraryFolders.map((f) => normalizePath(f).toLowerCase().replace(/\/+$/, ''));
  const groupsMap = new Map<string, Audiobook[]>();

  for (const track of rawTracks) {
    const normPath = normalizePath(track.file_path);
    const normPathLower = normPath.toLowerCase();

    let bookFolder = '';

    // Check if track resides inside one of the scanned library roots
    for (const root of normalizedRoots) {
      if (normPathLower.startsWith(root)) {
        const relative = normPath.slice(root.length).replace(/^\/+/, '');
        const segments = relative.split('/');
        if (segments.length > 1) {
          // The top-level folder under the library root is the book folder
          bookFolder = segments[0];
        }
        break;
      }
    }

    // Fallback: If not matched to a root, use parent directory
    if (!bookFolder) {
      const parts = normPath.split('/');
      if (parts.length >= 2) {
        let parentDir = parts[parts.length - 2];
        // If parent is a generic subfolder like "disk 1", "cd 1", "Audiobook", look one level higher
        if (/^(disk\s*\d+|cd\s*\d+|audiobook|audio_books|audio)$/i.test(parentDir) && parts.length >= 3) {
          parentDir = parts[parts.length - 3];
        }
        bookFolder = parentDir;
      }
    }

    // If still no folder or single file in root, treat single files uniquely
    let groupKey: string;
    if (bookFolder && bookFolder !== 'SingleFiles') {
      groupKey = `folder:${bookFolder.toLowerCase()}`;
    } else if (track.album && track.album.trim().length > 3) {
      groupKey = `album:${track.album.trim().toLowerCase()}`;
    } else {
      groupKey = `track:${track.id}`;
    }

    if (!groupsMap.has(groupKey)) {
      groupsMap.set(groupKey, []);
    }
    groupsMap.get(groupKey)!.push(track);
  }

  // Convert groups into cohesive Audiobook entities
  const organizedBooks: Audiobook[] = [];

  for (const [groupKey, tracksInGroup] of groupsMap.entries()) {
    // Sort tracks inside book in natural numerical order
    tracksInGroup.sort((a, b) => {
      return naturalCompare(a.file_path, b.file_path);
    });

    const firstTrack = tracksInGroup[0];
    const isMultiTrack = tracksInGroup.length > 1;

    // Determine Folder Name
    const normFirst = normalizePath(firstTrack.file_path);
    const parts = normFirst.split('/');
    let folderName = '';
    let folderPath = '';
    if (parts.length >= 2) {
      folderName = parts[parts.length - 2];
      folderPath = parts.slice(0, -1).join('/');
      if (/^(disk\s*\d+|cd\s*\d+|audiobook)$/i.test(folderName) && parts.length >= 3) {
        folderName = parts[parts.length - 3];
        folderPath = parts.slice(0, -2).join('/');
      }
    }

    // Determine Clean Title:
    // If all tracks share an album tag (e.g. "We Who Wrestle with God"), prioritize it.
    // Otherwise use cleaned folder name or track title.
    const albumTag = tracksInGroup.find((t) => t.album && t.album.trim().length > 2)?.album;
    let title: string;
    if (albumTag && albumTag.trim().length > 3 && !/^(disk|cd|audiobook)/i.test(albumTag)) {
      title = cleanTitle(albumTag);
    } else if (folderName && isMultiTrack) {
      title = cleanTitle(folderName);
    } else {
      title = cleanTitle(firstTrack.title);
    }

    // Determine Author
    const authorTag = tracksInGroup.find((t) => t.author && t.author.trim() && !t.author.toLowerCase().includes('unknown'))?.author;
    const author = cleanAuthor(authorTag, folderName);

    // Sum total duration & size
    const totalDuration = tracksInGroup.reduce((acc, t) => acc + (t.duration_seconds || 0), 0);
    const totalSize = tracksInGroup.reduce((acc, t) => acc + (t.file_size || 0), 0);

    // Find cover image from any track in the group
    const coverImage = tracksInGroup.find((t) => t.cover_image)?.cover_image;

    // Convert individual tracks into typed AudiobookTrack items
    const formattedTracks: AudiobookTrack[] = tracksInGroup.map((t, idx) => {
      const fileName = normalizePath(t.file_path).split('/').pop() || t.title;
      const fileStem = fileName.replace(/\.[^/.]+$/, '');
      const cleanTrackTitle = (t.title && t.title !== 'Unknown Title' && t.title !== albumTag)
        ? t.title
        : fileStem;

      return {
        id: t.id,
        book_id: isMultiTrack ? groupKey : t.id,
        track_number: idx + 1,
        title: cleanTrackTitle,
        file_path: t.file_path,
        duration_seconds: t.duration_seconds || 0,
        file_size: t.file_size || 0,
        format: t.format,
        cover_image: t.cover_image,
        playback: t.playback,
      };
    });

    // Determine consolidated playback state
    // If any track has been played, compute overall progress
    let consolidatedPlayback = firstTrack.playback;
    let anyPlayedTrack = tracksInGroup.find((t) => t.playback && (t.playback.position_seconds > 0 || t.playback.is_completed));
    if (anyPlayedTrack && anyPlayedTrack.playback) {
      consolidatedPlayback = anyPlayedTrack.playback;
    }

    const bookId = isMultiTrack ? `group-${groupKey.replace(/[^a-zA-Z0-9_-]/g, '_')}` : firstTrack.id;

    organizedBooks.push({
      id: bookId,
      title,
      author,
      narrator: firstTrack.narrator,
      album: albumTag || title,
      duration_seconds: totalDuration > 0 ? totalDuration : firstTrack.duration_seconds,
      file_path: firstTrack.file_path,
      file_size: totalSize,
      format: isMultiTrack ? `${firstTrack.format} (${tracksInGroup.length} parts)` : firstTrack.format,
      cover_image: coverImage,
      last_scanned_at: firstTrack.last_scanned_at,
      playback: consolidatedPlayback,
      tracks: formattedTracks,
      track_count: tracksInGroup.length,
      folder_name: folderName || title,
      folder_path: folderPath,
      is_multi_track: isMultiTrack,
    });
  }

  return organizedBooks;
}

// Group organized audiobooks by Author
export function groupByAuthor(books: Audiobook[]): Record<string, Audiobook[]> {
  const result: Record<string, Audiobook[]> = {};

  for (const book of books) {
    const author = book.author || 'Unknown Author';
    if (!result[author]) {
      result[author] = [];
    }
    result[author].push(book);
  }

  return result;
}

// Group organized audiobooks by Folder
export function groupByFolder(books: Audiobook[]): Record<string, Audiobook[]> {
  const result: Record<string, Audiobook[]> = {};

  for (const book of books) {
    const folder = book.folder_name || 'Root Library';
    if (!result[folder]) {
      result[folder] = [];
    }
    result[folder].push(book);
  }

  return result;
}

// Filter and sort audiobooks
export function filterAndSortAudiobooks(
  books: Audiobook[],
  searchQuery: string,
  filterMode: FilterMode,
  sortOption: SortOption
): Audiobook[] {
  let result = [...books];

  // 1. Search Query Filter
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    result = result.filter((book) => {
      const matchTitle = book.title.toLowerCase().includes(q);
      const matchAuthor = book.author?.toLowerCase().includes(q) || false;
      const matchAlbum = book.album?.toLowerCase().includes(q) || false;
      const matchFolder = book.folder_name?.toLowerCase().includes(q) || false;
      // Search inside chapter/track names as well!
      const matchTracks = book.tracks?.some((t) => t.title.toLowerCase().includes(q)) || false;

      return matchTitle || matchAuthor || matchAlbum || matchFolder || matchTracks;
    });
  }

  // 2. Status Filter
  if (filterMode === 'in-progress') {
    result = result.filter(
      (b) =>
        b.playback &&
        !b.playback.is_completed &&
        (b.playback.position_seconds > 0 || (b.playback.completion_percentage || 0) > 0)
    );
  } else if (filterMode === 'completed') {
    result = result.filter((b) => b.playback?.is_completed);
  } else if (filterMode === 'not-started') {
    result = result.filter(
      (b) =>
        !b.playback ||
        (!b.playback.is_completed &&
          b.playback.position_seconds === 0 &&
          (b.playback.completion_percentage || 0) === 0)
    );
  }

  // 3. Sorting
  result.sort((a, b) => {
    switch (sortOption) {
      case 'title':
        return naturalCompare(a.title, b.title);
      case 'author':
        return naturalCompare(a.author || '', b.author || '');
      case 'duration':
        return (b.duration_seconds || 0) - (a.duration_seconds || 0);
      case 'tracks':
        return (b.track_count || 1) - (a.track_count || 1);
      case 'progress':
        return (b.playback?.completion_percentage || 0) - (a.playback?.completion_percentage || 0);
      case 'recent':
      default: {
        const timeA = a.playback?.last_played_at
          ? new Date(a.playback.last_played_at).getTime()
          : a.last_scanned_at
          ? new Date(a.last_scanned_at).getTime()
          : 0;
        const timeB = b.playback?.last_played_at
          ? new Date(b.playback.last_played_at).getTime()
          : b.last_scanned_at
          ? new Date(b.last_scanned_at).getTime()
          : 0;
        return timeB - timeA;
      }
    }
  });

  return result;
}
