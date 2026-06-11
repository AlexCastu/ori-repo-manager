use log::info;
use std::process::Command;
use std::sync::{Arc, Mutex};
use std::thread;

use crate::{
    apply_no_window, fast_forward_other_branches, git_network_cmd, run_with_timeout,
    GIT_NETWORK_TIMEOUT,
};

/// Repos procesados en paralelo por lote
const BATCH_CHUNK_SIZE: usize = 8;

// ==================== BATCH OPERATIONS ====================

#[tauri::command]
pub async fn batch_git_fetch(
    project_paths: Vec<String>,
) -> Result<Vec<(String, Result<String, String>)>, String> {
    info!("Batch fetch iniciado: {} repositorios", project_paths.len());
    let results = Arc::new(Mutex::new(Vec::new()));

    for chunk in project_paths.chunks(BATCH_CHUNK_SIZE) {
        let handles: Vec<_> = chunk
            .iter()
            .map(|path| {
                let path = path.clone();
                let results = Arc::clone(&results);

                thread::spawn(move || {
                    let mut cmd = git_network_cmd(&path);
                    cmd.args(["fetch", "--all", "--prune"]);

                    let result = match run_with_timeout(&mut cmd, GIT_NETWORK_TIMEOUT) {
                        Ok(out) => {
                            if out.status.success() {
                                // stderr de fetch trae el detalle de refs actualizadas;
                                // se usa en auto-sync para detectar novedades
                                let detail = String::from_utf8_lossy(&out.stderr).to_string();
                                if detail.trim().is_empty() {
                                    Ok("Fetch completed".to_string())
                                } else {
                                    Ok(format!("Fetch completed\n{}", detail.trim()))
                                }
                            } else {
                                Err(String::from_utf8_lossy(&out.stderr).to_string())
                            }
                        }
                        Err(e) => Err(e),
                    };

                    results.lock().unwrap().push((path, result));
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
pub async fn batch_git_pull(
    project_paths: Vec<String>,
) -> Result<Vec<(String, Result<String, String>)>, String> {
    info!("Batch pull iniciado: {} repositorios", project_paths.len());
    let results = Arc::new(Mutex::new(Vec::new()));

    for chunk in project_paths.chunks(BATCH_CHUNK_SIZE) {
        let handles: Vec<_> = chunk
            .iter()
            .map(|path| {
                let path = path.clone();
                let results = Arc::clone(&results);

                thread::spawn(move || {
                    // Único acceso a red: fetch --all --prune.
                    // Abortamos si falla: sin fetch correcto no se puede afirmar "al día".
                    let mut fetch_cmd = git_network_cmd(&path);
                    fetch_cmd.args(["fetch", "--all", "--prune"]);
                    match run_with_timeout(&mut fetch_cmd, GIT_NETWORK_TIMEOUT) {
                        Ok(out) if out.status.success() => {}
                        Ok(out) => {
                            let err = String::from_utf8_lossy(&out.stderr).trim().to_string();
                            results.lock().unwrap().push((
                                path,
                                Err(format!("No se pudo consultar el remoto: {}", err)),
                            ));
                            return;
                        }
                        Err(e) => {
                            results.lock().unwrap().push((path, Err(e)));
                            return;
                        }
                    }

                    // Avanzar rama actual al upstream descargado (sin red, solo fast-forward)
                    let mut merge_cmd = Command::new("git");
                    merge_cmd
                        .current_dir(&path)
                        .args(["merge", "--ff-only", "@{u}"]);
                    apply_no_window(&mut merge_cmd);

                    let result = match merge_cmd.output() {
                        Ok(out) => {
                            if out.status.success() {
                                // Resto de ramas locales: fast-forward sin red
                                let extra = fast_forward_other_branches(&path);
                                let mut msg = String::from_utf8_lossy(&out.stdout).to_string();
                                if !extra.is_empty() {
                                    msg.push_str(&format!(
                                        "\n{} ramas locales actualizadas",
                                        extra.len()
                                    ));
                                }
                                Ok(msg)
                            } else {
                                Err(String::from_utf8_lossy(&out.stderr).to_string())
                            }
                        }
                        Err(e) => Err(format!("Failed to merge: {}", e)),
                    };

                    results.lock().unwrap().push((path, result));
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

// ==================== BATCH PUSH ====================

#[tauri::command]
pub async fn batch_git_push(
    project_paths: Vec<String>,
) -> Result<Vec<(String, Result<String, String>)>, String> {
    info!("Batch push iniciado: {} repositorios", project_paths.len());
    let results = Arc::new(Mutex::new(Vec::new()));

    for chunk in project_paths.chunks(BATCH_CHUNK_SIZE) {
        let handles: Vec<_> = chunk
            .iter()
            .map(|path| {
                let path = path.clone();
                let results = Arc::clone(&results);

                thread::spawn(move || {
                    let mut cmd = git_network_cmd(&path);
                    cmd.args(["push"]);

                    let result = match run_with_timeout(&mut cmd, GIT_NETWORK_TIMEOUT) {
                        Ok(out) => {
                            if out.status.success() {
                                let stdout = String::from_utf8_lossy(&out.stdout).to_string();
                                let stderr = String::from_utf8_lossy(&out.stderr).to_string();
                                let msg = if stdout.trim().is_empty() {
                                    stderr
                                } else {
                                    format!("{}\n{}", stdout, stderr)
                                };
                                Ok(msg)
                            } else {
                                Err(String::from_utf8_lossy(&out.stderr).to_string())
                            }
                        }
                        Err(e) => Err(e),
                    };

                    results.lock().unwrap().push((path, result));
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
