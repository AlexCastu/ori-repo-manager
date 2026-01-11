import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Package, Plus, RotateCcw, Trash2, RefreshCw } from 'lucide-react';
import { useStore } from '../store/useStore';
import { invoke } from '@tauri-apps/api/core';
import type { GitStash } from '../types';

interface StashPanelProps {
  isOpen: boolean;
  onClose: () => void;
  projectPath: string;
  projectName: string;
}

export function StashPanel({ isOpen, onClose, projectPath, projectName }: StashPanelProps) {
  const { addToast, addGitOperation } = useStore();
  const [stashes, setStashes] = useState<GitStash[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadStashes();
    }
  }, [isOpen]);

  const loadStashes = async () => {
    setLoading(true);
    const startTime = Date.now();
    try {
      const result = await invoke<GitStash[]>('get_stash_list', {
        repoPath: projectPath,
      });
      setStashes(result);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error al cargar stash',
        message: String(error),
      });
      addGitOperation({
        type: 'stash',
        status: 'error',
        message: 'Error al cargar lista de stash',
        projectName,
        details: String(error),
        duration: Date.now() - startTime,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStashSave = async () => {
    if (!message.trim()) {
      addToast({
        type: 'error',
        title: 'Mensaje requerido',
        message: 'Ingresa un mensaje para el stash',
      });
      return;
    }

    const startTime = Date.now();
    try {
      await invoke('stash_save', {
        repoPath: projectPath,
        message: message.trim(),
      });

      addToast({
        type: 'success',
        title: 'Cambios guardados',
        message: 'Stash creado correctamente',
      });

      addGitOperation({
        type: 'stash',
        status: 'success',
        message: `Stash guardado: ${message.trim()}`,
        projectName,
        duration: Date.now() - startTime,
      });

      setMessage('');
      loadStashes();
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error al guardar',
        message: String(error),
      });
      addGitOperation({
        type: 'stash',
        status: 'error',
        message: 'Error al guardar stash',
        projectName,
        details: String(error),
        duration: Date.now() - startTime,
      });
    }
  };

  const handleStashPop = async (index: number) => {
    const startTime = Date.now();
    try {
      await invoke('stash_pop', {
        repoPath: projectPath,
        index,
      });

      addToast({
        type: 'success',
        title: 'Stash aplicado',
        message: 'Cambios restaurados correctamente',
      });

      addGitOperation({
        type: 'stash',
        status: 'success',
        message: `Stash aplicado (index ${index})`,
        projectName,
        duration: Date.now() - startTime,
      });

      loadStashes();
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error al aplicar',
        message: String(error),
      });
      addGitOperation({
        type: 'stash',
        status: 'error',
        message: 'Error al aplicar stash',
        projectName,
        details: String(error),
        duration: Date.now() - startTime,
      });
    }
  };

  const handleStashDrop = async (index: number, stashMessage: string) => {
    if (!confirm(`¿Eliminar stash "${stashMessage}"?`)) {
      return;
    }

    const startTime = Date.now();
    try {
      await invoke('stash_drop', {
        repoPath: projectPath,
        index,
      });

      addToast({
        type: 'success',
        title: 'Stash eliminado',
        message: stashMessage,
      });

      addGitOperation({
        type: 'stash',
        status: 'success',
        message: `Stash eliminado: ${stashMessage}`,
        projectName,
        duration: Date.now() - startTime,
      });

      loadStashes();
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error al eliminar',
        message: String(error),
      });
      addGitOperation({
        type: 'stash',
        status: 'error',
        message: 'Error al eliminar stash',
        projectName,
        details: String(error),
        duration: Date.now() - startTime,
      });
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
              <Package className="w-5 h-5 text-blue-400" />
              Git Stash
            </h2>
            <p className="text-sm text-theme-muted mt-1">{projectName}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadStashes}
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
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)]">
          {/* Save Stash */}
          <div className="panel-dark p-4 rounded-2xl mb-6">
            <h3 className="text-theme-primary font-medium mb-3">Guardar Cambios</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStashSave()}
                placeholder="Mensaje del stash (ej: WIP: nueva feature)"
                className="flex-1 px-4 py-2 input-base"
              />
              <button
                onClick={handleStashSave}
                disabled={!message.trim()}
                className="btn-primary flex items-center gap-2 px-4 py-2"
                style={{
                  opacity: message.trim() ? 1 : 0.5,
                }}
              >
                <Plus className="w-4 h-4" />
                Guardar
              </button>
            </div>
          </div>

          {/* Stash List */}
          <div>
            <h3 className="text-theme-primary font-medium mb-3">
              Stashes Guardados ({stashes.length})
            </h3>
            {loading ? (
              <div className="text-center py-8 text-theme-muted">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                Cargando...
              </div>
            ) : stashes.length === 0 ? (
              <div className="text-center py-8 text-theme-muted">
                No hay stashes guardados
              </div>
            ) : (
              <div className="space-y-2">
                {stashes.map((stash, idx) => (
                  <motion.div
                    key={stash.index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-start gap-3 p-4 rounded-2xl panel-dark hover:bg-[var(--glass-border-light)] transition-colors group"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
                      }}
                    >
                      <span className="text-white font-bold text-sm">
                        {stash.index}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-theme-primary font-medium">{stash.message}</p>
                      <p className="text-xs text-theme-muted mt-1">
                        Rama: {stash.branch}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleStashPop(stash.index)}
                        className="p-2 rounded-lg hover:bg-green-500/20 transition-colors"
                        title="Aplicar y eliminar"
                      >
                        <RotateCcw className="w-4 h-4 text-green-400" />
                      </button>
                      <button
                        onClick={() => handleStashDrop(stash.index, stash.message)}
                        className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
