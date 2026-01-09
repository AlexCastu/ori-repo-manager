import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GitBranch, Download, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { gitPull } from '../utils/tauri';

type PullStatus = 'idle' | 'pulling' | 'success' | 'error';

export function GitPullModal() {
  const { gitPullModal, closeGitPullModal, addToast } = useStore();
  const [status, setStatus] = useState<PullStatus>('idle');
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string>('');

  const data = gitPullModal.data;

  const handlePull = async () => {
    if (!data) return;

    setStatus('pulling');
    setOutput('');
    setError('');

    try {
      const result = await gitPull(data.projectPath);
      setOutput(result);
      setStatus('success');
      addToast({
        type: 'success',
        title: 'Pull completado',
        message: `${data.projectName} actualizado correctamente`,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      setStatus('error');
      addToast({
        type: 'error',
        title: 'Error en Pull',
        message: errorMsg,
      });
    }
  };

  const handleClose = () => {
    setStatus('idle');
    setOutput('');
    setError('');
    closeGitPullModal();
  };

  if (!gitPullModal.isOpen || !data) return null;

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
              <div className="p-2 bg-blue-500/20 rounded-xl">
                <GitBranch className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Git Pull</h2>
                <p className="text-sm text-gray-400">{data.projectName}</p>
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
            {/* Status Display */}
            <div className="min-h-[150px] bg-black/30 rounded-xl p-4 font-mono text-sm overflow-auto max-h-[300px]">
              {status === 'idle' && (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>Presiona el botón para iniciar el pull</p>
                </div>
              )}

              {status === 'pulling' && (
                <div className="flex items-center gap-3 text-blue-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Descargando cambios...</span>
                </div>
              )}

              {status === 'success' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    <span>Pull completado exitosamente</span>
                  </div>
                  <pre className="text-gray-300 whitespace-pre-wrap">{output || 'Ya estás actualizado'}</pre>
                </div>
              )}

              {status === 'error' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-red-400">
                    <XCircle className="w-5 h-5" />
                    <span>Error durante el pull</span>
                  </div>
                  <pre className="text-red-300 whitespace-pre-wrap">{error}</pre>
                </div>
              )}
            </div>

            {/* Path Info */}
            <div className="text-xs text-gray-500 break-all">
              <span className="font-semibold">Ruta:</span> {data.projectPath}
            </div>
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
              onClick={handlePull}
              disabled={status === 'pulling'}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'pulling' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Descargando...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Ejecutar Pull</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
