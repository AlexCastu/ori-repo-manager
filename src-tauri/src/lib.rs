use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use std::process::Command;
use walkdir::WalkDir;

mod git_advanced;
use git_advanced::*;

// ==================== TYPES ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Environment {
    pub id: String,
    pub name: String,
    #[serde(rename = "basePath")]
    pub base_path: String,
    #[serde(rename = "gitServer")]
    pub git_server: String,
    #[serde(default = "default_color")]
    pub color: String,
    #[serde(default = "default_icon")]
    pub icon: String,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    #[serde(rename = "updatedAt")]
    pub updated_at: String,
}

fn default_color() -> String {
    "emerald".to_string()
}

fn default_icon() -> String {
    "folder".to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub name: String,
    pub path: String,
    #[serde(rename = "gitUrl")]
    pub git_url: Option<String>,
    #[serde(rename = "hasGit")]
    pub has_git: bool,
    pub platform: Option<String>,
    #[serde(rename = "lastScanned")]
    pub last_scanned: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Favorite {
    #[serde(rename = "projectName")]
    pub project_name: String,
    pub note: String,
    pub order: i32,
    #[serde(rename = "addedAt")]
    pub added_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub theme: String,
    #[serde(rename = "defaultView")]
    pub default_view: String,
    #[serde(rename = "showFavoritesFirst")]
    pub show_favorites_first: bool,
    #[serde(rename = "autoScanOnStart")]
    pub auto_scan_on_start: bool,
    #[serde(rename = "ideCommand", default = "default_ide_command")]
    pub ide_command: String,
}

fn default_ide_command() -> String {
    "code".to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub version: String,
    pub environments: Vec<Environment>,
    pub favorites: HashMap<String, Favorite>,
    #[serde(rename = "projectsCache")]
    pub projects_cache: HashMap<String, HashMap<String, Project>>,
    pub settings: AppSettings,
}

// ==================== HELPER FUNCTIONS ====================

fn get_config_path() -> Result<std::path::PathBuf, String> {
    let app_data = dirs::config_dir()
        .ok_or_else(|| "Could not find config directory".to_string())?;
    let config_dir = app_data.join("ORI-RepoManager");

    // Create directory if it doesn't exist
    if !config_dir.exists() {
        fs::create_dir_all(&config_dir)
            .map_err(|e| format!("Failed to create config directory: {}", e))?;
    }

    Ok(config_dir.join("config.json"))
}

fn get_default_config() -> AppConfig {
    AppConfig {
        version: "2.0.0".to_string(),
        environments: vec![],
        favorites: HashMap::new(),
        projects_cache: HashMap::new(),
        settings: AppSettings {
            theme: "dark".to_string(),
            default_view: "grid".to_string(),
            show_favorites_first: true,
            auto_scan_on_start: true,
            ide_command: "code".to_string(),
        },
    }
}

fn detect_git_platform(url: &str) -> Option<String> {
    let url_lower = url.to_lowercase();
    if url_lower.contains("github.com") {
        Some("github".to_string())
    } else if url_lower.contains("gitlab") {
        Some("gitlab".to_string())
    } else if url_lower.contains("bitbucket") {
        Some("bitbucket".to_string())
    } else if url_lower.contains("dev.azure.com") || url_lower.contains("visualstudio.com") {
        Some("azure".to_string())
    } else {
        Some("other".to_string())
    }
}

fn get_git_remote(project_path: &str) -> Option<String> {
    let git_config_path = Path::new(project_path).join(".git").join("config");

    if !git_config_path.exists() {
        return None;
    }

    let content = fs::read_to_string(&git_config_path).ok()?;

    // Simple parser for git config to find remote URL
    let mut in_remote_origin = false;
    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed == "[remote \"origin\"]" {
            in_remote_origin = true;
        } else if trimmed.starts_with('[') {
            in_remote_origin = false;
        } else if in_remote_origin && trimmed.starts_with("url = ") {
            return Some(trimmed.replace("url = ", "").trim().to_string());
        }
    }

    None
}

// ==================== TAURI COMMANDS ====================

