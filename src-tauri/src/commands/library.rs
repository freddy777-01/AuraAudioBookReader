use tauri::{Manager, State};

use crate::db::{AudiobookRecord, DbState};
use crate::scanner::scan_and_sync_all_folders;

#[tauri::command]
pub fn add_library_folder(
    app: tauri::AppHandle,
    folder_path: String,
    state: State<'_, DbState>,
) -> Result<Vec<String>, String> {
    let _ = app.asset_protocol_scope().allow_directory(&folder_path, true);

    state
        .add_library_folder(&folder_path)
        .map_err(|e| format!("Failed to add folder: {}", e))?;

    // Immediately trigger a scan of folders so new items appear
    let _ = scan_and_sync_all_folders(&state);

    state
        .get_library_folders()
        .map_err(|e| format!("Failed to get folders: {}", e))
}

#[tauri::command]
pub fn get_library_folders(state: State<'_, DbState>) -> Result<Vec<String>, String> {
    state
        .get_library_folders()
        .map_err(|e| format!("Failed to fetch library folders: {}", e))
}

#[tauri::command]
pub fn remove_library_folder(
    folder_path: String,
    state: State<'_, DbState>,
) -> Result<Vec<String>, String> {
    state
        .remove_library_folder(&folder_path)
        .map_err(|e| format!("Failed to remove library folder: {}", e))?;

    state
        .get_library_folders()
        .map_err(|e| format!("Failed to fetch library folders: {}", e))
}

#[tauri::command]
pub fn scan_library_folders(state: State<'_, DbState>) -> Result<Vec<AudiobookRecord>, String> {
    scan_and_sync_all_folders(&state)
}

#[tauri::command]
pub fn get_library_books(state: State<'_, DbState>) -> Result<Vec<AudiobookRecord>, String> {
    state
        .get_all_audiobooks()
        .map_err(|e| format!("Failed to fetch books: {}", e))
}

#[tauri::command]
pub fn clear_library(state: State<'_, DbState>) -> Result<(), String> {
    state
        .clear_all_audiobooks()
        .map_err(|e| format!("Failed to clear library: {}", e))
}

