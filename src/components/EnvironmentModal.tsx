import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Folder, Server, FolderOpen, Trash2, Palette,
  Code, Database, Cloud, Globe, Rocket, Star, Zap, Box, Layers, GitBranch
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { selectDirectory } from '../utils/tauri';
import type { EnvironmentColor, EnvironmentIcon } from '../types';
import { availableColors, availableIcons, defaultEnvironmentColor, defaultEnvironmentIcon, environmentColors } from '../utils/colors';

// Map icon names to components
const iconComponents: Record<EnvironmentIcon, React.ComponentType<{ className?: string }>> = {
  'folder': Folder,
  'code': Code,
  'server': Server,
  'database': Database,
  'cloud': Cloud,
  'globe': Globe,
  'rocket': Rocket,
  'star': Star,
  'zap': Zap,
  'box': Box,
  'layers': Layers,
  'git-branch': GitBranch,
};

export function EnvironmentModal() {
  const {
    environmentModal,
    closeEnvironmentModal,
    addEnvironment,
    updateEnvironment,
    openDeleteEnvironmentModal,
    addToast,
  } = useStore();

  const { isOpen, data } = environmentModal;
  const isEditMode = data?.mode === 'edit';
  const existingEnv = data?.environment;

  const [name, setName] = useState('');
  const [basePath, setBasePath] = useState('');
  const [gitServer, setGitServer] = useState('');
  const [selectedColor, setSelectedColor] = useState<EnvironmentColor>(defaultEnvironmentColor);
  const [selectedIcon, setSelectedIcon] = useState<EnvironmentIcon>(defaultEnvironmentIcon);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen && isEditMode && existingEnv) {
      setName(existingEnv.name);
      setBasePath(existingEnv.basePath);
      setGitServer(existingEnv.gitServer);
      setSelectedColor(existingEnv.color || defaultEnvironmentColor);
      setSelectedIcon(existingEnv.icon || defaultEnvironmentIcon);
    } else if (isOpen) {
      setName('');
      setBasePath('');
      setGitServer('');
      setSelectedColor(defaultEnvironmentColor);
      setSelectedIcon(defaultEnvironmentIcon);
    }
  }, [isOpen, isEditMode, existingEnv]);

  const handleSelectDirectory = async () => {
    try {
      const path = await selectDirectory();
      if (path) {
        setBasePath(path);
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo seleccionar la carpeta',
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !basePath.trim()) {
      addToast({
        type: 'warning',
        title: 'Campos requeridos',
        message: 'Nombre y ruta base son obligatorios',
      });
      return;
    }

    if (isEditMode && existingEnv) {
      updateEnvironment(existingEnv.id, {
        name: name.trim(),
        basePath: basePath.trim(),
        gitServer: gitServer.trim(),
        color: selectedColor,
        icon: selectedIcon,
      });
      addToast({
        type: 'success',
        title: 'Entorno actualizado',
        message: `${name} guardado correctamente`,
      });
    } else {
      addEnvironment({
        name: name.trim(),
        basePath: basePath.trim(),
        gitServer: gitServer.trim(),
        color: selectedColor,
        icon: selectedIcon,
      });
    }

    closeEnvironmentModal();
  };

  const handleOpenDeleteModal = () => {
    if (existingEnv) {
      closeEnvironmentModal();
      openDeleteEnvironmentModal({ environment: existingEnv });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeEnvironmentModal}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg max-h-[90vh] bg-dark-900 border border-white/10
                       rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 flex-shrink-0">
              <h2 className="text-xl font-bold text-white">
                {isEditMode ? 'Editar Entorno' : 'Nuevo Entorno'}
              </h2>
              <button
                onClick={closeEnvironmentModal}
                className="btn-icon"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form - Scrollable */}
            <form id="environment-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre del Entorno
                </label>
                <div className="relative">
                  <Folder className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Desarrollo, PRO, PRE..."
                    className="input-base pl-11"
                    autoFocus
                  />
                </div>
              </div>

              {/* Base Path */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Ruta Base
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <FolderOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={basePath}
                      onChange={(e) => setBasePath(e.target.value)}
                      placeholder="C:\proyectos\desarrollo"
                      className="input-base pl-11"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSelectDirectory}
                    className="btn-secondary"
                  >
                    Explorar
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  Carpeta donde están los proyectos de este entorno
                </p>
              </div>

              {/* Git Server */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Servidor Git (opcional)
                </label>
                <div className="relative">
                  <Server className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={gitServer}
                    onChange={(e) => setGitServer(e.target.value)}
                    placeholder="https://github.com o URL personalizada"
                    className="input-base pl-11"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  URL del servidor Git para clonar nuevos proyectos
                </p>
              </div>

              {/* Color Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Color del Entorno
                  </div>
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {availableColors.map((color) => {
                    const colorData = environmentColors[color];
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`w-8 h-8 rounded-lg transition-all duration-200
                                   ${selectedColor === color
                                     ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-900 scale-110'
                                     : 'hover:scale-110'}`}
                        style={{ backgroundColor: colorData.primary }}
                        title={color.charAt(0).toUpperCase() + color.slice(1)}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Icon Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Icono del Entorno
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {availableIcons.map((iconName) => {
                    const IconComponent = iconComponents[iconName];
                    const colorData = environmentColors[selectedColor];
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setSelectedIcon(iconName)}
                        className={`p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center
                                   ${selectedIcon === iconName
                                     ? 'ring-2 ring-offset-2 ring-offset-dark-900 scale-110'
                                     : 'bg-dark-800 hover:bg-dark-700'}`}
                        style={{
                          backgroundColor: selectedIcon === iconName ? colorData.primary : undefined,
                          color: selectedIcon === iconName ? 'white' : '#9ca3af'
                        }}
                        title={iconName}
                      >
                        <IconComponent className="w-5 h-5" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 bg-dark-800 rounded-xl border border-white/5">
                <p className="text-xs text-gray-500 mb-2">Vista previa</p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: environmentColors[selectedColor].primary }}
                  >
                    {(() => {
                      const IconComponent = iconComponents[selectedIcon];
                      return <IconComponent className="w-5 h-5 text-white" />;
                    })()}
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {name || 'Nombre del entorno'}
                    </p>
                    <p className="text-xs text-gray-500 truncate max-w-[250px]">
                      {basePath || 'Ruta base...'}
                    </p>
                  </div>
                </div>
              </div>
            </form>

            {/* Actions - Footer outside scroll */}
            <div className="flex items-center justify-between p-6 border-t border-white/5 flex-shrink-0 bg-dark-900">
              {isEditMode ? (
                <button
                  type="button"
                  onClick={handleOpenDeleteModal}
                  className="text-red-400 hover:text-red-300 text-sm font-medium
                             flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar entorno
                </button>
              ) : (
                <div />
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeEnvironmentModal}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  form="environment-form"
                  className="btn-primary"
                >
                  {isEditMode ? 'Guardar Cambios' : 'Crear Entorno'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
