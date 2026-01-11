import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Save } from 'lucide-react';
import { useStore } from '../store/useStore';

export function FavoriteNoteModal() {
  const {
    favoriteNoteModal,
    closeFavoriteNoteModal,
    updateProjectNote,
    addToast,
  } = useStore();

  const { isOpen, data } = favoriteNoteModal;

  const [note, setNote] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && data) {
      setNote(data.currentNote || '');
    }
  }, [isOpen, data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!data?.projectName) return;

    updateProjectNote(data.projectName, note.trim());
    addToast({
      type: 'success',
      title: 'Nota guardada',
      message: note.trim() ? 'La nota ha sido guardada' : 'La nota ha sido eliminada',
    });
    closeFavoriteNoteModal();
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
            onClick={closeFavoriteNoteModal}
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
                <div className="w-10 h-10 rounded-xl bg-yellow-400/10
                                flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-theme-primary">Nota del Proyecto</h2>
                  <p className="text-sm text-theme-muted">{data?.projectName}</p>
                </div>
              </div>
              <button
                onClick={closeFavoriteNoteModal}
                className="btn-icon"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-2">
                  Escribe una nota para recordar información importante
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ej: Branch principal: develop, Contacto: juan@..."
                  rows={4}
                  className="input-base resize-none"
                  autoFocus
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--glass-border-light)]">
                <button
                  type="button"
                  onClick={closeFavoriteNoteModal}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="btn-primary flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Guardar Nota
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
