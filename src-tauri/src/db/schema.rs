use rusqlite::{Connection, Result};

pub const SCHEMA_SQL: &str = r#"
CREATE TABLE IF NOT EXISTS library_folders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    folder_path TEXT NOT NULL UNIQUE,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audiobooks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT,
    narrator TEXT,
    album TEXT,
    duration_seconds REAL NOT NULL DEFAULT 0.0,
    file_path TEXT NOT NULL UNIQUE,
    file_size INTEGER NOT NULL,
    format TEXT NOT NULL,
    cover_image TEXT,
    last_scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS playback_state (
    book_id TEXT PRIMARY KEY,
    position_seconds REAL NOT NULL DEFAULT 0.0,
    duration_seconds REAL NOT NULL DEFAULT 0.0,
    completion_percentage REAL NOT NULL DEFAULT 0.0,
    is_completed INTEGER NOT NULL DEFAULT 0,
    last_played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(book_id) REFERENCES audiobooks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id TEXT NOT NULL,
    timestamp_seconds REAL NOT NULL,
    title TEXT NOT NULL,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(book_id) REFERENCES audiobooks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_audiobooks_author ON audiobooks(author);
CREATE INDEX IF NOT EXISTS idx_playback_last_played ON playback_state(last_played_at);
CREATE INDEX IF NOT EXISTS idx_bookmarks_book ON bookmarks(book_id);
"#;

pub fn initialize_database(conn: &Connection) -> Result<()> {
    conn.execute_batch(SCHEMA_SQL)?;
    Ok(())
}
