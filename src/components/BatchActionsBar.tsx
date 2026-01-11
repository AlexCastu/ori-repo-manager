import { motion } from 'framer-motion';
import { Upload, RefreshCw, X, Check } from 'lucide-react';
import { useStore } from '../store/useStore';
import { batchGitPull } from '../utils/tauriAdvanced';
import { useState } from 'react';
import { PullResultsModal, type PullResult } from './PullResultsModal';

export function BatchActionsBar() {
  const { selectedProjects, deselectAllProjects, addToast, triggerRefresh } = useStore();
  const [isProcessing, setIsProcessing] = useState(false);
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

      // Convert to modal format
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
        message: `✓ ${success} exitosos, ✗ ${failed} fallidos`,
      });

      // Trigger refresh to update git status in cards
      triggerRefresh();
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to pull repositories',
      });
      setShowResultsModal(false);
    } finally {
      setIsProcessing(false);
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
                background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
              }}
            >
              <Check className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium text-theme-primary">
              {selectedCount} proyecto{selectedCount !== 1 ? 's' : ''} seleccionado{selectedCount !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="h-8 w-px bg-[var(--glass-border-light)]" />

          <button
            onClick={handleBatchPull}
            disabled={isProcessing}
            className="btn-primary flex items-center gap-2 px-4 py-2"
          >
            {isProcessing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            <span>Pull & Fetch All</span>
          </button>

          <div className="h-8 w-px bg-[var(--glass-border-light)]" />

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
