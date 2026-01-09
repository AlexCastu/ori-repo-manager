import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Settings2, Plus, Trash2, Loader2, CheckCircle, Globe,
  AlertCircle, RefreshCw, Key, Edit3, Save, XCircle
} from 'lucide-react';
import { useStore } from '../store/useStore';
import {
  listGitConfig,
  setGitConfigValue,
  unsetGitConfigValue,
  type GitConfigEntry
} from '../utils/tauri';

// Proxy presets for quick configuration
const PROXY_PRESETS = [
  { label: 'SOCKS5 (127.0.0.1:10443)', value: 'socks5h://127.0.0.1:10443' },
  { label: 'HTTP (127.0.0.1:8080)', value: 'http://127.0.0.1:8080' },
];

export function GitVariablesModal() {
  const { gitVariablesModal, closeGitVariablesModal, addToast } = useStore();
  const [entries, setEntries] = useState<GitConfigEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Proxy status
  const httpProxy = entries.find(e => e.key === 'http.proxy')?.value;
  const httpsProxy = entries.find(e => e.key === 'https.proxy')?.value;
  const isProxyActive = !!httpProxy || !!httpsProxy;

  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const config = await listGitConfig();
      setEntries(config);
    } catch (error) {
      console.error('Failed to load git config:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo cargar la configuración de Git',
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (gitVariablesModal.isOpen) {
      loadConfig();
    }
  }, [gitVariablesModal.isOpen, loadConfig]);

  const handleAddVariable = async () => {
    if (!newKey.trim() || !newValue.trim()) {
      addToast({
        type: 'warning',
        title: 'Campos requeridos',
        message: 'Introduce la clave y el valor',
      });
      return;
    }

    setIsSaving(true);
    try {
      await setGitConfigValue(newKey.trim(), newValue.trim());
      addToast({
        type: 'success',
        title: 'Variable añadida',
        message: `${newKey} configurada correctamente`,
      });
      setNewKey('');
      setNewValue('');
      await loadConfig();
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: `No se pudo añadir ${newKey}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteVariable = async (key: string) => {
    try {
      await unsetGitConfigValue(key);
      addToast({
        type: 'success',
        title: 'Variable eliminada',
        message: `${key} eliminada correctamente`,
      });
      await loadConfig();
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: `No se pudo eliminar ${key}`,
      });
    }
  };

  const handleEditVariable = (key: string, value: string) => {
    setEditingKey(key);
    setEditValue(value);
  };

  const handleSaveEdit = async () => {
    if (!editingKey || !editValue.trim()) return;

    setIsSaving(true);
    try {
      await setGitConfigValue(editingKey, editValue.trim());
      addToast({
        type: 'success',
        title: 'Variable actualizada',
        message: `${editingKey} actualizada correctamente`,
      });
      setEditingKey(null);
      setEditValue('');
      await loadConfig();
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: `No se pudo actualizar ${editingKey}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleProxy = async (activate: boolean, proxyValue?: string) => {
    setIsSaving(true);
    try {
      if (activate && proxyValue) {
        await setGitConfigValue('http.proxy', proxyValue);
        await setGitConfigValue('https.proxy', proxyValue);
        addToast({
          type: 'success',
          title: 'Proxy activado',
          message: `Proxy configurado: ${proxyValue}`,
        });
      } else {
        await unsetGitConfigValue('http.proxy');
        await unsetGitConfigValue('https.proxy');
        addToast({
          type: 'success',
          title: 'Proxy desactivado',
          message: 'Configuración de proxy eliminada',
        });
      }
      await loadConfig();
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo cambiar la configuración del proxy',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setNewKey('');
    setNewValue('');
    setEditingKey(null);
    setEditValue('');
    closeGitVariablesModal();
  };

  if (!gitVariablesModal.isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl max-h-[85vh] bg-dark-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-xl">
                <Settings2 className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Variables Git Global</h2>
                <p className="text-sm text-gray-400">Configuración git --global</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadConfig}
                disabled={isLoading}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                title="Refrescar"
              >
                <RefreshCw className={`w-5 h-5 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Proxy Quick Actions */}
            <div className="p-4 bg-dark-800 rounded-xl border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-blue-400" />
                  <div>
                    <h3 className="font-medium text-white">Configuración Proxy</h3>
                    <p className="text-xs text-gray-500">Gestión rápida del proxy Git</p>
                  </div>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                  isProxyActive
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    isProxyActive ? 'bg-green-400' : 'bg-gray-500'
                  }`} />
                  {isProxyActive ? 'Activo' : 'Inactivo'}
                </div>
              </div>

              {/* Current Proxy Info */}
              {isProxyActive && (
                <div className="mb-4 p-3 bg-black/30 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Proxy actual:</div>
                  <div className="text-sm text-white font-mono">{httpProxy || httpsProxy}</div>
                </div>
              )}

              {/* Proxy Actions */}
              <div className="flex flex-wrap gap-2">
                {PROXY_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => handleToggleProxy(true, preset.value)}
                    disabled={isSaving}
                    className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-sm rounded-lg transition-colors disabled:opacity-50"
                  >
                    <span className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      {preset.label}
                    </span>
                  </button>
                ))}
                {isProxyActive && (
                  <button
                    onClick={() => handleToggleProxy(false)}
                    disabled={isSaving}
                    className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm rounded-lg transition-colors disabled:opacity-50"
                  >
                    <span className="flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      Desactivar Proxy
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Add New Variable */}
            <div className="p-4 bg-dark-800 rounded-xl border border-white/5">
              <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4 text-green-400" />
                Añadir Variable
              </h3>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="text"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="Clave (ej: http.proxy)"
                    className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 text-sm"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="Valor"
                    className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddVariable()}
                  />
                </div>
                <button
                  onClick={handleAddVariable}
                  disabled={isSaving || !newKey.trim() || !newValue.trim()}
                  className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Ejemplos: http.proxy, https.proxy, core.autocrlf, credential.helper
              </p>
            </div>

            {/* Variables List */}
            <div>
              <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                <Key className="w-4 h-4 text-purple-400" />
                Variables Configuradas ({entries.length})
              </h3>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                </div>
              ) : entries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No hay variables configuradas</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {entries.map((entry) => (
                    <div
                      key={entry.key}
                      className="flex items-center gap-3 p-3 bg-dark-800 rounded-lg border border-white/5 group hover:border-white/10 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">
                          {entry.key}
                        </div>
                        {editingKey === entry.key ? (
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full mt-1 px-2 py-1 bg-black/30 border border-purple-500/50 rounded text-sm text-gray-300 focus:outline-none"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit();
                              if (e.key === 'Escape') setEditingKey(null);
                            }}
                          />
                        ) : (
                          <div className="text-xs text-gray-500 truncate font-mono">
                            {entry.value}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {editingKey === entry.key ? (
                          <>
                            <button
                              onClick={handleSaveEdit}
                              disabled={isSaving}
                              className="p-1.5 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors"
                              title="Guardar"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingKey(null)}
                              className="p-1.5 hover:bg-gray-500/20 text-gray-400 rounded-lg transition-colors"
                              title="Cancelar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditVariable(entry.key, entry.value)}
                              className="p-1.5 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteVariable(entry.key)}
                              className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-white/10 flex-shrink-0 bg-dark-900">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
