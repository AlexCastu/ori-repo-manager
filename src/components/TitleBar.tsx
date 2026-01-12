import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import { Logo } from './Logo';
import { useStore } from '../store/useStore';

// Función para detectar si es macOS - exportada para uso en otros componentes
export function isMacOSPlatform(): boolean {
  const platform = navigator.platform.toLowerCase();
  return platform.includes('mac');
}

interface TitleBarProps {
  className?: string;
}

export function TitleBar({ className = '' }: TitleBarProps) {
  const [isMacOS, setIsMacOS] = useState(false);
  const { openSettingsModal, config } = useStore();

  useEffect(() => {
    // Detect platform using navigator
    setIsMacOS(isMacOSPlatform());

  }, []);

  // Solo mostrar en macOS - en Windows usamos decoraciones nativas
  if (!isMacOS) {
    return null;
  }

  return (
    <div
      data-tauri-drag-region
      className={`titlebar h-10 flex items-center select-none ${className}`}
      style={{
        background: 'var(--glass-sidebar-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--glass-border-light)',
      }}
    >
      {/* macOS: Leave space for traffic lights (semáforo) */}
      <div className="w-[78px] flex-shrink-0" />

      {/* Logo only */}
      <div className="flex items-center gap-2 px-3 titlebar-no-drag">
        <Logo size={22} />
        <span className="text-sm font-medium text-theme-secondary">
          ORI-RepoManager
        </span>
        <span className="text-[10px] text-theme-muted px-1.5 py-0.5 rounded bg-blue-500/20">v{config?.version || '2.0'}</span>
      </div>

      {/* Spacer */}
      <div className="flex-1" data-tauri-drag-region />

      {/* Settings Button - larger with more padding */}
      <div className="flex items-center px-2 titlebar-no-drag">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => openSettingsModal()}
          className="h-9 w-9 flex items-center justify-center rounded-lg transition-colors text-theme-primary hover:text-blue-400"
          style={{
            padding: '5px',
            margin: '8px',
          }}
          title="Configuración"
        >
          <Settings className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
}
