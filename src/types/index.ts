// Types for ORI-RepoManager v2.0

// Available theme colors for environments
export type EnvironmentColor =
  | 'ocean'       // Océano profundo (azul-verde)
  | 'forest'      // Bosque (verde profundo)
  | 'sunset'      // Atardecer (amarillo-naranja-púrpura)
  | 'arctic'      // Ártico (cyan-azul)
  | 'violet'      // Violeta (púrpura-rosa)
  | 'coral'       // Coral (rosa-salmón)
  | 'emerald'     // Esmeralda (verde menta)
  | 'electric'    // Eléctrico (azul intenso)
  | 'silver'      // Plata (azul gris)
  | 'aurora'      // Aurora (verde-púrpura)
  | 'teal'        // Teal (cyan-verde)
  | 'slate'       // Pizarra (gris oscuro)
  | 'copper'      // Cobre (marrón cálido)
  | 'navy'        // Marino (azul profundo)
  | 'flame';      // Llama (naranja-rojo)

// Available icons for environments
export type EnvironmentIcon =
  | 'folder'
  | 'code'
  | 'server'
  | 'database'
  | 'cloud'
  | 'globe'
  | 'rocket'
  | 'star'
  | 'zap'
  | 'box'
  | 'layers'
  | 'git-branch';

export interface Environment {
  id: string;
  name: string;
  basePath: string;
  gitServer: string;
  color: EnvironmentColor;
  icon: EnvironmentIcon;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  name: string;
  path: string;
  gitUrl: string | null;
  hasGit: boolean;
  platform: GitPlatform | null;
  lastScanned: string;
}

export interface Favorite {
  projectName: string;
  note: string;
  order: number;
  addedAt: string;
}

// Git Status from Rust backend
export interface GitStatus {
  has_changes: boolean;
  ahead: number;
  behind: number;
  branch: string;
  status_message: string;
}

export interface AppConfig {
  version: string;
  environments: Environment[];
  favorites: Record<string, Favorite>;
  projectNotes: Record<string, string>; // Notas independientes de favoritos
  hiddenProjects: Record<string, string>; // key=projectName, value=hiddenAt ISO date
  projectsCache: Record<string, Record<string, Project>>;
  settings: AppSettings;
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  defaultView: 'grid' | 'list';
  showFavoritesFirst: boolean;
  autoScanOnStart: boolean;
  ideCommand: string;
}

export type GitPlatform = 'github' | 'gitlab' | 'bitbucket' | 'azure' | 'other';

// Project Tag
export interface ProjectTag {
  id: string;
  name: string;
  color: string;
  icon?: string;
  createdAt: string;
}

// Git Operation
export interface GitOperation {
  id: string;
  type: 'clone' | 'pull' | 'push' | 'fetch' | 'checkout' | 'stash' | 'config' | 'batch';
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  timestamp: string;
  projectPath?: string;
  projectName?: string;
  details?: string;
  duration?: number;
}

// Auto Sync Configuration
export interface AutoSyncConfig {
  enabled: boolean;
  intervalMinutes: number;
  notifyOnUpdates: boolean;
  autoFetchOnStart: boolean;
  environments: string[];
}

