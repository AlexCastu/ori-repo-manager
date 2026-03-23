import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Filter, X, Check, ArrowUpDown, Tag as TagIcon, GitBranch } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { GitPlatform } from '../types';

interface AdvancedFiltersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
}

export function AdvancedFiltersPanel({ isOpen, onClose, buttonRef }: AdvancedFiltersPanelProps) {
  const { filters, setFilters, resetFilters, gitStatuses, tags } = useStore();
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Ramas únicas extraídas del store centralizado
  const uniqueBranches = useMemo(() => {
    const branches = new Set<string>();
    Object.values(gitStatuses).forEach(status => {
      if (status.branch) branches.add(status.branch);
    });
    return Array.from(branches).sort();
  }, [gitStatuses]);

  // Lista de tags disponibles
  const tagList = useMemo(() => Object.values(tags), [tags]);

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

  const sortOptions: Array<{ value: typeof filters.sortBy; label: string }> = [
    { value: 'name', label: 'Nombre' },
    { value: 'status', label: 'Estado Git' },
    { value: 'branch', label: 'Rama' },
  ];

  const togglePlatform = (platform: GitPlatform) => {
    const current = filters.platforms;
    const updated = current.includes(platform)
      ? current.filter(p => p !== platform)
      : [...current, platform];
    setFilters({ platforms: updated });
  };

  const toggleBranch = (branch: string) => {
    const current = filters.branches;
    const updated = current.includes(branch)
      ? current.filter(b => b !== branch)
      : [...current, branch];
    setFilters({ branches: updated });
  };

  const toggleTag = (tagId: string) => {
    const current = filters.tags;
    const updated = current.includes(tagId)
      ? current.filter(t => t !== tagId)
      : [...current, tagId];
    setFilters({ tags: updated });
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

            {/* Branch Filter */}
            {uniqueBranches.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-theme-secondary mb-2 flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5" />
                  Ramas
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {uniqueBranches.map(branch => {
                    const isSelected = filters.branches.includes(branch);
                    return (
                      <button
                        key={branch}
                        onClick={() => toggleBranch(branch)}
                        className={`config-btn text-xs ${isSelected ? 'active' : ''}`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        <span className="truncate max-w-[120px]">{branch}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tags Filter */}
            {tagList.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-theme-secondary mb-2 flex items-center gap-1.5">
                  <TagIcon className="w-3.5 h-3.5" />
                  Etiquetas
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {tagList.map(tag => {
                    const isSelected = filters.tags.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs border transition-all ${
                          isSelected
                            ? 'border-current opacity-100'
                            : 'border-[var(--border)] opacity-70 hover:opacity-100'
                        }`}
                        style={{ color: tag.color }}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sort By */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-theme-secondary mb-2 flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5" />
                Ordenar por
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ sortBy: e.target.value as typeof filters.sortBy })}
                className="w-full px-3 py-2 rounded-lg input-base text-sm"
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
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
