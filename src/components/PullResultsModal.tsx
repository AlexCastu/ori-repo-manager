import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertCircle, Download, Clock, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

export interface PullResult {
  projectName: string;
  projectPath: string;
  success: boolean;
  message: string;
  details?: string;
  duration?: number;
}

interface PullResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: PullResult[];
  title?: string;
  isProcessing?: boolean;
}

export function PullResultsModal({ isOpen, onClose, results, title = 'Resultados del Pull', isProcessing = false }: PullResultsModalProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const successCount = results.filter(r => r.success).length;
  const failedCount = results.filter(r => !r.success).length;

  // Auto-expand failed items
  useEffect(() => {
    const failedPaths = results.filter(r => !r.success).map(r => r.projectPath);
    setExpandedItems(new Set(failedPaths));
  }, [results]);

  const toggleExpand = (path: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl max-h-[80vh] glass-modal flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-[var(--glass-border-light)]">
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-xl"
                style={{ background: 'rgba(59, 130, 246, 0.2)' }}
              >
                <Download className="w-5 h-5" style={{ color: '#3B82F6' }} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-theme-primary">{title}</h2>
                <div className="flex items-center gap-3 text-sm">
                  {isProcessing ? (
                    <span className="flex items-center gap-1 text-blue-400">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Procesando...
                    </span>
                  ) : (
                    <>
                      <span className="flex items-center gap-1 text-green-400">
                        <Check className="w-3 h-3" />
                        {successCount} exitosos
                      </span>
                      {failedCount > 0 && (
                        <span className="flex items-center gap-1 text-red-400">
                          <AlertCircle className="w-3 h-3" />
                          {failedCount} fallidos
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="btn-icon">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Results List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {results.length === 0 && !isProcessing && (
              <div className="text-center py-8 text-theme-muted">
                No hay resultados para mostrar
              </div>
            )}

            {results.map((result) => (
              <motion.div
                key={result.projectPath}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl border overflow-hidden ${
                  result.success
                    ? 'border-green-500/30 bg-green-500/5'
                    : 'border-red-500/30 bg-red-500/5'
                }`}
              >
                {/* Result Header */}
                <button
                  onClick={() => toggleExpand(result.projectPath)}
                  className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        result.success ? 'bg-green-500/20' : 'bg-red-500/20'
                      }`}
                    >
                      {result.success ? (
                        <Check className="w-3.5 h-3.5 text-green-400" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm text-theme-primary">
                        {result.projectName}
                      </p>
                      <p className="text-xs text-theme-muted truncate max-w-[400px]">
                        {result.message}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.duration && (
                      <span className="text-xs text-theme-muted flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {(result.duration / 1000).toFixed(1)}s
                      </span>
                    )}
                    {result.details && (
                      expandedItems.has(result.projectPath) ? (
                        <ChevronUp className="w-4 h-4 text-theme-muted" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-theme-muted" />
                      )
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedItems.has(result.projectPath) && result.details && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3">
                        <pre className="text-xs p-3 rounded-lg bg-black/30 text-red-300 overflow-x-auto whitespace-pre-wrap font-mono">
                          {result.details}
                        </pre>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex justify-end p-4 border-t border-[var(--glass-border-light)]">
            <button onClick={onClose} className="btn-primary px-6">
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
