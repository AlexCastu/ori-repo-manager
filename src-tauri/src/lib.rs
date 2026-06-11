use log::{error, info, warn};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use std::process::Command;
use std::time::Duration;
use walkdir::WalkDir;

mod git_advanced;
use git_advanced::*;

mod git_extended;
use git_extended::*;

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
    #[serde(rename = "ultraCompactView", default)]
    pub ultra_compact_view: bool,
}

fn default_ide_command() -> String {
    "code".to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub version: String,
    pub environments: Vec<Environment>,
    pub favorites: HashMap<String, Favorite>,
    #[serde(rename = "projectNotes", default)]
    pub project_notes: HashMap<String, String>,
    #[serde(rename = "hiddenProjects", default)]
    pub hidden_projects: HashMap<String, String>,
    #[serde(rename = "projectsCache")]
    pub projects_cache: HashMap<String, HashMap<String, Project>>,
    pub settings: AppSettings,
    // Preserve extra fields from frontend (tags, projectTags, autoSyncConfig, etc.)
    #[serde(flatten)]
    pub extra: HashMap<String, serde_json::Value>,
}

// ==================== HELPER FUNCTIONS ====================

fn get_config_path() -> Result<std::path::PathBuf, String> {
    let app_data =
        dirs::config_dir().ok_or_else(|| "Could not find config directory".to_string())?;
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
        project_notes: HashMap::new(),
        hidden_projects: HashMap::new(),
        projects_cache: HashMap::new(),
        settings: AppSettings {
            theme: "dark".to_string(),
            default_view: "grid".to_string(),
            show_favorites_first: true,
            auto_scan_on_start: true,
            ide_command: "code".to_string(),
            ultra_compact_view: false,
        },
        extra: HashMap::new(),
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

// ==================== VALIDATION HELPERS ====================

/// Valida que la ruta sea un repositorio Git válido
pub fn validate_git_repo(path: &str) -> Result<(), String> {
    let p = Path::new(path);
    if !p.exists() {
        return Err(format!("La ruta no existe: {}", path));
    }
    if !p.join(".git").exists() {
        return Err(format!("No es un repositorio Git válido: {}", path));
    }
    Ok(())
}

/// Valida que el nombre de rama sea seguro para Git
pub fn validate_branch_name(name: &str) -> Result<(), String> {
    if name.is_empty() {
        return Err("El nombre de rama no puede estar vacío".to_string());
    }
    if name.starts_with('-') || name.starts_with('.') {
        return Err("El nombre de rama no puede empezar con '-' o '.'".to_string());
    }
    if name.ends_with('.') || name.ends_with(".lock") {
        return Err("El nombre de rama no puede terminar en '.' o '.lock'".to_string());
    }
    let prohibited = ["..", "~", "^", ":", "\\", "@{", "[", " ", "\t"];
    for ch in &prohibited {
        if name.contains(ch) {
            return Err(format!(
                "El nombre de rama contiene caracteres no permitidos: '{}'",
                ch
            ));
        }
    }
    Ok(())
}

/// Crea backup del archivo de configuración
fn backup_config() -> Result<(), String> {
    let config_path = get_config_path()?;
    if config_path.exists() {
        let backup_path = config_path.with_extension("backup.json");
        fs::copy(&config_path, &backup_path)
            .map_err(|e| format!("Error creando backup de config: {}", e))?;
    }
    Ok(())
}

// ==================== TAURI COMMANDS ====================

#[tauri::command]
async fn scan_projects(base_path: String) -> Result<Vec<Project>, String> {
    let base = Path::new(&base_path);

    if !base.exists() {
        error!("Ruta no encontrada al escanear: {}", base_path);
        return Err(format!("La ruta no existe: {}", base_path));
    }

    info!("Escaneando proyectos en: {}", base_path);
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
            let name = path
                .file_name()
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

// Helper for Windows to hide CMD window
#[cfg(target_os = "windows")]
pub fn apply_no_window(cmd: &mut Command) {
    use std::os::windows::process::CommandExt;
    cmd.creation_flags(CREATE_NO_WINDOW);
}

#[cfg(not(target_os = "windows"))]
pub fn apply_no_window(_cmd: &mut Command) {
    // No-op on non-Windows
}

/// Crea un Command de git para operaciones de red: oculta ventana en Windows
/// y desactiva prompts de credenciales en terminal (evita cuelgues en apps GUI).
pub fn git_network_cmd(working_dir: &str) -> Command {
    let mut cmd = Command::new("git");
    cmd.current_dir(working_dir);
    cmd.env("GIT_TERMINAL_PROMPT", "0");
    apply_no_window(&mut cmd);
    cmd
}

/// Run a Command with a timeout. Returns the Output or an error if it times out.
/// stdout/stderr van por pipes drenados en threads: sin esto la salida llega
/// vacía (errores de git invisibles) y el proceso puede bloquearse con buffers llenos.
pub fn run_with_timeout(
    cmd: &mut Command,
    timeout: Duration,
) -> Result<std::process::Output, String> {
    use std::io::Read;
    use std::process::Stdio;

    cmd.stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("Failed to spawn process: {}", e))?;

    let mut stdout_pipe = child.stdout.take();
    let mut stderr_pipe = child.stderr.take();
    let stdout_reader = std::thread::spawn(move || {
        let mut buf = Vec::new();
        if let Some(ref mut pipe) = stdout_pipe {
            let _ = pipe.read_to_end(&mut buf);
        }
        buf
    });
    let stderr_reader = std::thread::spawn(move || {
        let mut buf = Vec::new();
        if let Some(ref mut pipe) = stderr_pipe {
            let _ = pipe.read_to_end(&mut buf);
        }
        buf
    });

    let start = std::time::Instant::now();
    loop {
        match child.try_wait() {
            Ok(Some(status)) => {
                let stdout = stdout_reader.join().unwrap_or_default();
                let stderr = stderr_reader.join().unwrap_or_default();
                return Ok(std::process::Output {
                    status,
                    stdout,
                    stderr,
                });
            }
            Ok(None) => {
                if start.elapsed() > timeout {
                    let _ = child.kill();
                    let _ = child.wait();
                    return Err(
                        "Operación cancelada: tiempo de espera agotado (sin conectividad?)"
                            .to_string(),
                    );
                }
                std::thread::sleep(Duration::from_millis(100));
            }
            Err(e) => return Err(format!("Error waiting for process: {}", e)),
        }
    }
}

/// Default timeout for network git operations (30 seconds)
pub const GIT_NETWORK_TIMEOUT: Duration = Duration::from_secs(30);

/// Timeout para clones (repos grandes pueden tardar varios minutos)
pub const GIT_CLONE_TIMEOUT: Duration = Duration::from_secs(300);

#[tauri::command]
async fn get_git_remote_url(project_path: String) -> Result<Option<String>, String> {
    Ok(get_git_remote(&project_path))
}

#[tauri::command]
async fn git_clone(repo_url: String, destination: String) -> Result<String, String> {
    // Validar formato básico de URL
    let url_trimmed = repo_url.trim();
    if url_trimmed.is_empty() {
        return Err("La URL del repositorio no puede estar vacía".to_string());
    }
    if !(url_trimmed.starts_with("https://")
        || url_trimmed.starts_with("http://")
        || url_trimmed.starts_with("git@")
        || url_trimmed.starts_with("ssh://")
        || url_trimmed.starts_with("git://"))
    {
        return Err(
            "URL no válida. Debe empezar con https://, http://, git@, ssh:// o git://".to_string(),
        );
    }

    info!("Clonando repositorio: {} → {}", repo_url, destination);

    let dest = Path::new(&destination);

    // Ensure destination directory exists
    if !dest.exists() {
        fs::create_dir_all(dest)
            .map_err(|e| format!("No se pudo crear el directorio destino: {}", e))?;
    }

    // Aviso temprano si la carpeta del repo ya existe en el destino
    let repo_dir_name = url_trimmed
        .trim_end_matches('/')
        .rsplit('/')
        .next()
        .unwrap_or("")
        .trim_end_matches(".git");
    if !repo_dir_name.is_empty() && dest.join(repo_dir_name).exists() {
        return Err(format!(
            "La carpeta '{}' ya existe en el directorio destino",
            repo_dir_name
        ));
    }

    let mut cmd = git_network_cmd(&destination);
    cmd.args(["clone", &repo_url]);

    let output = run_with_timeout(&mut cmd, GIT_CLONE_TIMEOUT)?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        info!("Clone completado: {}", repo_url);
        Ok(if stdout.is_empty() {
            stderr
        } else {
            format!("{}\n{}", stdout, stderr)
        })
    } else {
        let err = String::from_utf8_lossy(&output.stderr).to_string();
        error!("Clone fallido para {}: {}", repo_url, err);
        Err(err)
    }
}

