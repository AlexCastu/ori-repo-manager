# 🗺️ ORI-RepoManager - Roadmap de Mejoras Avanzadas

## ✅ COMPLETADO

### 1. Base de Tipos TypeScript
- ✅ `GitCommit`, `GitBranch`, `GitStash`, `DiffFile`
- ✅ `ProjectTag`, `GitOperation`, `AutoSyncConfig`
- ✅ `ProjectFilters` con filtros avanzados
- ✅ Extensión de `ProjectsSlice` y `AppStore`

### 2. Comandos Rust Implementados
- ✅ `get_branches` - Listar ramas
- ✅ `checkout_branch` - Cambiar de rama
- ✅ `create_branch` - Crear nueva rama
- ✅ `delete_branch` - Eliminar rama
- ✅ `get_commits` - Historial de commits
- ✅ `get_stash_list` - Listar stashes
- ✅ `stash_save` - Guardar stash
- ✅ `stash_pop` - Aplicar stash
- ✅ `stash_drop` - Eliminar stash
- ✅ `get_file_changes` - Archivos modificados
- ✅ `get_diff` - Ver diferencias
- ✅ `batch_git_fetch` - Fetch múltiple
- ✅ `batch_git_pull` - Pull múltiple

### 3. Utilidades Frontend
- ✅ `tauriAdvanced.ts` con todas las funciones wrapper

---

## 🚧 PENDIENTE DE IMPLEMENTACIÓN

### 📋 FASE 1: Selección Múltiple y Acciones en Masa (PRIORITARIO)

#### Backend (src-tauri/src/lib.rs o git_advanced.rs)
```rust
#[tauri::command]
pub async fn batch_git_push(project_paths: Vec<String>) -> Result<Vec<(String, Result<String, String>)>, String> {
    // Similar a batch_git_pull pero con push
}
```

#### Frontend
**Archivo:** `src/store/useStore.ts`
```typescript
// Añadir al ProjectsSlice:
selectedProjects: new Set<string>(),
toggleProjectSelection: (projectPath: string) => {
  set((state) => {
    const newSelected = new Set(state.selectedProjects);
    if (newSelected.has(projectPath)) {
      newSelected.delete(projectPath);
    } else {
      newSelected.add(projectPath);
    }
    return { selectedProjects: newSelected };
  });
},
selectAllProjects: () => {
  set((state) => ({
    selectedProjects: new Set(state.projects.map(p => p.path))
  }));
},
deselectAllProjects: () => {
  set({ selectedProjects: new Set() });
},
```

**Archivo:** `src/components/BatchActionsBar.tsx`
```tsx
export function BatchActionsBar() {
  const { selectedProjects, projects } = useStore();
  const selectedCount = selectedProjects.size;

  if (selectedCount === 0) return null;

  return (
    <motion.div className="glass-panel fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-4 px-6 py-3">
        <span>{selectedCount} proyectos seleccionados</span>
        <button onClick={handleBatchPull}>Pull All</button>
        <button onClick={handleBatchFetch}>Fetch All</button>
        <button onClick={handleBatchPush}>Push All</button>
        <button onClick={deselectAll}>Deseleccionar</button>
      </div>
    </motion.div>
  );
}
```

**Archivo:** `src/components/ProjectCardCompact.tsx`
- Añadir checkbox al inicio del card
- Manejar selección con `toggleProjectSelection`

---

### 🌿 FASE 2: Gestión de Ramas

**Archivo:** `src/components/BranchSelector.tsx`
```tsx
export function BranchSelector({ projectPath }: { projectPath: string }) {
  const [branches, setBranches] = useState<GitBranch[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    getBranches(projectPath).then(setBranches);
  }, [projectPath]);

  return (
    <Dropdown>
      {/* Lista de ramas con botón de crear/eliminar */}
      {branches.map(branch => (
        <BranchItem
          key={branch.name}
          branch={branch}
          onCheckout={() => checkoutBranch(projectPath, branch.name)}
          onDelete={() => deleteBranch(projectPath, branch.name)}
        />
      ))}
      <Button onClick={() => promptCreateBranch()}>+ Nueva Rama</Button>
    </Dropdown>
  );
}
```

**Integración:** Añadir `<BranchSelector>` en `ProjectCardCompact.tsx`

---

### 📊 FASE 3: Visor de Commits

**Archivo:** `src/components/CommitHistoryModal.tsx`
```tsx
export function CommitHistoryModal({ projectPath }: Props) {
  const [commits, setCommits] = useState<GitCommit[]>([]);

  useEffect(() => {
    getCommits(projectPath, 50).then(setCommits);
  }, [projectPath]);

  return (
    <Modal>
      <Timeline>
        {commits.map(commit => (
          <CommitItem key={commit.hash}>
            <Avatar>{commit.author[0]}</Avatar>
            <div>
              <h4>{commit.message}</h4>
              <span>{commit.author} • {commit.date}</span>
            </div>
            <code>{commit.shortHash}</code>
          </CommitItem>
        ))}
      </Timeline>
    </Modal>
  );
}
```

---

