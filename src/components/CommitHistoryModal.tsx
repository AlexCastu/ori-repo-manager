import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, GitCommit as GitCommitIcon, User, Calendar, Hash } from 'lucide-react';
import type { GitCommit } from '../types';
import { getCommits } from '../utils/tauriAdvanced';
import { useStore } from '../store/useStore';

interface CommitHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectPath: string;
  projectName: string;
}

export function CommitHistoryModal({ isOpen, onClose, projectPath, projectName }: CommitHistoryModalProps) {
  const { addToast } = useStore();
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [limit, setLimit] = useState(20);

  useEffect(() => {
    if (isOpen) {
      loadCommits();
    }
  }, [isOpen, limit]);

  const loadCommits = async () => {
    setIsLoading(true);
    try {
      const commitList = await getCommits(projectPath, limit);
      setCommits(commitList);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar los commits',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-3xl max-h-[80vh] modal-base overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--glass-border-light)]">
          <div>
            <h2 className="text-xl font-semibold text-theme-primary flex items-center gap-2">
              <GitCommitIcon className="w-5 h-5 text-blue-400" />
              Historial de Commits
            </h2>
            <p className="text-sm text-theme-muted mt-1">{projectName}</p>
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : commits.length === 0 ? (
            <div className="text-center py-12 text-theme-muted">
              No hay commits
            </div>
          ) : (
            <div className="space-y-4">
              {commits.map((commit, index) => (
                <motion.div
                  key={commit.hash}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="panel-dark p-4 rounded-2xl hover:bg-[var(--glass-border-light)] transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}
                    >
                      <span className="text-white font-semibold">
                        {commit.author[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-theme-primary font-medium mb-2">{commit.message}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-theme-secondary">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {commit.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(commit.date).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: 'rgba(99, 163, 255, 0.1)',
                            color: '#63A3FF',
                          }}
                        >
                          <Hash className="w-3 h-3" />
                          {commit.shortHash}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {commits.length >= limit && (
                <button
                  onClick={() => setLimit(limit + 20)}
                  className="w-full py-3 rounded-2xl text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    color: '#93c5fd',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                  }}
                >
                  Cargar más commits
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
