import { motion } from 'framer-motion';
import { ask } from '@tauri-apps/plugin-dialog';
import { Download, RefreshCw, X, Check, GitBranch, Upload } from 'lucide-react';
import { useStore } from '../store/useStore';
import { batchGitPull, batchGitFetch, batchGitPush } from '../utils/tauriAdvanced';
import { useState } from 'react';
import { PullResultsModal, type PullResult } from './PullResultsModal';

export function BatchActionsBar() {
  const { selectedProjects, deselectAllProjects, addToast, triggerRefresh } = useStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [pullResults, setPullResults] = useState<PullResult[]>([]);
  const [showResultsModal, setShowResultsModal] = useState(false);

  const selectedCount = selectedProjects.size;
  const selectedPaths = Array.from(selectedProjects);

  if (selectedCount === 0) return null;

  const handleBatchPull = async () => {
    setIsProcessing(true);
    setPullResults([]);
    setShowResultsModal(true);
    const startTime = Date.now();

    try {
      const apiResults = await batchGitPull(selectedPaths);

      const results: PullResult[] = apiResults.map(([path, result]) => {
        const projectName = path.split('/').pop() || path;
        const isSuccess = 'Ok' in result;
        return {
          projectName,
          projectPath: path,
          success: isSuccess,
          message: isSuccess ? 'Pull completado correctamente' : 'Error en el pull',
          details: isSuccess ? undefined : (result as { Err: string }).Err,
          duration: Date.now() - startTime,
        };
      });

      setPullResults(results);

      const success = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      addToast({
        type: success === results.length ? 'success' : 'warning',
        title: 'Pull completado',
        message: `${success} exitosos, ${failed} fallidos`,
      });

      triggerRefresh();
    } catch {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo hacer pull de los repositorios',
      });
      setShowResultsModal(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchFetch = async () => {
    setIsFetching(true);

    try {
      const apiResults = await batchGitFetch(selectedPaths);

      const success = apiResults.filter(([, result]) => 'Ok' in result).length;
      const failed = apiResults.filter(([, result]) => 'Err' in result).length;

      addToast({
        type: failed > 0 ? 'warning' : 'success',
        title: 'Fetch completado',
        message: `${success} exitosos, ${failed} fallidos`,
      });

      triggerRefresh();
    } catch {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo hacer fetch de los repositorios',
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handleBatchPush = async () => {
    const confirmed = await ask(`¿Push en ${selectedCount} proyecto${selectedCount !== 1 ? 's' : ''}? Se enviarán los commits locales a los remotos.`, { title: 'Confirmar push masivo', kind: 'warning' });
    if (!confirmed) return;
    setIsPushing(true);

    try {
      const apiResults = await batchGitPush(selectedPaths);

      const success = apiResults.filter(([, result]) => 'Ok' in result).length;
      const failed = apiResults.filter(([, result]) => 'Err' in result).length;

      addToast({
        type: failed > 0 ? 'warning' : 'success',
        title: 'Push completado',
        message: `${success} exitosos, ${failed} fallidos`,
      });

      triggerRefresh();
    } catch {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo hacer push de los repositorios',
      });
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 modal-base rounded-2xl"
      >
        <div className="flex items-center gap-4 px-6 py-3">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, var(--primary), var(--primary-muted))',
              }}
            >
              <Check className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium text-theme-primary">
              {selectedCount} proyecto{selectedCount !== 1 ? 's' : ''} seleccionado{selectedCount !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="h-8 w-px bg-[var(--border)]" />

          {/* Pull Selected */}
          <button
            onClick={handleBatchPull}
            disabled={isProcessing || isFetching || isPushing}
            className="btn-primary flex items-center gap-2 px-4 py-2"
            title="Descarga los cambios remotos y actualiza tu rama local (fetch + merge)"
          >
            {isProcessing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Pull</span>
          </button>

          {/* Fetch Selected */}
          <button
            onClick={handleBatchFetch}
            disabled={isProcessing || isFetching || isPushing}
            className="btn-secondary flex items-center gap-2 px-4 py-2"
            title="Consulta los cambios remotos sin modificar tu rama local (solo actualiza referencias)"
          >
            {isFetching ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <GitBranch className="w-4 h-4" />
            )}
            <span>Fetch</span>
          </button>

          {/* Push Selected */}
          <button
            onClick={handleBatchPush}
            disabled={isProcessing || isFetching || isPushing}
            className="btn-secondary flex items-center gap-2 px-4 py-2"
            title="Envía los commits locales a los repositorios remotos"
          >
            {isPushing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            <span>Push</span>
          </button>

          <div className="h-8 w-px bg-[var(--border)]" />

          <button
            onClick={deselectAllProjects}
            className="btn-icon"
            title="Deseleccionar todo"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* Results Modal */}
      <PullResultsModal
        isOpen={showResultsModal}
        onClose={() => setShowResultsModal(false)}
        results={pullResults}
        title={`Pull de ${selectedCount} proyecto${selectedCount !== 1 ? 's' : ''}`}
        isProcessing={isProcessing}
      />
    </>
  );
}