/// Tras un fetch, hace fast-forward de todas las ramas locales con upstream
/// (excepto la actual). Operación local, sin red. Devuelve líneas de log.
fn fast_forward_other_branches(project_path: &str) -> Vec<String> {
    let mut log_lines = Vec::new();

    let mut refs_cmd = Command::new("git");
    refs_cmd.current_dir(project_path).args([
        "for-each-ref",
        "refs/heads",
        "--format=%(HEAD)|%(refname:short)|%(upstream:short)",
    ]);
    apply_no_window(&mut refs_cmd);

    let refs_output = match refs_cmd.output() {
        Ok(o) if o.status.success() => String::from_utf8_lossy(&o.stdout).to_string(),
        _ => return log_lines,
    };

    for line in refs_output.lines() {
        let parts: Vec<&str> = line.split('|').collect();
        if parts.len() != 3 {
            continue;
        }
        let is_current = parts[0] == "*";
        let branch = parts[1].trim();
        let upstream = parts[2].trim();

        // La rama actual se actualiza con merge --ff-only; sin upstream no hay nada que hacer
        if is_current || branch.is_empty() || upstream.is_empty() {
            continue;
        }

        // fetch desde el propio repo ('.'): actualiza la rama local al remote-tracking
        // ya descargado. Solo fast-forward; sin red.
        let mut ff_cmd = Command::new("git");
        ff_cmd
            .current_dir(project_path)
            .args(["fetch", ".", &format!("{}:{}", upstream, branch)]);
        apply_no_window(&mut ff_cmd);

        match ff_cmd.output() {
            Ok(out) if out.status.success() => {
                let stderr = String::from_utf8_lossy(&out.stderr);
                // git informa por stderr: "abc123..def456  origin/x -> x" cuando avanza
                if stderr.contains("->") && !stderr.contains("[up to date]") {
                    log_lines.push(format!("  ↳ {} actualizada desde {}", branch, upstream));
                }
            }
            Ok(out) => {
                let stderr = String::from_utf8_lossy(&out.stderr);
                if stderr.contains("non-fast-forward") || stderr.contains("rejected") {
                    log_lines.push(format!(
                        "  ↳ {} omitida (divergida del remoto, requiere merge manual)",
                        branch
                    ));
                }
            }
            Err(_) => {}
        }
    }

    log_lines
}

