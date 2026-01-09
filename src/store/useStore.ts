import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  AppStore,
  Project,
  ToastMessage,
  AppConfig
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

      // Favorites
      favorites: {},

      // UI State
      toasts: [],
      environmentModal: { isOpen: false },
      gitConfigModal: { isOpen: false },
      cloneModal: { isOpen: false },
      favoriteNoteModal: { isOpen: false },
      gitPullModal: { isOpen: false },
      settingsModal: { isOpen: false },
      gitVariablesModal: { isOpen: false },
      deleteEnvironmentModal: { isOpen: false },

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
        const { environments, favorites, config, projects, activeEnvironmentId } = get();
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
      scanCurrentEnvironment: async () => {
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

          get().addToast({
            type: 'success',
            title: 'Escaneo completado',
            message: `Se encontraron ${projects.length} proyectos`,
          });
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
        }));
        get().saveConfig();
        get().addToast({
          type: 'success',
          title: 'Entorno creado',
          message: `${envData.name} añadido correctamente`,
        });
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

        // Remove from cache
        const projectsCache = { ...config?.projectsCache };
        if (projectsCache[id]) {
          delete projectsCache[id];
        }

        set((state) => ({
          environments: state.environments.filter((e) => e.id !== id),
          activeEnvironmentId: activeEnvironmentId === id ? null : activeEnvironmentId,
          projects: activeEnvironmentId === id ? [] : state.projects,
          config: state.config ? { ...state.config, projectsCache } : state.config,
        }));

        get().saveConfig();
        get().addToast({
          type: 'success',
          title: 'Entorno eliminado',
          message: env ? `${env.name} eliminado correctamente` : 'Entorno eliminado',
        });
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

      updateFavoriteNote: (projectName, note) => {
        set((state) => {
          if (!state.favorites[projectName]) return state;

          return {
            favorites: {
              ...state.favorites,
              [projectName]: {
                ...state.favorites[projectName],
                note,
              },
            },
          };
        });
        get().saveConfig();
      },

      isFavorite: (projectName) => {
        return !!get().favorites[projectName];
      },

      getFavoriteNote: (projectName) => {
        return get().favorites[projectName]?.note || '';
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

      openGitVariablesModal: () => {
        set({ gitVariablesModal: { isOpen: true } });
      },
      closeGitVariablesModal: () => {
        set({ gitVariablesModal: { isOpen: false } });
      },

      openDeleteEnvironmentModal: (data) => {
        set({ deleteEnvironmentModal: { isOpen: true, data } });
      },
      closeDeleteEnvironmentModal: () => {
        set({ deleteEnvironmentModal: { isOpen: false } });
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

// Filtered projects selector
export const useFilteredProjects = () => {
  const projects = useStore((state) => state.projects);
  const searchQuery = useStore((state) => state.searchQuery);
  const showOnlyFavorites = useStore((state) => state.showOnlyFavorites);
  const favorites = useStore((state) => state.favorites);

  return projects
    .filter((project) => {
      // Filter by favorites
      if (showOnlyFavorites && !favorites[project.name]) {
        return false;
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          project.name.toLowerCase().includes(query) ||
          project.gitUrl?.toLowerCase().includes(query)
        );
      }

      return true;
    })
    .sort((a, b) => {
      // Sort favorites first
      const aFav = favorites[a.name];
      const bFav = favorites[b.name];

      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      if (aFav && bFav) return aFav.order - bFav.order;

      return a.name.localeCompare(b.name);
    });
};
