import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Tag as TagIcon, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';

interface TagManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const colorPresets = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
];

export function TagManager({ isOpen, onClose }: TagManagerProps) {
  const { tags, addTag, deleteTag, addToast } = useStore();
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(colorPresets[0]);

  if (!isOpen) return null;

  const tagList = Object.values(tags);

  const handleAddTag = () => {
    if (!newTagName.trim()) return;

    addTag({
      name: newTagName.trim(),
      color: selectedColor,
    });

    addToast({
      type: 'success',
      title: 'Etiqueta creada',
      message: newTagName,
    });

    setNewTagName('');
    setSelectedColor(colorPresets[0]);
  };

  const handleDeleteTag = (tagId: string) => {
    const tag = tags[tagId];
    if (!tag) return;

    if (confirm(`¿Eliminar la etiqueta "${tag.name}"?`)) {
      deleteTag(tagId);
      addToast({
        type: 'success',
        title: 'Etiqueta eliminada',
        message: tag.name,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-2xl max-h-[80vh] modal-base overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--glass-border-light)]">
          <h2 className="text-xl font-semibold text-theme-primary flex items-center gap-2">
            <TagIcon className="w-5 h-5 text-blue-400" />
            Gestión de Etiquetas
          </h2>
          <button
            onClick={onClose}
            className="btn-icon"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)]">
          {/* Create Tag */}
          <div className="panel-dark p-4 rounded-2xl mb-6">
            <h3 className="text-theme-primary font-medium mb-3">Nueva Etiqueta</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Nombre de la etiqueta"
                className="input-base"
              />
              <div>
                <label className="block text-sm text-theme-muted mb-2">Color</label>
                <div className="flex gap-2">
                  {colorPresets.map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className="w-10 h-10 rounded-lg transition-all"
                      style={{
                        backgroundColor: color,
                        border: selectedColor === color ? '2px solid white' : '2px solid transparent',
                        transform: selectedColor === color ? 'scale(1.1)' : 'scale(1)',
                      }}
                    />
                  ))}
                </div>
              </div>
              <button
                onClick={handleAddTag}
                disabled={!newTagName.trim()}
                className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Crear Etiqueta
              </button>
            </div>
          </div>

          {/* Tags List */}
          <div>
            <h3 className="text-theme-primary font-medium mb-3">Etiquetas Existentes</h3>
            {tagList.length === 0 ? (
              <div className="text-center py-8 text-theme-muted">
                No hay etiquetas creadas
              </div>
            ) : (
              <div className="space-y-2">
                {tagList.map((tag, index) => (
                  <motion.div
                    key={tag.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-2xl panel-dark hover:bg-black/10 transition-colors group"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex-shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-theme-primary font-medium">{tag.name}</p>
                      <p className="text-xs text-theme-muted">
                        Creada: {new Date(tag.createdAt).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteTag(tag.id)}
                      className="p-2 rounded-lg hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