#[tauri::command]
async fn git_pull(project_path: String) -> Result<String, String> {
    validate_git_repo(&project_path)?;
    info!("Pull iniciado en: {}", project_path);

    // Obtener rama actual
    let mut branch_cmd = Command::new("git");
    branch_cmd
        .current_dir(&project_path)
        .args(["rev-parse", "--abbrev-ref", "HEAD"]);
    apply_no_window(&mut branch_cmd);
    let branch = branch_cmd
        .output()
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        .unwrap_or_else(|_| "desconocida".to_string());

    // Guardar HEAD actual para comparar después
    let mut head_cmd = Command::new("git");
    head_cmd
        .current_dir(&project_path)
        .args(["rev-parse", "HEAD"]);
    apply_no_window(&mut head_cmd);
    let old_head = head_cmd
        .output()
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        .unwrap_or_default();

    // Único acceso a red: fetch de todos los remotos.
    // Si falla (sin conexión, credenciales, remoto caído) hay que abortar:
    // el merge local diría "al día" sin haber comprobado nada.
    let mut fetch_cmd = git_network_cmd(&project_path);
    fetch_cmd.args(["fetch", "--all", "--prune"]);
    let fetch_output = run_with_timeout(&mut fetch_cmd, GIT_NETWORK_TIMEOUT)?;
    if !fetch_output.status.success() {
        let err = String::from_utf8_lossy(&fetch_output.stderr).to_string();
        error!("Fetch fallido en {}: {}", project_path, err);
        return Err(format!("No se pudo consultar el remoto:\n{}", err.trim()));
    }
    let fetch_info = String::from_utf8_lossy(&fetch_output.stderr).to_string();

    // Avanzar la rama actual al upstream ya descargado (sin red, solo fast-forward)
    let mut merge_cmd = Command::new("git");
    merge_cmd
        .current_dir(&project_path)
        .args(["merge", "--ff-only", "@{u}"]);
    apply_no_window(&mut merge_cmd);
    let merge_output = merge_cmd
        .output()
        .map_err(|e| format!("Failed to merge: {}", e))?;

    if !merge_output.status.success() {
        let err = String::from_utf8_lossy(&merge_output.stderr).to_string();
        error!(
            "Pull fallido en {} (rama {}): {}",
            project_path, branch, err
        );
        if err.contains("no upstream") || err.contains("no tracking information") {
            return Err(format!(
                "La rama '{}' no tiene upstream configurado en el remoto",
                branch
            ));
        }
        return Err(err);
    }

    let merge_stdout = String::from_utf8_lossy(&merge_output.stdout).to_string();
    let up_to_date =
        merge_stdout.contains("Already up to date") || merge_stdout.contains("Already up-to-date");

    // Actualizar también el resto de ramas locales (fast-forward, sin red)
    let other_branches_log = fast_forward_other_branches(&project_path);

    let mut log = format!("📌 Rama: {}\n", branch);

    if !fetch_info.trim().is_empty() {
        log.push_str(&format!("🔄 Fetch: {}\n", fetch_info.trim()));
    }

    if up_to_date {
        log.push_str("✅ Ya estás al día — sin cambios nuevos.\n");
        info!(
            "Pull completado (sin cambios) en: {} [{}]",
            project_path, branch
        );
    } else {
        log.push_str("✅ Pull completado con cambios nuevos:\n\n");

        // Estadísticas: qué archivos cambiaron
        if !old_head.is_empty() {
            let mut stat_cmd = Command::new("git");
            stat_cmd.current_dir(&project_path).args([
                "diff",
                "--stat",
                &format!("{}..HEAD", old_head),
            ]);
            apply_no_window(&mut stat_cmd);

            if let Ok(stat_out) = stat_cmd.output() {
                let stats = String::from_utf8_lossy(&stat_out.stdout).to_string();
                if !stats.trim().is_empty() {
                    log.push_str("📊 Archivos modificados:\n");
                    log.push_str(&stats);
                    log.push('\n');
                }
            }

            // Commits recibidos
            let mut shortlog_cmd = Command::new("git");
            shortlog_cmd.current_dir(&project_path).args([
                "log",
                "--oneline",
                &format!("{}..HEAD", old_head),
            ]);
            apply_no_window(&mut shortlog_cmd);

            if let Ok(shortlog_out) = shortlog_cmd.output() {
                let commits = String::from_utf8_lossy(&shortlog_out.stdout).to_string();
                if !commits.trim().is_empty() {
                    let count = commits.lines().count();
                    log.push_str(&format!(
                        "📋 {} commit{} recibido{}:\n",
                        count,
                        if count != 1 { "s" } else { "" },
                        if count != 1 { "s" } else { "" }
                    ));
                    log.push_str(&commits);
                }
            }
        }

        info!(
            "Pull completado con cambios en: {} [{}]",
            project_path, branch
        );
    }

    if !other_branches_log.is_empty() {
        log.push_str("\n🌿 Otras ramas locales:\n");
        for line in &other_branches_log {
            log.push_str(line);
            log.push('\n');
        }
    }

    Ok(log)
}

