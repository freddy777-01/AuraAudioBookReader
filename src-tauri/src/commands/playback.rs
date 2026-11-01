use tauri::State;

use crate::db::{BookmarkRecord, DbState, PlaybackStateRecord};

#[tauri::command]
pub fn save_playback_state(
    book_id: String,
    position_seconds: f64,
    duration_seconds: f64,
    is_completed: bool,
    state: State<'_, DbState>,
) -> Result<(), String> {
    state
        .save_playback_state(&book_id, position_seconds, duration_seconds, is_completed)
        .map_err(|e| format!("Failed to save playback state: {}", e))
}

#[tauri::command]
pub fn get_playback_state(
    book_id: String,
    state: State<'_, DbState>,
) -> Result<Option<PlaybackStateRecord>, String> {
    state
        .get_playback_state(&book_id)
        .map_err(|e| format!("Failed to get playback state: {}", e))
}

#[tauri::command]
pub fn create_bookmark(
    book_id: String,
    timestamp_seconds: f64,
    title: String,
    note: Option<String>,
    state: State<'_, DbState>,
) -> Result<BookmarkRecord, String> {
    state
        .add_bookmark(&book_id, timestamp_seconds, &title, note.as_deref())
        .map_err(|e| format!("Failed to create bookmark: {}", e))
}

#[tauri::command]
pub fn get_bookmarks(
    book_id: String,
    state: State<'_, DbState>,
) -> Result<Vec<BookmarkRecord>, String> {
    state
        .get_bookmarks(&book_id)
        .map_err(|e| format!("Failed to get bookmarks: {}", e))
}

#[tauri::command]
pub fn delete_bookmark(bookmark_id: i64, state: State<'_, DbState>) -> Result<(), String> {
    state
        .delete_bookmark(bookmark_id)
        .map_err(|e| format!("Failed to delete bookmark: {}", e))
}
