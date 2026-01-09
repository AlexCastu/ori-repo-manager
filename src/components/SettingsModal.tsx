import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Star, RefreshCw, Save, User, Mail, GitBranch, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTheme } from '../contexts/ThemeContext';
import { getGitGlobalConfig, setGitGlobalConfig } from '../utils/tauri';
import type { AppSettings } from '../types';

export function SettingsModal() {
  const { settingsModal, closeSettingsModal, config, addToast, saveConfig } = useStore();
  const { colors } = useTheme();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Git config state
  const [gitName, setGitName] = useState('');
  const [gitEmail, setGitEmail] = useState('');
  const [isLoadingGit, setIsLoadingGit] = useState(false);
  const [isSavingGit, setIsSavingGit] = useState(false);

  useEffect(() => {
    if (settingsModal.isOpen && config) {
      setSettings({ ...config.settings });
      loadGitConfig();
    }
  }, [settingsModal.isOpen, config]);

  const loadGitConfig = async () => {
    setIsLoadingGit(true);
    try {
      const gitConfig = await getGitGlobalConfig();
      setGitName(gitConfig.name);
      setGitEmail(gitConfig.email);
    } catch (error) {
      console.error('Failed to load git config:', error);
    } finally {
      setIsLoadingGit(false);
    }
  };

  const handleSaveGitConfig = async () => {
    if (!gitName.trim() || !gitEmail.trim()) {
      addToast({
        type: 'warning',
        title: 'Campos requeridos',
        message: 'Nombre y email son obligatorios',
      });
      return;
    }

    setIsSavingGit(true);
    try {
      await setGitGlobalConfig(gitName.trim(), gitEmail.trim());
      addToast({
        type: 'success',
        title: 'Git configurado',
        message: 'Configuración global de Git guardada',
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo guardar la configuración de Git',
      });
    } finally {
      setIsSavingGit(false);
    }
  };

  const handleSave = async () => {
    if (!settings || !config) return;

    setIsSaving(true);
    try {
      const { config: currentConfig } = useStore.getState();
      if (currentConfig) {
        currentConfig.settings = settings;
        await saveConfig();
        addToast({
          type: 'success',
          title: 'Configuración guardada',
          message: 'Los cambios se han aplicado correctamente',
        });
        closeSettingsModal();
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo guardar la configuración',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!settingsModal.isOpen || !settings) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={closeSettingsModal}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-dark-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-xl"
                style={{ backgroundColor: `${colors.primary}20` }}
              >
                <Settings className="w-5 h-5" style={{ color: colors.primary }} />
              </div>
              <h2 className="text-lg font-bold text-white">Configuración</h2>
            </div>
            <button
              onClick={closeSettingsModal}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Git Global Config Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <GitBranch className="w-4 h-4" style={{ color: colors.primary }} />
                Configuración Git Global
              </div>

              {isLoadingGit ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Git Name */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">user.name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        value={gitName}
                        onChange={(e) => setGitName(e.target.value)}
                        placeholder="Tu nombre"
                        className="w-full px-4 py-2 pl-10 bg-dark-800 border border-white/10 rounded-lg
                                   text-sm text-gray-100 placeholder:text-gray-500
                                   focus:outline-none focus:border-white/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Git Email */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">user.email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="email"
                        value={gitEmail}
                        onChange={(e) => setGitEmail(e.target.value)}
                        placeholder="tu@email.com"
                        className="w-full px-4 py-2 pl-10 bg-dark-800 border border-white/10 rounded-lg
                                   text-sm text-gray-100 placeholder:text-gray-500
                                   focus:outline-none focus:border-white/20 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSaveGitConfig}
                    disabled={isSavingGit}
                    className="w-full py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: `${colors.primary}20`,
                      color: colors.primary
                    }}
                  >
                    {isSavingGit ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Guardar Git Config
                  </button>
                </div>
              )}
            </div>

            <div className="border-t border-white/5" />

            {/* App Settings */}
            <div className="space-y-4">
              <div className="text-sm font-medium text-gray-300">Preferencias</div>

              {/* Show Favorites First */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-gray-300">Mostrar favoritos primero</span>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, showFavoritesFirst: !settings.showFavoritesFirst })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    settings.showFavoritesFirst ? '' : 'bg-gray-600'
                  }`}
                  style={{ backgroundColor: settings.showFavoritesFirst ? colors.primary : undefined }}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      settings.showFavoritesFirst ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Auto Scan on Start */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-300">Escaneo automático al iniciar</span>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, autoScanOnStart: !settings.autoScanOnStart })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    settings.autoScanOnStart ? '' : 'bg-gray-600'
                  }`}
                  style={{ backgroundColor: settings.autoScanOnStart ? colors.primary : undefined }}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      settings.autoScanOnStart ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Version Info */}
            <div className="pt-4 border-t border-white/10">
              <p className="text-xs text-gray-500 text-center">
                ORI-RepoManager v{config?.version || '2.0.0'}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-5 border-t border-white/10">
            <button
              onClick={closeSettingsModal}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 text-white text-sm font-medium rounded-lg transition-all"
              style={{ backgroundColor: colors.primary }}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Guardar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
