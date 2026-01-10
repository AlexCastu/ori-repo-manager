import { motion } from 'framer-motion';
import {
  Plus,
  Folder,
  Settings,
  RefreshCw,
  Edit3,
  ChevronRight,
  GitBranch,
  FolderOpen,
  GitPullRequest,
  Code,
  Server,
  Database,
  Cloud,
  Globe,
  Rocket,
  Star,
  Zap,
  Box,
  Layers,
  Settings2
} from 'lucide-react';
import { useStore, useEnvironments, useActiveEnvironment } from '../store/useStore';
import { cn } from '../utils/helpers';
import { openInExplorer } from '../utils/tauri';
import { environmentColors, defaultEnvironmentColor, defaultEnvironmentIcon } from '../utils/colors';
import type { EnvironmentIcon } from '../types';

// Map icon names to components
const iconComponents: Record<EnvironmentIcon, React.ComponentType<{ className?: string }>> = {
  'folder': Folder,
  'code': Code,
  'server': Server,
  'database': Database,
  'cloud': Cloud,
  'globe': Globe,
  'rocket': Rocket,
  'star': Star,
  'zap': Zap,
  'box': Box,
  'layers': Layers,
  'git-branch': GitBranch,
};

export function Sidebar() {
  const environments = useEnvironments();
  const activeEnvironment = useActiveEnvironment();
  const {
    setActiveEnvironment,
    openEnvironmentModal,
    openCloneModal,
    openSettingsModal,
    openGitVariablesModal,
    scanCurrentEnvironment,
    isLoading,
    addToast
  } = useStore();

  const handleOpenFolder = async (basePath: string) => {
    try {
      await openInExplorer(basePath);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo abrir la carpeta',
      });
    }
  };

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-72 h-full glass-sidebar flex flex-col overflow-hidden"
    >
      {/* Header / Logo */}
      <div className="p-6 border-b" style={{ borderColor: 'rgba(99, 163, 255, 0.15)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
               style={{
                 background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
                 boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
               }}>
            <GitBranch className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">ORI-RepoManager</h1>
            <p className="text-xs" style={{ color: '#D1D5DB' }}>v2.0 • Alex C.C.</p>
          </div>
        </div>
      </div>

      {/* New Environment Button */}
      <div className="p-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => openEnvironmentModal({ mode: 'create' })}
          className="w-full btn-primary flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Entorno</span>
        </motion.button>
      </div>

      {/* Environments List */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <div className="text-xs font-medium uppercase tracking-wider px-3 mb-2"
             style={{ color: '#D1D5DB' }}>
          Entornos
        </div>

        {environments.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <Folder className="w-10 h-10 mx-auto mb-3" style={{ color: '#3B82F6' }} />
            <p className="text-sm text-white">
              No hay entornos configurados
            </p>
            <p className="text-xs mt-1" style={{ color: '#D1D5DB' }}>
              Crea uno para empezar
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {environments.map((env, index) => (
              <motion.div
                key={env.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <button
                  onClick={() => setActiveEnvironment(env.id)}
                  className={cn(
                    'w-full group',
                    activeEnvironment?.id === env.id
                      ? 'sidebar-item-active'
                      : 'sidebar-item'
                  )}
                >
                  {(() => {
                    const iconName = env.icon || defaultEnvironmentIcon;
                    const colorName = env.color || defaultEnvironmentColor;
                    const IconComponent = iconComponents[iconName];
                    const colorData = environmentColors[colorName];
                    const isActive = activeEnvironment?.id === env.id;
                    const isGradient = colorData.gradient.startsWith('linear-gradient');

                    return (
                      <div
                        className={cn(
                          'w-7 h-7 rounded-xl flex items-center justify-center transition-all',
                          isActive ? '' : 'bg-white/10'
                        )}
                        style={
                          isActive
                            ? isGradient
                              ? { background: colorData.gradient }
                              : { backgroundColor: colorData.primary }
                            : undefined
                        }
                      >
                        <IconComponent className="w-4 h-4 text-white" />
                      </div>
                    );
                  })()}
                  <span className="flex-1 text-left truncate">{env.name}</span>
                  <ChevronRight className={cn(
                    'w-4 h-4 transition-all',
                    activeEnvironment?.id === env.id
                      ? 'rotate-90 text-white'
                      : 'opacity-0 group-hover:opacity-100'
                  )} style={{ color: activeEnvironment?.id !== env.id ? '#D1D5DB' : undefined }} />
                </button>

                {/* Environment Actions - show on active */}
                {activeEnvironment?.id === env.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="ml-8 mt-1 space-y-1"
                  >
                    {/* Action Buttons Row */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          scanCurrentEnvironment();
                        }}
                        disabled={isLoading}
                        className="btn-icon"
                        title="Rescanear proyectos"
                      >
                        <RefreshCw className={cn(
                          'w-4 h-4',
                          isLoading && 'animate-spin'
                        )} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEnvironmentModal({ mode: 'edit', environment: env });
                        }}
                        className="btn-icon"
                        title="Editar entorno"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenFolder(env.basePath);
                        }}
                        className="btn-icon"
                        title="Abrir carpeta del entorno"
                      >
                        <FolderOpen className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Clone Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openCloneModal({
                          environmentId: env.id,
                          gitServer: env.gitServer,
                          basePath: env.basePath,
                        });
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-lg transition-colors"
                      style={{
                        color: '#10B981',
                        backgroundColor: 'transparent'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.15)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <GitPullRequest className="w-3.5 h-3.5" />
                      <span>Clonar Repositorio</span>
                    </button>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer / Settings */}
      <div className="p-4 space-y-1" style={{ borderTop: '1px solid rgba(99, 163, 255, 0.15)' }}>
        <button
          onClick={() => openGitVariablesModal()}
          className="sidebar-item w-full"
        >
          <Settings2 className="w-5 h-5" />
          <span>Variables Git</span>
        </button>
        <button
          onClick={() => openSettingsModal()}
          className="sidebar-item w-full"
        >
          <Settings className="w-5 h-5" />
          <span>Configuración</span>
        </button>
      </div>
    </motion.aside>
  );
}