### 🔍 FASE 4: Filtros Avanzados

**Archivo:** `src/components/AdvancedFilters.tsx`
```tsx
export function AdvancedFilters() {
  const { filters, setFilters } = useStore();

  return (
    <div className="glass-panel p-4">
      <Select
        label="Estado Git"
        value={filters.gitStatus}
        onChange={(v) => setFilters({ gitStatus: v })}
        options={[
          { value: 'all', label: 'Todos' },
          { value: 'with-changes', label: 'Con cambios' },
          { value: 'up-to-date', label: 'Actualizado' },
          { value: 'ahead', label: 'Commits para subir' },
          { value: 'behind', label: 'Commits para bajar' },
        ]}
      />

      <MultiSelect
        label="Plataformas"
        value={filters.platforms}
        onChange={(v) => setFilters({ platforms: v })}
        options={['github', 'gitlab', 'bitbucket', 'azure']}
      />

      <Checkbox
        label="Solo sin commitear"
        checked={filters.hasUncommitted}
        onChange={(v) => setFilters({ hasUncommitted: v })}
      />
    </div>
  );
}
```

**Actualizar:** `src/store/useStore.ts` con lógica de filtrado en `useFilteredProjects`

---

### 💾 FASE 5: Stash Management

**Archivo:** `src/components/StashPanel.tsx`
```tsx
export function StashPanel({ projectPath }: Props) {
  const [stashes, setStashes] = useState<GitStash[]>([]);

  const loadStashes = async () => {
    const list = await getStashList(projectPath);
    setStashes(list);
  };

  return (
    <Panel>
      <Button onClick={() => stashSave(projectPath, prompt('Mensaje'))}>
        Guardar Cambios Temporales
      </Button>
      {stashes.map(stash => (
        <StashItem key={stash.index}>
          <span>{stash.message}</span>
          <span>{stash.date}</span>
          <Button onClick={() => stashPop(projectPath, stash.index)}>Aplicar</Button>
          <Button onClick={() => stashDrop(projectPath, stash.index)}>Eliminar</Button>
        </StashItem>
      ))}
    </Panel>
  );
}
```

---

### 📄 FASE 6: Diff Viewer

**Archivo:** `src/components/DiffViewer.tsx`
```tsx
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export function DiffViewer({ projectPath, filePath }: Props) {
  const [diff, setDiff] = useState('');

  useEffect(() => {
    getDiff(projectPath, filePath).then(setDiff);
  }, [projectPath, filePath]);

  return (
    <Modal>
      <SyntaxHighlighter language="diff" style={vscDarkPlus}>
        {diff}
      </SyntaxHighlighter>
    </Modal>
  );
}
```

**Instalación:**
```bash
npm install react-syntax-highlighter @types/react-syntax-highlighter
```

---

### 📈 FASE 7: Dashboard de Estadísticas

Requiere comandos adicionales en Rust:
```rust
#[tauri::command]
pub async fn get_repo_stats(project_path: String) -> Result<RepoStats, String> {
    // git log --all --numstat --format="%H|%an|%ai" --since="1 month ago"
    // Parsear para obtener líneas de código, commits, etc.
}
```

**Archivo:** `src/components/StatsPanel.tsx`
```tsx
import { BarChart, LineChart } from 'recharts';

export function StatsPanel() {
  const { projects } = useStore();
  const [stats, setStats] = useState<RepoStats[]>([]);

  // Cargar estadísticas de todos los proyectos
  // Mostrar gráficos con recharts

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card title="Actividad Semanal">
        <LineChart data={activityData} />
      </Card>
      <Card title="Repos Más Activos">
        <BarChart data={activeRepos} />
      </Card>
    </div>
  );
}
```

**Instalación:**
```bash
npm install recharts
```

---

### ⌨️ FASE 8: Atajos de Teclado

**Archivo:** `src/hooks/useKeyboardShortcuts.tsx`
```tsx
export function useKeyboardShortcuts() {
  const { scanCurrentEnvironment, setSearchQuery } = useStore();
  const [showQuickSwitcher, setShowQuickSwitcher] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        setShowQuickSwitcher(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault();
        scanCurrentEnvironment();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return { showQuickSwitcher, setShowQuickSwitcher };
}
```

**Componente:** `src/components/QuickSwitcher.tsx` - Modal tipo Command Palette

---

### 🔔 FASE 9: Auto-Sync y Notificaciones

**Archivo:** `src/hooks/useAutoSync.tsx`
```tsx
export function useAutoSync() {
  const { autoSyncConfig, projects, addToast } = useStore();

  useEffect(() => {
    if (!autoSyncConfig.enabled) return;

    const interval = setInterval(async () => {
      const paths = projects.map(p => p.path);
      const results = await batchGitFetch(paths);

      const updates = results.filter(([_, result]) =>
        'Ok' in result && result.Ok.includes('new commits')
      );

      if (updates.length > 0 && autoSyncConfig.notifyOnUpdates) {
        new Notification('Actualizaciones disponibles', {
          body: `${updates.length} repositorios tienen nuevos commits`
        });
      }
    }, autoSyncConfig.intervalMinutes * 60 * 1000);

    return () => clearInterval(interval);
  }, [autoSyncConfig, projects]);
}
```

