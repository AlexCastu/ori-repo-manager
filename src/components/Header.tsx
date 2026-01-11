import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  RefreshCw,
  Download,
  Zap,
  X,
  Tag,
  History
} from 'lucide-react';
import { useStore, useActiveEnvironment } from '../store/useStore';
import { cn } from '../utils/helpers';
import { Logo } from './Logo';

export function Header() {
  const {
    searchQuery,
    setSearchQuery,
    scanCurrentEnvironment,
    pullAllProjects,
    fetchAllProjects,
    isLoading,
    openTagManagerModal,
    openGitOperationsLogModal
  } = useStore();
  const activeEnvironment = useActiveEnvironment();
  const [isFocused, setIsFocused] = useState(false);

  const handlePullAll = async () => {
    if (!activeEnvironment || isLoading) return;
    await pullAllProjects();
  };

  const handleFetchAll = async () => {
    if (!activeEnvironment || isLoading) return;
    await fetchAllProjects();
  };

  const handleRefresh = () => {
    if (isLoading) return;
    scanCurrentEnvironment();
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <header className="flex items-center justify-between px-6 gap-6 titlebar-drag app-header"
            style={{
              height: '70px',
              paddingTop: '14px',
            }}>
      {/* Logo */}
      <motion.div
        className="titlebar-no-drag flex-shrink-0"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Logo size={42} className="drop-shadow-lg" />
      </motion.div>

      {/* Left: Search Bar */}
      <div className="flex-1 max-w-2xl titlebar-no-drag">
        <motion.div
          animate={{
            scale: isFocused ? 1.02 : 1,
          }}
          className="relative"
        >
          <div className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors",
            isFocused ? "text-blue-400" : "text-blue-500/50"
          )}>
            <Search className={cn(
              "w-4 h-4 transition-transform",
              isFocused && "scale-110"
            )} />
          </div>

          <input
            type="text"
            id="search-input"
            placeholder="Buscar proyectos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="input-glass pl-11 pr-11"
          />

          <AnimatePresence>
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500/50
                           hover:text-theme-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Glow effect when focused */}
          {isFocused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 -z-10 rounded-2xl blur-xl
                         bg-blue-500/15"
            />
          )}
        </motion.div>
      </div>

      {/* Right: Action Buttons */}
      <div className="flex items-center gap-2 titlebar-no-drag">
        {/* Refresh Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRefresh}
          disabled={isLoading}
          className="btn-glass px-4 py-2.5 flex items-center gap-2"
          title="Actualizar proyectos"
        >
          <RefreshCw className={cn(
            "w-4 h-4",
            isLoading && "animate-spin"
          )} />
          <span className="text-sm font-medium">Actualizar</span>
        </motion.button>

        {/* Pull All Button */}
        {activeEnvironment && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePullAll}
            disabled={isLoading}
            className="btn-primary px-4 py-2.5 flex items-center gap-2 group"
            title="Pull en todos los proyectos"
          >
            <Download className={cn(
              "w-4 h-4 transition-transform",
              "group-hover:animate-bounce"
            )} />
            <span className="text-sm font-semibold">Pull & Fetch All</span>
            <Zap className="w-3 h-3 opacity-70" />
          </motion.button>
        )}

        {/* Sync All Button (fetch all repos from all environments) */}
        {activeEnvironment && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleFetchAll}
            disabled={isLoading}
            className="btn-glass px-4 py-2.5 flex items-center gap-2"
            title="Sincronizar todos los repositorios de todos los entornos"
          >
            <RefreshCw className={cn(
              "w-4 h-4",
              isLoading && "animate-spin"
            )} />
            <span className="text-sm font-medium">Sync All</span>
          </motion.button>
        )}

        {/* Divider */}
        <div className="w-px h-6 bg-blue-500/20" />

        {/* Tags Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={openTagManagerModal}
          className="btn-glass p-2.5"
          title="Gestión de Etiquetas"
        >
          <Tag className="w-4 h-4" />
        </motion.button>

        {/* Git Operations Log Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={openGitOperationsLogModal}
          className="btn-glass p-2.5"
          title="Historial de Operaciones"
        >
          <History className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Environment Badge */}
      {activeEnvironment && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute left-1/2 -translate-x-1/2 bottom-2 titlebar-no-drag"
        >
          <div className="px-4 py-1.5 bg-blue-900/40 backdrop-blur-md rounded-full
                          border border-blue-500/20 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs font-medium text-blue-200">
              {activeEnvironment.name}
            </span>
          </div>
        </motion.div>
      )}
    </header>
  );
}
