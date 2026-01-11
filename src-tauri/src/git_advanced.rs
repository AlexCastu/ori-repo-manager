use serde::{Deserialize, Serialize};
use std::process::Command;

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

#[cfg(target_os = "windows")]
fn apply_no_window(cmd: &mut Command) {
    use std::os::windows::process::CommandExt;
    cmd.creation_flags(CREATE_NO_WINDOW);
}

#[cfg(not(target_os = "windows"))]
fn apply_no_window(_cmd: &mut Command) {}

// ==================== ADVANCED GIT TYPES ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitBranch {
    pub name: String,
    #[serde(rename = "isActive")]
    pub is_active: bool,
    pub ahead: i32,
    pub behind: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitCommit {
    pub hash: String,
    #[serde(rename = "shortHash")]
    pub short_hash: String,
    pub author: String,
    pub email: String,
    pub date: String,
    pub message: String,
    pub branch: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitStash {
    pub index: usize,
    pub message: String,
    pub branch: String,
    pub date: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiffFile {
    pub path: String,
    pub status: String, // added, modified, deleted, renamed
    pub additions: i32,
    pub deletions: i32,
}

// ==================== BRANCH MANAGEMENT ====================

#[tauri::command]
pub async fn get_branches(project_path: String) -> Result<Vec<GitBranch>, String> {
    let mut cmd = Command::new("git");
    cmd.current_dir(&project_path)
        .args(["branch", "-vv", "--all"]);
    apply_no_window(&mut cmd);

    let output = cmd.output()
        .map_err(|e| format!("Failed to get branches: {}", e))?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut branches = Vec::new();

    for line in stdout.lines() {
        if line.trim().is_empty() {
            continue;
        }

        let is_active = line.starts_with('*');
        let name = line
            .trim_start_matches('*')
            .trim()
            .split_whitespace()
            .next()
            .unwrap_or("")
            .trim_start_matches("remotes/origin/")
            .to_string();

        // Skip HEAD reference
        if name.contains("HEAD") {
            continue;
        }

        branches.push(GitBranch {
            name,
            is_active,
            ahead: 0,
            behind: 0,
        });
    }

    // Remove duplicates (local and remote branches with same name)
    branches.dedup_by(|a, b| a.name == b.name);

    Ok(branches)
}

#[tauri::command]
pub async fn checkout_branch(project_path: String, branch_name: String) -> Result<String, String> {
    let mut cmd = Command::new("git");
    cmd.current_dir(&project_path)
        .args(["checkout", &branch_name]);
    apply_no_window(&mut cmd);

    let output = cmd.output()
        .map_err(|e| format!("Failed to checkout branch: {}", e))?;

    if output.status.success() {
        Ok(format!("Switched to branch '{}'", branch_name))
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
pub async fn create_branch(project_path: String, branch_name: String) -> Result<String, String> {
    let mut cmd = Command::new("git");
    cmd.current_dir(&project_path)
        .args(["checkout", "-b", &branch_name]);
    apply_no_window(&mut cmd);

    let output = cmd.output()
        .map_err(|e| format!("Failed to create branch: {}", e))?;

    if output.status.success() {
        Ok(format!("Created and switched to branch '{}'", branch_name))
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
pub async fn delete_branch(project_path: String, branch_name: String) -> Result<String, String> {
    let mut cmd = Command::new("git");
    cmd.current_dir(&project_path)
        .args(["branch", "-d", &branch_name]);
    apply_no_window(&mut cmd);

    let output = cmd.output()
        .map_err(|e| format!("Failed to delete branch: {}", e))?;

    if output.status.success() {
        Ok(format!("Deleted branch '{}'", branch_name))
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

// ==================== COMMIT HISTORY ====================

#[tauri::command]
pub async fn get_commits(project_path: String, limit: usize) -> Result<Vec<GitCommit>, String> {
    let mut cmd = Command::new("git");
    cmd.current_dir(&project_path)
        .args([
            "log",
            &format!("-{}", limit),
            "--pretty=format:%H|%h|%an|%ae|%ai|%s",
            "--all",
        ]);
    apply_no_window(&mut cmd);

    let output = cmd.output()
        .map_err(|e| format!("Failed to get commits: {}", e))?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut commits = Vec::new();

    for line in stdout.lines() {
        let parts: Vec<&str> = line.split('|').collect();
        if parts.len() >= 6 {
            commits.push(GitCommit {
                hash: parts[0].to_string(),
                short_hash: parts[1].to_string(),
                author: parts[2].to_string(),
                email: parts[3].to_string(),
                date: parts[4].to_string(),
                message: parts[5..].join("|"),
                branch: String::new(), // Would need another command to determine
            });
        }
    }

    Ok(commits)
}

// ==================== STASH MANAGEMENT ====================

#[tauri::command]
pub async fn get_stash_list(project_path: String) -> Result<Vec<GitStash>, String> {
    let mut cmd = Command::new("git");
    cmd.current_dir(&project_path)
        .args(["stash", "list", "--pretty=format:%gd|%s|%cr"]);
    apply_no_window(&mut cmd);

    let output = cmd.output()
        .map_err(|e| format!("Failed to list stashes: {}", e))?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut stashes = Vec::new();

    for (index, line) in stdout.lines().enumerate() {
        let parts: Vec<&str> = line.split('|').collect();
        if parts.len() >= 3 {
            stashes.push(GitStash {
                index,
                message: parts[1].to_string(),
                branch: String::new(),
                date: parts[2].to_string(),
            });
        }
    }

    Ok(stashes)
}

#[tauri::command]
pub async fn stash_save(project_path: String, message: Option<String>) -> Result<String, String> {
    let mut cmd = Command::new("git");
    cmd.current_dir(&project_path).arg("stash");

    if let Some(msg) = message {
        cmd.args(["save", &msg]);
    }

    apply_no_window(&mut cmd);

    let output = cmd.output()
        .map_err(|e| format!("Failed to save stash: {}", e))?;

    if output.status.success() {
        Ok("Changes stashed successfully".to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
pub async fn stash_pop(project_path: String, index: usize) -> Result<String, String> {
    let mut cmd = Command::new("git");
    cmd.current_dir(&project_path)
        .args(["stash", "pop", &format!("stash@{{{}}}", index)]);
    apply_no_window(&mut cmd);

    let output = cmd.output()
        .map_err(|e| format!("Failed to pop stash: {}", e))?;

    if output.status.success() {
        Ok("Stash applied successfully".to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
pub async fn stash_drop(project_path: String, index: usize) -> Result<String, String> {
    let mut cmd = Command::new("git");
    cmd.current_dir(&project_path)
        .args(["stash", "drop", &format!("stash@{{{}}}", index)]);
    apply_no_window(&mut cmd);

    let output = cmd.output()
        .map_err(|e| format!("Failed to drop stash: {}", e))?;

    if output.status.success() {
        Ok("Stash deleted successfully".to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

// ==================== FILE CHANGES & DIFF ====================

#[tauri::command]
pub async fn get_file_changes(project_path: String) -> Result<Vec<DiffFile>, String> {
    let mut cmd = Command::new("git");
    cmd.current_dir(&project_path)
        .args(["status", "--porcelain"]);
    apply_no_window(&mut cmd);

    let output = cmd.output()
        .map_err(|e| format!("Failed to get file changes: {}", e))?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut files = Vec::new();

    for line in stdout.lines() {
        if line.len() < 4 {
            continue;
        }

        let status_code = &line[0..2];
        let path = line[3..].trim().to_string();

        let status = match status_code.trim() {
            "A" | "??" => "added",
            "M" => "modified",
            "D" => "deleted",
            "R" => "renamed",
            _ => "modified",
        };

        files.push(DiffFile {
            path,
            status: status.to_string(),
            additions: 0,
            deletions: 0,
        });
    }

    Ok(files)
}

#[tauri::command]
pub async fn get_diff(project_path: String, file_path: Option<String>) -> Result<String, String> {
    let mut cmd = Command::new("git");
    cmd.current_dir(&project_path).arg("diff");

    if let Some(file) = file_path {
        cmd.arg(file);
    }

    apply_no_window(&mut cmd);

    let output = cmd.output()
        .map_err(|e| format!("Failed to get diff: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

// ==================== BATCH OPERATIONS ====================

#[tauri::command]
pub async fn batch_git_fetch(project_paths: Vec<String>) -> Result<Vec<(String, Result<String, String>)>, String> {
    let mut results = Vec::new();

    for path in project_paths {
        let mut cmd = Command::new("git");
        cmd.current_dir(&path).args(["fetch", "--all"]);
        apply_no_window(&mut cmd);

        let output = cmd.output();

        let result = match output {
            Ok(out) => {
                if out.status.success() {
                    Ok("Fetch completed".to_string())
                } else {
                    Err(String::from_utf8_lossy(&out.stderr).to_string())
                }
            }
            Err(e) => Err(format!("Failed to fetch: {}", e)),
        };

        results.push((path, result));
    }

    Ok(results)
}

#[tauri::command]
pub async fn batch_git_pull(project_paths: Vec<String>) -> Result<Vec<(String, Result<String, String>)>, String> {
    let mut results = Vec::new();

    for path in project_paths {
        // First, fetch all branches from all remotes
        let mut fetch_cmd = Command::new("git");
        fetch_cmd.current_dir(&path)
            .args(["fetch", "--all"]);
        apply_no_window(&mut fetch_cmd);

        let _fetch_output = fetch_cmd.output();

        // Then, pull the current branch
        let mut pull_cmd = Command::new("git");
        pull_cmd.current_dir(&path).arg("pull");
        apply_no_window(&mut pull_cmd);

        let output = pull_cmd.output();

        let result = match output {
            Ok(out) => {
                if out.status.success() {
                    Ok(String::from_utf8_lossy(&out.stdout).to_string())
                } else {
                    Err(String::from_utf8_lossy(&out.stderr).to_string())
                }
            }
            Err(e) => Err(format!("Failed to pull: {}", e)),
        };

        results.push((path, result));
    }

    Ok(results)
}