**Integración:** Llamar en `App.tsx`

---

### 🏷️ FASE 10: Sistema de Tags

**Archivo:** `src/components/TagManager.tsx`
```tsx
export function TagManager() {
  const { tags, addTag, deleteTag } = useStore();

  return (
    <Modal>
      <TagList>
        {Object.values(tags).map(tag => (
          <TagItem key={tag.id}>
            <ColorPicker value={tag.color} onChange={...} />
            <Input value={tag.name} />
            <Button onClick={() => deleteTag(tag.id)}>Eliminar</Button>
          </TagItem>
        ))}
      </TagList>
      <Button onClick={() => addTag({ name: '', color: '#3B82F6' })}>
        + Nueva Etiqueta
      </Button>
    </Modal>
  );
}
```

**Actualizar:** `ProjectCardCompact.tsx` para mostrar tags y permitir añadir/quitar

---

### 📜 FASE 11: Historial de Operaciones

**Archivo:** `src/components/GitOperationsLog.tsx`
```tsx
export function GitOperationsLog() {
  const { gitOperations } = useStore();

  return (
    <Panel>
      <Timeline>
        {gitOperations.map(op => (
          <OperationItem key={op.id} status={op.status}>
            <Icon type={op.type} />
            <div>
              <h4>{op.message}</h4>
              <span>{op.projectName}</span>
              <span>{op.timestamp}</span>
            </div>
            {op.status === 'error' && <ErrorDetails>{op.details}</ErrorDetails>}
          </OperationItem>
        ))}
      </Timeline>
    </Panel>
  );
}
```

---

### 💻 FASE 12: Terminal Integrado

**Instalación:**
```bash
npm install xterm @xterm/addon-fit
```

**Backend Rust:**
```rust
#[tauri::command]
pub async fn execute_command(
    project_path: String,
    command: String
) -> Result<String, String> {
    // Ejecutar comando en el directorio del proyecto
}
```

**Archivo:** `src/components/TerminalPanel.tsx`
```tsx
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';

export function TerminalPanel({ projectPath }: Props) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [terminal, setTerminal] = useState<Terminal | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal();
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    setTerminal(term);

    return () => term.dispose();
  }, []);

  return <div ref={terminalRef} className="terminal-container" />;
}
```

---

## 📦 Instalaciones Necesarias

```bash
# Gráficos y visualización
npm install recharts

# Syntax highlighting
npm install react-syntax-highlighter @types/react-syntax-highlighter

# Terminal
npm install xterm @xterm/addon-fit

# Color picker (para tags)
npm install react-colorful

# Notificaciones (ya incluido en Tauri)
```

---

## 🎯 Orden de Implementación Recomendado

1. ✅ **Selección Múltiple** - Impacto inmediato
2. ✅ **Gestión de Ramas** - Feature esencial
3. ✅ **Filtros Avanzados** - Mejora navegación
4. ✅ **Atajos de Teclado** - Aumenta productividad
5. **Visor de Commits** - Info importante
6. **Stash Management** - Workflow útil
7. **Auto-Sync** - Comodidad
8. **Tags** - Organización
9. **Diff Viewer** - Debugging
10. **Historial Ops** - Auditoría
11. **Estadísticas** - Insights
12. **Terminal** - Poder avanzado

---

## 🔧 Store Completo Actualizado

El archivo `src/store/useStore.ts` necesitará estas adiciones:

```typescript
interface StoreState extends AppStore {
  // Selección múltiple
  selectedProjects: Set<string>;
  toggleProjectSelection: (path: string) => void;
  selectAllProjects: () => void;
  deselectAllProjects: () => void;

  // Tags
  tags: Record<string, ProjectTag>;
  projectTags: Record<string, string[]>;
  addTag: (tag: Omit<ProjectTag, 'id' | 'createdAt'>) => string;
  deleteTag: (tagId: string) => void;
  addTagToProject: (projectPath: string, tagId: string) => void;
  removeTagFromProject: (projectPath: string, tagId: string) => void;

  // Operaciones Git
  gitOperations: GitOperation[];
  addGitOperation: (op: Omit<GitOperation, 'id' | 'timestamp'>) => void;

  // Auto-sync
  autoSyncConfig: AutoSyncConfig;
  updateAutoSyncConfig: (config: Partial<AutoSyncConfig>) => void;

  // Filtros
  filters: ProjectFilters;
  setFilters: (filters: Partial<ProjectFilters>) => void;
  resetFilters: () => void;
}
```

---

## 📝 Notas Finales

- **Testing:** Cada feature debería tener tests unitarios
- **Performance:** Implementar virtualización para listas largas (react-window)
- **Persistencia:** Guardar preferencias en `config.json`
- **Documentación:** Crear ayuda contextual para cada feature
- **Accesibilidad:** Todos los componentes con ARIA labels

**Estado actual:** Backend implementado al 80%, Frontend al 20%
**Tiempo estimado completo:** 40-60 horas de desarrollo