#[tauri::command]
async fn scan_projects(base_path: String) -> Result<Vec<Project>, String> {
    let base = Path::new(&base_path);

    if !base.exists() {
        return Err(format!("Path does not exist: {}", base_path));
    }

    let mut projects: Vec<Project> = Vec::new();
    let now = chrono::Local::now().to_rfc3339();

    // Walk only first level directories
    for entry in WalkDir::new(&base_path)
        .min_depth(1)
        .max_depth(1)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.path();

        if path.is_dir() {
            let name = path.file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("unknown")
                .to_string();

            // Skip hidden folders
            if name.starts_with('.') {
                continue;
            }

            let path_str = path.to_string_lossy().to_string();
            let git_url = get_git_remote(&path_str);
            let has_git = path.join(".git").exists();
            let platform = git_url.as_ref().and_then(|url| detect_git_platform(url));

            projects.push(Project {
                name,
                path: path_str,
                git_url,
                has_git,
                platform,
                last_scanned: now.clone(),
            });
        }
    }

    // Sort by name
    projects.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));

    Ok(projects)
}

// Windows constant for hiding CMD window
#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

// Helper macro for Windows to hide CMD window
#[cfg(target_os = "windows")]
fn apply_no_window(cmd: &mut Command) {
    use std::os::windows::process::CommandExt;
    cmd.creation_flags(CREATE_NO_WINDOW);
}

#[cfg(not(target_os = "windows"))]
fn apply_no_window(_cmd: &mut Command) {
    // No-op on non-Windows
}

#[tauri::command]
async fn get_git_remote_url(project_path: String) -> Result<Option<String>, String> {
    Ok(get_git_remote(&project_path))
}

