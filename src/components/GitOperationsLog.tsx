import { motion } from 'framer-motion';
import { X, GitBranch, Download, Upload, RefreshCw, Settings, Check, XCircle, Clock } from 'lucide-react';
import { useStore } from '../store/useStore';

interface GitOperationsLogProps {
  isOpen: boolean;
  onClose: () => void;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'success':
      return <Check className="w-4 h-4 text-green-400" />;
    case 'error':
      return <XCircle className="w-4 h-4 text-red-400" />;
    case 'running':
      return <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />;
    default:
      return <Clock className="w-4 h-4 text-gray-400" />;
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'pull':
      return <Download className="w-4 h-4" />;
    case 'push':
      return <Upload className="w-4 h-4" />;
    case 'fetch':
      return <RefreshCw className="w-4 h-4" />;
    case 'checkout':
      return <GitBranch className="w-4 h-4" />;
    case 'config':
      return <Settings className="w-4 h-4" />;
    default:
      return <GitBranch className="w-4 h-4" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'success':
      return 'rgba(16, 185, 129, 0.2)';
    case 'error':
      return 'rgba(239, 68, 68, 0.2)';
    case 'running':
      return 'rgba(59, 130, 246, 0.2)';
    default:
      return 'rgba(107, 114, 128, 0.2)';
  }
};

export function GitOperationsLog({ isOpen, onClose }: GitOperationsLogProps) {
  const { gitOperations } = useStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-4xl max-h-[80vh] modal-base overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--glass-border-light)]">
          <div>
            <h2 className="text-xl font-semibold text-theme-primary flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-400" />
              Historial de Operaciones Git
            </h2>
            <p className="text-sm text-theme-muted mt-1">
              {gitOperations.length} operacion{gitOperations.length !== 1 ? 'es' : ''} registrada{gitOperations.length !== 1 ? 's' : ''}
            </p>
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
          {gitOperations.length === 0 ? (
            <div className="text-center py-12 text-theme-muted">
              No hay operaciones registradas
            </div>
          ) : (
            <div className="space-y-3">
              {gitOperations.map((operation, index) => (
                <motion.div
                  key={operation.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-start gap-4 p-4 rounded-2xl"
                  style={{
                    backgroundColor: getStatusColor(operation.status),
                  }}
                >
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-theme-secondary"
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    {getTypeIcon(operation.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-theme-primary font-medium">{operation.message}</h4>
                      {getStatusIcon(operation.status)}
                    </div>

                    {operation.projectName && (
                      <p className="text-sm text-theme-secondary mb-1">
                        Proyecto: {operation.projectName}
                      </p>
                    )}

                    {operation.details && operation.status === 'error' && (
                      <details className="mt-2">
                        <summary className="text-xs text-red-400 cursor-pointer hover:text-red-300">
                          Ver detalles del error
                        </summary>
                        <pre className="mt-2 p-2 rounded-lg bg-black/20 text-xs text-theme-muted overflow-x-auto">
                          {operation.details}
                        </pre>
                      </details>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-xs text-theme-muted">
                      <span className="capitalize">{operation.type}</span>
                      <span>•</span>
                      <span>
                        {new Date(operation.timestamp).toLocaleString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                      {operation.duration && (
                        <>
                          <span>•</span>
                          <span>{operation.duration}ms</span>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
