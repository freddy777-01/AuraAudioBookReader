# AuraAudio 🎧✨

<p align="left">
  <a href="https://github.com/freddy777-01/AuraAudioBookReader/releases">
    <img src="https://img.shields.io/github/downloads/freddy777-01/AuraAudioBookReader/total.svg?style=flat-square&logo=github&color=f59e0b&label=Total%20Downloads" alt="Total Downloads" />
  </a>
  <a href="https://github.com/freddy777-01/AuraAudioBookReader/releases/latest">
    <img src="https://img.shields.io/github/v/release/freddy777-01/AuraAudioBookReader?style=flat-square&color=10b981&label=Latest%20Version" alt="Latest Version" />
  </a>
  <img src="https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-0078d4?style=flat-square&logo=windows&logoColor=white" alt="Platform" />
  <img src="https://img.shields.io/badge/Privacy-100%25%20Offline%20%26%20Local-10b981?style=flat-square" alt="Privacy" />
</p>

> **A high-performance, distraction-free native desktop audiobook player crafted for immersion and offline listening.**

AuraAudio gives you a premium, physical-book-like experience on your Windows PC. No subscriptions, no telemetry, and 100% offline.

---

## 🌟 Key Features

### 📚 Intelligent Library & Chapter Grouping
- **Automatic Multi-Part Bundling**: Automatically detects and consolidates multi-disc and multi-track audiobooks into unified titles, eliminating library clutter.
- **Natural Chapter Sequence**: Sorts parts naturally (`Part 1`, `Part 2`, `Part 10`) regardless of filename variations.
- **Smart Title Cleaner**: Strips noisy bracket tags, year stamps, and format clutter (`[FreeTutorials.Us]`, `(Unabridged)`, `.mp3`) for a pristine, elegant library view.
- **Multi-View Organization**: Browse your collection by **Books**, **Author**, or **Folders**, with instant search and filtering (All, In-Progress, Completed, Unplayed).

### ⏱️ Seamless Resume & Precision Memory
- **Exact-Minute Resume**: Highlights previously played chapters even when browsing the sequence without playing.
- **Timestamp Indicators**: Displays exact timestamps, remaining minutes, and sleek progress bars (`At 14:20 • 13m left (52%)`).
- **One-Click Continue**: Dedicated "Continue" buttons on chapter rows and drawer footer to resume instantly right where you left off.
- **Smart Context Rewind**: Automatically rewinds 5 seconds upon resuming after an extended pause to refresh your memory.
- **Restart Flexibility**: Quick "Play from Beginning" option whenever you want to restart fresh from 0:00.

### 🎛️ Pro Audio Engine & Variable Speed
- **Pitch-Preserving Speed Controls**: Adjust playback speed smoothly from **0.5x up to 3.0x** without high-pitch distortion or the "chipmunk effect".
- **Instant Skip Controls**: Customizable quick forward and backward jumps (default 30 seconds).
- **Format Compatibility**: Plays `.mp3`, `.m4b` (audiobooks), `.m4a`, `.aac`, `.flac`, and `.ogg` files locally with hardware acceleration.

### 🎨 Stunning Visual Modes
- **Persistent Player Bar**: Compact bottom bar with volume slider, scrubber, speed picker, chapter toggle, and bookmark drawer.
- **Immersive Full-Screen Player**: Distraction-free listening view featuring ambient artwork glow, large scrubbers, and responsive controls.
- **Interactive Chapter Drawer**: Slide-out sequence panel to search, preview, and jump between parts effortlessly.
- **Interactive Bookmarks**: Capture memorable quotes and timestamps with notes, and jump back anytime.
- **Theme Support**: Handcrafted **Obsidian Dark** and **Warm Light** modes with smooth animated transitions.

### 🔒 100% Private & Offline
- All scan metadata and playback state are stored in a lightweight, local SQLite database on your device.
- Zero analytics, zero accounts, zero cloud dependencies.

---

## ⌨️ Desktop Shortcuts

| Key | Action |
| :--- | :--- |
| <kbd>Space</kbd> | Play / Pause |
| <kbd>→</kbd> (Right Arrow) | Skip Forward (30s) |
| <kbd>←</kbd> (Left Arrow) | Skip Backward (30s) |

---

## 🚀 Installation & Running

### 📥 Download for Windows (64-bit)

<p align="left">
  <a href="https://github.com/freddy777-01/AuraAudioBookReader/releases/latest">
    <img src="https://img.shields.io/badge/Download_AuraAudio-Windows_Installer-f59e0b?style=for-the-badge&logo=windows&logoColor=white" alt="Download AuraAudio for Windows" />
  </a>
</p>

1. Download **`AuraAudio_0.1.0_x64-setup.exe`** from the [Latest Release](https://github.com/freddy777-01/AuraAudioBookReader/releases/latest) page.
2. Run the installer and launch AuraAudio.
3. Add your audiobook folders and enjoy listening!

> **Note on Tracking**: Download statistics are tracked automatically by GitHub Releases and reflected live on the **Total Downloads** badge above.

### Building from Source

```bash
# Clone the repository
git clone https://github.com/freddy777-01/AuraAudioBookReader.git
cd AuraAudioBookReader

# Install frontend dependencies
npm install

# Run in development mode
npm run tauri dev

# Build Windows production executable & installer
npm run tauri build
```

---

<p align="center">
  <b>Powered by FEMAG</b> • Crafted with ❤️ for audiobook lovers
</p>