#[tauri::command]
async fn git_config(project_path: String, name: String, email: String) -> Result<(), String> {
    validate_git_repo(&project_path)?;
    info!(
        "Configurando git user en: {} (name={}, email={})",
        project_path, name, email
    );

    // Set user.name
    let mut cmd_name = Command::new("git");
    cmd_name
        .current_dir(&project_path)
        .args(["config", "user.name", &name]);
    apply_no_window(&mut cmd_name);

    let output_name = cmd_name
        .output()
        .map_err(|e| format!("Failed to set user.name: {}", e))?;

    if !output_name.status.success() {
        return Err(String::from_utf8_lossy(&output_name.stderr).to_string());
    }

    // Set user.email
    let mut cmd_email = Command::new("git");
    cmd_email
        .current_dir(&project_path)
        .args(["config", "user.email", &email]);
    apply_no_window(&mut cmd_email);

    let output_email = cmd_email
        .output()
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
        fs::write(&config_path, json).map_err(|e| format!("Failed to write config: {}", e))?;
        return Ok(default_config);
    }

    let content =
        fs::read_to_string(&config_path).map_err(|e| format!("Failed to read config: {}", e))?;

    let config: AppConfig =
        serde_json::from_str(&content).map_err(|e| format!("Failed to parse config: {}", e))?;

    Ok(config)
}

