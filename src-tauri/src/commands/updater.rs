use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ReleaseAsset {
    pub name: String,
    pub browser_download_url: String,
    pub size: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GithubReleaseInfo {
    pub tag_name: String,
    pub name: Option<String>,
    pub html_url: String,
    pub body: Option<String>,
    pub published_at: Option<String>,
    pub assets: Vec<ReleaseAsset>,
}

#[tauri::command]
pub fn check_github_update(repo: String) -> Result<GithubReleaseInfo, String> {
    let url = format!("https://api.github.com/repos/{}/releases/latest", repo);

    // Prefer curl from PATH or fallback to C:\Windows\System32\curl.exe
    let curl_bin = if std::process::Command::new("curl").arg("--version").output().is_ok() {
        "curl".to_string()
    } else {
        r"C:\Windows\System32\curl.exe".to_string()
    };

    let output = std::process::Command::new(curl_bin)
        .args([
            "-s",
            "-H",
            "User-Agent: AuraAudio-Desktop",
            "-H",
            "Accept: application/vnd.github.v3+json",
            &url,
        ])
        .output()
        .map_err(|e| format!("Network request failed: {}", e))?;

    if !output.status.success() {
        return Err("GitHub release request failed".to_string());
    }

    let body = String::from_utf8_lossy(&output.stdout);

    // Check if GitHub returned an API error (e.g., rate limit or not found)
    if body.contains("\"message\"") && !body.contains("\"tag_name\"") {
        return Err(format!("GitHub API response: {}", body.trim()));
    }

    let release: GithubReleaseInfo = serde_json::from_str(&body)
        .map_err(|e| format!("Failed to parse release information: {}", e))?;

    Ok(release)
}

#[tauri::command]
pub fn open_external_url(url: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/c", "start", "", &url])
            .spawn()
            .map_err(|e| format!("Failed to open link: {}", e))?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&url)
            .spawn()
            .map_err(|e| format!("Failed to open link: {}", e))?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&url)
            .spawn()
            .map_err(|e| format!("Failed to open link: {}", e))?;
    }
    Ok(())
}

