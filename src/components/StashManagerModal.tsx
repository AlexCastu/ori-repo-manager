import { useState, useEffect } from 'react';
import { X, Archive, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { getStashList, stashSave, stashPop, stashDrop } from '../utils/tauri';
import type { GitStash } from '../types';

interface StashManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectPath: string;
  projectName: string;
  onStashChanged?: () => void;
}

export default function StashManagerModal({
  isOpen,
  onClose,
  projectPath,
  projectName,
  onStashChanged,
}: StashManagerModalProps) {
  const [stashes, setStashes] = useState<GitStash[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newStashMessage, setNewStashMessage] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadStashes();
    }
  }, [isOpen, projectPath]);

  async function loadStashes() {
    setLoading(true);
    setError(null);
    try {
      const result = await getStashList(projectPath);
      setStashes(result);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveStash() {
    if (!newStashMessage.trim()) {
      setError('Debes escribir un mensaje para el stash');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await stashSave(projectPath, newStashMessage.trim());
      setSuccess('Cambios guardados en stash correctamente');
      setNewStashMessage('');
      setShowSaveForm(false);
      await loadStashes();
      onStashChanged?.();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handlePopStash(index: number) {
    if (!confirm('¿Aplicar este stash? Se aplicarán los cambios guardados al directorio de trabajo.')) return;

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await stashPop(projectPath, index);
      setSuccess('Stash aplicado correctamente');
      await loadStashes();
      onStashChanged?.();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleDropStash(index: number) {
    if (!confirm('¿Eliminar este stash permanentemente?')) return;

    setLoading(true);
    setError(null);
    try {
      await stashDrop(projectPath, index);
      await loadStashes();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Gestión de Stashes - {projectName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Save Stash Form */}
          {showSaveForm ? (
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
              <input
                type="text"
                placeholder="Mensaje para el stash (ej: WIP: implementando feature X)"
                value={newStashMessage}
                onChange={(e) => setNewStashMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveStash()}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveStash}
                  disabled={!newStashMessage.trim() || loading}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm disabled:opacity-50 flex-1"
                >
                  Guardar Stash
                </button>
                <button
                  onClick={() => {
                    setShowSaveForm(false);
                    setNewStashMessage('');
                    setError(null);
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowSaveForm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm"
            >
              <Plus className="w-4 h-4" />
              Guardar Cambios en Stash
            </button>
          )}

          {/* Stashes List */}
          {loading && !stashes.length ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Cargando stashes...
            </div>
          ) : stashes.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Archive className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay stashes guardados</p>
              <p className="text-sm mt-1">Los stashes permiten guardar cambios temporalmente sin hacer commit</p>
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Stashes guardados ({stashes.length})
              </h3>
              {stashes.map((stash) => (
                <div
                  key={stash.index}
                  className="flex items-start justify-between p-3 rounded-lg border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded text-xs font-medium">
                        {`stash@{${stash.index}}`}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {stash.branch}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 dark:text-white truncate">
                      {stash.message}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <button
                      onClick={() => handlePopStash(stash.index)}
                      disabled={loading}
                      className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded disabled:opacity-50"
                      title="Aplicar stash"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDropStash(stash.index)}
                      disabled={loading}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:opacity-50"
                      title="Eliminar stash"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
