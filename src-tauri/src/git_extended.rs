use crate::{
    apply_no_window, run_with_timeout, validate_branch_name, validate_git_repo, GIT_NETWORK_TIMEOUT,
};
use log::{error, info, warn};
use serde::{Deserialize, Serialize};
use std::process::Command;

// ==================== TYPES ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitBranch {
    pub name: String,
    pub is_current: bool,
    pub is_remote: bool,
    pub tracking: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitCommit {
    pub hash: String,
    pub short_hash: String,
    pub author: String,
    pub email: String,
    pub date: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitStash {
    pub index: usize,
    pub branch: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileChange {
    pub path: String,
    pub status: String,
    pub staged: bool,
}

// ==================== BRANCHES ====================

#[tauri::command]
pub async fn get_branches(project_path: String) -> Result<Vec<GitBranch>, String> {
    validate_git_repo(&project_path)?;

    let mut cmd = Command::new("git");
    cmd.current_dir(&project_path).args(["branch", "-a", "-vv"]); // -a = all (local + remote), -vv = verbose
    apply_no_window(&mut cmd);

    let output = cmd
        .output()
        .map_err(|e| format!("Failed to get branches: {}", e))?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut branches = Vec::new();

    for line in stdout.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }

        let is_current = trimmed.starts_with('*');
        let line_content = if is_current { &trimmed[2..] } else { trimmed };

        // Skip detached HEAD and symbolic refs (e.g. remotes/origin/HEAD -> origin/main)
        if line_content.starts_with('(') || line_content.contains("->") {
            continue;
        }

        let parts: Vec<&str> = line_content.split_whitespace().collect();
        if parts.is_empty() {
            continue;
        }

        let name = parts[0].to_string();
        let is_remote = name.starts_with("remotes/");

        // Extract tracking info if available (between brackets)
        let tracking = if line_content.contains('[') && line_content.contains(']') {
            let start = line_content.find('[').unwrap();
            let end = line_content.find(']').unwrap();
            Some(line_content[start + 1..end].to_string())
        } else {
            None
        };

        branches.push(GitBranch {
            name,
            is_current,
            is_remote,
            tracking,
        });
    }

    Ok(branches)
}

#[tauri::command]
pub async fn checkout_branch(project_path: String, branch_name: String) -> Result<String, String> {
    validate_git_repo(&project_path)?;
    info!("Checkout rama '{}' en: {}", branch_name, project_path);

    let mut cmd = Command::new("git");
    cmd.current_dir(&project_path)
        .args(["checkout", &branch_name]);
    apply_no_window(&mut cmd);

    let output = cmd
        .output()
        .map_err(|e| format!("Failed to checkout branch: {}", e))?;

    if output.status.success() {
        Ok(format!("Rama {} activada", branch_name))
    } else {
        let err = String::from_utf8_lossy(&output.stderr).to_string();
        error!(
            "Checkout fallido '{}' en {}: {}",
            branch_name, project_path, err
        );
        Err(err)
    }
}

