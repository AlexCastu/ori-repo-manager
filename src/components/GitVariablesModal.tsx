import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Settings2, Plus, Trash2, CheckCircle, Globe,
  AlertCircle, RefreshCw, Key, Edit3, Save, XCircle, Info,
  FolderPlus, Shield, Lock, GitBranch, FileText, Zap,
  ChevronDown, ChevronUp, Download
} from 'lucide-react';
import { useStore } from '../store/useStore';
import {
  listGitConfig,
  setGitConfigValue,
  unsetGitConfigValue,
  type GitConfigEntry
} from '../utils/tauri';

// Git configuration catalog with descriptions
const GIT_CONFIG_CATALOG = [
  {
    category: 'Seguridad SSL',
    icon: Shield,
    items: [
      {
        key: 'http.sslVerify',
        name: 'Verificación de Certificados SSL',
        description: 'Verifica que los certificados SSL sean válidos. Solo desactiva si usas certificados autofirmados en desarrollo.',
        values: [
          { label: '✓ Activado (Seguro)', value: 'true' },
          { label: '✗ Desactivado (Inseguro)', value: 'false' }
        ],
        dangerous: true
      },
      {
        key: 'http.sslCAInfo',
        name: 'Certificado CA personalizado',
        description: 'Ruta al archivo de certificado CA personalizado para verificación SSL.',
        type: 'text' as const,
        placeholder: '/path/to/ca-bundle.crt'
      }
    ]
  },
  {
    category: 'Credenciales',
    icon: Lock,
    items: [
      {
        key: 'credential.helper',
        name: 'Almacenamiento de Contraseñas',
        description: 'Cómo guardar tus credenciales de Git. Cache = temporal en memoria, Store = permanente en disco.',
        values: [
          { label: 'Cache (15 min)', value: 'cache' },
          { label: 'Cache 1 hora', value: 'cache --timeout=3600' },
          { label: 'Store (texto plano)', value: 'store' },
          { label: 'macOS Keychain', value: 'osxkeychain' },
          { label: 'Windows Credential Manager', value: 'manager-core' }
        ]
      }
    ]
  },
  {
    category: 'Core',
    icon: GitBranch,
    items: [
      {
        key: 'core.autocrlf',
        name: 'Saltos de Línea',
        description: 'Convierte automáticamente los finales de línea. Windows usa CRLF (\r\n), Unix/Mac usan LF (\n).',
        values: [
          { label: 'true → Convertir en Windows', value: 'true' },
          { label: 'input → Solo al commit', value: 'input' },
          { label: 'false → Sin conversión', value: 'false' }
        ]
      },
      {
        key: 'core.fileMode',
        name: 'Permisos de Archivo',
        description: 'Detecta cambios en permisos (chmod). Desactivar en Windows para evitar cambios fantasma.',
        values: [
          { label: '✓ Detectar cambios', value: 'true' },
          { label: '✗ Ignorar permisos', value: 'false' }
        ]
      },
      {
        key: 'core.ignoreCase',
        name: 'Mayúsculas/Minúsculas',
        description: 'Trata FILE.txt y file.txt como el mismo archivo. Activar en Windows/macOS, desactivar en Linux.',
        values: [
          { label: '✓ Ignorar (Windows/Mac)', value: 'true' },
          { label: '✗ Distinguir (Linux)', value: 'false' }
        ]
      },
      {
        key: 'core.longpaths',
        name: 'Rutas Largas (Windows)',
        description: 'Permite rutas con más de 260 caracteres. Necesario en proyectos con carpetas muy anidadas.',
        values: [
          { label: '✓ Permitir rutas largas', value: 'true' },
          { label: '✗ Límite 260 caracteres', value: 'false' }
        ]
      },
      {
        key: 'core.editor',
        name: 'Editor por Defecto',
        description: 'Editor que se abre para commits, rebases interactivos, etc.',
        type: 'text' as const,
        placeholder: 'code --wait'
      },
      {
        key: 'core.compression',
        name: 'Nivel de Compresión',
        description: 'Compresión de objetos Git (0=ninguna, 9=máxima). -1 = default de zlib (recomendado).',
        values: [
          { label: 'Default (-1)', value: '-1' },
          { label: 'Sin compresión (0)', value: '0' },
          { label: 'Rápida (1)', value: '1' },
          { label: 'Balanceada (6)', value: '6' },
          { label: 'Máxima (9)', value: '9' }
        ]
      },
      {
        key: 'core.quotepath',
        name: 'Caracteres Especiales',
        description: 'Muestra caracteres no-ASCII (ñ, é, 中文) tal cual en lugar de codificados como octal.',
        values: [
          { label: '✓ Codificar (safe)', value: 'true' },
          { label: '✗ Mostrar tal cual', value: 'false' }
        ]
      }
    ]
  },
  {
    category: 'Pull/Push',
    icon: Download,
    items: [
      {
        key: 'pull.rebase',
        name: 'Estrategia de Pull',
        description: 'Cómo integrar cambios remotos. Merge crea commit de merge, Rebase reescribe historial (más limpio).',
        values: [
          { label: 'Merge → Crear commit', value: 'false' },
          { label: 'Rebase → Historial lineal', value: 'true' },
          { label: 'Interactive → Manual', value: 'interactive' }
        ]
      },
      {
        key: 'push.default',
        name: 'Qué Subir en Push',
        description: 'Qué ramas se suben cuando haces push sin especificar. Simple = solo la rama actual (recomendado).',
        values: [
          { label: 'Simple → Solo rama actual', value: 'simple' },
          { label: 'Current → Rama con mismo nombre', value: 'current' },
          { label: 'Upstream → Rama configurada', value: 'upstream' },
          { label: 'Matching → Todas las ramas', value: 'matching' }
        ]
      },
      {
        key: 'push.autoSetupRemote',
        name: 'Crear Rama Remota Automática',
        description: 'Crea automáticamente la rama en el servidor al hacer push por primera vez (sin --set-upstream).',
        values: [
          { label: '✓ Crear automáticamente', value: 'true' },
          { label: '✗ Pedir confirmación', value: 'false' }
        ]
      },
      {
        key: 'push.followTags',
        name: 'Subir Tags Automáticamente',
        description: 'Sube automáticamente los tags junto con el push (sin necesidad de --tags).',
        values: [
          { label: '✓ Subir tags', value: 'true' },
          { label: '✗ Solo código', value: 'false' }
        ]
      },
      {
        key: 'fetch.prune',
        name: 'Limpiar Ramas Remotas Borradas',
        description: 'Elimina automáticamente referencias locales a ramas que fueron borradas en el servidor.',
        values: [
          { label: '✓ Auto-limpiar', value: 'true' },
          { label: '✗ Mantener referencias', value: 'false' }
        ]
      },
      {
        key: 'submodule.recurse',
        name: 'Actualizar Submódulos',
        description: 'Actualiza automáticamente submódulos en pull/checkout/merge.',
        values: [
          { label: '✓ Auto-actualizar', value: 'true' },
          { label: '✗ Manual', value: 'false' }
        ]
      }
    ]
  },
  {
    category: 'Rendimiento',
    icon: Zap,
    items: [
      {
        key: 'diff.algorithm',
        name: 'Algoritmo de Diff',
        description: 'Algoritmo para detectar diferencias. Histogram es más rápido y preciso (recomendado).',
        values: [
          { label: 'Default (myers)', value: 'myers' },
          { label: 'Minimal', value: 'minimal' },
          { label: 'Patience', value: 'patience' },
          { label: 'Histogram (mejor)', value: 'histogram' }
        ]
      },
      {
        key: 'feature.manyFiles',
        name: 'Optimizar para Muchos Archivos',
        description: 'Optimizaciones para repositorios con miles de archivos (Windows).',
        values: [
          { label: '✓ Activar', value: 'true' },
          { label: '✗ Desactivar', value: 'false' }
        ]
      },
      {
        key: 'pack.threads',
        name: 'Hilos de Compresión',
        description: 'Número de hilos CPU para operaciones de pack (0 = autodetectar).',
        values: [
          { label: 'Auto (0)', value: '0' },
          { label: '1 hilo', value: '1' },
          { label: '2 hilos', value: '2' },
          { label: '4 hilos', value: '4' },
          { label: '8 hilos', value: '8' }
        ]
      }
    ]
  },
  {
    category: 'Interfaz',
    icon: FileText,
    items: [
      {
        key: 'color.ui',
        name: 'Colores en Terminal',
        description: 'Muestra colores en los comandos de Git (log, status, diff, etc.).',
        values: [
          { label: 'Auto → Detectar terminal', value: 'auto' },
          { label: 'Siempre → Forzar colores', value: 'always' },
          { label: 'Nunca → Sin colores', value: 'false' }
        ]
      },
      {
        key: 'init.defaultBranch',
        name: 'Rama por defecto',
        description: 'Nombre de la rama principal al crear nuevos repositorios.',
        type: 'text' as const,
        placeholder: 'main'
      }
    ]
  }
];

