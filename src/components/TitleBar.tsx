import { useEffect, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { motion } from 'framer-motion';
import { Minus, Square, X, Maximize2, Settings } from 'lucide-react';
import { Logo } from './Logo';
import { useStore } from '../store/useStore';

interface TitleBarProps {
  className?: string;
}

export function TitleBar({ className = '' }: TitleBarProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMacOS, setIsMacOS] = useState(false);
  const { openSettingsModal, config } = useStore();

  useEffect(() => {
    // Detect platform using navigator
    const platform = navigator.platform.toLowerCase();
    setIsMacOS(platform.includes('mac'));

    // Check if window is maximized (with error handling)
    const checkMaximized = async () => {
      try {
        const appWindow = getCurrentWindow();
        const maximized = await appWindow.isMaximized();
        setIsMaximized(maximized);
      } catch (error) {
        console.warn('Could not check maximized state:', error);
      }
    };

    checkMaximized();

    // Set up listener for resize events
    let cleanup: (() => void) | null = null;

    const setupListener = async () => {
      try {
        const appWindow = getCurrentWindow();
        const unlisten = await appWindow.onResized(() => {
          checkMaximized();
        });
        cleanup = unlisten;
      } catch (error) {
        console.warn('Could not set up resize listener:', error);
      }
    };

    setupListener();

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  const handleMinimize = async () => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.minimize();
    } catch (error) {
      console.warn('Could not minimize:', error);
    }
  };

  const handleMaximize = async () => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.toggleMaximize();
    } catch (error) {
      console.warn('Could not toggle maximize:', error);
    }
  };

  const handleClose = async () => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.close();
    } catch (error) {
      console.warn('Could not close:', error);
    }
  };

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
      {isMacOS && <div className="w-[78px] flex-shrink-0" />}

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

      {/* Windows/Linux: Custom window controls */}
      {!isMacOS && (
        <div className="flex items-center titlebar-no-drag">
          <motion.button
            whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}
            whileTap={{ scale: 0.95 }}
            onClick={handleMinimize}
            className="h-10 w-12 flex items-center justify-center text-theme-secondary hover:text-theme-primary transition-colors"
            title="Minimizar"
          >
            <Minus className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}
            whileTap={{ scale: 0.95 }}
            onClick={handleMaximize}
            className="h-10 w-12 flex items-center justify-center text-theme-secondary hover:text-theme-primary transition-colors"
            title={isMaximized ? "Restaurar" : "Maximizar"}
          >
            {isMaximized ? (
              <Square className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </motion.button>

          <motion.button
            whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.9)' }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClose}
            className="h-10 w-12 flex items-center justify-center text-theme-secondary hover:text-white transition-colors"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </motion.button>
        </div>
      )}
    </div>
  );
}