#[tauri::command]
async fn git_clone(repo_url: String, destination: String) -> Result<String, String> {
    let mut cmd = Command::new("git");
    cmd.args(["clone", &repo_url, &destination]);
    apply_no_window(&mut cmd);

    let output = cmd.output()
        .map_err(|e| format!("Failed to execute git clone: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
async fn git_pull(project_path: String) -> Result<String, String> {
    // First, fetch all branches from all remotes
    let mut fetch_cmd = Command::new("git");
    fetch_cmd.current_dir(&project_path)
        .args(["fetch", "--all"]);
    apply_no_window(&mut fetch_cmd);

    let fetch_output = fetch_cmd.output()
        .map_err(|e| format!("Failed to execute git fetch: {}", e))?;

    // Then, pull the current branch
    let mut pull_cmd = Command::new("git");
    pull_cmd.current_dir(&project_path)
        .args(["pull"]);
    apply_no_window(&mut pull_cmd);

    let pull_output = pull_cmd.output()
        .map_err(|e| format!("Failed to execute git pull: {}", e))?;

    if pull_output.status.success() {
        let fetch_msg = String::from_utf8_lossy(&fetch_output.stdout);
        let pull_msg = String::from_utf8_lossy(&pull_output.stdout);
        Ok(format!("Fetch: {}\n\nPull: {}", fetch_msg, pull_msg))
    } else {
        Err(String::from_utf8_lossy(&pull_output.stderr).to_string())
    }
}

#[tauri::command]
async fn git_config(project_path: String, name: String, email: String) -> Result<(), String> {
    // Set user.name
    let mut cmd_name = Command::new("git");
    cmd_name.current_dir(&project_path)
        .args(["config", "user.name", &name]);
    apply_no_window(&mut cmd_name);

    let output_name = cmd_name.output()
        .map_err(|e| format!("Failed to set user.name: {}", e))?;

    if !output_name.status.success() {
        return Err(String::from_utf8_lossy(&output_name.stderr).to_string());
    }

    // Set user.email
    let mut cmd_email = Command::new("git");
    cmd_email.current_dir(&project_path)
        .args(["config", "user.email", &email]);
    apply_no_window(&mut cmd_email);

    let output_email = cmd_email.output()
        .map_err(|e| format!("Failed to set user.email: {}", e))?;

    if !output_email.status.success() {
        return Err(String::from_utf8_lossy(&output_email.stderr).to_string());
    }

    Ok(())
}

#[tauri::command]
async fn load_config() -> Result<AppConfig, String> {
    let config_path = get_config_path()?;

    if !config_path.exists() {
        let default_config = get_default_config();
        let json = serde_json::to_string_pretty(&default_config)
            .map_err(|e| format!("Failed to serialize config: {}", e))?;
        fs::write(&config_path, json)
            .map_err(|e| format!("Failed to write config: {}", e))?;
        return Ok(default_config);
    }

    let content = fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read config: {}", e))?;

    let config: AppConfig = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse config: {}", e))?;

    Ok(config)
}

#[tauri::command]
async fn save_config(config: AppConfig) -> Result<(), String> {
    let config_path = get_config_path()?;

    let json = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;

    fs::write(&config_path, json)
        .map_err(|e| format!("Failed to write config: {}", e))?;

    Ok(())
}

// Get the config file path
#[tauri::command]
async fn get_config_file_path() -> Result<String, String> {
    let path = get_config_path()?;
    Ok(path.to_string_lossy().to_string())
}

// ==================== GIT CONFIG VARIABLES MANAGEMENT ====================

// Get a single git config value by key
#[tauri::command]
async fn get_git_config_value(key: String) -> Result<String, String> {
    let mut cmd = Command::new("git");
    cmd.args(["config", "--global", "--get", &key]);
    apply_no_window(&mut cmd);

    let output = cmd.output()
        .map_err(|e| format!("Failed to get git config {}: {}", key, e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        Ok(String::new()) // Key not set
    }
}

// Set a git config value
#[tauri::command]
async fn set_git_config_value(key: String, value: String) -> Result<(), String> {
    let mut cmd = Command::new("git");
    cmd.args(["config", "--global", &key, &value]);
    apply_no_window(&mut cmd);

    cmd.output()
        .map_err(|e| format!("Failed to set git config {}: {}", key, e))?;

    Ok(())
}

// Unset (remove) a git config value - uses --unset-all to remove all instances
#[tauri::command]
async fn unset_git_config_value(key: String) -> Result<(), String> {
    let mut cmd = Command::new("git");
    // Use --unset-all to ensure ALL instances of this key are removed
    cmd.args(["config", "--global", "--unset-all", &key]);
    apply_no_window(&mut cmd);

    let output = cmd.output()
        .map_err(|e| format!("Failed to unset git config {}: {}", key, e))?;

    // Don't error if key doesn't exist (exit code 5)
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        // Exit code 5 means key doesn't exist, which is fine
        if output.status.code() != Some(5) && !stderr.is_empty() {
            return Err(format!("Failed to unset {}: {}", key, stderr));
        }
    }

    Ok(())
}

// Clean all proxy-related git config values
#[tauri::command]
async fn clean_proxy_config() -> Result<Vec<String>, String> {
    let proxy_keys = vec![
        "http.proxy",
        "https.proxy",
        "http.sslVerify",
        "http.sslBackend",
        "http.sslCAInfo",
        "http.sslCAPath",
        "http.sslCert",
        "http.sslKey",
        "url.https://.insteadOf",
        "url.http://.insteadOf",
        "core.gitProxy",
        "http.proxyAuthMethod",
        "http.emptyAuth",
    ];

    let mut cleaned = Vec::new();

    // First, clean the standard proxy keys
    for key in proxy_keys {
        let mut cmd = Command::new("git");
        cmd.args(["config", "--global", "--unset-all", key]);
        apply_no_window(&mut cmd);

        let output = cmd.output()
            .map_err(|e| format!("Failed to unset {}: {}", key, e))?;

        // If it succeeded (not exit code 5 = not found), it was cleaned
        if output.status.success() {
            cleaned.push(key.to_string());
        }
    }

    // Also search for URL-specific proxy configurations like http.https://example.com.proxy
    let mut list_cmd = Command::new("git");
    list_cmd.args(["config", "--global", "--list"]);
    apply_no_window(&mut list_cmd);

    if let Ok(output) = list_cmd.output() {
        if output.status.success() {
            let config_output = String::from_utf8_lossy(&output.stdout);
            for line in config_output.lines() {
                // Look for patterns like http.https://xxx.proxy or http.http://xxx.proxy
                if line.contains(".proxy=") && (line.contains("http.http") || line.contains("http.https")) {
                    if let Some(key) = line.split('=').next() {
                        let key = key.trim();
                        // Try to unset this specific URL proxy config
                        let mut unset_cmd = Command::new("git");
                        unset_cmd.args(["config", "--global", "--unset-all", key]);
                        apply_no_window(&mut unset_cmd);

                        if let Ok(unset_output) = unset_cmd.output() {
                            if unset_output.status.success() {
                                cleaned.push(key.to_string());
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(cleaned)
}

// Git config entry for listing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitConfigEntry {
    pub key: String,
    pub value: String,
}

// List all git global config entries
#[tauri::command]
async fn list_git_config() -> Result<Vec<GitConfigEntry>, String> {
    let mut cmd = Command::new("git");
    cmd.args(["config", "--global", "--list"]);
    apply_no_window(&mut cmd);

    let output = cmd.output()
        .map_err(|e| format!("Failed to list git config: {}", e))?;

    let output_str = String::from_utf8_lossy(&output.stdout);
    let mut entries = Vec::new();

    for line in output_str.lines() {
        if let Some((key, value)) = line.split_once('=') {
            entries.push(GitConfigEntry {
                key: key.to_string(),
                value: value.to_string(),
            });
        }
    }

    Ok(entries)
}

// Pull all projects in a directory
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PullResult {
    pub project_name: String,
    pub success: bool,
    pub message: String,
}

#[tauri::command]
async fn pull_all_projects(base_path: String) -> Result<Vec<PullResult>, String> {
    let base = Path::new(&base_path);
    if !base.exists() {
        return Err(format!("Base path does not exist: {}", base_path));
    }

    let mut results = Vec::new();

    let entries = fs::read_dir(base)
        .map_err(|e| format!("Failed to read directory: {}", e))?;

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() && path.join(".git").exists() {
            let project_name = path.file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("unknown")
                .to_string();

            let mut cmd = Command::new("git");
            cmd.current_dir(&path).args(["pull"]);
            apply_no_window(&mut cmd);

            let output = cmd.output();

            match output {
                Ok(out) => {
                    if out.status.success() {
                        let msg = String::from_utf8_lossy(&out.stdout).to_string();
                        results.push(PullResult {
                            project_name,
                            success: true,
                            message: if msg.contains("Already up to date") {
                                "Ya actualizado".to_string()
                            } else {
                                "Actualizado correctamente".to_string()
                            },
                        });
                    } else {
                        results.push(PullResult {
                            project_name,
                            success: false,
                            message: String::from_utf8_lossy(&out.stderr).to_string(),
                        });
                    }
                }
                Err(e) => {
                    results.push(PullResult {
                        project_name,
                        success: false,
                        message: format!("Error: {}", e),
                    });
                }
            }
        }
    }

    Ok(results)
}

#[tauri::command]
async fn open_in_ide(project_path: String, ide_command: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;

        let mut cmd = Command::new(&ide_command);
        cmd.arg(&project_path);
        cmd.creation_flags(CREATE_NO_WINDOW);

        if let Ok(_) = cmd.spawn() {
            return Ok(());
        }

        // If the simple command failed, try specific paths for VS Code
        if ide_command == "code" {
            let local_app_data = std::env::var("LOCALAPPDATA").unwrap_or_default();
            let vscode_path = format!("{}\\Programs\\Microsoft VS Code\\Code.exe", local_app_data);

            if Path::new(&vscode_path).exists() {
                let mut cmd = Command::new(&vscode_path);
                cmd.arg(&project_path);
                cmd.creation_flags(CREATE_NO_WINDOW);
                cmd.spawn()
                    .map_err(|e| format!("Failed to open VS Code: {}", e))?;
                return Ok(());
            }

            let user_profile = std::env::var("USERPROFILE").unwrap_or_default();
            let vscode_path_alt = format!("{}\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe", user_profile);

            if Path::new(&vscode_path_alt).exists() {
                let mut cmd = Command::new(&vscode_path_alt);
                cmd.arg(&project_path);
                cmd.creation_flags(CREATE_NO_WINDOW);
                cmd.spawn()
                    .map_err(|e| format!("Failed to open VS Code: {}", e))?;
                return Ok(());
            }
        }

        return Err(format!("IDE '{}' not found. Please ensure it's installed and in PATH.", ide_command));
    }

    #[cfg(target_os = "macos")]
    {
        // Try the command directly first
        if let Ok(_) = Command::new(&ide_command).arg(&project_path).spawn() {
            return Ok(());
        }

        // Try common paths for Sublime Text on macOS
        if ide_command == "subl" {
            let sublime_paths = vec![
                "/Applications/Sublime Text.app/Contents/SharedSupport/bin/subl",
                "/usr/local/bin/subl",
                "/opt/homebrew/bin/subl",
            ];

            for path in sublime_paths {
                if Path::new(path).exists() {
                    if let Ok(_) = Command::new(path).arg(&project_path).spawn() {
                        return Ok(());
                    }
                }
            }
        }

        // Try common paths for VS Code on macOS
        if ide_command == "code" {
            let vscode_paths = vec![
                "/usr/local/bin/code",
                "/opt/homebrew/bin/code",
                "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code",
            ];

            for path in vscode_paths {
                if Path::new(path).exists() {
                    if let Ok(_) = Command::new(path).arg(&project_path).spawn() {
                        return Ok(());
                    }
                }
            }
        }

        // Try common paths for Cursor on macOS
        if ide_command == "cursor" {
            let cursor_paths = vec![
                "/usr/local/bin/cursor",
                "/opt/homebrew/bin/cursor",
            ];

            for path in cursor_paths {
                if Path::new(path).exists() {
                    if let Ok(_) = Command::new(path).arg(&project_path).spawn() {
                        return Ok(());
                    }
                }
            }
        }

        return Err(format!("IDE '{}' not found. Please ensure it's installed and the command is in your PATH.", ide_command));
    }

    #[cfg(all(not(target_os = "windows"), not(target_os = "macos")))]
    {
        Command::new(&ide_command)
            .arg(&project_path)
            .spawn()
            .map_err(|e| format!("Failed to open IDE '{}': {}", ide_command, e))?;

        return Ok(());
    }

    #[allow(unreachable_code)]
    Ok(())
}

#[tauri::command]
async fn open_in_explorer(project_path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(&project_path)
            .spawn()
            .map_err(|e| format!("Failed to open Explorer: {}", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&project_path)
            .spawn()
            .map_err(|e| format!("Failed to open Finder: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(&project_path)
            .spawn()
            .map_err(|e| format!("Failed to open file manager: {}", e))?;
    }

    Ok(())
}

// ==================== GIT STATUS COMMANDS ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitStatus {
    pub has_changes: bool,
    pub ahead: i32,
    pub behind: i32,
    pub branch: String,
    pub status_message: String,
}

#[tauri::command]
async fn get_git_status(project_path: String) -> Result<GitStatus, String> {
    // Get current branch
    let mut branch_cmd = Command::new("git");
    branch_cmd.current_dir(&project_path)
        .args(["rev-parse", "--abbrev-ref", "HEAD"]);
    apply_no_window(&mut branch_cmd);

    let branch_output = branch_cmd.output()
        .map_err(|e| format!("Failed to get branch: {}", e))?;

    let branch = String::from_utf8_lossy(&branch_output.stdout).trim().to_string();

    // Check for uncommitted changes
    let mut status_cmd = Command::new("git");
    status_cmd.current_dir(&project_path)
        .args(["status", "--porcelain"]);
    apply_no_window(&mut status_cmd);

    let status_output = status_cmd.output()
        .map_err(|e| format!("Failed to get status: {}", e))?;

    let has_changes = !status_output.stdout.is_empty();

    // Get ahead/behind count
    let mut ahead_cmd = Command::new("git");
    ahead_cmd.current_dir(&project_path)
        .args(["rev-list", "--left-right", "--count", &format!("HEAD...origin/{}", branch)]);
    apply_no_window(&mut ahead_cmd);

    let ahead_behind = ahead_cmd.output();

    let (ahead, behind) = match ahead_behind {
        Ok(output) => {
            let counts = String::from_utf8_lossy(&output.stdout);
            let parts: Vec<&str> = counts.trim().split('\t').collect();
            if parts.len() == 2 {
                (
                    parts[0].parse().unwrap_or(0),
                    parts[1].parse().unwrap_or(0),
                )
            } else {
                (0, 0)
            }
        }
        Err(_) => (0, 0),
    };

    let status_message = if has_changes && ahead > 0 && behind > 0 {
        format!("⚠️ {} cambios, ↑{} ↓{}", if has_changes { "+" } else { "" }, ahead, behind)
    } else if has_changes {
        "⚠️ Cambios sin commit".to_string()
    } else if ahead > 0 && behind > 0 {
        format!("↑{} ↓{}", ahead, behind)
    } else if ahead > 0 {
        format!("↑{} para push", ahead)
    } else if behind > 0 {
        format!("↓{} para pull", behind)
    } else {
        "✓ Al día".to_string()
    };

    Ok(GitStatus {
        has_changes,
        ahead,
        behind,
        branch,
        status_message,
    })
}

#[tauri::command]
async fn git_fetch(project_path: String) -> Result<String, String> {
    let mut cmd = Command::new("git");
    cmd.current_dir(&project_path)
        .args(["fetch", "--all"]);
    apply_no_window(&mut cmd);

    let output = cmd.output()
        .map_err(|e| format!("Failed to fetch: {}", e))?;

    if output.status.success() {
        Ok("Fetch completado".to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
async fn select_directory(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    let result = app.dialog().file().blocking_pick_folder();

    match result {
        Some(path) => Ok(Some(path.to_string())),
        None => Ok(None),
    }
}

#[tauri::command]
async fn check_path_exists(path: String) -> Result<bool, String> {
    Ok(Path::new(&path).exists())
}

// ==================== APP ENTRY POINT ====================

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            scan_projects,
            get_git_remote_url,
            git_clone,
            git_pull,
            git_config,
            git_fetch,
            get_git_status,
            get_git_config_value,
            set_git_config_value,
            unset_git_config_value,
            clean_proxy_config,
            list_git_config,
            pull_all_projects,
            load_config,
            save_config,
            get_config_file_path,
            open_in_ide,
            open_in_explorer,
            select_directory,
            check_path_exists,
            // Batch Git Operations
            batch_git_fetch,
            batch_git_pull,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
