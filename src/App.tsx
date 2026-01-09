import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sidebar,
  ProjectGrid,
  EnvironmentModal,
  GitConfigModal,
  FavoriteNoteModal,
  ToastContainer
} from './components';
import { GitPullModal } from './components/GitPullModal';
import { GitCloneModal } from './components/GitCloneModal';
import { SettingsModal } from './components/SettingsModal';
import { GitVariablesModal } from './components/GitVariablesModal';
import { ThemeProvider } from './contexts/ThemeContext';
import { useStore } from './store/useStore';

function App() {
  const { initialize, isInitialized } = useStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!isInitialized) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-dark-950 gradient-mesh">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center
                          shadow-glow-lg mx-auto mb-4 animate-pulse-slow">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <p className="text-gray-400">Cargando...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className="h-screen w-screen flex overflow-hidden bg-dark-950 gradient-mesh">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <ProjectGrid />
        </main>

        {/* Modals */}
        <EnvironmentModal />
        <GitConfigModal />
        <FavoriteNoteModal />
        <GitPullModal />
        <GitCloneModal />
        <SettingsModal />
        <GitVariablesModal />

        {/* Toasts */}
        <ToastContainer />
      </div>
    </ThemeProvider>
  );
}

export default App;
