import { invoke } from '@tauri-apps/api/core';
import type { AppConfig, Environment, Project, GitStatus, EnvironmentColor, EnvironmentIcon, GitBranch, GitCommit, GitStash, FileChange } from '../types';
import { defaultEnvironmentColor, defaultEnvironmentIcon } from './colors';

// Tauri command wrappers for type safety

export async function scanProjects(basePath: string): Promise<Project[]> {
  return invoke<Project[]>('scan_projects', { basePath });
}

export async function getGitStatus(projectPath: string): Promise<GitStatus> {
  return invoke<GitStatus>('get_git_status', { projectPath });
}

export async function gitFetch(projectPath: string): Promise<void> {
  return invoke<void>('git_fetch', { projectPath });
}

export async function getGitRemoteUrl(projectPath: string): Promise<string | null> {
  return invoke<string | null>('get_git_remote_url', { projectPath });
}

export async function gitClone(repoUrl: string, destination: string): Promise<string> {
  return invoke<string>('git_clone', { repoUrl, destination });
}

export async function gitPull(projectPath: string): Promise<string> {
  return invoke<string>('git_pull', { projectPath });
}

export async function gitConfig(projectPath: string, name: string, email: string): Promise<void> {
  return invoke<void>('git_config', { projectPath, name, email });
}

export async function loadConfig(): Promise<AppConfig> {
  return invoke<AppConfig>('load_config');
}

export async function saveConfig(config: AppConfig): Promise<void> {
  return invoke<void>('save_config', { config });
}

export async function openInIDE(projectPath: string, ideCommand: string = 'code'): Promise<void> {
  return invoke<void>('open_in_ide', { projectPath, ideCommand });
}

export async function openInExplorer(projectPath: string): Promise<void> {
  return invoke<void>('open_in_explorer', { projectPath });
}

export async function selectDirectory(): Promise<string | null> {
  return invoke<string | null>('select_directory');
}

export async function checkPathExists(path: string): Promise<boolean> {
  return invoke<boolean>('check_path_exists', { path });
}

export async function getConfigPath(): Promise<string> {
  return invoke<string>('get_config_file_path');
}

// Pull all projects result
export interface PullResult {
  project_name: string;
  success: boolean;
  message: string;
}

export async function pullAllProjects(basePath: string): Promise<PullResult[]> {
  return invoke<PullResult[]>('pull_all_projects', { basePath });
}

// Helper to detect git platform from URL
export function detectGitPlatform(url: string): string | null {
  if (!url) return null;
  const urlLower = url.toLowerCase();
  if (urlLower.includes('github.com')) return 'github';
  if (urlLower.includes('gitlab.com') || urlLower.includes('gitlab')) return 'gitlab';
  if (urlLower.includes('bitbucket.org') || urlLower.includes('bitbucket')) return 'bitbucket';
  if (urlLower.includes('dev.azure.com') || urlLower.includes('visualstudio.com')) return 'azure';
  return 'other';
}

// Default config for new installations
export function getDefaultConfig(): AppConfig {
  return {
    version: '2.0.0',
    environments: [],
    favorites: {},
    projectNotes: {},
    hiddenProjects: {},
    tags: {},
    projectTags: {},
    projectsCache: {},
    settings: {
      theme: 'dark',
      defaultView: 'grid',
      showFavoritesFirst: true,
      autoScanOnStart: true,
      ideCommand: 'code',
      ultraCompactView: false,
    },
  };
}

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Create new environment
export function createEnvironment(
  name: string,
  basePath: string,
  gitServer: string,
  color: EnvironmentColor = defaultEnvironmentColor,
  icon: EnvironmentIcon = defaultEnvironmentIcon
): Environment {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    name,
    basePath,
    gitServer,
    color,
    icon,
    createdAt: now,
    updatedAt: now,
  };
}

// ==================== EXTENDED GIT OPERATIONS ====================

export async function getBranches(projectPath: string): Promise<GitBranch[]> {
  return invoke<GitBranch[]>('get_branches', { projectPath });
}

export async function checkoutBranch(projectPath: string, branchName: string): Promise<string> {
  return invoke<string>('checkout_branch', { projectPath, branchName });
}

export async function createBranch(projectPath: string, branchName: string, checkout: boolean = false): Promise<string> {
  return invoke<string>('create_branch', { projectPath, branchName, checkout });
}

export async function deleteBranch(projectPath: string, branchName: string, force: boolean = false): Promise<string> {
  return invoke<string>('delete_branch', { projectPath, branchName, force });
}

export async function getCommits(projectPath: string, limit: number = 20): Promise<GitCommit[]> {
  return invoke<GitCommit[]>('get_commits', { projectPath, limit });
}

export async function getStashList(projectPath: string): Promise<GitStash[]> {
  return invoke<GitStash[]>('get_stash_list', { projectPath });
}

export async function stashSave(projectPath: string, message: string): Promise<string> {
  return invoke<string>('stash_save', { projectPath, message });
}

export async function stashPop(projectPath: string, index: number): Promise<string> {
  return invoke<string>('stash_pop', { projectPath, index });
}

export async function stashDrop(projectPath: string, index: number): Promise<string> {
  return invoke<string>('stash_drop', { projectPath, index });
}

export async function getFileChanges(projectPath: string): Promise<FileChange[]> {
  return invoke<FileChange[]>('get_file_changes', { projectPath });
}

export async function getDiff(projectPath: string, filePath?: string, staged?: boolean): Promise<string> {
  return invoke<string>('get_diff', { projectPath, filePath: filePath || null, staged: staged || false });
}

// ==================== PUSH, STAGE, COMMIT, MERGE ====================

export async function gitPush(projectPath: string, force: boolean = false): Promise<string> {
  return invoke<string>('git_push', { projectPath, force });
}

export async function gitStageFile(projectPath: string, filePath: string): Promise<string> {
  return invoke<string>('git_stage_file', { projectPath, filePath });
}

export async function gitStageAll(projectPath: string): Promise<string> {
  return invoke<string>('git_stage_all', { projectPath });
}

export async function gitUnstageFile(projectPath: string, filePath: string): Promise<string> {
  return invoke<string>('git_unstage_file', { projectPath, filePath });
}

export async function gitDiscardFile(projectPath: string, filePath: string): Promise<string> {
  return invoke<string>('git_discard_file', { projectPath, filePath });
}

export async function gitDiscardAll(projectPath: string): Promise<string> {
  return invoke<string>('git_discard_all', { projectPath });
}

export async function gitCommit(projectPath: string, message: string): Promise<string> {
  return invoke<string>('git_commit', { projectPath, message });
}

export async function gitMergeBranch(projectPath: string, branchName: string): Promise<string> {
  return invoke<string>('git_merge_branch', { projectPath, branchName });
}

export async function gitRevertCommit(projectPath: string, commitHash: string): Promise<string> {
  return invoke<string>('git_revert_commit', { projectPath, commitHash });
}

export async function gitCherryPick(projectPath: string, commitHash: string): Promise<string> {
  return invoke<string>('git_cherry_pick', { projectPath, commitHash });
}

// ==================== CONFIG EXPORT/IMPORT ====================

export async function exportConfigFile(configJson: string): Promise<string> {
  return invoke<string>('export_config_file', { configJson });
}

export async function importConfigFile(): Promise<string> {
  return invoke<string>('import_config_file');
}
