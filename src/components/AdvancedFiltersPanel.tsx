import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Filter, X, Check } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { GitPlatform } from '../types';

interface AdvancedFiltersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
}

export function AdvancedFiltersPanel({ isOpen, onClose, buttonRef }: AdvancedFiltersPanelProps) {
  const { filters, setFilters, resetFilters } = useStore();
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.right + window.scrollX - 320 // 320px = ancho del panel
      });
    }
  }, [isOpen, buttonRef]);

  const gitStatusOptions: Array<{ value: typeof filters.gitStatus; label: string }> = [
    { value: 'all', label: 'Todos' },
    { value: 'with-changes', label: 'Con cambios' },
    { value: 'up-to-date', label: 'Actualizado' },
    { value: 'ahead', label: 'Commits para subir' },
    { value: 'behind', label: 'Commits para bajar' },
  ];

  const platformOptions: GitPlatform[] = ['github', 'gitlab', 'bitbucket', 'azure', 'other'];

  const togglePlatform = (platform: GitPlatform) => {
    const current = filters.platforms;
    const updated = current.includes(platform)
      ? current.filter(p => p !== platform)
      : [...current, platform];
    setFilters({ platforms: updated });
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[100]"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed w-80 rounded-2xl p-4 z-[101] modal-base"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-theme-primary font-medium flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filtros Avanzados
              </h3>
              <button
                onClick={onClose}
                className="btn-icon"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Git Status */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-theme-secondary mb-2">
                Estado Git
              </label>
              <select
                value={filters.gitStatus}
                onChange={(e) => setFilters({ gitStatus: e.target.value as typeof filters.gitStatus })}
                className="w-full px-3 py-2 rounded-lg input-base text-sm"
              >
                {gitStatusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Platforms */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-theme-secondary mb-2">
                Plataformas
              </label>
              <div className="flex flex-wrap gap-2">
                {platformOptions.map(platform => {
                  const isSelected = filters.platforms.includes(platform);
                  return (
                    <button
                      key={platform}
                      onClick={() => togglePlatform(platform)}
                      className={`config-btn ${isSelected ? 'active' : ''}`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      {platform}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Uncommitted Changes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-theme-secondary mb-2">
                Cambios sin commitear
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilters({ hasUncommitted: null })}
                  className={`flex-1 config-btn ${filters.hasUncommitted === null ? 'active' : ''}`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilters({ hasUncommitted: true })}
                  className={`flex-1 config-btn ${filters.hasUncommitted === true ? 'active' : ''}`}
                >
                  Solo con cambios
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-[var(--glass-border-light)]">
              <button
                onClick={() => {
                  resetFilters();
                  onClose();
                }}
                className="flex-1 btn-secondary"
              >
                Limpiar
              </button>
              <button
                onClick={onClose}
                className="flex-1 btn-primary"
              >
                Aplicar
              </button>
            </div>
          </motion.div>
    </>,
    document.body
  );
}
