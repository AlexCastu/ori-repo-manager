import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Settings } from 'lucide-react';
import { useStore } from '../store/useStore';
import { gitConfig } from '../utils/tauri';

export function GitConfigModal() {
  const {
    gitConfigModal,
    closeGitConfigModal,
    addToast,
  } = useStore();

  const { isOpen, data } = gitConfigModal;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setEmail('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      addToast({
        type: 'warning',
        title: 'Campos requeridos',
        message: 'Nombre y email son obligatorios',
      });
      return;
    }

    if (!data?.projectPath) return;

    setIsLoading(true);
    try {
      await gitConfig(data.projectPath, name.trim(), email.trim());
      addToast({
        type: 'success',
        title: 'Git configurado',
        message: `Configuración aplicada a ${data.projectName}`,
      });
      closeGitConfigModal();
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: String(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeGitConfigModal}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md modal-base overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--glass-border-light)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-500/20
                                flex items-center justify-center">
                  <Settings className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-theme-primary">Git Config</h2>
                  <p className="text-sm text-theme-muted">{data?.projectName}</p>
                </div>
              </div>
              <button
                onClick={closeGitConfigModal}
                className="btn-icon"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <p className="text-sm text-theme-secondary">
                Configura el nombre y email para los commits en este repositorio.
              </p>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-2">
                  user.name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre"
                    className="input-base pl-11"
                    autoFocus
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-2">
                  user.email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="input-base pl-11"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--glass-border-light)]">
                <button
                  type="button"
                  onClick={closeGitConfigModal}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary flex items-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : null}
                  Aplicar Config
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
