import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sidebar,
  ProjectGrid,
  EnvironmentModal,
  GitConfigModal,
  FavoriteNoteModal,
  ToastContainer,
  BatchActionsBar,
  QuickSwitcher,
  TagManager,
  GitOperationsLog,
  TitleBar
} from './components';
import { GitPullModal } from './components/GitPullModal';
import { GitCloneModal } from './components/GitCloneModal';
import { SettingsModal } from './components/SettingsModal';
import { GitVariablesModal } from './components/GitVariablesModal';
import { DeleteEnvironmentModal } from './components/DeleteEnvironmentModal';
import { ThemeProvider } from './contexts/ThemeContext';
import { useStore } from './store/useStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useAutoSync } from './hooks/useAutoSync';

function App() {
  const {
    initialize,
    isInitialized,
    selectedProjects,
    tagManagerModal,
    gitOperationsLogModal,
    closeTagManagerModal,
    closeGitOperationsLogModal
  } = useStore();

  // Keyboard shortcuts
  const { showQuickSwitcher, setShowQuickSwitcher } = useKeyboardShortcuts();

  // Auto-sync
  useAutoSync();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!isInitialized) {
    return (
      <div className="h-screen w-screen flex items-center justify-center gradient-mesh relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse-slow"
               style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}>
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <p className="text-theme-muted">Cargando...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className="h-screen w-screen flex flex-col overflow-hidden gradient-mesh relative">
        {/* Custom Title Bar */}
        <TitleBar />

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <Sidebar />

          {/* Main Content */}
          <main className="flex-1 flex flex-col overflow-hidden">
            <ProjectGrid />
          </main>
        </div>

        {/* Modals */}
        <EnvironmentModal />
        <GitConfigModal />
        <FavoriteNoteModal />
        <GitPullModal />
        <GitCloneModal />
        <SettingsModal />
        <GitVariablesModal />
        <DeleteEnvironmentModal />

        {/* New Components */}
        {selectedProjects.size > 0 && <BatchActionsBar />}
        <QuickSwitcher
          isOpen={showQuickSwitcher}
          onClose={() => setShowQuickSwitcher(false)}
        />
        <TagManager
          isOpen={tagManagerModal.isOpen}
          onClose={closeTagManagerModal}
        />
        <GitOperationsLog
          isOpen={gitOperationsLogModal.isOpen}
          onClose={closeGitOperationsLogModal}
        />

        {/* Toasts */}
        <ToastContainer />
      </div>
    </ThemeProvider>
  );
}

export default App;
