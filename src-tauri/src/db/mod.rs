pub mod schema;

use rusqlite::{params, Connection, OptionalExtension, Result};
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudiobookRecord {
    pub id: String,
    pub title: String,
    pub author: Option<String>,
    pub narrator: Option<String>,
    pub album: Option<String>,
    pub duration_seconds: f64,
    pub file_path: String,
    pub file_size: u64,
    pub format: String,
    pub cover_image: Option<String>,
    pub last_scanned_at: Option<String>,
    pub playback: Option<PlaybackStateRecord>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlaybackStateRecord {
    pub book_id: String,
    pub position_seconds: f64,
    pub duration_seconds: f64,
    pub completion_percentage: f64,
    pub is_completed: bool,
    pub last_played_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BookmarkRecord {
    pub id: i64,
    pub book_id: String,
    pub timestamp_seconds: f64,
    pub title: String,
    pub note: Option<String>,
    pub created_at: Option<String>,
}

pub struct DbState {
    pub conn: Mutex<Connection>,
}

impl DbState {
    pub fn new<P: AsRef<Path>>(db_path: P) -> Result<Self> {
        // Ensure parent directory exists
        if let Some(parent) = db_path.as_ref().parent() {
            let _ = std::fs::create_dir_all(parent);
        }

        let conn = Connection::open(db_path)?;
        let _ = conn.execute_batch("PRAGMA foreign_keys = ON;");
        schema::initialize_database(&conn)?;
        let _ = Self::prune_internal(&conn);
        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    pub fn insert_or_update_audiobook(&self, book: &AudiobookRecord) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            r#"
            INSERT INTO audiobooks (
                id, title, author, narrator, album, duration_seconds,
                file_path, file_size, format, cover_image, last_scanned_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
                title = excluded.title,
                author = excluded.author,
                narrator = excluded.narrator,
                album = excluded.album,
                duration_seconds = excluded.duration_seconds,
                file_size = excluded.file_size,
                format = excluded.format,
                cover_image = COALESCE(excluded.cover_image, audiobooks.cover_image),
                last_scanned_at = CURRENT_TIMESTAMP
            "#,
            params![
                book.id,
                book.title,
                book.author,
                book.narrator,
                book.album,
                book.duration_seconds,
                book.file_path,
                book.file_size as i64,
                book.format,
                book.cover_image,
            ],
        )?;
        Ok(())
    }

    pub fn get_all_audiobooks(&self) -> Result<Vec<AudiobookRecord>> {
        let conn = self.conn.lock().unwrap();

        // If no library folders are registered, there are no books in the library
        let folder_count: i64 = conn
            .query_row("SELECT COUNT(*) FROM library_folders", [], |row| row.get(0))
            .unwrap_or(0);
        if folder_count == 0 {
            return Ok(Vec::new());
        }

        let mut stmt = conn.prepare(
            r#"
            SELECT 
                a.id, a.title, a.author, a.narrator, a.album, a.duration_seconds,
                a.file_path, a.file_size, a.format, a.cover_image, a.last_scanned_at,
                p.position_seconds, p.duration_seconds AS p_duration, p.completion_percentage,
                p.is_completed, p.last_played_at
            FROM audiobooks a
            LEFT JOIN playback_state p ON a.id = p.book_id
            ORDER BY COALESCE(p.last_played_at, a.last_scanned_at) DESC
            "#
        )?;

        let rows = stmt.query_map([], |row| {
            let book_id: String = row.get(0)?;
            let p_pos: Option<f64> = row.get(11)?;

            let playback = match p_pos {
                Some(pos) => Some(PlaybackStateRecord {
                    book_id: book_id.clone(),
                    position_seconds: pos,
                    duration_seconds: row.get::<_, Option<f64>>(12)?.unwrap_or(0.0),
                    completion_percentage: row.get::<_, Option<f64>>(13)?.unwrap_or(0.0),
                    is_completed: row.get::<_, Option<i32>>(14)?.unwrap_or(0) != 0,
                    last_played_at: row.get(15)?,
                }),
                None => None,
            };

            Ok(AudiobookRecord {
                id: book_id,
                title: row.get(1)?,
                author: row.get(2)?,
                narrator: row.get(3)?,
                album: row.get(4)?,
                duration_seconds: row.get(5)?,
                file_path: row.get(6)?,
                file_size: row.get::<_, i64>(7)? as u64,
                format: row.get(8)?,
                cover_image: row.get(9)?,
                last_scanned_at: row.get(10)?,
                playback,
            })
        })?;

        let mut books = Vec::new();
        for row in rows {
            books.push(row?);
        }
        Ok(books)
    }

    pub fn save_playback_state(
        &self,
        book_id: &str,
        position_seconds: f64,
        duration_seconds: f64,
        is_completed: bool,
    ) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let completion_percentage = if duration_seconds > 0.0 {
            ((position_seconds / duration_seconds) * 100.0).clamp(0.0, 100.0)
        } else {
            0.0
        };

        conn.execute(
            r#"
            INSERT INTO playback_state (
                book_id, position_seconds, duration_seconds, completion_percentage, is_completed, last_played_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, CURRENT_TIMESTAMP)
            ON CONFLICT(book_id) DO UPDATE SET
                position_seconds = excluded.position_seconds,
                duration_seconds = excluded.duration_seconds,
                completion_percentage = excluded.completion_percentage,
                is_completed = excluded.is_completed,
                last_played_at = CURRENT_TIMESTAMP
            "#,
            params![
                book_id,
                position_seconds,
                duration_seconds,
                completion_percentage,
                if is_completed { 1 } else { 0 },
            ],
        )?;
        Ok(())
    }

    pub fn get_playback_state(&self, book_id: &str) -> Result<Option<PlaybackStateRecord>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            r#"
            SELECT book_id, position_seconds, duration_seconds, completion_percentage, is_completed, last_played_at
            FROM playback_state
            WHERE book_id = ?1
            "#,
        )?;

        stmt.query_row(params![book_id], |row| {
            Ok(PlaybackStateRecord {
                book_id: row.get(0)?,
                position_seconds: row.get(1)?,
                duration_seconds: row.get(2)?,
                completion_percentage: row.get(3)?,
                is_completed: row.get::<_, i32>(4)? != 0,
                last_played_at: row.get(5)?,
            })
        })
        .optional()
    }

    pub fn add_bookmark(
        &self,
        book_id: &str,
        timestamp_seconds: f64,
        title: &str,
        note: Option<&str>,
    ) -> Result<BookmarkRecord> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            r#"
            INSERT INTO bookmarks (book_id, timestamp_seconds, title, note, created_at)
            VALUES (?1, ?2, ?3, ?4, CURRENT_TIMESTAMP)
            "#,
            params![book_id, timestamp_seconds, title, note],
        )?;

        let id = conn.last_insert_rowid();
        Ok(BookmarkRecord {
            id,
            book_id: book_id.to_string(),
            timestamp_seconds,
            title: title.to_string(),
            note: note.map(|s| s.to_string()),
            created_at: None,
        })
    }

    pub fn get_bookmarks(&self, book_id: &str) -> Result<Vec<BookmarkRecord>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            r#"
            SELECT id, book_id, timestamp_seconds, title, note, created_at
            FROM bookmarks
            WHERE book_id = ?1
            ORDER BY timestamp_seconds ASC
            "#,
        )?;

        let rows = stmt.query_map(params![book_id], |row| {
            Ok(BookmarkRecord {
                id: row.get(0)?,
                book_id: row.get(1)?,
                timestamp_seconds: row.get(2)?,
                title: row.get(3)?,
                note: row.get(4)?,
                created_at: row.get(5)?,
            })
        })?;

        let mut bookmarks = Vec::new();
        for r in rows {
            bookmarks.push(r?);
        }
        Ok(bookmarks)
    }

    pub fn delete_bookmark(&self, bookmark_id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM bookmarks WHERE id = ?1", params![bookmark_id])?;
        Ok(())
    }

    pub fn add_library_folder(&self, folder_path: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR IGNORE INTO library_folders (folder_path) VALUES (?1)",
            params![folder_path],
        )?;
        Ok(())
    }

    pub fn get_library_folders(&self) -> Result<Vec<String>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT folder_path FROM library_folders ORDER BY added_at ASC")?;
        let rows = stmt.query_map([], |row| row.get(0))?;
        let mut folders = Vec::new();
        for r in rows {
            folders.push(r?);
        }
        Ok(folders)
    }

    pub fn remove_library_folder(&self, folder_path: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM library_folders WHERE folder_path = ?1", params![folder_path])?;
        let _ = Self::prune_internal(&conn);
        Ok(())
    }

    pub fn prune_orphaned_audiobooks(&self) -> Result<usize> {
        let conn = self.conn.lock().unwrap();
        Self::prune_internal(&conn)
    }

    fn prune_internal(conn: &Connection) -> Result<usize> {
        let mut stmt = conn.prepare("SELECT folder_path FROM library_folders")?;
        let remaining_folders: Vec<String> = stmt
            .query_map([], |row| row.get(0))?
            .filter_map(|r| r.ok())
            .collect();

        if remaining_folders.is_empty() {
            let count = conn.execute("DELETE FROM audiobooks", [])?;
            return Ok(count);
        }

        let mut book_stmt = conn.prepare("SELECT id, file_path FROM audiobooks")?;
        let books_to_check: Vec<(String, String)> = book_stmt
            .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))?
            .filter_map(|r| r.ok())
            .collect();

        let mut deleted_count = 0;
        for (id, file_path) in books_to_check {
            let norm_file = file_path.replace('\\', "/").to_lowercase();
            let belongs_to_any = remaining_folders.iter().any(|rf| {
                let norm_rf = rf.replace('\\', "/").to_lowercase().trim_end_matches('/').to_string();
                norm_file.starts_with(&norm_rf)
            });

            if !belongs_to_any {
                conn.execute("DELETE FROM audiobooks WHERE id = ?1", params![id])?;
                deleted_count += 1;
            }
        }

        Ok(deleted_count)
    }

    pub fn clear_all_audiobooks(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM audiobooks", [])?;
        conn.execute("DELETE FROM library_folders", [])?;
        Ok(())
    }
}
