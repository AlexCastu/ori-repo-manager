import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Star,
  GitBranch,
  ExternalLink,
  FolderOpen,
  Settings,
  MoreVertical,
  MessageSquare,
  Download,
  Upload,
  Github,
  Gitlab,
  Copy,
  Check,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import type { Project, GitStatus } from '../types';
import { useStore } from '../store/useStore';
import { cn, getPlatformColor } from '../utils/helpers';
import { openInVscode, openInExplorer, getGitStatus, gitFetch } from '../utils/tauri';

interface ProjectCardProps {
  project: Project;
  index: number;
}

export function ProjectCard({ project, index }: ProjectCardProps) {
  const {
    favorites,
    toggleFavorite,
    openGitConfigModal,
    openFavoriteNoteModal,
    openGitPullModal,
    addToast
  } = useStore();
  const [showMenu, setShowMenu] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  const isFavorite = !!favorites[project.name];
  const favoriteNote = favorites[project.name]?.note || '';

  // NO auto-load git status on mount - only on demand to prevent CMD spam
  // User can click refresh button to load status

  const loadGitStatus = async (withFetch: boolean = false) => {
    if (!project.hasGit || isLoadingStatus) return;
    setIsLoadingStatus(true);
    try {
      // Only fetch if explicitly requested (manual refresh)
      if (withFetch) {
        try {
          await gitFetch(project.path);
        } catch {
          // Ignore fetch errors (might be offline)
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
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo abrir VS Code. Verifica que esté instalado y en el PATH.',
      });
    }
  };

  const handleOpenExplorer = async () => {
    try {
      await openInExplorer(project.path);
    } catch (error) {
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

  const handleCopyUrl = async () => {
    if (!project.gitUrl) return;
    try {
      await navigator.clipboard.writeText(project.gitUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
      addToast({
        type: 'success',
        title: 'URL copiada',
        message: 'URL del repositorio copiada al portapapeles',
        duration: 2000,
      });
    } catch {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo copiar la URL',
      });
    }
  };

  const getPlatformIcon = () => {
    switch (project.platform) {
      case 'github': return <Github className="w-4 h-4" />;
      case 'gitlab': return <Gitlab className="w-4 h-4" />;
      default: return <GitBranch className="w-4 h-4" />;
    }
  };

  // Git status indicators
  const hasCommitsToPush = gitStatus && gitStatus.ahead > 0;
  const hasCommitsToPull = gitStatus && gitStatus.behind > 0;
  const hasUncommittedChanges = gitStatus && gitStatus.has_changes;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className="card-interactive group relative"
      onMouseLeave={() => setShowMenu(false)}
    >
      {/* Top Row: Favorite & Menu */}
      <div className="flex items-start justify-between mb-3">
        {/* Favorite Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => toggleFavorite(project.name)}
          className={cn(
            'p-1.5 rounded-lg transition-all duration-200',
            isFavorite
              ? 'text-yellow-400 bg-yellow-400/10'
              : 'text-gray-500 hover:text-yellow-400 hover:bg-yellow-400/10 opacity-0 group-hover:opacity-100'
          )}
        >
          <Star className={cn('w-4 h-4', isFavorite && 'fill-current')} />
        </motion.button>

        {/* Git Status Badges */}
        <div className="flex items-center gap-1.5 flex-1 justify-center">
          {isLoadingStatus ? (
            <RefreshCw className="w-3 h-3 text-gray-500 animate-spin" />
          ) : (
            <>
              {hasUncommittedChanges && (
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full flex items-center gap-1" title="Cambios sin commitear">
                  <AlertCircle className="w-3 h-3" />
                  <span>Cambios</span>
                </span>
              )}
              {hasCommitsToPush && (
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full flex items-center gap-1" title={`${gitStatus.ahead} commits para subir`}>
                  <Upload className="w-3 h-3" />
                  <span>{gitStatus.ahead}</span>
                </span>
              )}
              {hasCommitsToPull && (
                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1" title={`${gitStatus.behind} commits para descargar`}>
                  <Download className="w-3 h-3" />
                  <span>{gitStatus.behind}</span>
                </span>
              )}
            </>
          )}
        </div>

        {/* Menu Button */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="btn-icon opacity-0 group-hover:opacity-100"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute right-0 top-8 w-48 bg-dark-800 border border-white/10
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
                      loadGitStatus(true); // with fetch
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-300
                               hover:bg-white/5 flex items-center gap-3"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Actualizar Estado
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

      {/* Project Name & Branch */}
      <div className="mb-3">
        <h3 className="text-base font-semibold text-white mb-1">
          {project.name}
        </h3>
        {gitStatus?.branch && (
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <GitBranch className="w-3 h-3" />
            {gitStatus.branch}
          </span>
        )}
      </div>

      {/* Git URL - Full, Copiable */}
      {project.gitUrl && (
        <div className="mb-3 p-2 bg-black/20 rounded-lg group/url">
          <div className={cn(
            'flex items-start gap-2 text-xs',
            getPlatformColor(project.platform)
          )}>
            {getPlatformIcon()}
            <span className="break-all opacity-80 flex-1 select-all cursor-text">
              {project.gitUrl}
            </span>
            <button
              onClick={handleCopyUrl}
              className="p-1 hover:bg-white/10 rounded transition-colors opacity-0 group-hover/url:opacity-100"
              title="Copiar URL"
            >
              {copiedUrl ? (
                <Check className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Favorite Note */}
      {isFavorite && favoriteNote && (
        <div className="mb-3 px-3 py-2 bg-primary-500/10 border border-primary-500/20
                        rounded-lg text-xs text-primary-300">
          <MessageSquare className="w-3 h-3 inline-block mr-1.5 opacity-50" />
          {favoriteNote}
        </div>
      )}

      {/* No Git indicator */}
      {!project.hasGit && (
        <div className="badge-warning mb-3">
          Sin repositorio Git
        </div>
      )}

      {/* Action Buttons - Direct Access */}
      <div className="flex items-center gap-2 pt-3 border-t border-white/5">
        {/* VS Code Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleOpenVSCode}
          className="flex-1 btn-primary text-sm py-2 flex items-center justify-center gap-2"
          title="Abrir en VS Code"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          VS Code
        </motion.button>

        {/* Folder Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleOpenExplorer}
          className="btn-secondary text-sm py-2 flex items-center justify-center gap-2"
          title="Abrir carpeta"
        >
          <FolderOpen className="w-3.5 h-3.5" />
        </motion.button>

        {/* Pull Button */}
        {project.hasGit && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePull}
            className={cn(
              "btn-secondary text-sm py-2 flex items-center justify-center gap-2",
              hasCommitsToPull && "border-green-500/50 text-green-400"
            )}
            title="Git Pull"
          >
            <Download className="w-3.5 h-3.5" />
            {hasCommitsToPull && <span className="text-xs">{gitStatus!.behind}</span>}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
