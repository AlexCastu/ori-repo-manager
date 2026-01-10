import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Star,
  GitBranch,
  ExternalLink,
  FolderOpen,
  Download,
  Upload,
  Github,
  Gitlab,
  Check,
  AlertCircle,
  RefreshCw,
  MoreVertical,
  Settings,
  MessageSquare,
  Copy,
  Link as LinkIcon
} from 'lucide-react';
import type { Project, GitStatus } from '../types';
import { useStore } from '../store/useStore';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../utils/helpers';
import { openInIDE, openInExplorer, getGitStatus, gitFetch } from '../utils/tauri';

interface ProjectCardCompactProps {
  project: Project;
  index: number;
}

export function ProjectCardCompact({ project, index }: ProjectCardCompactProps) {
  const {
    favorites,
    toggleFavorite,
    openGitConfigModal,
    openFavoriteNoteModal,
    openGitPullModal,
    addToast
  } = useStore();
  const { colors } = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  const isFavorite = !!favorites[project.name];
  const favoriteNote = favorites[project.name]?.note || '';

  // Load git status on mount (without fetch for speed)
  useEffect(() => {
    if (project.hasGit) {
      loadGitStatus(false);
    }
  }, [project.path]);

  const loadGitStatus = async (withFetch: boolean = false) => {
    if (!project.hasGit || isLoadingStatus) return;
    setIsLoadingStatus(true);
    try {
      if (withFetch) {
        try {
          await gitFetch(project.path);
        } catch {
          // Ignore fetch errors
        }
      }
      const status = await getGitStatus(project.path);
      setGitStatus(status);
    } catch (error) {
      console.error('Failed to get git status:', error);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleOpenIDE = async () => {
    try {
      await openInIDE(project.path);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo abrir el IDE',
      });
    }
  };

  const handleOpenExplorer = async () => {
    try {
      await openInExplorer(project.path);
    } catch {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo abrir el explorador',
      });
    }
  };

  const handleCopyUrl = async () => {
    if (!project.gitUrl) return;
    try {
      await navigator.clipboard.writeText(project.gitUrl);
      addToast({
        type: 'success',
        title: 'Copiado',
        message: 'URL del repositorio copiada al portapapeles',
      });
    } catch {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo copiar la URL',
      });
    }
  };

  const handlePull = () => {
    if (!project.hasGit) return;
    openGitPullModal({
      projectPath: project.path,
      projectName: project.name,
    });
  };

  const getPlatformIcon = () => {
    switch (project.platform) {
      case 'github': return <Github className="w-3.5 h-3.5" />;
      case 'gitlab': return <Gitlab className="w-3.5 h-3.5" />;
      default: return <GitBranch className="w-3.5 h-3.5" />;
    }
  };

  // Git status indicators
  const hasCommitsToPush = gitStatus && gitStatus.ahead > 0;
  const hasCommitsToPull = gitStatus && gitStatus.behind > 0;
  const hasUncommittedChanges = gitStatus && gitStatus.has_changes;
  const isUpToDate = gitStatus && !hasCommitsToPush && !hasCommitsToPull && !hasUncommittedChanges;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02, duration: 0.2 }}
      className="group relative flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200"
      style={{
        background: 'rgba(15, 31, 55, 0.6)',
        border: '1px solid rgba(99, 163, 255, 0.2)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(15, 31, 55, 0.8)';
        e.currentTarget.style.borderColor = 'rgba(99, 163, 255, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(15, 31, 55, 0.6)';
        e.currentTarget.style.borderColor = 'rgba(99, 163, 255, 0.2)';
        setShowMenu(false);
      }}
    >
      {/* Favorite Button */}
      <button
        onClick={() => toggleFavorite(project.name)}
        className={cn(
          'p-1 rounded-xl transition-all duration-200 flex-shrink-0',
          isFavorite
            ? ''
            : 'opacity-0 group-hover:opacity-100'
        )}
        style={{ color: isFavorite ? '#fcd34d' : '#D1D5DB' }}
      >
        <Star className={cn('w-4 h-4', isFavorite && 'fill-current')} />
      </button>

      {/* Platform Icon */}
      <div className="flex-shrink-0" style={{ color: '#3B82F6' }}>
        {getPlatformIcon()}
      </div>

      {/* Project Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-white truncate">
            {project.name}
          </h3>
          {gitStatus?.branch && (
            <span className="text-xs hidden sm:flex items-center gap-1 flex-shrink-0" style={{ color: '#D1D5DB' }}>
              <GitBranch className="w-3 h-3" />
              {gitStatus.branch}
            </span>
          )}
        </div>
        {project.gitUrl && (
          <div className="flex items-center gap-1 mt-0.5 group/url">
            <LinkIcon className="w-3 h-3 flex-shrink-0" style={{ color: '#3B82F6' }} />
            <span className="text-xs truncate flex-1" style={{ color: '#63A3FF' }}>
              {project.gitUrl}
            </span>
            <button
              onClick={handleCopyUrl}
              className="opacity-0 group-hover/url:opacity-100 p-1 rounded transition-all duration-200"
              style={{ color: '#D1D5DB' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#D1D5DB';
              }}
              title="Copiar URL"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
        )}
        {favoriteNote && (
          <p className="text-xs truncate mt-0.5" style={{ color: '#D1D5DB' }}>
            <MessageSquare className="w-3 h-3 inline mr-1" />
            {favoriteNote}
          </p>
        )}
      </div>

      {/* Status Badges */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {isLoadingStatus ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ color: '#3B82F6' }} />
        ) : (
          <>
            {isUpToDate && (
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)'
                }}
                title="Actualizado"
              >
                <Check className="w-3.5 h-3.5" style={{ color: '#10B981' }} />
              </span>
            )}
            {hasUncommittedChanges && (
              <span
                className="px-2 py-0.5 text-xs rounded-full flex items-center gap-1"
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.2)',
                  color: '#fcd34d',
                  border: '1px solid rgba(245, 158, 11, 0.3)'
                }}
                title="Cambios sin commitear"
              >
                <AlertCircle className="w-3 h-3" />
              </span>
            )}
            {hasCommitsToPush && (
              <span
                className="px-2 py-0.5 text-xs rounded-full flex items-center gap-1"
                style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                  color: '#93c5fd',
                  border: '1px solid rgba(59, 130, 246, 0.3)'
                }}
                title={`${gitStatus!.ahead} commits para subir`}
              >
                <Upload className="w-3 h-3" />
                <span>{gitStatus!.ahead}</span>
              </span>
            )}
            {hasCommitsToPull && (
              <span
                className="px-2 py-0.5 text-xs rounded-full flex items-center gap-1"
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  color: '#6ee7b7',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  boxShadow: '0 0 8px rgba(16, 185, 129, 0.3)'
                }}
                title={`${gitStatus!.behind} commits para descargar`}
              >
                <Download className="w-3 h-3" />
                <span>{gitStatus!.behind}</span>
              </span>
            )}
            {!project.hasGit && (
              <span
                className="px-2 py-0.5 text-xs rounded-full"
                style={{
                  backgroundColor: 'rgba(99, 163, 255, 0.1)',
                  color: '#D1D5DB',
                  border: '1px solid rgba(99, 163, 255, 0.2)'
                }}
              >
                No Git
              </span>
            )}
          </>
        )}
      </div>

      {/* Action Buttons - Right Side */}
      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* IDE */}
        <button
          onClick={handleOpenIDE}
          className="p-2 rounded-xl transition-colors"
          style={{ color: '#D1D5DB' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
            e.currentTarget.style.color = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#D1D5DB';
          }}
          title="Abrir en IDE"
        >
          <ExternalLink className="w-4 h-4" />
        </button>

        {/* Folder */}
        <button
          onClick={handleOpenExplorer}
          className="p-2 rounded-xl transition-colors"
          style={{ color: '#D1D5DB' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
            e.currentTarget.style.color = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#D1D5DB';
          }}
          title="Abrir carpeta"
        >
          <FolderOpen className="w-4 h-4" />
        </button>

        {/* Pull */}
        {project.hasGit && (
          <button
            onClick={handlePull}
            className="p-2 rounded-xl transition-colors"
            style={{
              color: hasCommitsToPull ? '#10B981' : '#D1D5DB'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = hasCommitsToPull
                ? 'rgba(16, 185, 129, 0.2)'
                : 'rgba(59, 130, 246, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Git Pull"
          >
            <Download className="w-4 h-4" />
          </button>
        )}

        {/* More Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-xl transition-colors"
            style={{ color: '#D1D5DB' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#D1D5DB';
            }}
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute right-0 top-10 w-44 rounded-2xl shadow-xl overflow-hidden z-50"
              style={{
                background: 'rgba(15, 31, 55, 0.95)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(99, 163, 255, 0.3)'
              }}
            >
              {project.hasGit && (
                <>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      openGitConfigModal({
                        projectPath: project.path,
                        projectName: project.name,
                      });
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors"
                    style={{ color: '#D1D5DB' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                      e.currentTarget.style.color = '#FFFFFF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#D1D5DB';
                    }}
                  >
                    <Settings className="w-4 h-4" />
                    Git Config
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      loadGitStatus(true);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors"
                    style={{ color: '#D1D5DB' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                      e.currentTarget.style.color = '#FFFFFF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#D1D5DB';
                    }}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Actualizar
                  </button>
                </>
              )}
              {isFavorite && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    openFavoriteNoteModal({
                      projectName: project.name,
                      currentNote: favoriteNote,
                    });
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors"
                  style={{ color: '#D1D5DB' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                    e.currentTarget.style.color = '#FFFFFF';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#D1D5DB';
                  }}
                >
                  <MessageSquare className="w-4 h-4" />
                  Editar Nota
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
