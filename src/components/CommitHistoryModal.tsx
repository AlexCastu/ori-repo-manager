import { useState, useEffect, useRef } from 'react';
import { X, History, User, Calendar, Hash, Search, Copy, Check, Undo2, CopyPlus } from 'lucide-react';
import { getCommits, gitRevertCommit, gitCherryPick } from '../utils/tauri';
import type { GitCommit } from '../types';

interface CommitHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectPath: string;
  projectName: string;
}

export default function CommitHistoryModal({
  isOpen,
  onClose,
  projectPath,
  projectName,
}: CommitHistoryModalProps) {
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const actionTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      if (actionTimerRef.current) clearTimeout(actionTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadCommits();
      setSearchTerm('');
    }
  }, [isOpen, projectPath, limit]);

  async function loadCommits() {
    setLoading(true);
    setError(null);
    try {
      const result = await getCommits(projectPath, limit);
      setCommits(result);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  function formatDate(timestamp: string): string {
    try {
      // Git %at returns Unix timestamp in seconds, JavaScript needs milliseconds
      const date = new Date(parseInt(timestamp, 10) * 1000);
      if (isNaN(date.getTime())) {
        return timestamp; // Return raw timestamp if parsing fails
      }
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (error) {
      return timestamp; // Return raw timestamp on error
    }
  }

  async function copyHash(hash: string) {
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedHash(hash);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopiedHash(null), 2000);
    } catch {
      // Fallback silencioso
    }
  }

  async function handleRevert(commit: GitCommit) {
    if (!confirm(`¿Revertir el commit "${commit.message}" (${commit.short_hash})?`)) return;
    setActionLoading(commit.hash);
    setActionMessage(null);
    try {
      await gitRevertCommit(projectPath, commit.hash);
      showActionMsg('success', `Commit ${commit.short_hash} revertido correctamente`);
      await loadCommits();
    } catch (err) {
      showActionMsg('error', String(err));
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCherryPick(commit: GitCommit) {
    if (!confirm(`¿Cherry-pick del commit "${commit.message}" (${commit.short_hash})?`)) return;
    setActionLoading(commit.hash);
    setActionMessage(null);
    try {
      await gitCherryPick(projectPath, commit.hash);
      showActionMsg('success', `Cherry-pick de ${commit.short_hash} completado`);
      await loadCommits();
    } catch (err) {
      showActionMsg('error', String(err));
    } finally {
      setActionLoading(null);
    }
  }

  function showActionMsg(type: 'success' | 'error', text: string) {
    setActionMessage({ type, text });
    if (actionTimerRef.current) clearTimeout(actionTimerRef.current);
    actionTimerRef.current = setTimeout(() => setActionMessage(null), 4000);
  }

  const filteredCommits = searchTerm.trim()
    ? commits.filter(
        (c) =>
          c.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.short_hash.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : commits;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Historial de Commits - {projectName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por mensaje, autor o hash..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="px-2 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
            {filteredCommits.length}/{commits.length}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {actionMessage && (
            <div className={`${actionMessage.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'} border rounded-lg p-3 mb-4`}>
              <p className={`text-sm ${actionMessage.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{actionMessage.text}</p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Cargando commits...
            </div>
          ) : filteredCommits.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {searchTerm ? 'No se encontraron commits' : 'No hay commits en este repositorio'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCommits.map((commit) => (
                <div
                  key={commit.hash}
                  className="group bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                >
                  {/* Commit Message */}
                  <p className="text-sm text-gray-900 dark:text-white font-medium mb-2">
                    {commit.message}
                  </p>

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[150px]" title={commit.email}>
                        {commit.author}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(commit.date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5" />
                      <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
                        {commit.short_hash}
                      </code>
                      <button
                        onClick={() => copyHash(commit.hash)}
                        className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Copiar hash completo"
                      >
                        {copiedHash === commit.hash ? (
                          <Check className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center gap-1 ml-auto">
                      <button
                        onClick={() => handleRevert(commit)}
                        disabled={actionLoading === commit.hash}
                        className="p-1 rounded hover:bg-orange-100 dark:hover:bg-orange-900/20 text-gray-400 hover:text-orange-600 transition-colors opacity-0 group-hover:opacity-100"
                        title="Revertir este commit"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleCherryPick(commit)}
                        disabled={actionLoading === commit.hash}
                        className="p-1 rounded hover:bg-purple-100 dark:hover:bg-purple-900/20 text-gray-400 hover:text-purple-600 transition-colors opacity-0 group-hover:opacity-100"
                        title="Cherry-pick este commit"
                      >
                        <CopyPlus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
