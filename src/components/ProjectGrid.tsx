import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Star, Folder, Download,
  Loader2, Filter, Eye, EyeOff, GitBranch, RefreshCw
} from 'lucide-react';
import { useStore, useFilteredProjects, useActiveEnvironment } from '../store/useStore';
import { ProjectCardCompact } from './ProjectCardCompact';
import { ProjectCardSkeleton } from './ProjectCardSkeleton';
import { AdvancedFiltersPanel } from './AdvancedFiltersPanel';
import { PullResultsModal, type PullResult } from './PullResultsModal';
import { cn } from '../utils/helpers';
import { pullAllProjects as pullAllProjectsApi } from '../utils/tauri';
import { batchGitFetch } from '../utils/tauriAdvanced';
import { useDebounce } from '../hooks/useDebounce';

// Number of items to render per batch
const ITEMS_PER_BATCH = 20;

export function ProjectGrid() {
  const {
    searchQuery,
    setSearchQuery,
    showOnlyFavorites,
    setShowOnlyFavorites,
    isLoading,
    scanCurrentEnvironment,
    addToast,
    hiddenProjects,
    showHiddenProjects,
    setShowHiddenProjects,
    projects,
  } = useStore();

  const filteredProjects = useFilteredProjects();
  const activeEnvironment = useActiveEnvironment();

  // Count hidden projects from the full project list
  const hiddenCount = projects.filter(p => !!hiddenProjects[p.name]).length;

  // Local state for immediate input feedback
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const debouncedSearchQuery = useDebounce(localSearchQuery, 200);

  // Sync debounced value to store
  useEffect(() => {
    setSearchQuery(debouncedSearchQuery);
  }, [debouncedSearchQuery, setSearchQuery]);

  // Sync store to local when it changes externally
  useEffect(() => {
    if (searchQuery !== localSearchQuery && searchQuery !== debouncedSearchQuery) {
      setLocalSearchQuery(searchQuery);
    }
  }, [searchQuery]);

  const [isPullingAll, setIsPullingAll] = useState(false);
  const [isFetchingAll, setIsFetchingAll] = useState(false);
  const [pullResults, setPullResults] = useState<PullResult[]>([]);
  const [showPullResults, setShowPullResults] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const filtersButtonRef = useRef<HTMLButtonElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Infinite scroll state - only render visible items for performance
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_BATCH);

  // Reset visible count when filtered projects change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_BATCH);
  }, [filteredProjects.length, debouncedSearchQuery]);

  // Handle scroll to load more items
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // Load more when user scrolls near bottom (100px threshold)
    if (scrollHeight - scrollTop - clientHeight < 100) {
      setVisibleCount(prev => Math.min(prev + ITEMS_PER_BATCH, filteredProjects.length));
    }
  }, [filteredProjects.length]);

  // Projects to actually render (limited for performance)
  const visibleProjects = filteredProjects.slice(0, visibleCount);

  // Pull all projects
  const handlePullAll = async () => {
    if (!activeEnvironment || isPullingAll) return;

    setIsPullingAll(true);
    setPullResults([]);
    setShowPullResults(true);

    try {
      const startTime = Date.now();
      const apiResults = await pullAllProjectsApi(activeEnvironment.basePath);

      // Convert API results to modal format
      const results: PullResult[] = apiResults.map(r => ({
        projectName: r.project_name,
        projectPath: r.project_name,
        success: r.success,
        message: r.success ? 'Pull completado correctamente' : 'Error en el pull',
        details: r.success ? undefined : r.message,
        duration: Date.now() - startTime,
      }));

      setPullResults(results);

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      addToast({
        type: failCount > 0 ? 'warning' : 'success',
        title: 'Pull completado',
        message: `${successCount} exitosos, ${failCount} fallidos`,
      });

      // Rescan to refresh status
      await scanCurrentEnvironment(true);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo hacer pull de los proyectos',
      });
      setShowPullResults(false);
    } finally {
      setIsPullingAll(false);
    }
  };

  // Fetch all projects (only updates remote refs, doesn't modify local)
  const handleFetchAll = async () => {
    if (!activeEnvironment || isFetchingAll) return;

    setIsFetchingAll(true);
    try {
      const projectPaths = projects.filter(p => p.hasGit).map(p => p.path);
      if (projectPaths.length === 0) {
        addToast({ type: 'warning', title: 'Sin proyectos', message: 'No hay proyectos Git para sincronizar' });
        return;
      }

      const apiResults = await batchGitFetch(projectPaths);
      const success = apiResults.filter(([, result]) => 'Ok' in result).length;
      const failed = apiResults.filter(([, result]) => 'Err' in result).length;

      addToast({
        type: failed > 0 ? 'warning' : 'success',
        title: 'Fetch completado',
        message: `${success} exitosos${failed > 0 ? `, ${failed} fallidos` : ''}`,
      });

      // Rescan to refresh status indicators
      await scanCurrentEnvironment(true);
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'No se pudo hacer fetch de los proyectos' });
    } finally {
      setIsFetchingAll(false);
    }
  };

  // No environment selected
  if (!activeEnvironment) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
            style={{
              background: 'linear-gradient(135deg, var(--primary-subtle), var(--primary-muted))',
              border: '1px solid var(--border)'
            }}
          >
            <Folder className="w-10 h-10" style={{ color: 'var(--primary)' }} />
          </div>
          <h2 className="text-2xl font-bold text-theme-primary mb-3">
            Selecciona un Entorno
          </h2>
          <p className="mb-6 text-theme-secondary">
            Crea o selecciona un entorno desde el panel lateral para ver tus proyectos
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header / Filters - with blue gradient */}
      <div
        className="p-4 relative overflow-hidden border-b border-[var(--border)]"
        style={{
          background: 'linear-gradient(135deg, var(--primary-subtle) 0%, transparent 70%)'
        }}
      >
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div>
            <h2 className="text-lg font-bold text-theme-primary">{activeEnvironment.name}</h2>
            <p className="text-xs truncate max-w-md text-theme-secondary">{activeEnvironment.basePath}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Fetch All Button */}
            <button
              onClick={handleFetchAll}
              disabled={isFetchingAll || isPullingAll || isLoading}
              className="btn-secondary flex items-center gap-2"
              title="Consulta cambios remotos sin modificar tu rama local. Limpia ramas eliminadas en remoto (--prune)"
            >
              {isFetchingAll ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <GitBranch className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Fetch All</span>
            </button>

            {/* Pull All Button */}
            <button
              onClick={handlePullAll}
              disabled={isPullingAll || isFetchingAll || isLoading}
              className="btn-primary flex items-center gap-2"
              title="Descarga y aplica los cambios remotos en todos los proyectos (fetch --prune + pull)"
            >
              {isPullingAll ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Pull All</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-secondary" />
            <input
              id="search-input"
              type="text"
              placeholder="Buscar proyectos..."
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className="input-base pl-10 text-sm"
            />
          </div>

          {/* Favorites Filter */}
          <button
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
            className={cn(
              'px-3 py-2 rounded-2xl text-sm flex items-center gap-2 transition-all border',
              showOnlyFavorites
                ? 'bg-amber-500/25 border-amber-500/40 text-amber-600 dark:text-amber-400'
                : 'bg-[var(--surface)] border-[var(--border)] text-theme-secondary hover:text-theme-primary'
            )}
          >
            <Star className={cn('w-4 h-4', showOnlyFavorites && 'fill-current')} />
            <span className="hidden sm:inline">Favoritos</span>
          </button>

          {/* Advanced Filters Button */}
          <div className="relative">
            <button
              ref={filtersButtonRef}
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'px-3 py-2 rounded-2xl text-sm flex items-center gap-2 transition-all border',
                showFilters
                  ? 'bg-[var(--primary-subtle)] border-[var(--primary-muted)] text-[var(--primary)]'
                  : 'bg-[var(--surface)] border-[var(--border)] text-theme-secondary hover:text-theme-primary'
              )}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filtros</span>
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel - Rendered outside via portal */}
      <AdvancedFiltersPanel
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        buttonRef={filtersButtonRef}
      />

      {/* Pull Results Modal */}
      <PullResultsModal
        isOpen={showPullResults}
        onClose={() => setShowPullResults(false)}
        results={pullResults}
        title="Resultados del Pull"
        isProcessing={isPullingAll}
      />

      {/* Projects Content */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4"
      >
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ProjectCardSkeleton count={6} />
            </motion.div>
          ) : filteredProjects.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center h-full"
            >
              <div className="text-center max-w-md">
                <Search className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--primary)' }} />
                <h3 className="text-base font-semibold text-theme-primary mb-2">
                  {searchQuery ? 'Sin resultados' : 'No hay proyectos'}
                </h3>
                <p className="text-sm text-theme-secondary">
                  {searchQuery
                    ? `No se encontraron proyectos que coincidan con "${searchQuery}"`
                    : 'Este entorno no tiene proyectos. Usa Clone para añadir uno.'}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="project-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-2"
            >
              {visibleProjects.map((project) => (
                <ProjectCardCompact
                  key={project.path}
                  project={project}
                />
              ))}
              {/* Load more indicator */}
              {visibleCount < filteredProjects.length && (
                <div className="py-2 text-center">
                  <span className="text-xs" style={{ color: 'var(--primary)' }}>
                    Mostrando {visibleCount} de {filteredProjects.length} proyectos
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats Bar */}
      {(filteredProjects.length > 0 || hiddenCount > 0) && (
        <div
          className="px-4 py-2 border-t border-[var(--border)] flex items-center justify-between"
          style={{
            background: 'linear-gradient(135deg, var(--primary-subtle) 0%, transparent 50%)'
          }}
        >
          <p className="text-xs text-theme-secondary">
            {filteredProjects.length} proyecto{filteredProjects.length !== 1 ? 's' : ''}
            {showOnlyFavorites && ' favorito'}
            {showOnlyFavorites && filteredProjects.length !== 1 && 's'}
          </p>
          {hiddenCount > 0 && (
            <button
              onClick={() => setShowHiddenProjects(!showHiddenProjects)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all',
                showHiddenProjects
                  ? 'text-[var(--primary)] bg-[var(--primary-subtle)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--hover-overlay)]'
              )}
            >
              {showHiddenProjects ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{hiddenCount} oculto{hiddenCount !== 1 ? 's' : ''}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