#[tauri::command]
async fn save_config(config: AppConfig) -> Result<(), String> {
    let config_path = get_config_path()?;

    // Crear backup antes de guardar
    if let Err(e) = backup_config() {
        warn!("No se pudo crear backup de config: {}", e);
    }

    let json = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;

    fs::write(&config_path, json).map_err(|e| format!("Failed to write config: {}", e))?;

    info!("Configuración guardada correctamente");
    Ok(())
}

// Get the config file path
#[tauri::command]
async fn get_config_file_path() -> Result<String, String> {
    let path = get_config_path()?;
    Ok(path.to_string_lossy().to_string())
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
    use std::sync::{Arc, Mutex};
    use std::thread;

    let base = Path::new(&base_path);
    if !base.exists() {
        return Err(format!("Base path does not exist: {}", base_path));
    }

    let entries = fs::read_dir(base).map_err(|e| format!("Failed to read directory: {}", e))?;

    // Collect all git project paths first
    let projects: Vec<(String, std::path::PathBuf)> = entries
        .flatten()
        .filter_map(|entry| {
            let path = entry.path();
            if path.is_dir() && path.join(".git").exists() {
                let name = path
                    .file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or("unknown")
                    .to_string();
                Some((name, path))
            } else {
                None
            }
        })
        .collect();

    let results = Arc::new(Mutex::new(Vec::new()));

    // Process in parallel chunks of 8
    for chunk in projects.chunks(8) {
        let handles: Vec<_> = chunk
            .iter()
            .map(|(name, path)| {
                let project_name = name.clone();
                let project_path = path.clone();
                let results = Arc::clone(&results);

                thread::spawn(move || {
                    let path_str = project_path.to_string_lossy().to_string();

                    // Único acceso a red: fetch --all --prune.
                    // Abortamos si falla: sin fetch correcto no se puede afirmar "al día".
                    let mut fetch_cmd = git_network_cmd(&path_str);
                    fetch_cmd.args(["fetch", "--all", "--prune"]);
                    match run_with_timeout(&mut fetch_cmd, GIT_NETWORK_TIMEOUT) {
                        Ok(out) if out.status.success() => {}
                        Ok(out) => {
                            let err = String::from_utf8_lossy(&out.stderr).trim().to_string();
                            results.lock().unwrap().push(PullResult {
                                project_name,
                                success: false,
                                message: format!("No se pudo consultar el remoto: {}", err),
                            });
                            return;
                        }
                        Err(e) => {
                            results.lock().unwrap().push(PullResult {
                                project_name,
                                success: false,
                                message: e,
                            });
                            return;
                        }
                    }

                    // Avanzar rama actual al upstream descargado (sin red)
                    let mut merge_cmd = Command::new("git");
                    merge_cmd
                        .current_dir(&project_path)
                        .args(["merge", "--ff-only", "@{u}"]);
                    apply_no_window(&mut merge_cmd);

                    let result = match merge_cmd.output() {
                        Ok(out) => {
                            if out.status.success() {
                                let msg = String::from_utf8_lossy(&out.stdout).to_string();

                                // Actualizar el resto de ramas locales (fast-forward)
                                let extra = fast_forward_other_branches(&path_str);
                                let extra_note = if extra.is_empty() {
                                    String::new()
                                } else {
                                    format!(" (+{} ramas locales actualizadas)", extra.len())
                                };

                                if msg.contains("Already up to date")
                                    || msg.contains("Already up-to-date")
                                {
                                    PullResult {
                                        project_name,
                                        success: true,
                                        message: format!("Ya actualizado{}", extra_note),
                                    }
                                } else {
                                    // Obtener estadísticas del pull
                                    let mut stat_cmd = Command::new("git");
                                    stat_cmd.current_dir(&project_path).args([
                                        "diff",
                                        "--stat",
                                        "HEAD@{1}..HEAD",
                                    ]);
                                    apply_no_window(&mut stat_cmd);

                                    let detail = stat_cmd
                                        .output()
                                        .map(|o| String::from_utf8_lossy(&o.stdout).to_string())
                                        .unwrap_or_default();

                                    let summary = if detail.trim().is_empty() {
                                        format!("Actualizado correctamente{}", extra_note)
                                    } else {
                                        let last_line = detail.lines().last().unwrap_or("").trim();
                                        format!("Actualizado: {}{}", last_line, extra_note)
                                    };

                                    PullResult {
                                        project_name,
                                        success: true,
                                        message: summary,
                                    }
                                }
                            } else {
                                PullResult {
                                    project_name,
                                    success: false,
                                    message: String::from_utf8_lossy(&out.stderr).to_string(),
                                }
                            }
                        }
                        Err(e) => PullResult {
                            project_name,
                            success: false,
                            message: format!("Failed to merge: {}", e),
                        },
                    };

                    results.lock().unwrap().push(result);
                })
            })
            .collect();

        for handle in handles {
            let _ = handle.join();
        }
    }

    let results = Arc::try_unwrap(results)
        .map_err(|_| "Failed to unwrap results".to_string())?
        .into_inner()
        .map_err(|e| format!("Mutex error: {}", e))?;

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
            let vscode_path_alt = format!(
                "{}\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe",
                user_profile
            );

            if Path::new(&vscode_path_alt).exists() {
                let mut cmd = Command::new(&vscode_path_alt);
                cmd.arg(&project_path);
                cmd.creation_flags(CREATE_NO_WINDOW);
                cmd.spawn()
                    .map_err(|e| format!("Failed to open VS Code: {}", e))?;
                return Ok(());
            }
        }

        return Err(format!(
            "IDE '{}' not found. Please ensure it's installed and in PATH.",
            ide_command
        ));
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
            let cursor_paths = vec!["/usr/local/bin/cursor", "/opt/homebrew/bin/cursor"];

            for path in cursor_paths {
                if Path::new(path).exists() {
                    if let Ok(_) = Command::new(path).arg(&project_path).spawn() {
                        return Ok(());
                    }
                }
            }
        }

        return Err(format!(
            "IDE '{}' not found. Please ensure it's installed and the command is in your PATH.",
            ide_command
        ));
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
    pub has_conflicts: bool,
    pub ahead: i32,
    pub behind: i32,
    pub branch: String,
    pub status_message: String,
}

