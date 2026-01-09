import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Star, RefreshCw, Folder, Download,
  CheckCircle, XCircle, Loader2, Settings
} from 'lucide-react';
import { useStore, useFilteredProjects, useActiveEnvironment } from '../store/useStore';
import { ProjectCardCompact } from './ProjectCardCompact';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../utils/helpers';
import { pullAllProjects, type PullResult } from '../utils/tauri';

export function ProjectGrid() {
  const {
    searchQuery,
    setSearchQuery,
    showOnlyFavorites,
    setShowOnlyFavorites,
    isLoading,
    scanCurrentEnvironment,
    openSettingsModal,
    addToast
  } = useStore();

  const filteredProjects = useFilteredProjects();
  const activeEnvironment = useActiveEnvironment();
  const { colors } = useTheme();

  const [isPullingAll, setIsPullingAll] = useState(false);
  const [pullResults, setPullResults] = useState<PullResult[] | null>(null);
  const [showPullResults, setShowPullResults] = useState(false);

  // Pull all projects
  const handlePullAll = async () => {
    if (!activeEnvironment || isPullingAll) return;

    setIsPullingAll(true);
    setPullResults(null);

    try {
      const results = await pullAllProjects(activeEnvironment.basePath);
      setPullResults(results);
      setShowPullResults(true);

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      addToast({
        type: failCount > 0 ? 'warning' : 'success',
        title: 'Pull completado',
        message: `${successCount} exitosos, ${failCount} fallidos`,
      });

      // Rescan to refresh status
      await scanCurrentEnvironment();
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo hacer pull de los proyectos',
      });
    } finally {
      setIsPullingAll(false);
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
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: `${colors.primary}20` }}
          >
            <Folder className="w-10 h-10" style={{ color: colors.primary }} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            Selecciona un Entorno
          </h2>
          <p className="text-gray-400 mb-6">
            Crea o selecciona un entorno desde el panel lateral para ver tus proyectos
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header / Filters */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-white">{activeEnvironment.name}</h2>
            <p className="text-xs text-gray-500 truncate max-w-md">{activeEnvironment.basePath}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Pull All Button */}
            <button
              onClick={handlePullAll}
              disabled={isPullingAll || isLoading}
              className="btn-secondary flex items-center gap-2"
              title="Pull de todos los proyectos"
            >
              {isPullingAll ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Pull All</span>
            </button>

            {/* Rescan Button */}
            <button
              onClick={scanCurrentEnvironment}
              disabled={isLoading || isPullingAll}
              className="btn-secondary flex items-center gap-2"
              title="Rescanear proyectos"
            >
              <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
              <span className="hidden sm:inline">Rescanear</span>
            </button>

            {/* Settings Button */}
            <button
              onClick={openSettingsModal}
              className="btn-secondary"
              title="Configuración"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar proyectos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 bg-dark-800/60 border border-white/10 rounded-lg
                         text-sm text-gray-100 placeholder:text-gray-500
                         focus:outline-none focus:border-white/20 transition-all"
            />
          </div>

          {/* Favorites Filter */}
          <button
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
            className={cn(
              'px-3 py-2 rounded-lg border text-sm flex items-center gap-2 transition-all',
              showOnlyFavorites
                ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400'
                : 'bg-dark-800/60 border-white/10 text-gray-400 hover:text-white'
            )}
          >
            <Star className={cn('w-4 h-4', showOnlyFavorites && 'fill-current')} />
            <span className="hidden sm:inline">Favoritos</span>
          </button>
        </div>
      </div>

      {/* Pull Results Modal */}
      <AnimatePresence>
        {showPullResults && pullResults && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-white/5 bg-dark-900/50"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-white">Resultados del Pull</h3>
                <button
                  onClick={() => setShowPullResults(false)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Cerrar
                </button>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {pullResults.map((result, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'flex items-center gap-2 text-xs px-2 py-1.5 rounded',
                      result.success ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                    )}
                  >
                    {result.success ? (
                      <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    )}
                    <span className="font-medium">{result.project_name}</span>
                    <span className="text-gray-500 truncate">{result.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Projects Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: colors.primary }} />
              <p className="text-gray-400 text-sm">Escaneando proyectos...</p>
            </div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center h-full"
          >
            <div className="text-center max-w-md">
              <Search className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white mb-2">
                {searchQuery ? 'Sin resultados' : 'No hay proyectos'}
              </h3>
              <p className="text-sm text-gray-500">
                {searchQuery
                  ? `No se encontraron proyectos que coincidan con "${searchQuery}"`
                  : 'Este entorno no tiene proyectos. Usa Clone para añadir uno.'}
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div layout className="flex flex-col gap-2">
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project, index) => (
                <ProjectCardCompact
                  key={project.path}
                  project={project}
                  index={index}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Stats Bar */}
      {filteredProjects.length > 0 && (
        <div className="px-4 py-2 border-t border-white/5 bg-dark-900/30">
          <p className="text-xs text-gray-500">
            {filteredProjects.length} proyecto{filteredProjects.length !== 1 ? 's' : ''}
            {showOnlyFavorites && ' favorito'}
            {showOnlyFavorites && filteredProjects.length !== 1 && 's'}
          </p>
        </div>
      )}
    </div>
  );
}
