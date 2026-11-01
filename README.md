# AuraAudio 🎧📖

A high-performance, distraction-free native desktop audiobook player built with **Tauri v2**, **Rust**, **React**, and **Tailwind CSS**.

---

## Features

- ⚡ **Local-First & Fast**: Direct scanning of local folders (`.mp3`, `.m4b`, `.m4a`, `.aac`, `.flac`, `.ogg`) using Rust's `lofty` and `walkdir`.
- 🗄️ **Persistent SQLite State**: Auto-persisted playback position, book completion percentages, and user bookmarks managed via `rusqlite`.
- 🎨 **Gorgeous Native UI**: Modern dark obsidian palette with warm bookish amber glow, sleek scrubbers, and immersive full-screen player mode.
- ⏱️ **Audio Engine Controls**:
  - Variable speed playback (0.5x – 3.0x) with pitch preservation.
  - Skip forward & rewind 30s.
  - Periodic background state autosave (every 5 seconds and on pause/seek).
  - Bookmarks & notes drawer with instant timestamp jump.
- ⌨️ **Desktop Shortcuts**:
  - `Space`: Play / Pause
  - `Right Arrow`: Skip forward 30 seconds
  - `Left Arrow`: Skip backward 30 seconds

---

## Architecture

```
├── src-tauri/                 # Rust Native Backend
│   ├── Cargo.toml            # rusqlite, lofty, walkdir, serde
│   ├── tauri.conf.json       # Window & asset protocol permissions
│   ├── capabilities/         # Tauri v2 security capabilities
│   └── src/
│       ├── main.rs           # Windows subsystem entrypoint
│       ├── lib.rs            # Tauri setup & command registration
│       ├── db/
│       │   ├── schema.rs     # SQLite tables, indexes & migration
│       │   └── mod.rs        # rusqlite CRUD operations
│       ├── scanner/
│       │   ├── mod.rs        # Recursive directory scanner
│       │   └── metadata.rs   # Audio tag & artwork extraction
│       └── commands/
│           ├── library.rs    # Folder scanning & book listing commands
│           └── playback.rs   # Playback state & bookmark commands
└── src/                      # React 18 + TypeScript + Tailwind
    ├── contexts/
    │   └── AudioPlayerContext.tsx  # Centralized HTML5 audio state
    ├── hooks/
    │   └── useAudioPlayer.ts       # Player controls & time formatters
    ├── services/
    │   └── tauriBridge.ts          # IPC commands & asset streaming
    └── components/
        ├── layout/                 # Sidebar & MainLayout
        ├── player/                 # PlayerBar, FullScreenPlayer, BookmarksDrawer
        └── views/                  # LibraryView, NowPlayingView, SettingsView
```

---

## Getting Started

### Prerequisites

1. **Node.js** (v18+)
2. **Rust & Cargo** (Required to compile native Windows executable)

### Development

```bash
# Install frontend dependencies
npm install

# Run frontend in browser dev mode (with mock data & audio fallback)
npm run dev

# Run full native Tauri desktop application
npm run tauri dev
```

### Production Build

```bash
npm run tauri build
```
