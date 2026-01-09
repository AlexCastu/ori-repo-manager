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
  MessageSquare
} from 'lucide-react';
import type { Project, GitStatus } from '../types';
import { useStore } from '../store/useStore';
import { useTheme } from '../contexts/ThemeContext';
import { cn, getPlatformColor } from '../utils/helpers';
import { openInVscode, openInExplorer, getGitStatus, gitFetch } from '../utils/tauri';

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

  const handleOpenVSCode = async () => {
    try {
      await openInVscode(project.path);
    } catch {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo abrir VS Code',
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
      className="group relative flex items-center gap-3 px-4 py-3 bg-dark-900/40 hover:bg-dark-800/60
                 border border-white/5 hover:border-white/10 rounded-xl transition-all duration-200"
      onMouseLeave={() => setShowMenu(false)}
    >
      {/* Favorite Button */}
      <button
        onClick={() => toggleFavorite(project.name)}
        className={cn(
          'p-1 rounded-lg transition-all duration-200 flex-shrink-0',
          isFavorite
            ? 'text-yellow-400'
            : 'text-gray-600 hover:text-yellow-400 opacity-0 group-hover:opacity-100'
        )}
      >
        <Star className={cn('w-4 h-4', isFavorite && 'fill-current')} />
      </button>

      {/* Platform Icon */}
      <div className={cn('flex-shrink-0', getPlatformColor(project.platform))}>
        {getPlatformIcon()}
      </div>

      {/* Project Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-white truncate">
            {project.name}
          </h3>
          {gitStatus?.branch && (
            <span className="text-xs text-gray-500 hidden sm:flex items-center gap-1 flex-shrink-0">
              <GitBranch className="w-3 h-3" />
              {gitStatus.branch}
            </span>
          )}
        </div>
        {favoriteNote && (
          <p className="text-xs text-gray-500 truncate mt-0.5">
            <MessageSquare className="w-3 h-3 inline mr-1" />
            {favoriteNote}
          </p>
        )}
      </div>

      {/* Status Badges */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {isLoadingStatus ? (
          <RefreshCw className="w-3.5 h-3.5 text-gray-500 animate-spin" />
        ) : (
          <>
            {isUpToDate && (
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${colors.primary}20` }}
                title="Actualizado"
              >
                <Check className="w-3.5 h-3.5" style={{ color: colors.primary }} />
              </span>
            )}
            {hasUncommittedChanges && (
              <span
                className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full flex items-center gap-1"
                title="Cambios sin commitear"
              >
                <AlertCircle className="w-3 h-3" />
              </span>
            )}
            {hasCommitsToPush && (
              <span
                className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full flex items-center gap-1"
                title={`${gitStatus!.ahead} commits para subir`}
              >
                <Upload className="w-3 h-3" />
                <span>{gitStatus!.ahead}</span>
              </span>
            )}
            {hasCommitsToPull && (
              <span
                className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1"
                title={`${gitStatus!.behind} commits para descargar`}
              >
                <Download className="w-3 h-3" />
                <span>{gitStatus!.behind}</span>
              </span>
            )}
            {!project.hasGit && (
              <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 text-xs rounded-full">
                No Git
              </span>
            )}
          </>
        )}
      </div>

      {/* Action Buttons - Right Side */}
      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* VS Code */}
        <button
          onClick={handleOpenVSCode}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          style={{ color: colors.primary }}
          title="Abrir en VS Code"
        >
          <ExternalLink className="w-4 h-4" />
        </button>

        {/* Folder */}
        <button
          onClick={handleOpenExplorer}
          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          title="Abrir carpeta"
        >
          <FolderOpen className="w-4 h-4" />
        </button>

        {/* Pull */}
        {project.hasGit && (
          <button
            onClick={handlePull}
            className={cn(
              "p-2 rounded-lg transition-colors",
              hasCommitsToPull
                ? "text-green-400 hover:bg-green-500/20"
                : "text-gray-400 hover:text-white hover:bg-white/10"
            )}
            title="Git Pull"
          >
            <Download className="w-4 h-4" />
          </button>
        )}

        {/* More Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute right-0 top-10 w-44 bg-dark-800 border border-white/10
                         rounded-lg shadow-xl overflow-hidden z-50"
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
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-300
                               hover:bg-white/5 flex items-center gap-3"
                  >
                    <Settings className="w-4 h-4" />
                    Git Config
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      loadGitStatus(true);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-300
                               hover:bg-white/5 flex items-center gap-3"
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
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-300
                             hover:bg-white/5 flex items-center gap-3"
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