// Advanced Filters
export interface ProjectFilters {
  searchQuery: string;
  showOnlyFavorites: boolean;
  gitStatus: 'all' | 'with-changes' | 'up-to-date' | 'ahead' | 'behind';
  platforms: GitPlatform[];
  branches: string[];
  tags: string[];
  hasUncommitted: boolean | null;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

// Modal states
export interface ModalState {
  isOpen: boolean;
  data?: unknown;
}

export interface EnvironmentModalData {
  environment?: Environment;
  mode: 'create' | 'edit';
}

export interface GitConfigModalData {
  projectPath: string;
  projectName: string;
}

export interface CloneModalData {
  environmentId: string;
  gitServer: string;
  basePath: string;
}

export interface GitPullModalData {
  projectPath: string;
  projectName: string;
}

export interface FavoriteNoteModalData {
  projectName: string;
  currentNote: string;
}

export interface DeleteEnvironmentModalData {
  environment: Environment;
}

// Store types
export interface EnvironmentsSlice {
  environments: Environment[];
  activeEnvironmentId: string | null;
  setActiveEnvironment: (id: string | null) => void;
  addEnvironment: (env: Omit<Environment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateEnvironment: (id: string, env: Partial<Environment>) => void;
  deleteEnvironment: (id: string) => void;
}

export interface ProjectsSlice {
  projects: Project[];
  isLoading: boolean;
  searchQuery: string;
  viewMode: 'grid' | 'list';
  showOnlyFavorites: boolean;
  selectedProjects: Set<string>;
  refreshTrigger: number;
  filters: ProjectFilters;
  setProjects: (projects: Project[]) => void;
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setShowOnlyFavorites: (show: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  toggleProjectSelection: (projectPath: string) => void;
  selectAllProjects: () => void;
  deselectAllProjects: () => void;
  setFilters: (filters: Partial<ProjectFilters>) => void;
  resetFilters: () => void;
  triggerRefresh: () => void;
}

export interface FavoritesSlice {
  favorites: Record<string, Favorite>;
  toggleFavorite: (projectName: string) => void;
  isFavorite: (projectName: string) => boolean;
}

export interface ProjectNotesSlice {
  projectNotes: Record<string, string>;
  updateProjectNote: (projectName: string, note: string) => void;
  getProjectNote: (projectName: string) => string;
  hasProjectNote: (projectName: string) => boolean;
}

export interface UISlice {
  toasts: ToastMessage[];
  environmentModal: ModalState & { data?: EnvironmentModalData };
  gitConfigModal: ModalState & { data?: GitConfigModalData };
  cloneModal: ModalState & { data?: CloneModalData };
  favoriteNoteModal: ModalState & { data?: FavoriteNoteModalData };
  gitPullModal: ModalState & { data?: GitPullModalData };
  settingsModal: ModalState;
  deleteEnvironmentModal: ModalState & { data?: DeleteEnvironmentModalData };
  tagManagerModal: ModalState;
  gitOperationsLogModal: ModalState;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  openEnvironmentModal: (data: EnvironmentModalData) => void;
  closeEnvironmentModal: () => void;
  openGitConfigModal: (data: GitConfigModalData) => void;
  closeGitConfigModal: () => void;
  openCloneModal: (data: CloneModalData) => void;
  closeCloneModal: () => void;
  openFavoriteNoteModal: (data: FavoriteNoteModalData) => void;
  closeFavoriteNoteModal: () => void;
  openGitPullModal: (data: GitPullModalData) => void;
  closeGitPullModal: () => void;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;
  openDeleteEnvironmentModal: (data: DeleteEnvironmentModalData) => void;
  closeDeleteEnvironmentModal: () => void;
  openTagManagerModal: () => void;
  closeTagManagerModal: () => void;
  openGitOperationsLogModal: () => void;
  closeGitOperationsLogModal: () => void;
}

export type AppStore = EnvironmentsSlice & ProjectsSlice & FavoritesSlice & ProjectNotesSlice & UISlice & {
  config: AppConfig | null;
  isInitialized: boolean;
  // Hidden Projects
  hiddenProjects: Record<string, string>;
  showHiddenProjects: boolean;
  toggleHideProject: (projectName: string) => void;
  setShowHiddenProjects: (show: boolean) => void;
  // Tags
  tags: Record<string, ProjectTag>;
  projectTags: Record<string, string[]>;
  addTag: (tag: Omit<ProjectTag, 'id' | 'createdAt'>) => string;
  deleteTag: (tagId: string) => void;
  addTagToProject: (projectPath: string, tagId: string) => void;
  removeTagFromProject: (projectPath: string, tagId: string) => void;
  // Git Operations History
  gitOperations: GitOperation[];
  addGitOperation: (operation: Omit<GitOperation, 'id' | 'timestamp'>) => void;
  // Auto Sync
  autoSyncConfig: AutoSyncConfig;
  updateAutoSyncConfig: (config: Partial<AutoSyncConfig>) => void;
  // Methods
  initialize: () => Promise<void>;
  saveConfig: () => Promise<void>;
  scanCurrentEnvironment: (silent?: boolean) => Promise<void>;
  pullAllProjects: () => Promise<void>;
  fetchAllProjects: () => Promise<void>;
};
