// Types for ORI-RepoManager v2.0

// Available theme colors for environments
export type EnvironmentColor =
  | 'emerald'   // Verde esmeralda
  | 'teal'      // Verde azulado
  | 'cyan'      // Cian
  | 'sky'       // Azul cielo
  | 'blue'      // Azul
  | 'indigo'    // Índigo
  | 'violet'    // Violeta
  | 'purple'    // Púrpura
  | 'fuchsia'   // Fucsia
  | 'pink'      // Rosa
  | 'rose'      // Rosa intenso
  | 'amber'     // Ámbar
  | 'orange';   // Naranja

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

// Extended Project with Git Status
export interface ProjectWithStatus extends Project {
  gitStatus?: GitStatus;
}

export interface AppConfig {
  version: string;
  environments: Environment[];
  favorites: Record<string, Favorite>;
  projectsCache: Record<string, Record<string, Project>>;
  settings: AppSettings;
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  defaultView: 'grid' | 'list';
  showFavoritesFirst: boolean;
  autoScanOnStart: boolean;
}

export type GitPlatform = 'github' | 'gitlab' | 'bitbucket' | 'azure' | 'other';

export interface GitOperation {
  type: 'clone' | 'pull' | 'config';
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  timestamp: string;
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

export interface SettingsModalData {
  currentSettings: AppSettings;
}

export interface GitVariablesModalData {
  // No data needed, just opens the modal
}

export interface DeleteEnvironmentModalData {
  environment: Environment;
}

export interface FavoriteNoteModalData {
  projectName: string;
  currentNote: string;
}

// Store slices types
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
  setProjects: (projects: Project[]) => void;
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setShowOnlyFavorites: (show: boolean) => void;
  setIsLoading: (loading: boolean) => void;
}

export interface FavoritesSlice {
  favorites: Record<string, Favorite>;
  toggleFavorite: (projectName: string) => void;
  updateFavoriteNote: (projectName: string, note: string) => void;
  isFavorite: (projectName: string) => boolean;
  getFavoriteNote: (projectName: string) => string;
}

export interface UISlice {
  toasts: ToastMessage[];
  environmentModal: ModalState & { data?: EnvironmentModalData };
  gitConfigModal: ModalState & { data?: GitConfigModalData };
  cloneModal: ModalState & { data?: CloneModalData };
  favoriteNoteModal: ModalState & { data?: FavoriteNoteModalData };
  gitPullModal: ModalState & { data?: GitPullModalData };
  settingsModal: ModalState & { data?: SettingsModalData };
  gitVariablesModal: ModalState & { data?: GitVariablesModalData };
  deleteEnvironmentModal: ModalState & { data?: DeleteEnvironmentModalData };
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
  openGitVariablesModal: () => void;
  closeGitVariablesModal: () => void;
  openDeleteEnvironmentModal: (data: DeleteEnvironmentModalData) => void;
  closeDeleteEnvironmentModal: () => void;
}

export type AppStore = EnvironmentsSlice & ProjectsSlice & FavoritesSlice & UISlice & {
  config: AppConfig | null;
  isInitialized: boolean;
  initialize: () => Promise<void>;
  saveConfig: () => Promise<void>;
  scanCurrentEnvironment: () => Promise<void>;
};
