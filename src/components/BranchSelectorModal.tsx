import { useState, useEffect, useRef } from 'react';
import { X, GitBranch, Plus, Trash2, Check, GitMerge } from 'lucide-react';
import { getBranches, checkoutBranch, createBranch, deleteBranch, gitMergeBranch } from '../utils/tauri';
import { ask } from '@tauri-apps/plugin-dialog';
import type { GitBranch as GitBranchType } from '../types';

interface BranchSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectPath: string;
  projectName: string;
  onBranchChanged?: () => void;
}

export default function BranchSelectorModal({
  isOpen,
  onClose,
  projectPath,
  projectName,
  onBranchChanged,
}: BranchSelectorModalProps) {
  const [branches, setBranches] = useState<GitBranchType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newBranchName, setNewBranchName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createAndCheckout, setCreateAndCheckout] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (isOpen) {
      loadBranches();
    }
  }, [isOpen, projectPath]);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  async function loadBranches() {
    setLoading(true);
    setError(null);
    try {
      const result = await getBranches(projectPath);
      setBranches(result);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckout(branchName: string) {
    setLoading(true);
    setError(null);
    try {
      await checkoutBranch(projectPath, branchName);
      await loadBranches();
      onBranchChanged?.();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBranch() {
    if (!newBranchName.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await createBranch(projectPath, newBranchName.trim(), createAndCheckout);
      setNewBranchName('');
      setShowCreateForm(false);
      await loadBranches();
      onBranchChanged?.();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteBranch(branchName: string) {
    const confirmed = await ask(`¿Eliminar rama "${branchName}"?`, { title: 'Confirmar eliminación', kind: 'warning' });
    if (!confirmed) return;

    setLoading(true);
    setError(null);
    try {
      await deleteBranch(projectPath, branchName, false);
      await loadBranches();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleMergeBranch(branchName: string) {
    const confirmed = await ask(`¿Mergear "${branchName}" en la rama actual?`, { title: 'Confirmar merge', kind: 'info' });
    if (!confirmed) return;

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await gitMergeBranch(projectPath, branchName);
      setSuccess(result);
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      successTimerRef.current = setTimeout(() => setSuccess(null), 4000);
      await loadBranches();
      onBranchChanged?.();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  const localBranches = branches.filter(b => !b.is_remote);
  const currentBranch = branches.find(b => b.is_current);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Gestión de Ramas - {projectName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Current Branch */}
          {currentBranch && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <Check className="w-4 h-4" />
                <span className="font-medium">Rama actual: {currentBranch.name}</span>
              </div>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Create Branch Form */}
          {showCreateForm ? (
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
              <input
                type="text"
                placeholder="Nombre de la nueva rama"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateBranch()}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                autoFocus
              />
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={createAndCheckout}
                  onChange={(e) => setCreateAndCheckout(e.target.checked)}
                  className="rounded"
                />
                Cambiar a esta rama después de crearla
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateBranch}
                  disabled={!newBranchName.trim() || loading}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50 flex-1"
                >
                  Crear Rama
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewBranchName('');
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm"
            >
              <Plus className="w-4 h-4" />
              Nueva Rama
            </button>
          )}

          {/* Branches List */}
          {loading && !branches.length ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Cargando ramas...
            </div>
          ) : (
            <div className="space-y-2">
              {localBranches.map((branch) => (
                <div
                  key={branch.name}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    branch.is_current
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {branch.is_current && <Check className="w-4 h-4 text-blue-500" />}
                      <span className="font-medium text-gray-900 dark:text-white">
                        {branch.name}
                      </span>
                    </div>
                    {branch.tracking && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {branch.tracking}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!branch.is_current && (
                      <>
                        <button
                          onClick={() => handleCheckout(branch.name)}
                          disabled={loading}
                          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm disabled:opacity-50"
                        >
                          Cambiar
                        </button>
                        <button
                          onClick={() => handleMergeBranch(branch.name)}
                          disabled={loading}
                          className="p-1 text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded disabled:opacity-50"
                          title={`Mergear ${branch.name} en la rama actual`}
                        >
                          <GitMerge className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBranch(branch.name)}
                          disabled={loading}
                          className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:opacity-50"
                          title="Eliminar rama"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