#[tauri::command]
async fn get_git_status(project_path: String) -> Result<GitStatus, String> {
    validate_git_repo(&project_path)?;

    // Get current branch
    let mut branch_cmd = Command::new("git");
    branch_cmd
        .current_dir(&project_path)
        .args(["rev-parse", "--abbrev-ref", "HEAD"]);
    apply_no_window(&mut branch_cmd);

    let branch_output = branch_cmd
        .output()
        .map_err(|e| format!("Failed to get branch: {}", e))?;

    let branch = String::from_utf8_lossy(&branch_output.stdout)
        .trim()
        .to_string();

    // Check for uncommitted changes
    let mut status_cmd = Command::new("git");
    status_cmd
        .current_dir(&project_path)
        .args(["status", "--porcelain"]);
    apply_no_window(&mut status_cmd);

    let status_output = status_cmd
        .output()
        .map_err(|e| format!("Failed to get status: {}", e))?;

    let status_text = String::from_utf8_lossy(&status_output.stdout);
    let has_changes = !status_text.is_empty();

    // M7: Detectar conflictos de merge (UU, AA, DD, AU, UA, DU, UD)
    let has_conflicts = status_text.lines().any(|line| {
        if line.len() >= 2 {
            let x = &line[0..1];
            let y = &line[1..2];
            x == "U" || y == "U" || (x == "A" && y == "A") || (x == "D" && y == "D")
        } else {
            false
        }
    });

    // Get ahead/behind count
    let mut ahead_cmd = Command::new("git");
    ahead_cmd.current_dir(&project_path).args([
        "rev-list",
        "--left-right",
        "--count",
        &format!("HEAD...origin/{}", branch),
    ]);
    apply_no_window(&mut ahead_cmd);

    let ahead_behind = ahead_cmd.output();

    let (ahead, behind) = match ahead_behind {
        Ok(output) => {
            let counts = String::from_utf8_lossy(&output.stdout);
            let parts: Vec<&str> = counts.trim().split('\t').collect();
            if parts.len() == 2 {
                (parts[0].parse().unwrap_or(0), parts[1].parse().unwrap_or(0))
            } else {
                (0, 0)
            }
        }
        Err(_) => (0, 0),
    };

    let status_message = if has_conflicts {
        "⚠️ Conflictos de merge pendientes".to_string()
    } else if has_changes && ahead > 0 && behind > 0 {
        format!(
            "⚠️ {} cambios, ↑{} ↓{}",
            if has_changes { "+" } else { "" },
            ahead,
            behind
        )
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
        has_conflicts,
        ahead,
        behind,
        branch,
        status_message,
    })
}

