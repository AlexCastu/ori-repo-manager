import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';

export function DeleteEnvironmentModal() {
  const {
    deleteEnvironmentModal,
    closeDeleteEnvironmentModal,
    deleteEnvironment,
  } = useStore();

  const { isOpen, data } = deleteEnvironmentModal;
  const environment = data?.environment;

  const handleDelete = () => {
    if (environment) {
      deleteEnvironment(environment.id);
      closeDeleteEnvironmentModal();
    }
  };

  if (!isOpen || !environment) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeDeleteEnvironmentModal}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md modal-base border-red-500/30 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-red-500/20 bg-red-500/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-theme-primary">Eliminar Entorno</h2>
                <p className="text-sm text-red-400">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <button
              onClick={closeDeleteEnvironmentModal}
              className="btn-icon"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="panel-dark p-4 mb-4">
              <p className="text-sm text-theme-muted mb-1">Entorno a eliminar:</p>
              <p className="text-lg font-semibold text-theme-primary">{environment.name}</p>
              <p className="text-xs text-theme-muted mt-1 truncate">{environment.basePath}</p>
            </div>

            <div className="space-y-2 text-sm text-theme-secondary">
              <p>• Se eliminará la configuración del entorno</p>
              <p>• Los proyectos <strong className="text-theme-primary">NO</strong> serán eliminados del disco</p>
              <p>• Se perderán las notas de favoritos de este entorno</p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-[var(--glass-border-light)] bg-theme-elevated">
            <button
              onClick={closeDeleteEnvironmentModal}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar Entorno
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
