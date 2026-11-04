use tauri::{LogicalSize, WebviewWindow};

#[tauri::command]
pub fn set_mini_player_mode(window: WebviewWindow, mini: bool) -> Result<(), String> {
    if mini {
        // Mini player mode: ALWAYS frameless (no native OS title bar in either slim or card mode)
        let _ = window.set_decorations(false);
        let _ = window.set_always_on_top(true);

        // Set low minimum bounds so resizing between slim and card mode never gets clamped
        let _ = window.set_min_size(Some(LogicalSize::new(260.0, 48.0)));

        // Default to slim strip
        let _ = window.set_size(LogicalSize::new(390.0, 56.0));
    } else {
        // Full desktop app mode: restore standard desktop window
        let _ = window.set_always_on_top(false);

        // Expand size FIRST before setting min size, preventing Windows constraint clamp
        let _ = window.set_size(LogicalSize::new(1280.0, 840.0));
        let _ = window.set_min_size(Some(LogicalSize::new(960.0, 640.0)));

        // Restore native window title bar
        let _ = window.set_decorations(true);
        let _ = window.center();
    }
    Ok(())
}

#[tauri::command]
pub fn set_mini_player_compact_mode(window: WebviewWindow, compact: bool) -> Result<(), String> {
    // Both slim and card mini modes stay 100% frameless (no OS title bar)
    let _ = window.set_decorations(false);
    let _ = window.set_min_size(Some(LogicalSize::new(260.0, 48.0)));

    if compact {
        // Slim mode (390 x 56)
        let _ = window.set_size(LogicalSize::new(390.0, 56.0));
    } else {
        // Card mode (360 x 200)
        let _ = window.set_size(LogicalSize::new(360.0, 200.0));
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