#[tauri::command]
async fn git_fetch(project_path: String) -> Result<String, String> {
    validate_git_repo(&project_path)?;
    info!("Fetch iniciado en: {}", project_path);

    let mut cmd = git_network_cmd(&project_path);
    cmd.args(["fetch", "--all", "--prune"]);

    let output = run_with_timeout(&mut cmd, GIT_NETWORK_TIMEOUT)?;

    if output.status.success() {
        info!("Fetch completado en: {}", project_path);
        Ok("Fetch completado".to_string())
    } else {
        let err = String::from_utf8_lossy(&output.stderr).to_string();
        error!("Fetch fallido en {}: {}", project_path, err);
        Err(err)
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
async fn export_config_file(app: tauri::AppHandle, config_json: String) -> Result<String, String> {
    use tauri_plugin_dialog::DialogExt;

    let result = app
        .dialog()
        .file()
        .set_file_name("ori-config-backup.json")
        .add_filter("JSON", &["json"])
        .blocking_save_file();

    match result {
        Some(path) => {
            let path_str = path.to_string();
            fs::write(&path_str, config_json)
                .map_err(|e| format!("Error al guardar archivo: {}", e))?;
            Ok(path_str)
        }
        None => Err("Operación cancelada".to_string()),
    }
}

#[tauri::command]
async fn import_config_file(app: tauri::AppHandle) -> Result<String, String> {
    use tauri_plugin_dialog::DialogExt;

    let result = app
        .dialog()
        .file()
        .add_filter("JSON", &["json"])
        .blocking_pick_file();

    match result {
        Some(path) => {
            let path_str = path.to_string();
            let content = fs::read_to_string(&path_str)
                .map_err(|e| format!("Error al leer archivo: {}", e))?;
            // S4: Validar estructura JSON antes de devolver
            let parsed: serde_json::Value = serde_json::from_str(&content)
                .map_err(|e| format!("El archivo no contiene JSON válido: {}", e))?;
            if !parsed.is_object() || parsed.get("environments").is_none() {
                return Err("El archivo no tiene la estructura de configuración esperada (falta campo: environments)".to_string());
            }
            Ok(content)
        }
        None => Err("Operación cancelada".to_string()),
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
            let log_level = if cfg!(debug_assertions) {
                log::LevelFilter::Debug
            } else {
                log::LevelFilter::Info
            };
            app.handle().plugin(
                tauri_plugin_log::Builder::default()
                    .level(log_level)
                    .build(),
            )?;
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
            pull_all_projects,
            load_config,
            save_config,
            get_config_file_path,
            open_in_ide,
            open_in_explorer,
            select_directory,
            export_config_file,
            import_config_file,
            check_path_exists,
            // Batch Git Operations
            batch_git_fetch,
            batch_git_pull,
            batch_git_push,
            // Extended Git Operations
            get_branches,
            checkout_branch,
            create_branch,
            delete_branch,
            get_commits,
            get_stash_list,
            stash_save,
            stash_pop,
            stash_drop,
            get_file_changes,
            get_diff,
            // Push, Stage, Commit, Merge
            git_push,
            git_stage_file,
            git_stage_all,
            git_unstage_file,
            git_discard_file,
            git_discard_all,
            git_commit,
            git_merge_branch,
            git_revert_commit,
            git_cherry_pick,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