#[tauri::command]
pub async fn create_branch(
    project_path: String,
    branch_name: String,
    checkout: bool,
) -> Result<String, String> {
    validate_git_repo(&project_path)?;
    validate_branch_name(&branch_name)?;
    info!(
        "Crear rama '{}' en: {} (checkout: {})",
        branch_name, project_path, checkout
    );

    let mut cmd = Command::new("git");
    if checkout {
        cmd.current_dir(&project_path)
            .args(["checkout", "-b", &branch_name]);
    } else {
        cmd.current_dir(&project_path)
            .args(["branch", &branch_name]);
    }
    apply_no_window(&mut cmd);

    let output = cmd
        .output()
        .map_err(|e| format!("Failed to create branch: {}", e))?;

    if output.status.success() {
        Ok(format!("Rama {} creada", branch_name))
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
pub async fn delete_branch(
    project_path: String,
    branch_name: String,
    force: bool,
) -> Result<String, String> {
    validate_git_repo(&project_path)?;
    info!(
        "Eliminar rama '{}' en: {} (force: {})",
        branch_name, project_path, force
    );

    let mut cmd = Command::new("git");
    let flag = if force { "-D" } else { "-d" };
    cmd.current_dir(&project_path)
        .args(["branch", flag, &branch_name]);
    apply_no_window(&mut cmd);

    let output = cmd
        .output()
        .map_err(|e| format!("Failed to delete branch: {}", e))?;

    if output.status.success() {
        Ok(format!("Rama {} eliminada", branch_name))
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

// ==================== COMMITS ====================

#[tauri::command]
pub async fn get_commits(project_path: String, limit: usize) -> Result<Vec<GitCommit>, String> {
    validate_git_repo(&project_path)?;

    let mut cmd = Command::new("git");
    cmd.current_dir(&project_path).args([
        "log",
        &format!("-{}", limit),
        "--pretty=format:%H%x1f%h%x1f%an%x1f%ae%x1f%at%x1f%s",
    ]);
    apply_no_window(&mut cmd);

    let output = cmd
        .output()
        .map_err(|e| format!("Failed to get commits: {}", e))?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut commits = Vec::new();

    for line in stdout.lines() {
        let parts: Vec<&str> = line.split('\x1f').collect();
        if parts.len() >= 6 {
            commits.push(GitCommit {
                hash: parts[0].to_string(),
                short_hash: parts[1].to_string(),
                author: parts[2].to_string(),
                email: parts[3].to_string(),
                date: parts[4].to_string(),
                message: parts[5..].join(" "),
            });
        }
    }

    Ok(commits)
}

// ==================== STASHES ====================

#[tauri::command]
pub async fn get_stash_list(project_path: String) -> Result<Vec<GitStash>, String> {
    validate_git_repo(&project_path)?;

    let mut cmd = Command::new("git");
    cmd.current_dir(&project_path).args(["stash", "list"]);
    apply_no_window(&mut cmd);

    let output = cmd
        .output()
        .map_err(|e| format!("Failed to get stash list: {}", e))?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut stashes = Vec::new();

    for (index, line) in stdout.lines().enumerate() {
        // Format: stash@{0}: WIP on master: abc1234 commit message
        // OR:     stash@{0}: On master: saved message
        if let Some(colon_pos) = line.find(':') {
            let rest = line[colon_pos + 1..].trim();
            let parts: Vec<&str> = rest.splitn(3, ':').collect();

            // Branch is in the first part: "WIP on master" or "On master"
            let branch = parts[0]
                .trim()
                .split_whitespace()
                .last()
                .unwrap_or("unknown")
                .to_string();

            let message = if parts.len() > 1 {
                parts[1..].join(":").trim().to_string()
            } else {
                rest.to_string()
            };

            stashes.push(GitStash {
                index,
                branch,
                message,
            });
        }
    }

    Ok(stashes)
}

#[tauri::command]
pub async fn stash_save(project_path: String, message: String) -> Result<String, String> {
    validate_git_repo(&project_path)?;
    info!("Stash save en: {} (msg: {})", project_path, message);

    let mut cmd = Command::new("git");
    cmd.current_dir(&project_path)
        .args(["stash", "push", "-m", &message]);
    apply_no_window(&mut cmd);

    let output = cmd
        .output()
        .map_err(|e| format!("Failed to save stash: {}", e))?;

    if output.status.success() {
        Ok("Cambios guardados en stash".to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
pub async fn stash_pop(project_path: String, index: usize) -> Result<String, String> {
    validate_git_repo(&project_path)?;
    info!("Stash pop [{}] en: {}", index, project_path);

    let mut cmd = Command::new("git");
    cmd.current_dir(&project_path)
        .args(["stash", "pop", &format!("stash@{{{}}}", index)]);
    apply_no_window(&mut cmd);

    let output = cmd
        .output()
        .map_err(|e| format!("Failed to pop stash: {}", e))?;

    if output.status.success() {
        Ok("Stash aplicado correctamente".to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
pub async fn stash_drop(project_path: String, index: usize) -> Result<String, String> {
    validate_git_repo(&project_path)?;
    info!("Stash drop [{}] en: {}", index, project_path);

    let mut cmd = Command::new("git");
    cmd.current_dir(&project_path)
        .args(["stash", "drop", &format!("stash@{{{}}}", index)]);
    apply_no_window(&mut cmd);

    let output = cmd
        .output()
        .map_err(|e| format!("Failed to drop stash: {}", e))?;

    if output.status.success() {
        Ok("Stash eliminado".to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

// ==================== FILE CHANGES ====================

#[tauri::command]
pub async fn get_file_changes(project_path: String) -> Result<Vec<FileChange>, String> {
    validate_git_repo(&project_path)?;

    let mut cmd = Command::new("git");
    cmd.current_dir(&project_path)
        .args(["status", "--porcelain"]);
    apply_no_window(&mut cmd);

    let output = cmd
        .output()
        .map_err(|e| format!("Failed to get file changes: {}", e))?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut changes = Vec::new();

    for line in stdout.lines() {
        if line.len() < 4 {
            continue;
        }
        // git status --porcelain: XY filename
        // X = index (staged) status, Y = worktree (unstaged) status
        let index_status = &line[0..1];
        let worktree_status = &line[1..2];
        let raw_path = line[3..].trim().to_string();

        // Handle renames: "old_path -> new_path"
        let path = if raw_path.contains(" -> ") {
            raw_path
                .split(" -> ")
                .last()
                .unwrap_or(&raw_path)
                .to_string()
        } else {
            raw_path
        };

        // Untracked files: both are '?'
        if index_status == "?" && worktree_status == "?" {
            changes.push(FileChange {
                path,
                status: "??".to_string(),
                staged: false,
            });
            continue;
        }

        // If file is staged (index has a non-space status)
        if index_status != " " && index_status != "?" {
            changes.push(FileChange {
                path: path.clone(),
                status: index_status.to_string(),
                staged: true,
            });
        }

        // If file has unstaged changes (worktree has a non-space status)
        if worktree_status != " " && worktree_status != "?" {
            changes.push(FileChange {
                path,
                status: worktree_status.to_string(),
                staged: false,
            });
        }
    }

    Ok(changes)
}

#[tauri::command]
pub async fn get_diff(
    project_path: String,
    file_path: Option<String>,
    staged: Option<bool>,
) -> Result<String, String> {
    validate_git_repo(&project_path)?;

    // M4: Para archivos untracked, leer contenido directamente (git diff no muestra nada)
    if let Some(ref file) = file_path {
        if !staged.unwrap_or(false) {
            let mut check_cmd = Command::new("git");
            check_cmd
                .current_dir(&project_path)
                .args(["ls-files", "--error-unmatch", file]);
            apply_no_window(&mut check_cmd);

            let is_tracked = check_cmd
                .output()
                .map(|o| o.status.success())
                .unwrap_or(false);

            if !is_tracked {
                let file_full_path = std::path::Path::new(&project_path).join(file);
                match std::fs::read_to_string(&file_full_path) {
                    Ok(content) => {
                        let line_count = content.lines().count();
                        let added_lines: Vec<String> =
                            content.lines().map(|l| format!("+{}", l)).collect();
                        return Ok(format!(
                            "diff --git a/{f} b/{f}\nnew file\n--- /dev/null\n+++ b/{f}\n@@ -0,0 +1,{c} @@\n{lines}",
                            f = file,
                            c = line_count,
                            lines = added_lines.join("\n")
                        ));
                    }
                    Err(_) => return Ok("(Archivo binario o no se puede leer)".to_string()),
                }
            }
        }
    }

    let mut cmd = Command::new("git");
    cmd.current_dir(&project_path).arg("diff");

    if staged.unwrap_or(false) {
        cmd.arg("--cached");
    }

    if let Some(file) = file_path {
        cmd.arg("--").arg(file);
    }

    apply_no_window(&mut cmd);

    let output = cmd
        .output()
        .map_err(|e| format!("Failed to get diff: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

// ==================== PUSH ====================

#[tauri::command]
pub async fn git_push(project_path: String, force: bool) -> Result<String, String> {
    validate_git_repo(&project_path)?;

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

    info!(
        "Push iniciado en: {} [rama: {}] (force: {})",
        project_path, branch, force
    );

    let mut cmd = Command::new("git");
    cmd.current_dir(&project_path);

    if force {
        warn!("Push forzado en: {} [rama: {}]", project_path, branch);
        cmd.args(["push", "--force-with-lease"]);
    } else {
        cmd.args(["push"]);
    }
    apply_no_window(&mut cmd);

    let output = run_with_timeout(&mut cmd, GIT_NETWORK_TIMEOUT)?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        let msg = if stdout.trim().is_empty() {
            stderr
        } else {
            format!("{}\n{}", stdout, stderr)
        };
        info!("Push completado en: {} [{}]", project_path, branch);
        Ok(format!(
            "Push completado en rama {}\n{}",
            branch,
            msg.trim()
        ))
    } else {
        let err = String::from_utf8_lossy(&output.stderr).to_string();
        error!("Push fallido en {} [{}]: {}", project_path, branch, err);
        Err(err)
    }
}

// ==================== STAGE / UNSTAGE / DISCARD ====================

#[tauri::command]
pub async fn git_stage_file(project_path: String, file_path: String) -> Result<String, String> {
    validate_git_repo(&project_path)?;
    info!("Stage archivo: {} en {}", file_path, project_path);

    let mut cmd = Command::new("git");
    cmd.current_dir(&project_path)
        .args(["add", "--", &file_path]);
    apply_no_window(&mut cmd);

    let output = cmd
        .output()
        .map_err(|e| format!("Failed to stage file: {}", e))?;

    if output.status.success() {
        Ok(format!("Archivo staged: {}", file_path))
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
pub async fn git_stage_all(project_path: String) -> Result<String, String> {
    validate_git_repo(&project_path)?;
    info!("Stage all en: {}", project_path);

    let mut cmd = Command::new("git");
    cmd.current_dir(&project_path).args(["add", "-A"]);
    apply_no_window(&mut cmd);

    let output = cmd
        .output()
        .map_err(|e| format!("Failed to stage all: {}", e))?;

    if output.status.success() {
        Ok("Todos los archivos staged".to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
pub async fn git_unstage_file(project_path: String, file_path: String) -> Result<String, String> {
    validate_git_repo(&project_path)?;
    info!("Unstage archivo: {} en {}", file_path, project_path);

    let mut cmd = Command::new("git");
    cmd.current_dir(&project_path)
        .args(["reset", "HEAD", "--", &file_path]);
    apply_no_window(&mut cmd);

    let output = cmd
        .output()
        .map_err(|e| format!("Failed to unstage file: {}", e))?;

    if output.status.success() {
        Ok(format!("Archivo unstaged: {}", file_path))
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
pub async fn git_discard_file(project_path: String, file_path: String) -> Result<String, String> {
    validate_git_repo(&project_path)?;
    warn!("Descartando cambios en: {} ({})", file_path, project_path);

    // Check if file is untracked
    let mut check_cmd = Command::new("git");
    check_cmd
        .current_dir(&project_path)
        .args(["ls-files", "--error-unmatch", &file_path]);
    apply_no_window(&mut check_cmd);

    let is_tracked = check_cmd
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false);

    if is_tracked {
        // Tracked file: restore from HEAD
        let mut cmd = Command::new("git");
        cmd.current_dir(&project_path)
            .args(["checkout", "HEAD", "--", &file_path]);
        apply_no_window(&mut cmd);

        let output = cmd
            .output()
            .map_err(|e| format!("Failed to discard file: {}", e))?;

        if output.status.success() {
            Ok(format!("Cambios descartados: {}", file_path))
        } else {
            Err(String::from_utf8_lossy(&output.stderr).to_string())
        }
    } else {
        // Untracked file: remove it
        let file_full_path = std::path::Path::new(&project_path).join(&file_path);
        std::fs::remove_file(&file_full_path)
            .map_err(|e| format!("Failed to remove untracked file: {}", e))?;
        Ok(format!("Archivo sin seguimiento eliminado: {}", file_path))
    }
}

#[tauri::command]
pub async fn git_discard_all(project_path: String) -> Result<String, String> {
    validate_git_repo(&project_path)?;
    warn!("Descartando TODOS los cambios en: {}", project_path);

    // Reset tracked files
    let mut reset_cmd = Command::new("git");
    reset_cmd
        .current_dir(&project_path)
        .args(["checkout", "HEAD", "--", "."]);
    apply_no_window(&mut reset_cmd);

    let reset_out = reset_cmd
        .output()
        .map_err(|e| format!("Failed to reset files: {}", e))?;

    if !reset_out.status.success() {
        return Err(String::from_utf8_lossy(&reset_out.stderr).to_string());
    }

    // Clean untracked files (but not ignored files)
    let mut clean_cmd = Command::new("git");
    clean_cmd.current_dir(&project_path).args(["clean", "-fd"]);
    apply_no_window(&mut clean_cmd);

    let clean_out = clean_cmd
        .output()
        .map_err(|e| format!("Failed to clean untracked files: {}", e))?;

    if clean_out.status.success() {
        info!("Todos los cambios descartados en: {}", project_path);
        Ok("Todos los cambios descartados".to_string())
    } else {
        Err(String::from_utf8_lossy(&clean_out.stderr).to_string())
    }
}

// ==================== COMMIT ====================

#[tauri::command]
pub async fn git_commit(project_path: String, message: String) -> Result<String, String> {
    validate_git_repo(&project_path)?;

    if message.trim().is_empty() {
        return Err("El mensaje de commit no puede estar vacío".to_string());
    }

    info!("Commit en: {} (msg: {})", project_path, message);

    let mut cmd = Command::new("git");
    cmd.current_dir(&project_path)
        .args(["commit", "-m", &message]);
    apply_no_window(&mut cmd);

    let output = cmd
        .output()
        .map_err(|e| format!("Failed to commit: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        info!("Commit creado en: {}", project_path);
        Ok(stdout)
    } else {
        let err = String::from_utf8_lossy(&output.stderr).to_string();
        error!("Commit fallido en {}: {}", project_path, err);
        Err(err)
    }
}

// ==================== MERGE ====================

#[tauri::command]
pub async fn git_merge_branch(project_path: String, branch_name: String) -> Result<String, String> {
    validate_git_repo(&project_path)?;
    info!("Merge rama '{}' en: {}", branch_name, project_path);

    let mut cmd = Command::new("git");
    cmd.current_dir(&project_path)
        .args(["merge", "--no-edit", &branch_name]);
    apply_no_window(&mut cmd);

    let output = cmd
        .output()
        .map_err(|e| format!("Failed to merge: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        info!(
            "Merge completado: {} → current en {}",
            branch_name, project_path
        );
        Ok(stdout)
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        // Check for merge conflict
        if stderr.contains("CONFLICT") || stderr.contains("Automatic merge failed") {
            error!("Merge con conflictos: {} en {}", branch_name, project_path);
            // Abort the merge to leave repo clean
            let mut abort_cmd = Command::new("git");
            abort_cmd
                .current_dir(&project_path)
                .args(["merge", "--abort"]);
            apply_no_window(&mut abort_cmd);
            let _ = abort_cmd.output();
            Err(format!("Merge abortado: hay conflictos entre las ramas. Resuelve los conflictos manualmente.\n{}", stderr))
        } else {
            error!(
                "Merge fallido: {} en {}: {}",
                branch_name, project_path, stderr
            );
            Err(stderr)
        }
    }
}

// ==================== REVERT ====================

#[tauri::command]
pub async fn git_revert_commit(
    project_path: String,
    commit_hash: String,
) -> Result<String, String> {
    validate_git_repo(&project_path)?;
    info!("Revert commit {} en: {}", commit_hash, project_path);

    let mut cmd = Command::new("git");
    cmd.current_dir(&project_path)
        .args(["revert", "--no-edit", &commit_hash]);
    apply_no_window(&mut cmd);

    let output = cmd
        .output()
        .map_err(|e| format!("Failed to revert: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        info!("Revert completado: {} en {}", commit_hash, project_path);
        Ok(stdout)
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        if stderr.contains("CONFLICT") || stderr.contains("conflict") {
            error!("Revert con conflictos: {} en {}", commit_hash, project_path);
            let mut abort_cmd = Command::new("git");
            abort_cmd
                .current_dir(&project_path)
                .args(["revert", "--abort"]);
            apply_no_window(&mut abort_cmd);
            let _ = abort_cmd.output();
            Err(format!(
                "Revert abortado: hay conflictos. Resuelve manualmente.\n{}",
                stderr
            ))
        } else {
            error!(
                "Revert fallido: {} en {}: {}",
                commit_hash, project_path, stderr
            );
            Err(stderr)
        }
    }
}

// ==================== CHERRY-PICK ====================

#[tauri::command]
pub async fn git_cherry_pick(project_path: String, commit_hash: String) -> Result<String, String> {
    validate_git_repo(&project_path)?;
    info!("Cherry-pick commit {} en: {}", commit_hash, project_path);

    let mut cmd = Command::new("git");
    cmd.current_dir(&project_path)
        .args(["cherry-pick", "--no-edit", &commit_hash]);
    apply_no_window(&mut cmd);

    let output = cmd
        .output()
        .map_err(|e| format!("Failed to cherry-pick: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        info!(
            "Cherry-pick completado: {} en {}",
            commit_hash, project_path
        );
        Ok(stdout)
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        if stderr.contains("CONFLICT") || stderr.contains("conflict") {
            error!(
                "Cherry-pick con conflictos: {} en {}",
                commit_hash, project_path
            );
            let mut abort_cmd = Command::new("git");
            abort_cmd
                .current_dir(&project_path)
                .args(["cherry-pick", "--abort"]);
            apply_no_window(&mut abort_cmd);
            let _ = abort_cmd.output();
            Err(format!(
                "Cherry-pick abortado: hay conflictos. Resuelve manualmente.\n{}",
                stderr
            ))
        } else {
            error!(
                "Cherry-pick fallido: {} en {}: {}",
                commit_hash, project_path, stderr
            );
            Err(stderr)
        }
    }
}
