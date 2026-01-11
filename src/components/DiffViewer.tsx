import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, FileText, RefreshCw } from 'lucide-react';
import { useStore } from '../store/useStore';
import { invoke } from '@tauri-apps/api/core';

interface DiffViewerProps {
  isOpen: boolean;
  onClose: () => void;
  projectPath: string;
  projectName: string;
  filePath?: string;
}

export function DiffViewer({ isOpen, onClose, projectPath, projectName, filePath }: DiffViewerProps) {
  const { addToast } = useStore();
  const [diff, setDiff] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDiff();
    }
  }, [isOpen, filePath]);

  const loadDiff = async () => {
    setLoading(true);
    try {
      const result = await invoke<string>('get_diff', {
        repoPath: projectPath,
        filePath: filePath || null,
      });
      setDiff(result);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error al cargar diff',
        message: String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const parseDiffLines = (diffText: string) => {
    return diffText.split('\n').map((line, index) => {
      let className = 'text-theme-secondary';
      let bgColor = 'transparent';

      if (line.startsWith('+++') || line.startsWith('---')) {
        className = 'text-blue-400 font-semibold';
      } else if (line.startsWith('@@')) {
        className = 'text-cyan-400';
        bgColor = 'rgba(6, 182, 212, 0.1)';
      } else if (line.startsWith('+')) {
        className = 'text-green-400';
        bgColor = 'rgba(16, 185, 129, 0.1)';
      } else if (line.startsWith('-')) {
        className = 'text-red-400';
        bgColor = 'rgba(239, 68, 68, 0.1)';
      } else if (line.startsWith('diff --git')) {
        className = 'text-yellow-400 font-semibold';
      }

      return { line, className, bgColor, index };
    });
  };

  if (!isOpen) return null;

  const diffLines = parseDiffLines(diff);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-6xl max-h-[90vh] modal-base overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--glass-border-light)]">
          <div>
            <h2 className="text-xl font-semibold text-theme-primary flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Visor de Diferencias
            </h2>
            <p className="text-sm text-theme-muted mt-1">
              {projectName} {filePath && `• ${filePath}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadDiff}
              disabled={loading}
              className="btn-icon"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="btn-icon"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-theme-muted">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Cargando diferencias...
            </div>
          ) : !diff ? (
            <div className="text-center py-12 text-theme-muted">
              No hay cambios para mostrar
            </div>
          ) : (
            <div className="font-mono text-sm">
              {diffLines.map(({ line, className, bgColor, index }) => (
                <div
                  key={index}
                  className={`px-6 py-1 ${className}`}
                  style={{ backgroundColor: bgColor }}
                >
                  <span className="inline-block w-12 text-theme-muted select-none">
                    {index + 1}
                  </span>
                  <span className="whitespace-pre-wrap break-all">
                    {line || ' '}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
