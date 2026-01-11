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
