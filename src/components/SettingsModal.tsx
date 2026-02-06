import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Star, RefreshCw, Save, FolderOpen, Palette, Copy, CheckCircle2, Sun, Moon, Monitor, Code } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTheme } from '../contexts/ThemeContext';
import { getConfigPath } from '../utils/tauri';
import { IDE_OPTIONS, IdeIcon } from './IdeIcon';
import type { AppSettings } from '../types';

export function SettingsModal() {
  const { settingsModal, closeSettingsModal, config, addToast, saveConfig, initialize } = useStore();
  useTheme(); // Keep theme context active
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [configPath, setConfigPath] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const originalSettingsRef = useRef<AppSettings | null>(null);

  useEffect(() => {
    if (settingsModal.isOpen && config) {
      setSettings({ ...config.settings });
      originalSettingsRef.current = { ...config.settings };
      loadConfigPath();
    }
  }, [settingsModal.isOpen, config]);

  const loadConfigPath = async () => {
    try {
      const path = await getConfigPath();
      setConfigPath(path);
    } catch (error) {
      console.error('Failed to load config path:', error);
    }
  };

  const handleCopyPath = () => {
    navigator.clipboard.writeText(configPath);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addToast({
      type: 'success',
      title: 'Copiado',
      message: 'Ruta copiada al portapapeles',
    });
  };

  const handleSave = async () => {
    if (!settings || !config) return;

    setIsSaving(true);
    try {
      // Update config immutably so ThemeProvider re-renders immediately
      const updatedConfig = { ...config, settings };
      useStore.setState({ config: updatedConfig });
      await saveConfig();
      addToast({
        type: 'success',
        title: 'Configuración guardada',
        message: 'Los cambios se han aplicado correctamente',
      });
      closeSettingsModal();
    } catch {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo guardar la configuración',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Revert theme preview to original if user cancels
    if (config && originalSettingsRef.current) {
      useStore.setState({ config: { ...config, settings: originalSettingsRef.current } });
    }
    closeSettingsModal();
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
          onClick={handleCancel}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl glass-modal overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5"
               style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-xl"
                style={{ background: 'var(--primary-subtle)' }}
              >
                <Settings className="w-5 h-5" style={{ color: 'var(--primary)' }} />
              </div>
              <h2 className="text-lg font-bold text-theme-primary">Configuración</h2>
            </div>
            <button
              onClick={handleCancel}
              className="btn-icon"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Grid layout for main settings */}
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column - Theme & Preferences */}
              <div className="space-y-5">
                {/* Theme Settings */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-theme-secondary">
                    <Palette className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                    Tema de Interfaz
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'light', label: 'Claro', icon: Sun },
                  { value: 'dark', label: 'Oscuro', icon: Moon },
                  { value: 'system', label: 'Sistema', icon: Monitor },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => {
                      setSettings({ ...settings, theme: value as AppSettings['theme'] });
                      // Apply theme immediately so user sees it before saving
                      if (config) {
                        useStore.setState({ config: { ...config, settings: { ...config.settings, theme: value as AppSettings['theme'] } } });
                      }
                    }}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg transition-all border-2"
                    style={{
                      background: settings.theme === value ? 'var(--primary-subtle)' : 'var(--surface-alt)',
                      borderColor: settings.theme === value ? 'var(--primary)' : 'transparent',
                      color: settings.theme === value ? 'var(--primary)' : 'var(--text-muted)'
                    }}
                  >
                    <Icon className="w-5 h-5" />
                    <div className="text-xs font-medium">{label}</div>
                  </button>
                ))}
                  </div>
                </div>

                {/* App Settings / Preferences */}
                <div className="space-y-3">
                  <div className="text-sm font-medium text-theme-secondary">Preferencias</div>

                  {/* Show Favorites First */}
                  <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--surface-alt)' }}>
                    <div className="flex items-center gap-3">
                      <Star className="w-4 h-4" style={{ color: '#fcd34d' }} />
                      <span className="text-sm text-theme-secondary">Mostrar favoritos primero</span>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, showFavoritesFirst: !settings.showFavoritesFirst })}
                      className="relative w-11 h-6 rounded-full transition-colors"
                      style={{ backgroundColor: settings.showFavoritesFirst ? 'var(--primary)' : '#4b5563' }}
                    >
                      <span
                        className="absolute top-1 w-4 h-4 bg-white rounded-full transition-transform"
                        style={{ left: settings.showFavoritesFirst ? '1.5rem' : '0.25rem' }}
                      />
                    </button>
                  </div>

                  {/* Auto Scan on Start */}
                  <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--surface-alt)' }}>
                    <div className="flex items-center gap-3">
                      <RefreshCw className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                      <span className="text-sm text-theme-secondary">Escaneo automático al iniciar</span>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, autoScanOnStart: !settings.autoScanOnStart })}
                      className="relative w-11 h-6 rounded-full transition-colors"
                      style={{ backgroundColor: settings.autoScanOnStart ? 'var(--primary)' : '#4b5563' }}
                    >
                      <span
                        className="absolute top-1 w-4 h-4 bg-white rounded-full transition-transform"
                        style={{ left: settings.autoScanOnStart ? '1.5rem' : '0.25rem' }}
                      />
                    </button>
                  </div>
                </div>

                {/* IDE Configuration */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-theme-secondary">
                    <Code className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                    Editor de Código
                  </div>
                  {/* IDE Selector */}
                  <div className="relative">
                    <select
                      value={settings.ideCommand || 'code'}
                      onChange={(e) => setSettings({ ...settings, ideCommand: e.target.value })}
                      className="w-full p-3 pl-11 rounded-lg text-theme-primary text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 border"
                      style={{
                        background: 'var(--surface-alt)',
                        borderColor: 'var(--border)',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%233B82F6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                        paddingRight: '40px'
                      }}
                    >
                      {Object.entries(IDE_OPTIONS).map(([command, info]) => (
                        <option key={command} value={command}>
                          {info.label} ({command})
                        </option>
                      ))}
                    </select>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <IdeIcon ide={settings.ideCommand || 'code'} size={18} />
                    </div>
                  </div>
                  {/* Custom command input */}
                  <div className="flex items-center gap-2 p-2 rounded-lg border" style={{ background: 'var(--surface-alt)', borderColor: 'var(--border)' }}>
                    <span className="text-xs text-theme-muted shrink-0">Comando:</span>
                    <input
                      type="text"
                      value={settings.ideCommand || 'code'}
                      onChange={(e) => setSettings({ ...settings, ideCommand: e.target.value })}
                      className="flex-1 bg-transparent text-sm text-theme-primary focus:outline-none"
                      placeholder="code, cursor, subl..."
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Config & Info */}
              <div className="space-y-5">
                {/* Config File Location */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-theme-secondary">
                    <FolderOpen className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                    Ubicación de Configuración
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: 'var(--primary-subtle)' }}>
                    <p className="text-xs mb-2 text-theme-muted">
                      Archivo de configuración (config.json):
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs px-2 py-1.5 rounded text-theme-secondary overflow-auto max-w-[250px] truncate" style={{ background: 'var(--surface-alt)' }}>
                        {configPath || 'Cargando...'}
                      </code>
                      {configPath && (
                        <button
                          onClick={handleCopyPath}
                          className="p-2 rounded-lg transition-colors flex-shrink-0"
                          style={{ background: copied ? 'var(--success-subtle)' : 'var(--primary-subtle)', color: copied ? 'var(--success)' : 'var(--primary)' }}
                          title="Copiar ruta"
                        >
                          {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Version Info */}
                <div className="p-4 rounded-xl border" style={{ background: 'var(--surface-alt)', borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary-subtle)' }}>
                      <Code className="w-6 h-6" style={{ color: 'var(--primary)' }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-theme-primary">ORI-RepoManager</h3>
                      <p className="text-xs text-theme-muted">v{config?.version || '2.0.0'}</p>
                      <p className="text-xs text-theme-muted">Alex Constantin Castu</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-5" style={{ borderTop: '1px solid var(--border)' }}>
            <button
              onClick={handleCancel}
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
                <RefreshCw className="w-4 h-4 animate-spin" />
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
