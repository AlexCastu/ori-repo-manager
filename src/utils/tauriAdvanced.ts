import { invoke } from '@tauri-apps/api/core';

// ========== BATCH OPERATIONS ==========

export async function batchGitFetch(projectPaths: string[]): Promise<Array<[string, Result<string, string>]>> {
  return invoke('batch_git_fetch', { projectPaths });
}

export async function batchGitPull(projectPaths: string[]): Promise<Array<[string, Result<string, string>]>> {
  return invoke('batch_git_pull', { projectPaths });
}

export async function batchGitPush(projectPaths: string[]): Promise<Array<[string, Result<string, string>]>> {
  return invoke('batch_git_push', { projectPaths });
}

// Helper type for Rust Result
type Result<T, E> = { Ok: T } | { Err: E };
