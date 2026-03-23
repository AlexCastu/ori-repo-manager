import { useMemo } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';
import type {
  AppStore,
  Project,
  ToastMessage,
  AppConfig,
  ProjectTag,
  GitOperation
} from '../types';
import {
  loadConfig,
  saveConfig as saveConfigToFile,
  scanProjects,
  getDefaultConfig,
  generateId,
  createEnvironment as createEnv
} from '../utils/tauri';

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      config: null,
      isInitialized: false,

      // Environments
      environments: [],
      activeEnvironmentId: null,

      // Projects
      projects: [],
      isLoading: false,
      searchQuery: '',
      viewMode: 'grid',
      showOnlyFavorites: false,
      selectedProjects: new Set<string>(),
      refreshTrigger: 0, // Counter to trigger git status refresh in cards
      filters: {
        searchQuery: '',
        showOnlyFavorites: false,
        gitStatus: 'all',
        platforms: [],
        branches: [],
        tags: [],
        hasUncommitted: null,
        sortBy: 'name',
      },

      // Tags
      tags: {},
      projectTags: {},

      // Centralized Git Statuses
      gitStatuses: {},

      // Git Operations History
      gitOperations: [],

      // Auto Sync
      autoSyncConfig: {
        enabled: false,
        intervalMinutes: 5,
        notifyOnUpdates: true,
        autoFetchOnStart: false,
        environments: [],
      },

      // Favorites
      favorites: {},

      // Project Notes (independiente de favoritos)
      projectNotes: {},

      // Hidden Projects
      hiddenProjects: {},
      showHiddenProjects: false,

      toggleHideProject: (projectName) => {
        const { hiddenProjects } = get();
        const updated = { ...hiddenProjects };
        if (updated[projectName]) {
          delete updated[projectName];
        } else {
          updated[projectName] = new Date().toISOString();
        }
        set({ hiddenProjects: updated });
        get().saveConfig();
      },

      setShowHiddenProjects: (show) => {
        set({ showHiddenProjects: show });
      },

      // UI State
      toasts: [],
      environmentModal: { isOpen: false },
      gitConfigModal: { isOpen: false },
      cloneModal: { isOpen: false },
      favoriteNoteModal: { isOpen: false },
      gitPullModal: { isOpen: false },
      settingsModal: { isOpen: false },
      deleteEnvironmentModal: { isOpen: false },
      tagManagerModal: { isOpen: false },
      gitOperationsLogModal: { isOpen: false },

      // Initialize app
      initialize: async () => {
        try {
          let config: AppConfig;
          try {
            config = await loadConfig();
          } catch {
            // Config doesn't exist, create default
            config = getDefaultConfig();
            await saveConfigToFile(config);
          }

          set({
            config,
            environments: config.environments,
            favorites: config.favorites,
            projectNotes: config.projectNotes || {},
            hiddenProjects: config.hiddenProjects || {},
            tags: config.tags || {},
            projectTags: config.projectTags || {},
            isInitialized: true,
          });

          // Auto-load projects if there's an active environment
          if (config.environments.length > 0) {
            const firstEnv = config.environments[0];
            set({ activeEnvironmentId: firstEnv.id });

            // Load cached projects or scan
            const cachedProjects = config.projectsCache[firstEnv.id];
            if (cachedProjects) {
              set({ projects: Object.values(cachedProjects) });
            } else if (config.settings.autoScanOnStart) {
              await get().scanCurrentEnvironment();
            }
          }
        } catch (error) {
          console.error('Failed to initialize:', error);
          get().addToast({
            type: 'error',
            title: 'Error de inicialización',
            message: 'No se pudo cargar la configuración',
          });
        }
      },

      // Save config
      saveConfig: async () => {
        const { environments, favorites, projectNotes, hiddenProjects, tags, projectTags, config, projects, activeEnvironmentId } = get();
        if (!config) return;

        // Update projects cache for active environment
        const projectsCache = { ...config.projectsCache };
        if (activeEnvironmentId && projects.length > 0) {
          projectsCache[activeEnvironmentId] = projects.reduce((acc, p) => {
            acc[p.name] = p;
            return acc;
          }, {} as Record<string, Project>);
        }

        const updatedConfig: AppConfig = {
          ...config,
          environments,
          favorites,
          projectNotes,
          hiddenProjects,
          tags,
          projectTags,
          projectsCache,
        };

        try {
          await saveConfigToFile(updatedConfig);
          set({ config: updatedConfig });
        } catch (error) {
          console.error('Failed to save config:', error);
          get().addToast({
            type: 'error',
            title: 'Error',
            message: 'No se pudo guardar la configuración',
          });
        }
      },

      // Scan current environment for projects
      scanCurrentEnvironment: async (silent: boolean = false) => {
        const { activeEnvironmentId, environments, config } = get();
        if (!activeEnvironmentId || !config) return;

        const env = environments.find(e => e.id === activeEnvironmentId);
        if (!env) return;

        set({ isLoading: true });

        try {
          const projects = await scanProjects(env.basePath);
          set({ projects });

          // Update cache
          const updatedCache = {
            ...config.projectsCache,
            [activeEnvironmentId]: projects.reduce((acc, p) => {
              acc[p.name] = p;
              return acc;
            }, {} as Record<string, Project>),
          };

          const updatedConfig = {
            ...config,
            projectsCache: updatedCache,
          };

          await saveConfigToFile(updatedConfig);
          set({ config: updatedConfig });

          // Only show toast if not silent
          if (!silent) {
            get().addToast({
              type: 'success',
              title: 'Escaneo completado',
              message: `Se encontraron ${projects.length} proyectos`,
            });
          }
        } catch (error) {
          console.error('Failed to scan projects:', error);
          get().addToast({
            type: 'error',
            title: 'Error de escaneo',
            message: 'No se pudieron escanear los proyectos',
          });
        } finally {
          set({ isLoading: false });
        }
      },

      // Pull all projects in current environment
      pullAllProjects: async () => {
        const { projects } = get();
        const gitProjects = projects.filter(p => p.hasGit);
        if (gitProjects.length === 0) {
          get().addToast({
            type: 'warning',
            title: 'Sin proyectos',
            message: 'No hay proyectos Git para actualizar',
          });
          return;
        }

        set({ isLoading: true });
        const startTime = Date.now();
        const results = { success: 0, failed: 0 };

        for (const project of gitProjects) {
          try {
            await invoke('git_pull', { projectPath: project.path });
            results.success++;
          } catch (error) {
            results.failed++;
            get().addGitOperation({
              type: 'pull',
              status: 'error',
              message: `Error en pull de ${project.name}`,
              projectName: project.name,
              details: String(error),
              duration: Date.now() - startTime,
            });
          }
        }

        set({ isLoading: false });

        if (results.success > 0) {
          get().addToast({
            type: 'success',
            title: 'Pull completado',
            message: `${results.success} proyectos actualizados${results.failed > 0 ? `, ${results.failed} fallaron` : ''}`,
          });
        } else {
          get().addToast({
            type: 'error',
            title: 'Error',
            message: `Todos los pulls fallaron (${results.failed})`,
          });
        }

        // Rescan after pull
        await get().scanCurrentEnvironment();
      },

      // Fetch all projects from ALL environments
      fetchAllProjects: async () => {
        const { config } = get();
        if (!config || config.environments.length === 0) {
          get().addToast({
            type: 'warning',
            title: 'Sin entornos',
            message: 'No hay entornos configurados',
          });
          return;
        }

        set({ isLoading: true });
        const startTime = Date.now();
        const results = { success: 0, failed: 0, total: 0 };

        // Iterate through all environments and their projects
        for (const environment of config.environments) {
          try {
            const envProjects = await invoke<Project[]>('scan_projects', {
              basePath: environment.basePath,
            });

            for (const project of envProjects) {
              if (!project.hasGit) continue;
              results.total++;

              try {
                await invoke('git_fetch', { projectPath: project.path });
                results.success++;
              } catch (error) {
                results.failed++;
                console.error(`Fetch failed for ${project.name}:`, error);
              }
            }
          } catch (error) {
            console.error(`Error scanning environment ${environment.name}:`, error);
          }
        }

        set({ isLoading: false });

        if (results.success > 0) {
          get().addToast({
            type: 'success',
            title: 'Sincronización completada',
            message: `${results.success} de ${results.total} repositorios actualizados${results.failed > 0 ? ` (${results.failed} fallaron)` : ''}`,
          });

          get().addGitOperation({
            type: 'fetch',
            status: 'success',
            message: `Fetch de ${results.success} repositorios en todos los entornos`,
            duration: Date.now() - startTime,
          });
        } else if (results.total > 0) {
          get().addToast({
            type: 'error',
            title: 'Error',
            message: `No se pudo actualizar ningún repositorio (${results.failed} fallaron)`,
          });
        } else {
          get().addToast({
            type: 'warning',
            title: 'Sin repositorios',
            message: 'No se encontraron repositorios Git en ningún entorno',
          });
        }

        // Rescan current environment to update status
        await get().scanCurrentEnvironment();
      },

      // Environment actions
      setActiveEnvironment: (id) => {
        set({ activeEnvironmentId: id, projects: [], searchQuery: '' });

        if (id) {
          const { config } = get();
          if (config?.projectsCache[id]) {
            set({ projects: Object.values(config.projectsCache[id]) });
          }
        }
      },

      addEnvironment: (envData) => {
        const newEnv = createEnv(
          envData.name,
          envData.basePath,
          envData.gitServer,
          envData.color,
          envData.icon
        );
        set((state) => ({
          environments: [...state.environments, newEnv],
          activeEnvironmentId: newEnv.id, // Set new environment as active
        }));
        get().saveConfig();
        get().addToast({
          type: 'success',
          title: 'Entorno creado',
          message: `${envData.name} añadido correctamente`,
        });
        // Auto-scan the new environment
        get().scanCurrentEnvironment();
      },

      updateEnvironment: (id, updates) => {
        set((state) => ({
          environments: state.environments.map((env) =>
            env.id === id
              ? { ...env, ...updates, updatedAt: new Date().toISOString() }
              : env
          ),
        }));
        get().saveConfig();
      },

      deleteEnvironment: (id) => {
        const { environments, activeEnvironmentId, config } = get();
        const env = environments.find(e => e.id === id);
        if (!env) return;

        // Remove from cache
        if (config) {
          const updatedCache = { ...config.projectsCache };
          delete updatedCache[id];

          const updatedConfig = {
            ...config,
            projectsCache: updatedCache,
          };

          set({ config: updatedConfig });
        }

        // Remove from environments
        set((state) => ({
          environments: state.environments.filter(e => e.id !== id),
          activeEnvironmentId: activeEnvironmentId === id ? null : activeEnvironmentId,
          projects: activeEnvironmentId === id ? [] : state.projects,
        }));

        get().saveConfig();

        get().addToast({
          type: 'success',
          title: 'Entorno eliminado',
          message: env.name,
        });
      },

      // Selection actions
      toggleProjectSelection: (projectPath) => {
        set((state) => {
          const newSelected = new Set(state.selectedProjects);
          if (newSelected.has(projectPath)) {
            newSelected.delete(projectPath);
          } else {
            newSelected.add(projectPath);
          }
          return { selectedProjects: newSelected };
        });
      },

      selectAllProjects: () => {
        set((state) => ({
          selectedProjects: new Set(state.projects.map(p => p.path))
        }));
      },

      deselectAllProjects: () => {
        set({ selectedProjects: new Set() });
      },

      // Filter actions
      setFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters }
        }));
      },

      resetFilters: () => {
        set({
          filters: {
            searchQuery: '',
            showOnlyFavorites: false,
            gitStatus: 'all',
            platforms: [],
            branches: [],
            tags: [],
            hasUncommitted: null,
            sortBy: 'name',
          }
        });
      },

      triggerRefresh: () => {
        set((state) => ({
          refreshTrigger: state.refreshTrigger + 1
        }));
      },

      // Tag actions
      addTag: (tagData) => {
        const id = generateId();
        const newTag: ProjectTag = {
          ...tagData,
          id,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          tags: { ...state.tags, [id]: newTag }
        }));
        get().saveConfig();
        return id;
      },

      deleteTag: (tagId) => {
        set((state) => {
          const newTags = { ...state.tags };
          delete newTags[tagId];

          // Remove tag from all projects
          const newProjectTags = { ...state.projectTags };
          Object.keys(newProjectTags).forEach(projectPath => {
            newProjectTags[projectPath] = newProjectTags[projectPath].filter(id => id !== tagId);
          });

          return { tags: newTags, projectTags: newProjectTags };
        });
        get().saveConfig();
      },

      addTagToProject: (projectPath, tagId) => {
        set((state) => {
          const currentTags = state.projectTags[projectPath] || [];
          if (currentTags.includes(tagId)) return state;

          return {
            projectTags: {
              ...state.projectTags,
              [projectPath]: [...currentTags, tagId]
            }
          };
        });
        get().saveConfig();
      },

      removeTagFromProject: (projectPath, tagId) => {
        set((state) => ({
          projectTags: {
            ...state.projectTags,
            [projectPath]: (state.projectTags[projectPath] || []).filter(id => id !== tagId)
          }
        }));
        get().saveConfig();
      },

      // Git Operations
      addGitOperation: (opData) => {
        const operation: GitOperation = {
          ...opData,
          id: generateId(),
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          gitOperations: [operation, ...state.gitOperations].slice(0, 100) // Keep last 100
        }));
      },

      // Centralized Git Status
      setProjectGitStatus: (projectPath, status) => {
        set((state) => ({
          gitStatuses: { ...state.gitStatuses, [projectPath]: status }
        }));
      },

      // Auto Sync
      updateAutoSyncConfig: (config) => {
        set((state) => ({
          autoSyncConfig: { ...state.autoSyncConfig, ...config }
        }));
        get().saveConfig();
      },

      // Project actions
      setProjects: (projects) => set({ projects }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setShowOnlyFavorites: (show) => set({ showOnlyFavorites: show }),
      setIsLoading: (loading) => set({ isLoading: loading }),

      // Favorite actions
      toggleFavorite: (projectName) => {
        set((state) => {
          const newFavorites = { ...state.favorites };

          if (newFavorites[projectName]) {
            delete newFavorites[projectName];
          } else {
            newFavorites[projectName] = {
              projectName,
              note: '',
              order: Object.keys(newFavorites).length,
              addedAt: new Date().toISOString(),
            };
          }

          return { favorites: newFavorites };
        });
        get().saveConfig();
      },

      isFavorite: (projectName) => {
        return !!get().favorites[projectName];
      },

      // Project Notes actions (independiente de favoritos)
      updateProjectNote: (projectName, note) => {
        set((state) => {
          const newNotes = { ...state.projectNotes };

          if (note.trim()) {
            newNotes[projectName] = note.trim();
          } else {
            // Si la nota está vacía, eliminarla
            delete newNotes[projectName];
          }

          return { projectNotes: newNotes };
        });
        get().saveConfig();
      },

      getProjectNote: (projectName) => {
        return get().projectNotes[projectName] || '';
      },

      hasProjectNote: (projectName) => {
        const note = get().projectNotes[projectName];
        return !!note && note.trim().length > 0;
      },

      // Toast actions
      addToast: (toast) => {
        const id = generateId();
        const newToast: ToastMessage = { ...toast, id };

        set((state) => ({
          toasts: [...state.toasts, newToast],
        }));

        // Auto-remove after duration
        const duration = toast.duration || 4000;
        setTimeout(() => {
          get().removeToast(id);
        }, duration);
      },

      removeToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      },

      // Modal actions
      openEnvironmentModal: (data) => {
        set({ environmentModal: { isOpen: true, data } });
      },
      closeEnvironmentModal: () => {
        set({ environmentModal: { isOpen: false } });
      },

      openGitConfigModal: (data) => {
        set({ gitConfigModal: { isOpen: true, data } });
      },
      closeGitConfigModal: () => {
        set({ gitConfigModal: { isOpen: false } });
      },

      openCloneModal: (data) => {
        set({ cloneModal: { isOpen: true, data } });
      },
      closeCloneModal: () => {
        set({ cloneModal: { isOpen: false } });
      },

      openFavoriteNoteModal: (data) => {
        set({ favoriteNoteModal: { isOpen: true, data } });
      },
      closeFavoriteNoteModal: () => {
        set({ favoriteNoteModal: { isOpen: false } });
      },

      openGitPullModal: (data) => {
        set({ gitPullModal: { isOpen: true, data } });
      },
      closeGitPullModal: () => {
        set({ gitPullModal: { isOpen: false } });
      },

      openSettingsModal: () => {
        set({ settingsModal: { isOpen: true } });
      },
      closeSettingsModal: () => {
        set({ settingsModal: { isOpen: false } });
      },

      openDeleteEnvironmentModal: (data) => {
        set({ deleteEnvironmentModal: { isOpen: true, data } });
      },
      closeDeleteEnvironmentModal: () => {
        set({ deleteEnvironmentModal: { isOpen: false } });
      },

      openTagManagerModal: () => {
        set({ tagManagerModal: { isOpen: true } });
      },
      closeTagManagerModal: () => {
        set({ tagManagerModal: { isOpen: false } });
      },

      openGitOperationsLogModal: () => {
        set({ gitOperationsLogModal: { isOpen: true } });
      },
      closeGitOperationsLogModal: () => {
        set({ gitOperationsLogModal: { isOpen: false } });
      },
    }),
    {
      name: 'ori-repo-manager-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        viewMode: state.viewMode,
        showOnlyFavorites: state.showOnlyFavorites,
      }),
    }
  )
);

