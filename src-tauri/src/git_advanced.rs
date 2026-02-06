use std::process::Command;
use std::thread;
use std::sync::{Arc, Mutex};

use crate::{apply_no_window, run_with_timeout, GIT_NETWORK_TIMEOUT};

// ==================== BATCH OPERATIONS ====================

#[tauri::command]
pub async fn batch_git_fetch(project_paths: Vec<String>) -> Result<Vec<(String, Result<String, String>)>, String> {
    let results = Arc::new(Mutex::new(Vec::new()));

    for chunk in project_paths.chunks(4) {
        let handles: Vec<_> = chunk.iter().map(|path| {
            let path = path.clone();
            let results = Arc::clone(&results);

            thread::spawn(move || {
                let mut cmd = Command::new("git");
                cmd.current_dir(&path).args(["fetch", "--all", "--prune"]);
                apply_no_window(&mut cmd);

                let result = match run_with_timeout(&mut cmd, GIT_NETWORK_TIMEOUT) {
                    Ok(out) => {
                        if out.status.success() {
                            Ok("Fetch completed".to_string())
                        } else {
                            Err(String::from_utf8_lossy(&out.stderr).to_string())
                        }
                    }
                    Err(e) => Err(e),
                };

                results.lock().unwrap().push((path, result));
            })
        }).collect();

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
pub async fn batch_git_pull(project_paths: Vec<String>) -> Result<Vec<(String, Result<String, String>)>, String> {
    let results = Arc::new(Mutex::new(Vec::new()));

    for chunk in project_paths.chunks(4) {
        let handles: Vec<_> = chunk.iter().map(|path| {
            let path = path.clone();
            let results = Arc::clone(&results);

            thread::spawn(move || {
                // First: fetch --all --prune
                let mut fetch_cmd = Command::new("git");
                fetch_cmd.current_dir(&path)
                    .args(["fetch", "--all", "--prune"]);
                apply_no_window(&mut fetch_cmd);
                let _ = run_with_timeout(&mut fetch_cmd, GIT_NETWORK_TIMEOUT);

                // Then: pull
                let mut pull_cmd = Command::new("git");
                pull_cmd.current_dir(&path).arg("pull");
                apply_no_window(&mut pull_cmd);

                let result = match run_with_timeout(&mut pull_cmd, GIT_NETWORK_TIMEOUT) {
                    Ok(out) => {
                        if out.status.success() {
                            Ok(String::from_utf8_lossy(&out.stdout).to_string())
                        } else {
                            Err(String::from_utf8_lossy(&out.stderr).to_string())
                        }
                    }
                    Err(e) => Err(e),
                };

                results.lock().unwrap().push((path, result));
            })
        }).collect();

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
