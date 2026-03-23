import { useState, useEffect, useRef, type ReactNode } from 'react';
import { X, FileText, Eye, Plus, Minus, RefreshCw, FileEdit, RotateCcw, Check, Trash2, Send } from 'lucide-react';
import { getFileChanges, getDiff, gitStageFile, gitStageAll, gitUnstageFile, gitDiscardFile, gitDiscardAll, gitCommit } from '../utils/tauri';
import type { FileChange } from '../types';

interface FileChangesModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectPath: string;
  projectName: string;
  onChangesUpdated?: () => void;
}

export default function FileChangesModal({
  isOpen,
  onClose,
  projectPath,
  projectName,
  onChangesUpdated,
}: FileChangesModalProps) {
  const [files, setFiles] = useState<FileChange[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedFileStaged, setSelectedFileStaged] = useState(false);
  const [diff, setDiff] = useState<string | null>(null);
  const [loadingDiff, setLoadingDiff] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDiscardAllConfirm, setShowDiscardAllConfirm] = useState(false);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (isOpen) {
      loadFileChanges();
      setCommitMessage('');
      setShowDiscardAllConfirm(false);
    }
  }, [isOpen, projectPath]);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  async function loadFileChanges() {
    setLoading(true);
    setError(null);
    try {
      const result = await getFileChanges(projectPath);
      setFiles(result);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function loadDiff(filePath: string, staged: boolean) {
    setSelectedFile(filePath);
    setSelectedFileStaged(staged);
    setLoadingDiff(true);
    setDiff(null);
    try {
      const result = await getDiff(projectPath, filePath, staged);
      setDiff(result || 'No hay diferencias para mostrar');
    } catch (err) {
      setDiff(`Error al cargar diff: ${String(err)}`);
    } finally {
      setLoadingDiff(false);
    }
  }

  async function handleStageFile(filePath: string) {
    setActionLoading(filePath);
    try {
      await gitStageFile(projectPath, filePath);
      await loadFileChanges();
      onChangesUpdated?.();
    } catch (err) {
      setError(String(err));
    } finally {
      setActionLoading(null);
    }
  }

  async function handleStageAll() {
    setActionLoading('stage-all');
    try {
      await gitStageAll(projectPath);
      await loadFileChanges();
      onChangesUpdated?.();
    } catch (err) {
      setError(String(err));
    } finally {
      setActionLoading(null);
    }
  }

  async function handleUnstageFile(filePath: string) {
    setActionLoading(filePath);
    try {
      await gitUnstageFile(projectPath, filePath);
      await loadFileChanges();
      onChangesUpdated?.();
    } catch (err) {
      setError(String(err));
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDiscardFile(filePath: string) {
    if (!confirm(`¿Descartar cambios en "${filePath}"? Esta acción no se puede deshacer.`)) return;
    setActionLoading(filePath);
    try {
      await gitDiscardFile(projectPath, filePath);
      await loadFileChanges();
      setSelectedFile(null);
      setDiff(null);
      onChangesUpdated?.();
    } catch (err) {
      setError(String(err));
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDiscardAll() {
    setActionLoading('discard-all');
    try {
      await gitDiscardAll(projectPath);
      await loadFileChanges();
      setSelectedFile(null);
      setDiff(null);
      setShowDiscardAllConfirm(false);
      onChangesUpdated?.();
      showSuccessMsg('Todos los cambios descartados');
    } catch (err) {
      setError(String(err));
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCommit() {
    if (!commitMessage.trim()) return;
    setIsCommitting(true);
    setError(null);
    try {
      await gitCommit(projectPath, commitMessage.trim());
      showSuccessMsg('Commit creado correctamente');
      setCommitMessage('');
      await loadFileChanges();
      onChangesUpdated?.();
    } catch (err) {
      setError(String(err));
    } finally {
      setIsCommitting(false);
    }
  }

  function showSuccessMsg(msg: string) {
    setSuccess(msg);
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => setSuccess(null), 3000);
  }

  function getStatusLabel(status: string): { label: string; color: string; icon: ReactNode } {
    const trimmed = status.trim();
    if (trimmed === 'M' || trimmed.includes('M')) {
      return { label: 'Modificado', color: 'yellow', icon: <FileEdit className="w-3.5 h-3.5" /> };
    } else if (trimmed === 'A' || trimmed.includes('A')) {
      return { label: 'Añadido', color: 'green', icon: <Plus className="w-3.5 h-3.5" /> };
    } else if (trimmed === 'D' || trimmed.includes('D')) {
      return { label: 'Eliminado', color: 'red', icon: <Minus className="w-3.5 h-3.5" /> };
    } else if (trimmed === 'R' || trimmed.includes('R')) {
      return { label: 'Renombrado', color: 'blue', icon: <RefreshCw className="w-3.5 h-3.5" /> };
    } else if (trimmed === '??' || trimmed.includes('?')) {
      return { label: 'Sin rastrear', color: 'gray', icon: <FileText className="w-3.5 h-3.5" /> };
    } else {
      return { label: status, color: 'gray', icon: <FileText className="w-3.5 h-3.5" /> };
    }
  }

  function renderDiffColored(diffText: string) {
    if (!diffText) return null;
    return diffText.split('\n').map((line, i) => {
      let className = 'text-gray-700 dark:text-gray-300';
      if (line.startsWith('+') && !line.startsWith('+++')) {
        className = 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400';
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        className = 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400';
      } else if (line.startsWith('@@')) {
        className = 'text-blue-600 dark:text-blue-400 font-semibold';
      } else if (line.startsWith('diff') || line.startsWith('index')) {
        className = 'text-gray-500 dark:text-gray-500';
      }
      return (
        <div key={i} className={`px-3 py-0 ${className}`}>
          {line || '\u00A0'}
        </div>
      );
    });
  }

  if (!isOpen) return null;

  const stagedFiles = files.filter(f => f.staged);
  const unstagedFiles = files.filter(f => !f.staged);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-6xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Cambios - {projectName}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        {success && (
          <div className="mx-4 mt-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
          </div>
        )}
        {error && (
          <div className="mx-4 mt-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Files List */}
          <div className="w-[340px] border-r border-gray-200 dark:border-gray-700 overflow-y-auto flex flex-col">
            {loading ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Cargando archivos...
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Check className="w-12 h-12 mx-auto mb-3 opacity-50 text-green-500" />
                <p className="font-medium">Sin cambios</p>
                <p className="text-sm mt-1">El directorio de trabajo está limpio</p>
              </div>
            ) : (
              <div className="p-3 space-y-3 flex-1 overflow-y-auto">
                {/* Staged Section */}
                {stagedFiles.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-green-600 dark:text-green-400">
                        Staged ({stagedFiles.length})
                      </h4>
                    </div>
                    <div className="space-y-1">
                      {stagedFiles.map((file) => {
                        const status = getStatusLabel(file.status);
                        const isActive = selectedFile === file.path && selectedFileStaged;
                        return (
                          <div
                            key={`staged-${file.path}`}
                            className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                              isActive
                                ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
                            }`}
                            onClick={() => loadDiff(file.path, true)}
                          >
                            <div className="text-green-500">{status.icon}</div>
                            <p className="text-xs text-gray-900 dark:text-white truncate flex-1" title={file.path}>
                              {file.path.split('/').pop()}
                            </p>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleUnstageFile(file.path); }}
                              disabled={actionLoading === file.path}
                              className="opacity-0 group-hover:opacity-100 p-1 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded"
                              title="Unstage"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Unstaged Section */}
                {unstagedFiles.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                        Sin stage ({unstagedFiles.length})
                      </h4>
                      <button
                        onClick={handleStageAll}
                        disabled={actionLoading === 'stage-all'}
                        className="text-xs text-blue-500 hover:text-blue-600 font-medium"
                      >
                        Stage All
                      </button>
                    </div>
                    <div className="space-y-1">
                      {unstagedFiles.map((file) => {
                        const status = getStatusLabel(file.status);
                        const isActive = selectedFile === file.path && !selectedFileStaged;
                        return (
                          <div
                            key={`unstaged-${file.path}`}
                            className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                              isActive
                                ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
                            }`}
                            onClick={() => loadDiff(file.path, false)}
                          >
                            <div className="text-orange-500">{status.icon}</div>
                            <p className="text-xs text-gray-900 dark:text-white truncate flex-1" title={file.path}>
                              {file.path.split('/').pop()}
                            </p>
                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleStageFile(file.path); }}
                                disabled={actionLoading === file.path}
                                className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                                title="Stage"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDiscardFile(file.path); }}
                                disabled={actionLoading === file.path}
                                className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                title="Descartar cambios"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Commit Form */}
            {stagedFiles.length > 0 && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <textarea
                  placeholder="Mensaje de commit..."
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      handleCommit();
                    }
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm resize-none"
                  rows={2}
                />
                <button
                  onClick={handleCommit}
                  disabled={!commitMessage.trim() || isCommitting}
                  className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {isCommitting ? 'Creando commit...' : `Commit (${stagedFiles.length} archivo${stagedFiles.length !== 1 ? 's' : ''})`}
                </button>
                <p className="mt-1 text-xs text-gray-400 text-center">Ctrl+Enter para commit rápido</p>
              </div>
            )}
          </div>

          {/* Diff View */}
          <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-800/50">
            {!selectedFile ? (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Selecciona un archivo para ver las diferencias</p>
                </div>
              </div>
            ) : loadingDiff ? (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                Cargando diferencias...
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="p-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                      {selectedFile}
                    </h3>
                    {selectedFileStaged && (
                      <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs">
                        staged
                      </span>
                    )}
                    {diff && (() => {
                      const added = diff.split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++')).length;
                      const removed = diff.split('\n').filter(l => l.startsWith('-') && !l.startsWith('---')).length;
                      return (added > 0 || removed > 0) ? (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          <span className="text-green-600">+{added}</span>
                          {' '}
                          <span className="text-red-600">-{removed}</span>
                        </span>
                      ) : null;
                    })()}
                  </div>
                  <button
                    onClick={() => loadDiff(selectedFile, selectedFileStaged)}
                    className="text-sm text-blue-500 hover:text-blue-600"
                  >
                    Recargar
                  </button>
                </div>
                <div className="flex-1 overflow-auto">
                  <div className="bg-white dark:bg-gray-900 border-x border-gray-200 dark:border-gray-700 text-xs font-mono leading-5">
                    {renderDiffColored(diff || '')}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center gap-2 p-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <button
              onClick={loadFileChanges}
              className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Actualizar
            </button>
            {files.length > 0 && (
              <>
                {showDiscardAllConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-600 dark:text-red-400 font-medium">¿Descartar TODO?</span>
                    <button
                      onClick={handleDiscardAll}
                      disabled={actionLoading === 'discard-all'}
                      className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setShowDiscardAllConfirm(false)}
                      className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDiscardAllConfirm(true)}
                    className="px-3 py-1.5 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 rounded-lg text-sm flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Descartar todo
                  </button>
                )}
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
