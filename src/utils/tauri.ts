import { invoke } from '@tauri-apps/api/core';
import type { AppConfig, Environment, Project, GitStatus, EnvironmentColor, EnvironmentIcon } from '../types';
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

export async function openInIDE(projectPath: string): Promise<void> {
  return invoke<void>('open_in_vscode', { projectPath });
}

// Alias para compatibilidad
export const openInVscode = openInIDE;

export async function openInExplorer(projectPath: string): Promise<void> {
  return invoke<void>('open_in_explorer', { projectPath });
}

export async function selectDirectory(): Promise<string | null> {
  return invoke<string | null>('select_directory');
}

export async function checkPathExists(path: string): Promise<boolean> {
  return invoke<boolean>('check_path_exists', { path });
}

// Git global config types and functions
export interface GitGlobalConfig {
  name: string;
  email: string;
}

export async function getGitGlobalConfig(): Promise<GitGlobalConfig> {
  return invoke<GitGlobalConfig>('get_git_global_config');
}

export async function setGitGlobalConfig(name: string, email: string): Promise<void> {
  return invoke<void>('set_git_global_config', { name, email });
}

// Git config variable types and functions
export interface GitConfigEntry {
  key: string;
  value: string;
}

export async function getGitConfigValue(key: string): Promise<string> {
  return invoke<string>('get_git_config_value', { key });
}

export async function setGitConfigValue(key: string, value: string): Promise<void> {
  return invoke<void>('set_git_config_value', { key, value });
}

export async function unsetGitConfigValue(key: string): Promise<void> {
  return invoke<void>('unset_git_config_value', { key });
}

export async function listGitConfig(): Promise<GitConfigEntry[]> {
  return invoke<GitConfigEntry[]>('list_git_config');
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
    projectsCache: {},
    settings: {
      theme: 'dark',
      defaultView: 'grid',
      showFavoritesFirst: true,
      autoScanOnStart: true,
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
