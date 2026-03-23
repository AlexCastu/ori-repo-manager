import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Folder,
  RefreshCw,
  Edit3,
  ChevronRight,
  ChevronLeft,
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
  Settings,
  Tag as TagIcon
} from 'lucide-react';
import { useStore, useEnvironments, useActiveEnvironment } from '../store/useStore';
import { cn } from '../utils/helpers';
import { openInExplorer } from '../utils/tauri';
import { environmentColors, defaultEnvironmentColor, defaultEnvironmentIcon } from '../utils/colors';
import type { EnvironmentIcon } from '../types';

// Map icon names to components
const iconComponents: Record<EnvironmentIcon, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
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
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  const environments = useEnvironments();
  const activeEnvironment = useActiveEnvironment();
  const {
    setActiveEnvironment,
    openEnvironmentModal,
    openCloneModal,
    openSettingsModal,
    openTagManagerModal,
    scanCurrentEnvironment,
    triggerRefresh,
    isLoading,
    addToast
  } = useStore();

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

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

  const handleScanAndUpdate = async () => {
    if (isLoading) return;

    await scanCurrentEnvironment(true);

    const { projects } = useStore.getState();

    if (projects.length === 0) {
      addToast({
        type: 'warning',
        title: 'Sin proyectos',
        message: 'No se encontraron repositorios en este entorno',
      });
      return;
    }

    triggerRefresh();

    addToast({
      type: 'success',
      title: 'Actualización completada',
      message: `${projects.length} proyectos actualizados`,
    });
  };

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{
        x: 0,
        opacity: 1,
        width: isCollapsed ? '64px' : '288px'
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="h-full glass-sidebar flex flex-col relative overflow-hidden scrollbar-hide"
    >
      {/* Top controls: toggle + new environment button */}
      <div className={isCollapsed ? 'p-3 pt-6 pb-5' : 'p-4 pt-6 pb-5'}>
        <div className={isCollapsed ? 'flex flex-col items-center gap-3' : 'flex items-center gap-3'}>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-lg border border-[var(--glass-border-light)] bg-[var(--bg-elevated)]/95 backdrop-blur hover:translate-x-0.5 hover:shadow-xl"
            style={{ color: '#3B82F6' }}
            title={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openEnvironmentModal({ mode: 'create' })}
            className={`btn-primary flex items-center justify-center gap-2 ${isCollapsed ? 'p-2 h-10 w-10 rounded-xl' : 'w-full h-10'}`}
            title={isCollapsed ? 'Nuevo Entorno' : undefined}
          >
            <Plus className={isCollapsed ? "w-6 h-6" : "w-4 h-4"} />
            {!isCollapsed && <span>Nuevo Entorno</span>}
          </motion.button>
        </div>
      </div>

      {/* Environments List */}
      <div className="flex-1 overflow-y-auto py-2 scrollbar-hide" style={{ paddingLeft: isCollapsed ? '8px' : '12px', paddingRight: isCollapsed ? '8px' : '12px' }}>
        {!isCollapsed && (
          <div className="text-xs font-medium uppercase tracking-wider px-3 mb-2 text-theme-secondary">
            Entornos
          </div>
        )}

        {environments.length === 0 ? (
          !isCollapsed && (
            <div className="px-3 py-8 text-center">
              <Folder className="w-10 h-10 mx-auto mb-3" style={{ color: '#3B82F6' }} />
              <p className="text-sm text-theme-primary">
                No hay entornos configurados
              </p>
              <p className="text-xs mt-1 text-theme-secondary">
                Crea uno para empezar
              </p>
            </div>
          )
        ) : (
          <div className="space-y-1">
            {environments.map((env, index) => (
              <motion.div
                key={env.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative group"
              >
                <button
                  onClick={() => setActiveEnvironment(env.id)}
                  className={cn(
                    'w-full transition-all',
                    activeEnvironment?.id === env.id
                      ? 'sidebar-item-active'
                      : 'sidebar-item',
                    isCollapsed ? 'justify-center p-2' : ''
                  )}
                  title={isCollapsed ? `${env.name}${activeEnvironment?.id === env.id ? ' (Activo)' : ''}` : undefined}
                >
                  {(() => {
                    const iconName = env.icon || defaultEnvironmentIcon;
                    const colorName = env.color || defaultEnvironmentColor;
                    const IconComponent = iconComponents[iconName] || iconComponents[defaultEnvironmentIcon];
                    const colorData = environmentColors[colorName as keyof typeof environmentColors] || environmentColors[defaultEnvironmentColor];
                    const isActive = activeEnvironment?.id === env.id;
                    const isGradient = colorData?.gradient?.startsWith('linear-gradient') ?? false;

                    const backgroundStyle = isGradient
                      ? { background: colorData.gradient, opacity: isActive ? 1 : 0.45 }
                      : { backgroundColor: colorData?.primary || '#3B82F6', opacity: isActive ? 1 : 0.45 };

                    return (
                      <div
                        className={cn(
                          'rounded-xl flex items-center justify-center transition-all ring-1 ring-white/10',
                          isCollapsed ? 'w-8 h-8' : 'w-7 h-7'
                        )}
                        style={backgroundStyle}
                      >
                        <IconComponent className={isCollapsed ? 'w-5 h-5' : 'w-4 h-4'} style={{ color: isActive ? 'white' : 'var(--text-primary)' }} />
                      </div>
                    );
                  })()}
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left truncate" title={env.name}>{env.name}</span>
                      <ChevronRight className={cn(
                        'w-4 h-4 transition-all',
                        activeEnvironment?.id === env.id
                          ? 'rotate-90 text-theme-primary'
                          : 'opacity-0 group-hover:opacity-100 text-theme-secondary'
                      )} />
                    </>
                  )}
                </button>

                {/* Tooltip for collapsed mode */}
                {isCollapsed && (
                  <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2 py-1 rounded-md text-xs bg-[var(--bg-elevated)] border border-[var(--glass-border-light)] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {env.name}
                  </div>
                )}

                {/* Environment Actions - show on active */}
                {activeEnvironment?.id === env.id && !isCollapsed && (
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
                          handleScanAndUpdate();
                        }}
                        disabled={isLoading}
                        className="btn-icon"
                        title="Buscar y actualizar todos los repositorios"
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

      <div className={isCollapsed ? 'p-2 border-t border-[var(--glass-border-light)]' : 'p-4 border-t border-[var(--glass-border-light)] space-y-1'}>
        <button
          onClick={() => openTagManagerModal()}
          className={`sidebar-item w-full ${isCollapsed ? 'justify-center p-2' : ''}`}
          title={isCollapsed ? 'Etiquetas' : undefined}
        >
          <TagIcon className="w-5 h-5" />
          {!isCollapsed && <span>Etiquetas</span>}
        </button>
        <button
          onClick={() => openSettingsModal()}
          className={`sidebar-item w-full ${isCollapsed ? 'justify-center p-2' : ''}`}
          title={isCollapsed ? 'Configuración' : undefined}
        >
          <Settings className="w-5 h-5" />
          {!isCollapsed && <span>Configuración</span>}
        </button>
      </div>
    </motion.aside>
  );
}
