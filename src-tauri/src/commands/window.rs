use std::sync::Mutex;
use tauri::{LogicalSize, WebviewWindow};

#[derive(Clone, Copy, Debug)]
struct SavedDesktopWindow {
    width: f64,
    height: f64,
    _x: f64,
    _y: f64,
    was_maximized: bool,
}

static SAVED_DESKTOP_WINDOW: Mutex<Option<SavedDesktopWindow>> = Mutex::new(None);

#[cfg(target_os = "windows")]
extern "system" {
    fn GetWindowLongPtrW(hwnd: isize, n_index: i32) -> isize;
    fn SetWindowLongPtrW(hwnd: isize, n_index: i32, new_long: isize) -> isize;
    fn SetWindowPos(
        hwnd: isize,
        hwnd_insert_after: isize,
        x: i32,
        y: i32,
        cx: i32,
        cy: i32,
        flags: u32,
    ) -> i32;
}

#[cfg(target_os = "windows")]
const GWL_STYLE: i32 = -16;
#[cfg(target_os = "windows")]
const WS_CAPTION: isize = 0x00C00000;
#[cfg(target_os = "windows")]
const WS_THICKFRAME: isize = 0x00040000;
#[cfg(target_os = "windows")]
const WS_MINIMIZEBOX: isize = 0x00020000;
#[cfg(target_os = "windows")]
const WS_MAXIMIZEBOX: isize = 0x00010000;
#[cfg(target_os = "windows")]
const WS_SYSMENU: isize = 0x00080000;

#[cfg(target_os = "windows")]
const SWP_NOSIZE: u32 = 0x0001;
#[cfg(target_os = "windows")]
const SWP_NOMOVE: u32 = 0x0002;
#[cfg(target_os = "windows")]
const SWP_NOZORDER: u32 = 0x0004;
#[cfg(target_os = "windows")]
const SWP_FRAMECHANGED: u32 = 0x0020;

#[tauri::command]
pub fn set_mini_player_mode(window: WebviewWindow, mini: bool) -> Result<(), String> {
    if mini {
        // 1. Capture current desktop window state BEFORE entering mini player
        let was_maximized = window.is_maximized().unwrap_or(false);
        if !was_maximized {
            if let (Ok(scale), Ok(size), Ok(pos)) = (
                window.scale_factor(),
                window.inner_size(),
                window.outer_position(),
            ) {
                let logical_size = size.to_logical::<f64>(scale);
                let logical_pos = pos.to_logical::<f64>(scale);
                // Only save if it represents a desktop window (width >= 500, height >= 350)
                if logical_size.width >= 500.0 && logical_size.height >= 350.0 {
                    if let Ok(mut saved) = SAVED_DESKTOP_WINDOW.lock() {
                        *saved = Some(SavedDesktopWindow {
                            width: logical_size.width,
                            height: logical_size.height,
                            _x: logical_pos.x,
                            _y: logical_pos.y,
                            was_maximized: false,
                        });
                    }
                }
            }
        } else if let Ok(mut saved) = SAVED_DESKTOP_WINDOW.lock() {
            *saved = Some(SavedDesktopWindow {
                width: 1024.0,
                height: 580.0,
                _x: 0.0,
                _y: 0.0,
                was_maximized: true,
            });
        }

        let _ = window.unmaximize();
        // Mini player mode: ALWAYS frameless (no native OS title bar in either slim or card mode)
        let _ = window.set_decorations(false);
        let _ = window.set_always_on_top(true);

        #[cfg(target_os = "windows")]
        unsafe {
            if let Ok(hwnd) = window.hwnd() {
                let h = hwnd.0 as isize;
                let mut style = GetWindowLongPtrW(h, GWL_STYLE);
                style &= !WS_CAPTION;
                SetWindowLongPtrW(h, GWL_STYLE, style);
                SetWindowPos(
                    h,
                    0,
                    0,
                    0,
                    0,
                    0,
                    SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_FRAMECHANGED,
                );
            }
        }

        // Set low minimum bounds so resizing between slim and card mode never gets clamped
        let _ = window.set_min_size(Some(LogicalSize::new(260.0, 48.0)));

        // Default to slim strip
        let _ = window.set_size(LogicalSize::new(390.0, 56.0));
    } else {
        // Full desktop app mode: restore standard desktop window
        let _ = window.set_always_on_top(false);
        let _ = window.unmaximize();

        // 1. Restore native window decorations via Tauri
        let _ = window.set_decorations(true);

        // 2. Set friendly desktop minimum bounds (800 x 480)
        let _ = window.set_min_size(Some(LogicalSize::new(800.0, 480.0)));

        // 3. Determine target desktop dimensions (defaulting to 1024 x 580)
        let (target_w, target_h) = if let Ok(guard) = SAVED_DESKTOP_WINDOW.lock() {
            if let Some(state) = *guard {
                if !state.was_maximized && state.width >= 800.0 && state.height >= 480.0 {
                    (state.width.min(1366.0), state.height.min(768.0))
                } else {
                    (1024.0, 580.0)
                }
            } else {
                (1024.0, 580.0)
            }
        } else {
            (1024.0, 580.0)
        };

        // 4. Explicitly apply Win32 caption and frame recalculation with SWP_FRAMECHANGED
        #[cfg(target_os = "windows")]
        unsafe {
            if let Ok(hwnd) = window.hwnd() {
                let h = hwnd.0 as isize;
                let mut style = GetWindowLongPtrW(h, GWL_STYLE);
                style |= WS_CAPTION | WS_THICKFRAME | WS_MINIMIZEBOX | WS_MAXIMIZEBOX | WS_SYSMENU;
                SetWindowLongPtrW(h, GWL_STYLE, style);
                SetWindowPos(
                    h,
                    0,
                    0,
                    0,
                    0,
                    0,
                    SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_FRAMECHANGED,
                );
            }
        }

        // 5. Expand size to desktop dimensions and center cleanly on screen
        let _ = window.set_size(LogicalSize::new(target_w, target_h));
        let _ = window.center();
        let _ = window.set_focus();
    }
    Ok(())
}

#[tauri::command]
pub fn set_mini_player_compact_mode(window: WebviewWindow, compact: bool) -> Result<(), String> {
    // Both slim and card mini modes stay 100% frameless (no OS title bar)
    let _ = window.set_decorations(false);
    let _ = window.set_min_size(Some(LogicalSize::new(260.0, 48.0)));

    #[cfg(target_os = "windows")]
    unsafe {
        if let Ok(hwnd) = window.hwnd() {
            let h = hwnd.0 as isize;
            let mut style = GetWindowLongPtrW(h, GWL_STYLE);
            style &= !WS_CAPTION;
            SetWindowLongPtrW(h, GWL_STYLE, style);
            SetWindowPos(
                h,
                0,
                0,
                0,
                0,
                0,
                SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_FRAMECHANGED,
            );
        }
    }

    if compact {
        // Slim mode (390 x 56)
        let _ = window.set_size(LogicalSize::new(390.0, 56.0));
    } else {
        // Card mode (360 x 205)
        let _ = window.set_size(LogicalSize::new(360.0, 205.0));
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
