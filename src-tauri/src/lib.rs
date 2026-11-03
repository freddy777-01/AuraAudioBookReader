pub mod commands;
pub mod db;
pub mod scanner;

use db::DbState;
use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            // Locate app data directory (e.g. C:\Users\<USER>\AppData\Roaming\com.auraaudio.desktop)
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to resolve app data directory");

            std::fs::create_dir_all(&app_data_dir)
                .expect("Failed to create app data directory");

            let db_path = app_data_dir.join("aura_audio.db");
            println!("Initializing AuraAudio SQLite database at: {:?}", db_path);

            let db_state = DbState::new(db_path)
                .expect("Failed to initialize SQLite database");

            // Allow all configured library folders in asset protocol scope
            if let Ok(folders) = db_state.get_library_folders() {
                let scope = app.asset_protocol_scope();
                for folder in folders {
                    let _ = scope.allow_directory(&folder, true);
                }
            }

            app.manage(db_state);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::library::add_library_folder,
            commands::library::get_library_folders,
            commands::library::remove_library_folder,
            commands::library::scan_library_folders,
            commands::library::get_library_books,
            commands::library::clear_library,
            commands::playback::save_playback_state,
            commands::playback::get_playback_state,
            commands::playback::create_bookmark,
            commands::playback::get_bookmarks,
            commands::playback::delete_bookmark,
        ])
        .run(tauri::generate_context!())
        .expect("error while running AuraAudio tauri application");
}
