import { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import {
  Star,
  GitBranch,
  FolderOpen,
  Download,
  Upload,
  Check,
  AlertCircle,
  RefreshCw,
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
import { PlatformIcon } from './PlatformIcon';
import { IdeIcon, getIdeLabel } from './IdeIcon';

interface ProjectCardCompactProps {
  project: Project;
}

// Memoized component to prevent unnecessary re-renders
export const ProjectCardCompact = memo(function ProjectCardCompact({ project }: ProjectCardCompactProps) {
  // Use specific selectors to minimize re-renders
  const favorites = useStore((state) => state.favorites);
  const projectNotes = useStore((state) => state.projectNotes);
  const selectedProjects = useStore((state) => state.selectedProjects);
  const refreshTrigger = useStore((state) => state.refreshTrigger);
  const config = useStore((state) => state.config);
  const toggleFavorite = useStore((state) => state.toggleFavorite);
  const openGitConfigModal = useStore((state) => state.openGitConfigModal);
  const openFavoriteNoteModal = useStore((state) => state.openFavoriteNoteModal);
  const openGitPullModal = useStore((state) => state.openGitPullModal);
  const addToast = useStore((state) => state.addToast);
  const toggleProjectSelection = useStore((state) => state.toggleProjectSelection);

  const { isDark } = useTheme();
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  const isFavorite = !!favorites[project.name];
  const projectNote = projectNotes[project.name] || '';
  const hasNote = !!projectNote;
  const isSelected = selectedProjects.has(project.path);
  const ideCommand = config?.settings?.ideCommand || 'code';

  // Load git status on mount, when project changes, or when refreshTrigger changes
  useEffect(() => {
    let isMounted = true;

    const loadStatus = async () => {
      if (!project.hasGit) {
        if (isMounted) setIsLoadingStatus(false);
        return;
      }

      if (isMounted) {
        setIsLoadingStatus(true);
        try {
          const status = await getGitStatus(project.path);
          if (isMounted) {
            setGitStatus(status);
          }
        } catch (error) {
          console.error('Failed to get git status:', error);
        } finally {
          if (isMounted) {
            setIsLoadingStatus(false);
          }
        }
      }
    };

    loadStatus();

    return () => {
      isMounted = false;
    };
  }, [project.path, project.hasGit, refreshTrigger]);

  const loadGitStatus = async (withFetch: boolean = false) => {
    if (!project.hasGit) return;
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
      await openInIDE(project.path, ideCommand);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: `No se pudo abrir ${getIdeLabel(ideCommand)}`,
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

  // Git status indicators
  const hasCommitsToPush = gitStatus && gitStatus.ahead > 0;
  const hasCommitsToPull = gitStatus && gitStatus.behind > 0;
  const hasUncommittedChanges = gitStatus && gitStatus.has_changes;
  const isUpToDate = gitStatus && !hasCommitsToPush && !hasCommitsToPull && !hasUncommittedChanges;

  return (
    <div
      className={cn(
        'group relative flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 project-card',
        isSelected && 'selected'
      )}
    >
      {/* Checkbox for Selection */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleProjectSelection(project.path);
        }}
        className="flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all"
        style={{
          borderColor: isSelected ? '#3B82F6' : '#D1D5DB',
          backgroundColor: isSelected ? '#3B82F6' : 'transparent',
        }}
      >
        {isSelected && (
          <motion.svg
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-3 h-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </motion.svg>
        )}
      </button>

      {/* Favorite Button */}
      <button
        onClick={() => toggleFavorite(project.name)}
        className={cn(
          'p-1 rounded-xl transition-all duration-200 flex-shrink-0',
          isFavorite
            ? 'text-amber-500 dark:text-amber-400'
            : 'opacity-0 group-hover:opacity-100 text-theme-secondary'
        )}
      >
        <Star className={cn('w-4 h-4', isFavorite && 'fill-current')} />
      </button>

      {/* Platform Icon */}
      <div className="flex-shrink-0 text-theme-primary">
        <PlatformIcon platform={project.platform} size={16} />
      </div>

      {/* Project Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-theme-primary truncate">
            {project.name}
          </h3>
          {gitStatus?.branch && (
            <span className="text-xs hidden sm:flex items-center gap-1 flex-shrink-0 text-theme-secondary">
              <GitBranch className="w-3 h-3" />
              {gitStatus.branch}
            </span>
          )}
          {projectNote && (
            <span
              className="text-xs hidden sm:flex items-center gap-1 flex-shrink-0 text-theme-secondary"
              title={projectNote}
            >
              <MessageSquare className="w-3 h-3" />
            </span>
          )}
        </div>
        {project.gitUrl && (
          <div className="flex items-center gap-1 mt-0.5 group/url">
            <LinkIcon className="w-3 h-3 flex-shrink-0" style={{ color: '#3B82F6' }} />
            <span className="text-xs truncate flex-1" style={{ color: '#3B82F6' }}>
              {project.gitUrl}
            </span>
            <button
              onClick={handleCopyUrl}
              className="opacity-0 group-hover/url:opacity-100 p-1 rounded transition-all duration-200 text-theme-secondary hover:text-theme-primary hover:bg-[rgba(59,130,246,0.2)]"
              title="Copiar URL"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Status Badges - Fixed width container to prevent layout shift */}
      <div className="flex items-center gap-2 flex-shrink-0 min-w-[32px] justify-end">
        {isLoadingStatus && project.hasGit ? (
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center transition-opacity duration-300"
            style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)' }}
          >
            <RefreshCw className="w-4 h-4 animate-spin" style={{ color: '#3B82F6' }} />
          </span>
        ) : (
          <div className="flex items-center gap-2 transition-opacity duration-300">
            {isUpToDate && (
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.2)',
                  boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)'
                }}
                title="Actualizado"
              >
                <Check className="w-4 h-4" style={{ color: isDark ? '#34d399' : '#059669' }} />
              </span>
            )}
            {hasUncommittedChanges && (
              <span
                className="px-2.5 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5"
                style={{
                  backgroundColor: isDark ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.2)',
                  color: isDark ? '#fcd34d' : '#b45309',
                  border: `1px solid ${isDark ? 'rgba(245, 158, 11, 0.5)' : 'rgba(245, 158, 11, 0.6)'}`
                }}
                title="Cambios sin commitear"
              >
                <AlertCircle className="w-3.5 h-3.5" />
              </span>
            )}
            {hasCommitsToPush && (
              <span
                className="px-2.5 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5"
                style={{
                  backgroundColor: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)',
                  color: isDark ? '#93c5fd' : '#1d4ed8',
                  border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.6)'}`
                }}
                title={`${gitStatus!.ahead} commits para subir`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{gitStatus!.ahead}</span>
              </span>
            )}
            {hasCommitsToPull && (
              <span
                className="px-2.5 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5"
                style={{
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)',
                  color: isDark ? '#6ee7b7' : '#047857',
                  border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.5)' : 'rgba(16, 185, 129, 0.6)'}`
                }}
                title={`${gitStatus!.behind} commits para descargar`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>{gitStatus!.behind}</span>
              </span>
            )}
            {!project.hasGit && (
              <span
                className="px-2.5 py-1 text-xs font-medium rounded-full text-theme-secondary"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--glass-border-light)'
                }}
              >
                No Git
              </span>
            )}
          </div>
        )}
      </div>

      {/* IDE Button - Always visible */}
      <button
        onClick={handleOpenIDE}
        className="flex-shrink-0 p-2 rounded-xl transition-all duration-200 hover:bg-[rgba(59,130,246,0.2)] text-theme-secondary hover:text-theme-primary"
        title={`Abrir en ${getIdeLabel(ideCommand)}`}
      >
        <IdeIcon ide={ideCommand} size={18} />
      </button>

      {/* Action Buttons - Visible on hover */}
      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Folder */}
        <button
          onClick={handleOpenExplorer}
          className="btn-icon"
          title="Abrir carpeta"
        >
          <FolderOpen className="w-4 h-4" />
        </button>

        {/* Pull */}
        {project.hasGit && (
          <button
            onClick={handlePull}
            className="btn-icon"
            style={{
              color: hasCommitsToPull ? '#10B981' : undefined
            }}
            title="Git Pull"
          >
            <Download className="w-4 h-4" />
          </button>
        )}

        {/* Git Config */}
        {project.hasGit && (
          <button
            onClick={() => openGitConfigModal({
              projectPath: project.path,
              projectName: project.name,
            })}
            className="btn-icon"
            title="Git Config"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}

        {/* Refresh */}
        {/* {project.hasGit && (
          <button
            onClick={() => loadGitStatus(true)}
            className="btn-icon"
            title="Actualizar estado"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )} */}

        {/* Edit Note - Available for all projects */}
        <button
          onClick={() => openFavoriteNoteModal({
            projectName: project.name,
            currentNote: projectNote,
          })}
          className={cn(
            "btn-icon relative",
            hasNote && "text-yellow-400"
          )}
          title={projectNote ? "Editar nota" : "Agregar nota"}
        >
          <MessageSquare className="w-4 h-4" />
          {hasNote && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow-400 rounded-full" />
          )}
        </button>
      </div>
    </div>
  );
});
