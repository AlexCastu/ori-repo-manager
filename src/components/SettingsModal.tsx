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
          className="relative w-full max-w-md glass-modal overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5"
               style={{ borderBottom: '1px solid rgba(99, 163, 255, 0.15)' }}>
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-xl"
                style={{ background: 'rgba(59, 130, 246, 0.2)' }}
              >
                <Settings className="w-5 h-5" style={{ color: '#3B82F6' }} />
              </div>
              <h2 className="text-lg font-bold text-white">Configuración</h2>
            </div>
            <button
              onClick={closeSettingsModal}
              className="p-2 rounded-xl transition-colors"
              style={{ color: '#D1D5DB' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Git Global Config Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium" style={{ color: '#D1D5DB' }}>
                <GitBranch className="w-4 h-4" style={{ color: '#3B82F6' }} />
                Configuración Git Global
              </div>

              {isLoadingGit ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#3B82F6' }} />
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Git Name */}
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: '#9ca3af' }}>user.name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#3B82F6' }} />
                      <input
                        type="text"
                        value={gitName}
                        onChange={(e) => setGitName(e.target.value)}
                        placeholder="Tu nombre"
                        className="input-base pl-10 text-sm"
                      />
                    </div>
                  </div>

                  {/* Git Email */}
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: '#9ca3af' }}>user.email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#3B82F6' }} />
                      <input
                        type="email"
                        value={gitEmail}
                        onChange={(e) => setGitEmail(e.target.value)}
                        placeholder="tu@email.com"
                        className="input-base pl-10 text-sm"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSaveGitConfig}
                    disabled={isSavingGit}
                    className="w-full py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                    style={{
                      background: 'rgba(59, 130, 246, 0.2)',
                      color: '#3B82F6',
                      border: '1px solid rgba(59, 130, 246, 0.3)'
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

            <div style={{ borderTop: '1px solid rgba(99, 163, 255, 0.1)' }} />

            {/* App Settings */}
            <div className="space-y-4">
              <div className="text-sm font-medium" style={{ color: '#D1D5DB' }}>Preferencias</div>

              {/* Show Favorites First */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Star className="w-4 h-4" style={{ color: '#fcd34d' }} />
                  <span className="text-sm" style={{ color: '#D1D5DB' }}>Mostrar favoritos primero</span>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, showFavoritesFirst: !settings.showFavoritesFirst })}
                  className="relative w-11 h-6 rounded-full transition-colors"
                  style={{ backgroundColor: settings.showFavoritesFirst ? '#3B82F6' : '#4b5563' }}
                >
                  <span
                    className="absolute top-1 w-4 h-4 bg-white rounded-full transition-transform"
                    style={{ left: settings.showFavoritesFirst ? '1.5rem' : '0.25rem' }}
                  />
                </button>
              </div>

              {/* Auto Scan on Start */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-4 h-4" style={{ color: '#3B82F6' }} />
                  <span className="text-sm" style={{ color: '#D1D5DB' }}>Escaneo automático al iniciar</span>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, autoScanOnStart: !settings.autoScanOnStart })}
                  className="relative w-11 h-6 rounded-full transition-colors"
                  style={{ backgroundColor: settings.autoScanOnStart ? '#3B82F6' : '#4b5563' }}
                >
                  <span
                    className="absolute top-1 w-4 h-4 bg-white rounded-full transition-transform"
                    style={{ left: settings.autoScanOnStart ? '1.5rem' : '0.25rem' }}
                  />
                </button>
              </div>
            </div>

            {/* Version Info */}
            <div className="pt-4" style={{ borderTop: '1px solid rgba(99, 163, 255, 0.15)' }}>
              <p className="text-xs text-center" style={{ color: '#9ca3af' }}>
                ORI-RepoManager v{config?.version || '2.0.0'}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-5"
               style={{ borderTop: '1px solid rgba(99, 163, 255, 0.15)' }}>
            <button
              onClick={closeSettingsModal}
              className="btn-secondary text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary flex items-center gap-2 text-sm"
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
