pub mod metadata;

use std::collections::HashSet;
use std::path::Path;
use walkdir::WalkDir;

use crate::db::{AudiobookRecord, DbState};
use metadata::extract_metadata;

const SUPPORTED_EXTENSIONS: &[&str] = &["mp3", "m4b", "m4a", "aac", "flac", "ogg"];

pub fn scan_directory<P: AsRef<Path>>(dir_path: P) -> Vec<AudiobookRecord> {
    let mut books = Vec::new();
    let mut seen_canonical = HashSet::new();

    for entry in WalkDir::new(dir_path)
        .follow_links(true)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.path();
        if path.is_file() {
            if let Some(ext) = path.extension().and_then(|s| s.to_str()) {
                if SUPPORTED_EXTENSIONS.contains(&ext.to_lowercase().as_str()) {
                    if let Ok(canonical) = std::fs::canonicalize(path) {
                        if seen_canonical.insert(canonical) {
                            if let Some(book) = extract_metadata(path) {
                                books.push(book);
                            }
                        }
                    }
                }
            }
        }
    }

    books
}

pub fn scan_and_sync_all_folders(db: &DbState) -> Result<Vec<AudiobookRecord>, String> {
    let folders = db
        .get_library_folders()
        .map_err(|e| format!("Failed to read library folders: {}", e))?;

    let mut all_scanned = Vec::new();

    for folder in folders {
        let scanned = scan_directory(&folder);
        for book in &scanned {
            let _ = db.insert_or_update_audiobook(book);
        }
        all_scanned.extend(scanned);
    }

    // Return the updated library view
    db.get_all_audiobooks()
        .map_err(|e| format!("Failed to fetch books after scanning: {}", e))
}
