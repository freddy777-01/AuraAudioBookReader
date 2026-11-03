use tauri::{LogicalSize, WebviewWindow};

#[tauri::command]
pub fn set_mini_player_mode(window: WebviewWindow, mini: bool) -> Result<(), String> {
    if mini {
        // Allow the window to shrink below standard minimum desktop size
        window
            .set_min_size(Some(LogicalSize::new(320.0, 160.0)))
            .map_err(|e| e.to_string())?;

        // Resize down to compact floating player widget
        window
            .set_size(LogicalSize::new(360.0, 190.0))
            .map_err(|e| e.to_string())?;

        // Float on top of other desktop windows
        window
            .set_always_on_top(true)
            .map_err(|e| e.to_string())?;
    } else {
        // Disable floating on top
        window
            .set_always_on_top(false)
            .map_err(|e| e.to_string())?;

        // Restore minimum window constraints
        window
            .set_min_size(Some(LogicalSize::new(960.0, 640.0)))
            .map_err(|e| e.to_string())?;

        // Restore default desktop dimensions
        window
            .set_size(LogicalSize::new(1280.0, 840.0))
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn set_always_on_top(window: WebviewWindow, always_on_top: bool) -> Result<(), String> {
    window
        .set_always_on_top(always_on_top)
        .map_err(|e| e.to_string())
}