// Selectors for optimized re-renders
export const useEnvironments = () => useStore((state) => state.environments);
export const useActiveEnvironment = () => {
  const environments = useStore((state) => state.environments);
  const activeId = useStore((state) => state.activeEnvironmentId);
  return environments.find((e) => e.id === activeId) || null;
};
export const useProjects = () => useStore((state) => state.projects);
export const useFavorites = () => useStore((state) => state.favorites);
export const useSearchQuery = () => useStore((state) => state.searchQuery);
export const useViewMode = () => useStore((state) => state.viewMode);
export const useIsLoading = () => useStore((state) => state.isLoading);
export const useToasts = () => useStore((state) => state.toasts);

// Filtered projects selector with memoization
export const useFilteredProjects = () => {
  const projects = useStore((state) => state.projects);
  const searchQuery = useStore((state) => state.searchQuery);
  const showOnlyFavorites = useStore((state) => state.showOnlyFavorites);
  const favorites = useStore((state) => state.favorites);
  const filters = useStore((state) => state.filters);
  const config = useStore((state) => state.config);
  const hiddenProjects = useStore((state) => state.hiddenProjects);
  const showHiddenProjects = useStore((state) => state.showHiddenProjects);
  const projectTags = useStore((state) => state.projectTags);
  const gitStatuses = useStore((state) => state.gitStatuses);

  // Get showFavoritesFirst from config settings (defaults to true)
  const showFavoritesFirst = config?.settings?.showFavoritesFirst ?? true;

  // Memoize the filtered and sorted result
  return useMemo(() => {
    return projects
      .filter((project) => {
        // Filter hidden projects when toggle is off
        if (!showHiddenProjects && hiddenProjects[project.name]) {
          return false;
        }

        // Filter by favorites
        if (showOnlyFavorites && !favorites[project.name]) {
          return false;
        }

        // Filter by search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchesSearch =
            project.name.toLowerCase().includes(query) ||
            project.gitUrl?.toLowerCase().includes(query);
          if (!matchesSearch) return false;
        }

        // Advanced filters
        // Platform filter
        if (filters.platforms.length > 0) {
          if (!filters.platforms.includes(project.platform || 'other')) {
            return false;
          }
        }

        // Tags filter
        if (filters.tags.length > 0) {
          const pTags = projectTags[project.path] || [];
          if (!filters.tags.some(tagId => pTags.includes(tagId))) {
            return false;
          }
        }

        const status = gitStatuses[project.path];

        // Git status filter
        if (filters.gitStatus !== 'all' && project.hasGit && status) {
          if (filters.gitStatus === 'with-changes' && !status.has_changes && status.ahead === 0 && status.behind === 0) return false;
          if (filters.gitStatus === 'up-to-date' && (status.has_changes || status.ahead > 0 || status.behind > 0)) return false;
          if (filters.gitStatus === 'ahead' && status.ahead === 0) return false;
          if (filters.gitStatus === 'behind' && status.behind === 0) return false;
        }

        // Branch filter
        if (filters.branches.length > 0 && project.hasGit) {
          if (!status || !filters.branches.includes(status.branch)) {
            return false;
          }
        }

        // Uncommitted changes filter
        if (filters.hasUncommitted === true) {
          if (!project.hasGit || !status || !status.has_changes) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Hidden projects always go to the bottom
        const aHidden = !!hiddenProjects[a.name];
        const bHidden = !!hiddenProjects[b.name];
        if (aHidden && !bHidden) return 1;
        if (!aHidden && bHidden) return -1;

        // Only sort favorites first if setting is enabled
        if (showFavoritesFirst) {
          const aFav = favorites[a.name];
          const bFav = favorites[b.name];

          if (aFav && !bFav) return -1;
          if (!aFav && bFav) return 1;
          if (aFav && bFav) return aFav.order - bFav.order;
        }

        // Sort by selected criteria
        if (filters.sortBy === 'status') {
          const aStatus = gitStatuses[a.path];
          const bStatus = gitStatuses[b.path];
          const aScore = (aStatus?.has_changes ? 3 : 0) + ((aStatus?.ahead ?? 0) > 0 ? 2 : 0) + ((aStatus?.behind ?? 0) > 0 ? 1 : 0);
          const bScore = (bStatus?.has_changes ? 3 : 0) + ((bStatus?.ahead ?? 0) > 0 ? 2 : 0) + ((bStatus?.behind ?? 0) > 0 ? 1 : 0);
          if (bScore !== aScore) return bScore - aScore;
        }

        if (filters.sortBy === 'branch') {
          const aBranch = gitStatuses[a.path]?.branch || '';
          const bBranch = gitStatuses[b.path]?.branch || '';
          const branchCmp = aBranch.localeCompare(bBranch);
          if (branchCmp !== 0) return branchCmp;
        }

        return a.name.localeCompare(b.name);
      });
  }, [projects, searchQuery, showOnlyFavorites, favorites, filters, showFavoritesFirst, hiddenProjects, showHiddenProjects, projectTags, gitStatuses]);
};
