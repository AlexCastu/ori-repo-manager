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
  Link as LinkIcon,
  Eye,
  EyeOff,
  History,
  Archive,
  FileText,
  Tag as TagIcon,
  Plus
} from 'lucide-react';
import type { Project, GitStatus } from '../types';
import { useStore } from '../store/useStore';
import { cn } from '../utils/helpers';
import { openInIDE, openInExplorer, getGitStatus, gitPush } from '../utils/tauri';
import { PlatformIcon } from './PlatformIcon';
import { IdeIcon, getIdeLabel } from './IdeIcon';
import BranchSelectorModal from './BranchSelectorModal';
import CommitHistoryModal from './CommitHistoryModal';
import StashManagerModal from './StashManagerModal';
import FileChangesModal from './FileChangesModal';

// Referencia estable para evitar re-renders infinitos cuando no hay tags
const emptyTags: string[] = [];

interface ProjectCardCompactProps {
  project: Project;
}

export const ProjectCardCompact = memo(function ProjectCardCompact({ project }: ProjectCardCompactProps) {
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
  const hiddenProjects = useStore((state) => state.hiddenProjects);
  const toggleHideProject = useStore((state) => state.toggleHideProject);
  const tags = useStore((state) => state.tags);
  const projectTagIds = useStore((state) => state.projectTags[project.path]) ?? emptyTags;
  const addTagToProject = useStore((state) => state.addTagToProject);
  const removeTagFromProject = useStore((state) => state.removeTagFromProject);
  const openTagManagerModal = useStore((state) => state.openTagManagerModal);

  const setProjectGitStatus = useStore((state) => state.setProjectGitStatus);

  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [showStashModal, setShowStashModal] = useState(false);
  const [showFileChangesModal, setShowFileChangesModal] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [isPushing, setIsPushing] = useState(false);

  const isFavorite = !!favorites[project.name];
  const projectNote = projectNotes[project.name] || '';
  const hasNote = !!projectNote;
  const isSelected = selectedProjects.has(project.path);
  const isHidden = !!hiddenProjects[project.name];
  const ideCommand = config?.settings?.ideCommand || 'code';
  const ultraCompact = config?.settings?.ultraCompactView || false;

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
            setProjectGitStatus(project.path, status);
          }
        } catch (error) {
          console.error('Failed to get git status:', error);
        } finally {
          if (isMounted) setIsLoadingStatus(false);
        }
      }
    };

    loadStatus();
    return () => { isMounted = false; };
  }, [project.path, project.hasGit, refreshTrigger, setProjectGitStatus]);

  const handleOpenIDE = async () => {
    try {
      await openInIDE(project.path, ideCommand);
    } catch {
      addToast({ type: 'error', title: 'Error', message: `No se pudo abrir ${getIdeLabel(ideCommand)}` });
    }
  };

  const handleOpenExplorer = async () => {
    try {
      await openInExplorer(project.path);
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'No se pudo abrir el explorador' });
    }
  };

  const handleCopyUrl = async () => {
    if (!project.gitUrl) return;
    try {
      await navigator.clipboard.writeText(project.gitUrl);
      addToast({ type: 'success', title: 'Copiado', message: 'URL copiada al portapapeles' });
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'No se pudo copiar la URL' });
    }
  };

  const handlePull = () => {
    if (!project.hasGit) return;
    openGitPullModal({ projectPath: project.path, projectName: project.name });
  };

  const handlePush = async () => {
    if (!project.hasGit || isPushing) return;
    const ahead = gitStatus?.ahead || 0;
    const branch = gitStatus?.branch || 'desconocida';
    if (!confirm(`¿Push ${ahead} commit${ahead !== 1 ? 's' : ''} a la rama "${branch}"?`)) return;
    setIsPushing(true);
    try {
      const result = await gitPush(project.path);
      addToast({ type: 'success', title: 'Push exitoso', message: result });
      await refreshStatus();
    } catch (err) {
      addToast({ type: 'error', title: 'Error en Push', message: String(err) });
    } finally {
      setIsPushing(false);
    }
  };

  const refreshStatus = async () => {
    if (!project.hasGit) return;
    setIsLoadingStatus(true);
    try {
      const status = await getGitStatus(project.path);
      setGitStatus(status);
      setProjectGitStatus(project.path, status);
    } catch (error) {
      console.error('Failed to refresh git status:', error);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const hasCommitsToPush = gitStatus && gitStatus.ahead > 0;
  const hasCommitsToPull = gitStatus && gitStatus.behind > 0;
  const hasUncommittedChanges = gitStatus && gitStatus.has_changes;
  const isUpToDate = gitStatus && !hasCommitsToPush && !hasCommitsToPull && !hasUncommittedChanges;

  return (
    <div
      className={cn(
        'group relative flex flex-col rounded-xl transition-all duration-200 project-card',
        ultraCompact ? 'gap-1 px-3 py-2' : 'gap-1.5 px-4 py-3',
        isSelected && 'selected',
        isHidden && 'opacity-50'
      )}
    >
      {/* ── ROW 1: Identity & Status ────────────────────────── */}
      <div className={cn('flex items-center', ultraCompact ? 'gap-2' : 'gap-2.5')}>
        {/* Checkbox */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleProjectSelection(project.path); }}
          className={cn(
            'flex-shrink-0 rounded-md border-2 flex items-center justify-center transition-all',
            ultraCompact ? 'w-4 h-4' : 'w-5 h-5'
          )}
          style={{
            borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
            backgroundColor: isSelected ? 'var(--primary)' : 'transparent',
          }}
        >
          {isSelected && (
            <motion.svg
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-3 h-3 text-white"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </motion.svg>
          )}
        </button>

        {/* Favorite */}
        <button
          onClick={() => toggleFavorite(project.name)}
          className={cn(
            'flex-shrink-0 p-1 rounded-lg transition-all duration-200',
            isFavorite
              ? 'text-amber-500 dark:text-amber-400'
              : 'opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          )}
        >
          <Star className={cn('w-4 h-4', isFavorite && 'fill-current')} />
        </button>

        {/* Platform Icon */}
        <div className="flex-shrink-0 text-[var(--text-primary)]">
          <PlatformIcon platform={project.platform} size={18} />
        </div>

        {/* Project Name */}
        <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">
          {project.name}
        </h3>

        {/* Branch Badge (clickable) */}
        {gitStatus?.branch && (
          <button
            onClick={() => setShowBranchModal(true)}
            className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md text-xs flex-shrink-0 bg-[var(--surface-alt)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
            title="Gestionar ramas"
          >
            <GitBranch className="w-3 h-3" />
            <span className="max-w-[120px] truncate">{gitStatus.branch}</span>
          </button>
        )}

        {/* Note dot indicator */}
        {hasNote && (
          <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-amber-400" title={projectNote} />
        )}

        {/* Tag pills */}
        {projectTagIds.length > 0 && (
          <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
            {projectTagIds.slice(0, 3).map(tagId => {
              const tag = tags[tagId];
              if (!tag) return null;
              return (
                <span
                  key={tagId}
                  className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white truncate max-w-[80px]"
                  style={{ backgroundColor: tag.color }}
                  title={tag.name}
                >
                  {tag.name}
                </span>
              );
            })}
            {projectTagIds.length > 3 && (
              <span className="text-[10px] text-[var(--text-muted)]">+{projectTagIds.length - 3}</span>
            )}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Status Badges */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isLoadingStatus && project.hasGit ? (
            <RefreshCw className="w-4 h-4 animate-spin text-[var(--primary)]" />
          ) : (
            <>
              {isUpToDate && (
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--success-subtle)' }}
                  title="Al dia"
                >
                  <Check className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />
                </span>
              )}

              {hasUncommittedChanges && (
                <span
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ background: 'var(--warning-subtle)', color: 'var(--warning-text)' }}
                  title="Cambios sin commitear"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                </span>
              )}

              {gitStatus?.has_conflicts && (
                <span
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                  title="Conflictos de merge pendientes"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>!</span>
                </span>
              )}

              {hasCommitsToPush && (
                <span
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}
                  title={`${gitStatus?.ahead ?? 0} commits para push`}
                >
                  <Upload className="w-3 h-3" />
                  <span>{gitStatus?.ahead ?? 0}</span>
                </span>
              )}

              {hasCommitsToPull && (
                <span
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: 'var(--success-subtle)', color: 'var(--success-text)' }}
                  title={`${gitStatus?.behind ?? 0} commits para pull`}
                >
                  <Download className="w-3 h-3" />
                  <span>{gitStatus?.behind ?? 0}</span>
                </span>
              )}

              {!project.hasGit && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full text-[var(--text-muted)] bg-[var(--surface-alt)] border border-[var(--border-subtle)]">
                  No Git
                </span>
              )}
            </>
          )}
        </div>

        {/* IDE Button — Primary CTA */}
        <button
          onClick={handleOpenIDE}
          className="flex-shrink-0 btn-secondary flex items-center gap-2 px-3 py-1.5 text-xs"
          title={`Abrir en ${getIdeLabel(ideCommand)}`}
        >
          <IdeIcon ide={ideCommand} size={14} />
          <span className="hidden lg:inline">{getIdeLabel(ideCommand)}</span>
          <span className="lg:hidden">Abrir</span>
        </button>
      </div>

      {/* ── ROW 2: Metadata & Actions ───────────────────────── */}
      <div className="flex items-center justify-between gap-3 pl-[88px]">
        {/* Left: URL or path */}
        <div className="flex-1 min-w-0 flex items-center gap-1.5 group/url">
          {project.gitUrl ? (
            <>
              <LinkIcon className="w-3 h-3 flex-shrink-0 text-[var(--text-muted)]" />
              <span className="text-xs text-[var(--text-muted)] truncate">
                {project.gitUrl}
              </span>
              <button
                onClick={handleCopyUrl}
                className="opacity-0 group-hover/url:opacity-100 p-1 rounded transition-all duration-150 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary-subtle)]"
                title="Copiar URL"
              >
                <Copy className="w-3 h-3" />
              </button>
            </>
          ) : (
            <span className="text-xs text-[var(--text-muted)] truncate">
              {project.path}
            </span>
          )}
        </div>

        {/* Right: Action buttons — always visible */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={handleOpenExplorer}
            className="p-2 rounded-lg transition-all duration-150 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-overlay)]"
            title="Abrir carpeta"
          >
            <FolderOpen className="w-4 h-4" />
          </button>

          {project.hasGit && (
            <button
              onClick={handlePull}
              className={cn(
                'p-2 rounded-lg transition-all duration-150 hover:bg-[var(--hover-overlay)]',
                hasCommitsToPull
                  ? 'text-[var(--success)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
              title="Git Pull"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          {project.hasGit && (
            <button
              onClick={handlePush}
              disabled={isPushing}
              className={cn(
                'p-2 rounded-lg transition-all duration-150 hover:bg-[var(--hover-overlay)]',
                isPushing && 'animate-pulse',
                hasCommitsToPush
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
              title={hasCommitsToPush ? `Push (${gitStatus?.ahead ?? 0} commits)` : 'Git Push'}
            >
              <Upload className="w-4 h-4" />
            </button>
          )}

          {project.hasGit && (
            <>
              <button
                onClick={() => setShowFileChangesModal(true)}
                className={cn(
                  'p-2 rounded-lg transition-all duration-150 hover:bg-[var(--hover-overlay)]',
                  hasUncommittedChanges
                    ? 'text-[var(--warning)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                )}
                title="Ver archivos modificados"
              >
                <FileText className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowCommitModal(true)}
                className="p-2 rounded-lg transition-all duration-150 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-overlay)]"
                title="Historial de commits"
              >
                <History className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowStashModal(true)}
                className="p-2 rounded-lg transition-all duration-150 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-overlay)]"
                title="Gestionar stashes"
              >
                <Archive className="w-4 h-4" />
              </button>
              <button
                onClick={() => openGitConfigModal({ projectPath: project.path, projectName: project.name })}
                className="p-2 rounded-lg transition-all duration-150 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-overlay)]"
                title="Git Config"
              >
                <Settings className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            onClick={() => openFavoriteNoteModal({ projectName: project.name, currentNote: projectNote })}
            className={cn(
              'p-2 rounded-lg transition-all duration-150 relative',
              hasNote
                ? 'text-amber-500 dark:text-amber-400 hover:bg-amber-500/10'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-overlay)]'
            )}
            title={hasNote ? 'Editar nota' : 'Agregar nota'}
          >
            <MessageSquare className="w-4 h-4" />
            {hasNote && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full" />
            )}
          </button>

          <button
            onClick={() => toggleHideProject(project.name)}
            className={cn(
              'p-2 rounded-lg transition-all duration-150',
              isHidden
                ? 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-overlay)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-overlay)]'
            )}
            title={isHidden ? 'Mostrar proyecto' : 'Ocultar proyecto'}
          >
            {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          {/* Tag assignment button */}
          <div className="relative">
            <button
              onClick={() => setShowTagDropdown(!showTagDropdown)}
              className={cn(
                'p-2 rounded-lg transition-all duration-150',
                projectTagIds.length > 0
                  ? 'text-blue-500 hover:bg-blue-500/10'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-overlay)]'
              )}
              title="Asignar etiquetas"
            >
              <TagIcon className="w-4 h-4" />
            </button>
            {showTagDropdown && (
              <>
                <div className="fixed inset-0 z-[90]" onClick={() => setShowTagDropdown(false)} />
                <div className="absolute right-0 bottom-full mb-1 w-48 rounded-xl p-2 z-[91] modal-base shadow-lg">
                  {Object.values(tags).length === 0 ? (
                    <button
                      onClick={() => { setShowTagDropdown(false); openTagManagerModal(); }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs hover:bg-[var(--hover-overlay)] transition-colors text-[var(--primary)]"
                    >
                      <Plus className="w-3 h-3" />
                      Crear etiquetas
                    </button>
                  ) : (
                    <>
                      {Object.values(tags).map(tag => {
                        const isAssigned = projectTagIds.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            onClick={() => {
                              if (isAssigned) {
                                removeTagFromProject(project.path, tag.id);
                              } else {
                                addTagToProject(project.path, tag.id);
                              }
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs hover:bg-[var(--hover-overlay)] transition-colors"
                          >
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: tag.color }}
                            />
                            <span className="truncate text-[var(--text-primary)]">{tag.name}</span>
                            {isAssigned && <Check className="w-3 h-3 ml-auto text-[var(--primary)]" />}
                          </button>
                        );
                      })}
                      <div className="border-t border-[var(--border)] mt-1 pt-1">
                        <button
                          onClick={() => { setShowTagDropdown(false); openTagManagerModal(); }}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs hover:bg-[var(--hover-overlay)] transition-colors text-[var(--text-muted)]"
                        >
                          <Settings className="w-3 h-3" />
                          Gestionar etiquetas
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {project.hasGit && (
        <>
          <BranchSelectorModal
            isOpen={showBranchModal}
            onClose={() => setShowBranchModal(false)}
            projectPath={project.path}
            projectName={project.name}
            onBranchChanged={refreshStatus}
          />
          <CommitHistoryModal
            isOpen={showCommitModal}
            onClose={() => setShowCommitModal(false)}
            projectPath={project.path}
            projectName={project.name}
          />
          <StashManagerModal
            isOpen={showStashModal}
            onClose={() => setShowStashModal(false)}
            projectPath={project.path}
            projectName={project.name}
            onStashChanged={refreshStatus}
          />
          <FileChangesModal
            isOpen={showFileChangesModal}
            onClose={() => setShowFileChangesModal(false)}
            projectPath={project.path}
            projectName={project.name}
            onChangesUpdated={refreshStatus}
          />
        </>
      )}
    </div>
  );
});
