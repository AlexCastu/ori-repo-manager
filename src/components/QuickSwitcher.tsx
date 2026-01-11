import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Folder, Star } from 'lucide-react';
import { useStore, useFilteredProjects } from '../store/useStore';

interface QuickSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickSwitcher({ isOpen, onClose }: QuickSwitcherProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { favorites } = useStore();
  const projects = useFilteredProjects();

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.path.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filteredProjects.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredProjects[selectedIndex]) {
          // Navigate to project
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredProjects]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-32 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl modal-base overflow-hidden"
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--glass-border-light)]">
          <Search className="w-5 h-5 text-blue-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Buscar proyecto..."
            className="flex-1 bg-transparent text-theme-primary text-lg placeholder-[var(--text-muted)] focus:outline-none"
          />
          <kbd className="px-2 py-1 text-xs rounded bg-black/20 text-theme-muted">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12 text-theme-muted">
              {query ? 'No se encontraron proyectos' : 'Escribe para buscar...'}
            </div>
          ) : (
            <div className="p-2">
              {filteredProjects.map((project, index) => {
                const isFav = !!favorites[project.name];
                const isSelected = index === selectedIndex;

                return (
                  <motion.div
                    key={project.path}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-500/20' : 'hover:bg-blue-500/10'
                    }`}
                    onMouseEnter={() => setSelectedIndex(index)}
                    onClick={onClose}
                  >
                    <Folder className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-theme-primary font-medium">{project.name}</span>
                        {isFav && <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />}
                      </div>
                      <p className="text-xs text-theme-muted truncate">{project.path}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-[var(--glass-border-light)] text-xs text-theme-muted">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-black/20">↑↓</kbd>
              <span>Navegar</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-black/20">↵</kbd>
              <span>Seleccionar</span>
            </div>
          </div>
          <div>
            {filteredProjects.length} resultado{filteredProjects.length !== 1 ? 's' : ''}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
