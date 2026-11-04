use tauri::{LogicalSize, WebviewWindow};

#[tauri::command]
pub fn set_mini_player_mode(window: WebviewWindow, mini: bool) -> Result<(), String> {
    if mini {
        // On entering mini player, start in the sleek frameless slim strip without OS title bar
        window
            .set_decorations(false)
            .map_err(|e| e.to_string())?;

        window
            .set_min_size(Some(LogicalSize::new(280.0, 50.0)))
            .map_err(|e| e.to_string())?;

        window
            .set_size(LogicalSize::new(390.0, 56.0))
            .map_err(|e| e.to_string())?;

        // Float on top of other desktop windows
        window
            .set_always_on_top(true)
            .map_err(|e| e.to_string())?;
    } else {
        // Restore standard window decorations (minimize, maximize, close)
        window
            .set_decorations(true)
            .map_err(|e| e.to_string())?;

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
pub fn set_mini_player_compact_mode(window: WebviewWindow, compact: bool) -> Result<(), String> {
    if compact {
        // Remove OS title bar for frameless floating widget
        window
            .set_decorations(false)
            .map_err(|e| e.to_string())?;

        window
            .set_min_size(Some(LogicalSize::new(280.0, 50.0)))
            .map_err(|e| e.to_string())?;

        window
            .set_size(LogicalSize::new(390.0, 56.0))
            .map_err(|e| e.to_string())?;
    } else {
        // Restore title bar for card view
        window
            .set_decorations(true)
            .map_err(|e| e.to_string())?;

        window
            .set_min_size(Some(LogicalSize::new(320.0, 180.0)))
            .map_err(|e| e.to_string())?;

        window
            .set_size(LogicalSize::new(360.0, 220.0))
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn start_dragging(window: WebviewWindow) -> Result<(), String> {
    window.start_dragging().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_always_on_top(window: WebviewWindow, always_on_top: bool) -> Result<(), String> {
    window
        .set_always_on_top(always_on_top)
        .map_err(|e| e.to_string())
}
