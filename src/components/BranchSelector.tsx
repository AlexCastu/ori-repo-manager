import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, Plus, Trash2, Check, X, RefreshCw } from 'lucide-react';
import type { GitBranch as Branch } from '../types';
import { getBranches, checkoutBranch, createBranch, deleteBranch } from '../utils/tauriAdvanced';
import { useStore } from '../store/useStore';

interface BranchSelectorProps {
  projectPath: string;
  projectName: string;
  currentBranch?: string;
}

export function BranchSelector({ projectPath, projectName, currentBranch }: BranchSelectorProps) {
  const { addToast, addGitOperation } = useStore();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const activeBranch = branches.find(b => b.isActive);
  const displayBranch = activeBranch?.name || currentBranch || 'main';

  useEffect(() => {
    if (isOpen) {
      loadBranches();
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + window.scrollY + 8,
          left: rect.left + window.scrollX
        });
      }
    }
  }, [isOpen, projectPath]);

  // No need for click outside handler - backdrop handles it

  const loadBranches = async () => {
    setIsLoading(true);
    try {
      const branchList = await getBranches(projectPath);
      setBranches(branchList);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar las ramas',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckout = async (branchName: string) => {
    addGitOperation({
      type: 'checkout',
      status: 'running',
      message: `Switching to branch ${branchName}`,
      projectPath,
      projectName,
    });

    try {
      await checkoutBranch(projectPath, branchName);
      addToast({
        type: 'success',
        title: 'Rama cambiada',
        message: `Ahora estás en: ${branchName}`,
      });
      addGitOperation({
        type: 'checkout',
        status: 'success',
        message: `Switched to ${branchName}`,
        projectPath,
        projectName,
      });
      loadBranches();
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: String(error),
      });
      addGitOperation({
        type: 'checkout',
        status: 'error',
        message: `Failed to switch to ${branchName}`,
        projectPath,
        projectName,
        details: String(error),
      });
    }
  };

  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) return;

    addGitOperation({
      type: 'checkout',
      status: 'running',
      message: `Creating branch ${newBranchName}`,
      projectPath,
      projectName,
    });

    try {
      await createBranch(projectPath, newBranchName);
      addToast({
        type: 'success',
        title: 'Rama creada',
        message: `Nueva rama: ${newBranchName}`,
      });
      addGitOperation({
        type: 'checkout',
        status: 'success',
        message: `Created branch ${newBranchName}`,
        projectPath,
        projectName,
      });
      setNewBranchName('');
      setShowCreateInput(false);
      loadBranches();
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: String(error),
      });
      addGitOperation({
        type: 'checkout',
        status: 'error',
        message: `Failed to create ${newBranchName}`,
        projectPath,
        projectName,
        details: String(error),
      });
    }
  };

  const handleDeleteBranch = async (branchName: string) => {
    if (!confirm(`¿Eliminar la rama "${branchName}"?`)) return;

    try {
      await deleteBranch(projectPath, branchName);
      addToast({
        type: 'success',
        title: 'Rama eliminada',
        message: branchName,
      });
      loadBranches();
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: String(error),
      });
    }
  };

  return (
    <div ref={dropdownRef} className="relative inline-block">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
        style={{
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          color: '#93c5fd',
          border: '1px solid rgba(59, 130, 246, 0.3)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
        }}
      >
        <GitBranch className="w-3.5 h-3.5" />
        <span className="max-w-[100px] truncate">{displayBranch}</span>
      </button>

      {isOpen && createPortal(
        <>
          <div
            className="fixed inset-0 z-[150]"
            onClick={() => setIsOpen(false)}
          />
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="fixed w-64 rounded-2xl shadow-xl overflow-hidden z-[200] modal-base"
              style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                maxHeight: '400px',
              }}
            >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--glass-border-light)]">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-blue-400" />
                <span className="font-medium text-theme-primary">Ramas</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={loadBranches}
                  className="btn-icon p-1.5"
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setShowCreateInput(!showCreateInput)}
                  className="btn-icon p-1.5"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Create Branch Input */}
            <AnimatePresence>
              {showCreateInput && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 py-3 border-b border-[var(--glass-border-light)]"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newBranchName}
                      onChange={(e) => setNewBranchName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateBranch();
                        if (e.key === 'Escape') setShowCreateInput(false);
                      }}
                      placeholder="Nombre de la rama"
                      className="flex-1 px-3 py-2 rounded-lg text-sm input-base"
                      autoFocus
                    />
                    <button
                      onClick={handleCreateBranch}
                      className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 transition-colors"
                    >
                      <Check className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={() => setShowCreateInput(false)}
                      className="btn-icon p-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Branches List */}
            <div className="max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
                </div>
              ) : branches.length === 0 ? (
                <div className="text-center py-8 text-theme-muted text-sm">
                  No hay ramas
                </div>
              ) : (
                branches.map((branch) => (
                  <div
                    key={branch.name}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-[var(--glass-border-light)] transition-colors group"
                  >
                    <button
                      onClick={() => !branch.isActive && handleCheckout(branch.name)}
                      className="flex-1 flex items-center gap-3 text-left"
                    >
                      {branch.isActive ? (
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 flex-shrink-0" />
                      )}
                      <span className={`text-sm truncate ${branch.isActive ? 'text-theme-primary font-medium' : 'text-theme-secondary'}`}>
                        {branch.name}
                      </span>
                    </button>

                    {!branch.isActive && (
                      <button
                        onClick={() => handleDeleteBranch(branch.name)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
          </AnimatePresence>
        </>,
        document.body
      )}
    </div>
  );
}