// Saved profile interface
interface GitConfigProfile {
  id: string;
  name: string;
  description: string;
  variables: { key: string; value: string }[];
  createdAt: string;
}

// No template profiles - users create their own

// Tooltip component
function Tooltip({ children, content }: { children: React.ReactNode; content: string }) {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState<'top' | 'bottom'>('bottom');
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    setShow(true);

    // Detectar si hay espacio abajo o si debe mostrarse arriba
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Si hay menos de 200px abajo pero más arriba, mostrar arriba
      if (spaceBelow < 200 && spaceAbove > spaceBelow) {
        setPosition('top');
      } else {
        setPosition('bottom');
      }
    }
  };

  return (
    <div className="relative inline-block group" ref={triggerRef}>
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShow(false)}
      >
        {children}
      </div>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`absolute z-[9999] ${
              position === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'
            } right-0 px-4 py-2.5 rounded-lg text-sm shadow-2xl min-w-[280px] max-w-md leading-relaxed whitespace-normal pointer-events-none`}
            style={{
              background: 'var(--glass-card-bg)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)'
            }}
          >
            {content}
            <div className={`absolute ${
              position === 'bottom' ? 'bottom-full' : 'top-full'
            } right-4 border-[6px] border-transparent`} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function GitVariablesModal() {
  const { gitVariablesModal, closeGitVariablesModal, addToast } = useStore();
  const [entries, setEntries] = useState<GitConfigEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Profiles state
  const [profiles, setProfiles] = useState<GitConfigProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [showNewProfile, setShowNewProfile] = useState(false);
  const [editingProfile, setEditingProfile] = useState<GitConfigProfile | null>(null);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileDesc, setNewProfileDesc] = useState('');
  const [newProfileVars, setNewProfileVars] = useState<{ key: string; value: string }[]>([
    { key: '', value: '' }
  ]);

  // Catalog expanded state
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Seguridad SSL']);

  // Active tab - simplified to 3 tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'profiles' | 'catalog'>('overview');

  // Git user info (most important)
  const userName = entries.find(e => e.key === 'user.name')?.value;
  const userEmail = entries.find(e => e.key === 'user.email')?.value;

  // Proxy status
  const httpProxy = entries.find(e => e.key === 'http.proxy')?.value;
  const httpsProxy = entries.find(e => e.key === 'https.proxy')?.value;
  const isProxyActive = !!httpProxy || !!httpsProxy;

  // Load saved profiles from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ori-git-profiles');
    const activeId = localStorage.getItem('ori-git-active-profile');
    if (saved) {
      try {
        setProfiles(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load profiles:', e);
      }
    }
    if (activeId) {
      setActiveProfileId(activeId);
    }
  }, []);

  // Save profiles to localStorage
  const saveProfiles = (newProfiles: GitConfigProfile[]) => {
    setProfiles(newProfiles);
    localStorage.setItem('ori-git-profiles', JSON.stringify(newProfiles));
  };

  // Save active profile ID to localStorage
  const saveActiveProfileId = (id: string | null) => {
    setActiveProfileId(id);
    if (id) {
      localStorage.setItem('ori-git-active-profile', id);
    } else {
      localStorage.removeItem('ori-git-active-profile');
    }
  };

  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const config = await listGitConfig();
      console.log('[Git Config] Total entries loaded:', config.length);
      console.log('[Git Config] All entries:', config);
      setEntries(config);
    } catch (error) {
      console.error('Failed to load git config:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo cargar la configuración de Git',
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (gitVariablesModal.isOpen) {
      loadConfig();
    }
  }, [gitVariablesModal.isOpen, loadConfig]);

  const handleDeleteVariable = async (key: string) => {
    try {
      await unsetGitConfigValue(key);
      addToast({
        type: 'success',
        title: 'Variable eliminada',
        message: `${key} eliminada correctamente`,
      });
      await loadConfig();
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: `No se pudo eliminar ${key}`,
      });
    }
  };

  const handleSetConfigValue = async (key: string, value: string) => {
    setIsSaving(true);
    try {
      await setGitConfigValue(key, value);
      addToast({
        type: 'success',
        title: 'Configuración aplicada',
        message: `${key} = ${value}`,
      });
      await loadConfig();
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: `No se pudo configurar ${key}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Profile management
  const handleCreateProfile = () => {
    if (!newProfileName.trim()) {
      addToast({ type: 'warning', title: 'Nombre requerido', message: 'Introduce un nombre para el perfil' });
      return;
    }

    const validVars = newProfileVars.filter(v => v.key.trim() && v.value.trim());
    if (validVars.length === 0) {
      addToast({ type: 'warning', title: 'Variables requeridas', message: 'Añade al menos una variable' });
      return;
    }

    const newProfile: GitConfigProfile = {
      id: Date.now().toString(),
      name: newProfileName.trim(),
      description: newProfileDesc.trim(),
      variables: validVars,
      createdAt: new Date().toISOString()
    };

    saveProfiles([...profiles, newProfile]);
    setShowNewProfile(false);
    setNewProfileName('');
    setNewProfileDesc('');
    setNewProfileVars([{ key: '', value: '' }]);
    addToast({ type: 'success', title: 'Perfil creado', message: `${newProfile.name} guardado correctamente` });
  };

  const handleSaveEditProfile = () => {
    if (!editingProfile) return;

    const validVars = newProfileVars.filter(v => v.key.trim() && v.value.trim());
    if (validVars.length === 0) {
      addToast({ type: 'warning', title: 'Variables requeridas', message: 'Añade al menos una variable' });
      return;
    }

    const updatedProfile: GitConfigProfile = {
      ...editingProfile,
      name: newProfileName.trim(),
      description: newProfileDesc.trim(),
      variables: validVars
    };

    saveProfiles(profiles.map(p => p.id === editingProfile.id ? updatedProfile : p));
    setEditingProfile(null);
    setNewProfileName('');
    setNewProfileDesc('');
    setNewProfileVars([{ key: '', value: '' }]);
    addToast({ type: 'success', title: 'Perfil actualizado', message: `${updatedProfile.name} guardado` });
  };

  const handleEditProfile = (profile: GitConfigProfile) => {
    setEditingProfile(profile);
    setNewProfileName(profile.name);
    setNewProfileDesc(profile.description);
    setNewProfileVars(profile.variables.length > 0 ? [...profile.variables] : [{ key: '', value: '' }]);
    setShowNewProfile(false);
  };

  const handleCancelEdit = () => {
    setEditingProfile(null);
    setShowNewProfile(false);
    setNewProfileName('');
    setNewProfileDesc('');
    setNewProfileVars([{ key: '', value: '' }]);
  };

  const handleApplyProfile = async (profile: GitConfigProfile) => {
    setIsSaving(true);
    try {
      // Si hay un perfil activo, primero hacer unset de TODAS sus variables
      if (activeProfileId && activeProfileId !== profile.id) {
        const previousProfile = profiles.find(p => p.id === activeProfileId);
        if (previousProfile) {
          for (const variable of previousProfile.variables) {
            await unsetGitConfigValue(variable.key);
          }
        }
      }

      // Aplicar las variables del nuevo perfil
      for (const variable of profile.variables) {
        await setGitConfigValue(variable.key, variable.value);
      }

      saveActiveProfileId(profile.id);
      addToast({
        type: 'success',
        title: 'Perfil activado',
        message: `${profile.name} está ahora activo`,
      });
      await loadConfig();
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: `No se pudo aplicar el perfil`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivateProfile = async () => {
    if (!activeProfileId) return;

    setIsSaving(true);
    try {
      const activeProfile = profiles.find(p => p.id === activeProfileId);
      if (activeProfile) {
        // Hacer unset de todas las variables del perfil activo
        // Usar Promise.allSettled para que continue aunque alguna falle
        const results = await Promise.allSettled(
          activeProfile.variables.map(variable => unsetGitConfigValue(variable.key))
        );

        // Contar cuantas fallaron (excluyendo las que no existen)
        const failures = results.filter(r => r.status === 'rejected').length;
        if (failures > 0) {
          console.warn(`${failures} variables no se pudieron eliminar`);
        }
      }

      saveActiveProfileId(null);
      addToast({
        type: 'success',
        title: 'Perfil desactivado',
        message: 'Todas las variables del perfil han sido eliminadas',
      });
      await loadConfig();
    } catch (error) {
      console.error('Error deactivating profile:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo desactivar el perfil completamente',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProfile = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);

    // Si el perfil a eliminar está activo, desactivarlo primero
    if (activeProfileId === profileId) {
      handleDeactivateProfile();
    }

    saveProfiles(profiles.filter(p => p.id !== profileId));
    addToast({ type: 'success', title: 'Perfil eliminado', message: `${profile?.name} eliminado` });
  };

  const handleAddProfileVar = () => {
    setNewProfileVars([...newProfileVars, { key: '', value: '' }]);
  };

  const handleRemoveProfileVar = (index: number) => {
    setNewProfileVars(newProfileVars.filter((_, i) => i !== index));
  };

  const handleUpdateProfileVar = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...newProfileVars];
    updated[index][field] = value;
    setNewProfileVars(updated);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const getConfigValue = (key: string) => {
    // Git normaliza las keys a lowercase, así que comparamos en lowercase
    const entry = entries.find(e => e.key.toLowerCase() === key.toLowerCase());
    if (!entry) return undefined;

    // Limpiar comillas extras que vienen de Git ("value" -> value)
    let cleanValue = entry.value;
    if (cleanValue.startsWith('"') && cleanValue.endsWith('"')) {
      cleanValue = cleanValue.slice(1, -1);
    }

    return cleanValue;
  };

  const handleClose = () => {
    setEditingKey(null);
    setEditValue('');
    closeGitVariablesModal();
  };

  if (!gitVariablesModal.isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal - Fixed size */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl h-[85vh] modal-base flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-[var(--glass-border-light)] flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/20 rounded-xl">
                <Settings2 className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-theme-primary">Configuración Git Global</h2>
                <p className="text-sm text-theme-muted">Gestiona variables, proxy y perfiles de configuración</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadConfig}
                disabled={isLoading}
                className="btn-icon"
                title="Refrescar"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleClose}
                className="btn-icon"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[var(--glass-border-light)] px-5 flex-shrink-0">
            {[
              { id: 'overview', label: 'Resumen', icon: Settings2 },
              { id: 'profiles', label: 'Perfiles', icon: FolderPlus },
              { id: 'catalog', label: 'Todas las Variables', icon: Key },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-theme-muted hover:text-theme-primary'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-5">
                {/* Git User - Most Important */}
                <div className="p-5 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-xl border border-purple-500/20">
                  <h3 className="font-medium text-theme-primary mb-4 flex items-center gap-2">
                    <GitBranch className="w-5 h-5 text-purple-400" />
                    Usuario Git Global
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    {/* User Name */}
                    <div className="panel-dark p-4">
                      <div className="text-xs text-theme-muted mb-1">user.name</div>
                      {userName ? (
                        <div className="flex items-center justify-between">
                          <span className="text-theme-primary font-medium">{userName}</span>
                          <button
                            onClick={() => {
                              setEditingKey('user.name');
                              setEditValue(userName);
                            }}
                            className="btn-icon p-1.5"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-theme-muted italic">No configurado</span>
                          <button
                            onClick={() => {
                              setEditingKey('user.name');
                              setEditValue('');
                            }}
                            className="text-xs text-purple-400 hover:text-purple-300"
                          >
                            Configurar
                          </button>
                        </div>
                      )}
                    </div>

                    {/* User Email */}
                    <div className="panel-dark p-4">
                      <div className="text-xs text-theme-muted mb-1">user.email</div>
                      {userEmail ? (
                        <div className="flex items-center justify-between">
                          <span className="text-theme-primary font-medium">{userEmail}</span>
                          <button
                            onClick={() => {
                              setEditingKey('user.email');
                              setEditValue(userEmail);
                            }}
                            className="btn-icon p-1.5"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-yellow-500 italic flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            No configurado
                          </span>
                          <button
                            onClick={() => {
                              setEditingKey('user.email');
                              setEditValue('');
                            }}
                            className="text-xs text-purple-400 hover:text-purple-300"
                          >
                            Configurar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Edit inline */}
                  {(editingKey === 'user.name' || editingKey === 'user.email') && (
                    <div className="mt-4 panel-dark p-3 border-purple-500/30">
                      <div className="text-xs text-theme-muted mb-2">Editar {editingKey}</div>
                      <div className="flex gap-2">
                        <input
                          type={editingKey === 'user.email' ? 'email' : 'text'}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          placeholder={editingKey === 'user.email' ? 'tu@email.com' : 'Tu Nombre'}
                          className="input-dark flex-1"
                          autoFocus
                        />
                        <button
                          onClick={async () => {
                            if (editValue.trim()) {
                              await handleSetConfigValue(editingKey, editValue.trim());
                              setEditingKey(null);
                              setEditValue('');
                            }
                          }}
                          disabled={!editValue.trim() || isSaving}
                          className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingKey(null);
                            setEditValue('');
                          }}
                          className="btn-icon"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {(!userName || !userEmail) && (
                    <p className="text-xs text-yellow-400/80 mt-3 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Configura tu usuario para poder hacer commits y push
                    </p>
                  )}
                </div>

                {/* Proxy Status */}
                <div className="stat-card flex items-center justify-between !text-left">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-blue-400" />
                    <div>
                      <h3 className="font-medium text-theme-primary">Proxy</h3>
                      {isProxyActive ? (
                        <p className="text-xs text-theme-muted font-mono">{httpProxy || httpsProxy}</p>
                      ) : (
                        <p className="text-xs text-theme-muted">No configurado</p>
                      )}
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                    isProxyActive
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-500/20 text-theme-muted'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      isProxyActive ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
                    }`} />
                    {isProxyActive ? 'Activo' : 'Inactivo'}
                  </div>
                </div>

                {/* Active Profile */}
                {activeProfileId && (
                  <div className="stat-card border-green-500/20 flex items-center justify-between !text-left">
                    <div className="flex items-center gap-3">
                      <FolderPlus className="w-5 h-5 text-green-400" />
                      <div>
                        <h3 className="font-medium text-theme-primary">Perfil Activo</h3>
                        <p className="text-sm text-green-400">
                          {profiles.find(p => p.id === activeProfileId)?.name || 'Desconocido'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleDeactivateProfile}
                      disabled={isSaving}
                      className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs transition-colors"
                    >
                      Desactivar
                    </button>
                  </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="stat-card">
                    <div className="text-2xl font-bold text-theme-primary">{entries.length}</div>
                    <div className="text-xs text-theme-muted">Variables totales</div>
                  </div>
                  <div className="stat-card">
                    <div className="text-2xl font-bold text-theme-primary">{profiles.length}</div>
                    <div className="text-xs text-theme-muted">Perfiles guardados</div>
                  </div>
                  <div className="stat-card">
                    <div className="text-2xl font-bold text-theme-primary">
                      {activeProfileId ? '1' : '0'}
                    </div>
                    <div className="text-xs text-theme-muted">Perfil activo</div>
                  </div>
                </div>
              </div>
            )}

            {/* Catalog Tab */}
            {activeTab === 'catalog' && (
              <div className="space-y-3">
                <p className="text-sm text-theme-muted mb-4">
                  Configura opciones comunes de Git sin necesidad de usar la terminal. Pasa el cursor sobre
                  <Info className="w-3.5 h-3.5 inline mx-1 text-theme-muted" />
                  para más información.
                </p>

                {GIT_CONFIG_CATALOG.map((category) => (
                  <div key={category.category} className="category-panel">
                    <button
                      onClick={() => toggleCategory(category.category)}
                      className="category-panel-header"
                    >
                      <div className="flex items-center gap-3">
                        <category.icon className="w-5 h-5 text-purple-400" />
                        <span className="font-medium text-theme-primary">{category.category}</span>
                        <span className="text-xs text-theme-muted">({category.items.length} opciones)</span>
                      </div>
                      {expandedCategories.includes(category.category) ? (
                        <ChevronUp className="w-5 h-5 text-theme-muted" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-theme-muted" />
                      )}
                    </button>

                    <AnimatePresence>
                      {expandedCategories.includes(category.category) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-[var(--glass-border-light)]"
                        >
                          <div className="p-4 space-y-4">
                            {category.items.map((item) => {
                              const currentValue = getConfigValue(item.key);
                              const hasValue = currentValue !== undefined && currentValue !== null && currentValue !== '';

                              return (
                              <div key={item.key} className="config-item space-y-2.5">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm font-medium text-theme-primary">{item.name}</span>
                                      {'dangerous' in item && item.dangerous && (
                                        <span className="text-xs px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded border border-red-500/30">
                                          ⚠ Cuidado
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <code className="text-xs px-1.5 py-0.5 bg-black/20 text-theme-muted rounded font-mono">{item.key}</code>
                                      {hasValue ? (
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs text-theme-muted">=</span>
                                          <code className="text-xs px-2 py-0.5 bg-purple-500/30 text-purple-300 rounded font-mono font-semibold border border-purple-500/50">
                                            {currentValue}
                                          </code>
                                          <span className="text-xs px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">
                                            ✓
                                          </span>
                                        </div>
                                      ) : (
                                        <span className="text-xs text-theme-muted italic">Sin configurar (usando default)</span>
                                      )}
                                    </div>
                                  </div>
                                  <Tooltip content={item.description}>
                                    <div className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors cursor-help">
                                      <Info className="w-4 h-4 text-blue-400" />
                                    </div>
                                  </Tooltip>
                                </div>

                                {'values' in item && item.values ? (
                                  <div className="flex flex-wrap gap-2">
                                    {item.values.map((opt) => {
                                      // Normalizar valores para comparación (trim)
                                      const normalizedCurrent = String(currentValue || '').trim();
                                      const normalizedOptValue = String(opt.value).trim();
                                      const isSelected = normalizedCurrent === normalizedOptValue;

                                      return (
                                        <button
                                          key={opt.value}
                                          onClick={() => handleSetConfigValue(item.key, opt.value)}
                                          disabled={isSaving}
                                          className={`config-btn ${isSelected ? 'active' : ''}`}
                                        >
                                          {isSelected && (
                                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center border-2 border-[var(--bg-base)]">
                                              <span className="text-[8px] font-bold text-white">✓</span>
                                            </span>
                                          )}
                                          {opt.label}
                                        </button>
                                      );
                                    })}
                                    {hasValue && (
                                      <button
                                        onClick={() => handleDeleteVariable(item.key)}
                                        disabled={isSaving}
                                        title="Eliminar configuración (volver a default)"
                                        className="px-3 py-2 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all border-2 border-red-500/30 hover:border-red-500/50 hover:scale-105 flex items-center gap-1.5"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Reset</span>
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      placeholder={'placeholder' in item ? item.placeholder : ''}
                                      defaultValue={getConfigValue(item.key) || ''}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          handleSetConfigValue(item.key, (e.target as HTMLInputElement).value);
                                        }
                                      }}
                                      className="input-dark flex-1"
                                    />
                                    <button
                                      onClick={(e) => {
                                        const input = (e.target as HTMLElement).parentElement?.querySelector('input');
                                        if (input?.value) handleSetConfigValue(item.key, input.value);
                                      }}
                                      disabled={isSaving}
                                      className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </button>
                                    {hasValue && (
                                      <button
                                        onClick={() => handleDeleteVariable(item.key)}
                                        disabled={isSaving}
                                        title="Eliminar configuración (volver a default)"
                                        className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors border-2 border-red-500/30 hover:border-red-500/50"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            )}

            {/* Profiles Tab */}
            {activeTab === 'profiles' && (
              <div className="space-y-4">
                {/* Active Profile Banner */}
                {activeProfileId && (
                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <p className="text-xs text-green-400 uppercase tracking-wide">Perfil Activo</p>
                          <p className="font-medium text-theme-primary">
                            {profiles.find(p => p.id === activeProfileId)?.name || 'Desconocido'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleDeactivateProfile}
                        disabled={isSaving}
                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Desactivar
                      </button>
                    </div>
                    <p className="text-xs text-green-400/70 mt-2">
                      Al desactivar se hará <span className="font-mono">unset</span> de todas las variables de este perfil
                    </p>
                  </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-theme-secondary">
                      {profiles.length === 0
                        ? 'Crea tu primer perfil de configuración Git'
                        : `${profiles.length} perfil${profiles.length !== 1 ? 'es' : ''} guardado${profiles.length !== 1 ? 's' : ''}`
                      }
                    </p>
                    <p className="text-xs text-theme-muted mt-1">
                      Solo un perfil puede estar activo. Al cambiar, el anterior se desactiva automáticamente.
                    </p>
                  </div>
                  {!showNewProfile && !editingProfile && (
                    <button
                      onClick={() => setShowNewProfile(true)}
                      className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Nuevo Perfil
                    </button>
                  )}
                </div>

                {/* New/Edit Profile Form */}
                <AnimatePresence>
                  {(showNewProfile || editingProfile) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 category-panel border-purple-500/30 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-theme-primary flex items-center gap-2">
                            {editingProfile ? <Edit3 className="w-4 h-4 text-purple-400" /> : <Plus className="w-4 h-4 text-purple-400" />}
                            {editingProfile ? 'Editar Perfil' : 'Nuevo Perfil'}
                          </h3>
                          <button
                            onClick={handleCancelEdit}
                            className="btn-icon"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-theme-muted mb-1 block">Nombre del perfil *</label>
                            <input
                              type="text"
                              value={newProfileName}
                              onChange={(e) => setNewProfileName(e.target.value)}
                              placeholder="Ej: RIMA Proxy"
                              className="input-dark w-full"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-theme-muted mb-1 block">Descripción</label>
                            <input
                              type="text"
                              value={newProfileDesc}
                              onChange={(e) => setNewProfileDesc(e.target.value)}
                              placeholder="Túnel SSH para oficina"
                              className="input-dark w-full"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-theme-muted mb-2 block">Variables Git (clave = valor)</label>

                          {/* Quick add common variables */}
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            <span className="text-xs text-theme-muted mr-1">Añadir rápido:</span>
                            {[
                              { key: 'user.email', label: 'Email' },
                              { key: 'user.name', label: 'Nombre' },
                              { key: 'http.proxy', label: 'HTTP Proxy' },
                              { key: 'https.proxy', label: 'HTTPS Proxy' },
                            ].map(preset => (
                              <button
                                key={preset.key}
                                type="button"
                                onClick={() => {
                                  // Check if already exists
                                  if (!newProfileVars.some(v => v.key === preset.key)) {
                                    const emptyIndex = newProfileVars.findIndex(v => !v.key.trim());
                                    if (emptyIndex !== -1) {
                                      handleUpdateProfileVar(emptyIndex, 'key', preset.key);
                                    } else {
                                      setNewProfileVars([...newProfileVars, { key: preset.key, value: '' }]);
                                    }
                                  }
                                }}
                                disabled={newProfileVars.some(v => v.key === preset.key)}
                                className={`px-2 py-1 text-xs rounded transition-colors ${
                                  newProfileVars.some(v => v.key === preset.key)
                                    ? 'bg-gray-500/20 text-theme-muted cursor-not-allowed'
                                    : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                                }`}
                              >
                                + {preset.label}
                              </button>
                            ))}
                          </div>

                          <div className="space-y-2">
                            {newProfileVars.map((variable, index) => (
                              <div key={index} className="flex gap-2">
                                <input
                                  type="text"
                                  value={variable.key}
                                  onChange={(e) => handleUpdateProfileVar(index, 'key', e.target.value)}
                                  placeholder="http.proxy"
                                  className="input-dark flex-1 font-mono"
                                />
                                <input
                                  type="text"
                                  value={variable.value}
                                  onChange={(e) => handleUpdateProfileVar(index, 'value', e.target.value)}
                                  placeholder="socks5h://127.0.0.1:10443"
                                  className="input-dark flex-1 font-mono"
                                />
                                {newProfileVars.length > 1 && (
                                  <button
                                    onClick={() => handleRemoveProfileVar(index)}
                                    className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={handleAddProfileVar}
                            className="mt-2 text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Añadir variable
                          </button>
                        </div>

                        <button
                          onClick={editingProfile ? handleSaveEditProfile : handleCreateProfile}
                          className="w-full px-4 py-2.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          {editingProfile ? 'Guardar Cambios' : 'Crear Perfil'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Profiles List */}
                {profiles.length === 0 && !showNewProfile ? (
                  <div className="text-center py-12 text-theme-muted category-panel">
                    <FolderPlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No hay perfiles guardados</p>
                    <p className="text-sm mt-1">Crea un perfil para guardar configuraciones de Git</p>
                    <button
                      onClick={() => setShowNewProfile(true)}
                      className="mt-4 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-colors text-sm inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Crear primer perfil
                    </button>
                  </div>
                ) : profiles.length > 0 && (
                  <div className="space-y-3">
                    {profiles.map((profile) => {
                      const isActive = activeProfileId === profile.id;
                      return (
                        <div
                          key={profile.id}
                          className={`profile-card ${isActive ? 'active' : ''}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-theme-primary">{profile.name}</h4>
                                {isActive && (
                                  <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                                    Activo
                                  </span>
                                )}
                              </div>
                              {profile.description && (
                                <p className="text-sm text-theme-muted mt-0.5">{profile.description}</p>
                              )}

                              <div className="mt-2 space-y-1">
                                {profile.variables.map((v, i) => (
                                  <div key={i} className="text-xs text-theme-muted font-mono flex items-center gap-2">
                                    <span className="text-purple-400">{v.key}</span>
                                    <span className="opacity-50">=</span>
                                    <span className="truncate">{v.value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {!isActive && (
                                <button
                                  onClick={() => handleApplyProfile(profile)}
                                  disabled={isSaving}
                                  className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors text-sm flex items-center gap-2"
                                >
                                  <Zap className="w-4 h-4" />
                                  Activar
                                </button>
                              )}
                              <button
                                onClick={() => handleEditProfile(profile)}
                                className="btn-icon"
                                title="Editar"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProfile(profile.id)}
                                className="p-2 hover:bg-red-500/20 text-theme-muted hover:text-red-400 rounded-lg transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center gap-3 p-5 border-t border-[var(--glass-border-light)] flex-shrink-0 bg-theme-elevated">
            <div className="text-xs text-theme-muted">
              {entries.length} variables configuradas globalmente
            </div>
            <button
              onClick={handleClose}
              className="btn-secondary"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
