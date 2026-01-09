import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GitBranch, Download, CheckCircle, XCircle, Loader2, Link2, FolderOpen } from 'lucide-react';
import { useStore } from '../store/useStore';
import { gitClone, selectDirectory } from '../utils/tauri';

type CloneStatus = 'idle' | 'cloning' | 'success' | 'error';

export function GitCloneModal() {
  const { cloneModal, closeCloneModal, addToast, scanCurrentEnvironment } = useStore();
  const [repoUrl, setRepoUrl] = useState('');
  const [customPath, setCustomPath] = useState('');
  const [status, setStatus] = useState<CloneStatus>('idle');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const data = cloneModal.data;

  const handleSelectPath = async () => {
    try {
      const selected = await selectDirectory();
      if (selected) {
        setCustomPath(selected);
      }
    } catch (err) {
      console.error('Failed to select directory:', err);
    }
  };

  const handleClone = async () => {
    if (!data || !repoUrl) {
      addToast({
        type: 'warning',
        title: 'URL requerida',
        message: 'Por favor, introduce la URL del repositorio',
      });
      return;
    }

    setStatus('cloning');
    setOutput('');
    setError('');

    try {
      const destination = customPath || data.basePath;
      const result = await gitClone(repoUrl, destination);
      setOutput(result);
      setStatus('success');
      addToast({
        type: 'success',
        title: 'Clone completado',
        message: 'El repositorio se ha clonado correctamente',
      });
      // Refresh the project list
      await scanCurrentEnvironment();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      setStatus('error');
      addToast({
        type: 'error',
        title: 'Error en Clone',
        message: errorMsg,
      });
    }
  };

  const handleClose = () => {
    setRepoUrl('');
    setCustomPath('');
    setStatus('idle');
    setOutput('');
    setError('');
    closeCloneModal();
  };

  if (!cloneModal.isOpen || !data) return null;

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
          className="relative w-full max-w-lg glass-card rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-xl">
                <GitBranch className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Git Clone</h2>
                <p className="text-sm text-gray-400">Clonar nuevo repositorio</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Repository URL Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">URL del repositorio</label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder={`https://${data.gitServer}/usuario/repo.git`}
                  className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all"
                  disabled={status === 'cloning'}
                />
              </div>
            </div>

            {/* Destination Path */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Directorio de destino</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customPath || data.basePath}
                  readOnly
                  className="flex-1 px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-gray-400 focus:outline-none font-mono text-sm"
                />
                <button
                  onClick={handleSelectPath}
                  disabled={status === 'cloning'}
                  className="px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-colors disabled:opacity-50"
                >
                  <FolderOpen className="w-5 h-5 text-gray-300" />
                </button>
              </div>
              {/* Environment Info Box */}
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <FolderOpen className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-blue-300">Ruta del entorno activo</p>
                    <p className="text-xs text-blue-400/80 font-mono truncate mt-0.5" title={data.basePath}>
                      {data.basePath}
                    </p>
                    {data.gitServer && (
                      <p className="text-xs text-gray-500 mt-1">
                        Servidor: {data.gitServer}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Status Display */}
            {status !== 'idle' && (
              <div className="bg-black/30 rounded-xl p-4 font-mono text-sm overflow-auto max-h-[200px]">
                {status === 'cloning' && (
                  <div className="flex items-center gap-3 text-green-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Clonando repositorio...</span>
                  </div>
                )}

                {status === 'success' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="w-5 h-5" />
                      <span>Clone completado exitosamente</span>
                    </div>
                    <pre className="text-gray-300 whitespace-pre-wrap">{output}</pre>
                  </div>
                )}

                {status === 'error' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-red-400">
                      <XCircle className="w-5 h-5" />
                      <span>Error durante el clone</span>
                    </div>
                    <pre className="text-red-300 whitespace-pre-wrap">{error}</pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-white/10">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={handleClone}
              disabled={status === 'cloning' || !repoUrl}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'cloning' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Clonando...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Clonar</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
