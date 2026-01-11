import { useEffect } from 'react';
import { useStore, useActiveEnvironment } from '../store/useStore';
import { batchGitFetch } from '../utils/tauriAdvanced';

export function useAutoSync() {
  const { autoSyncConfig, projects, addToast, addGitOperation } = useStore();
  const activeEnvironment = useActiveEnvironment();

  useEffect(() => {
    if (!autoSyncConfig.enabled) return;
    if (!activeEnvironment) return;

    // Skip if environment is not in auto-sync list
    if (autoSyncConfig.environments.length > 0 &&
        !autoSyncConfig.environments.includes(activeEnvironment.id)) {
      return;
    }

    const performAutoSync = async () => {
      const paths = projects.filter(p => p.hasGit).map(p => p.path);
      if (paths.length === 0) return;

      addGitOperation({
        type: 'fetch',
        status: 'running',
        message: `Auto-sync: Fetching ${paths.length} repositories`,
      });

      try {
        const results = await batchGitFetch(paths);
        const updates = results.filter(([_, result]) => {
          if ('Ok' in result) {
            const msg = result.Ok.toLowerCase();
            return msg.includes('new') || msg.includes('update');
          }
          return false;
        });

        if (updates.length > 0 && autoSyncConfig.notifyOnUpdates) {
          // Request permission for notifications
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Actualizaciones disponibles', {
              body: `${updates.length} repositorio${updates.length !== 1 ? 's tienen' : ' tiene'} nuevos commits`,
              icon: '/icon.png',
            });
          }

          addToast({
            type: 'info',
            title: 'Auto-Sync',
            message: `${updates.length} repositorio${updates.length !== 1 ? 's' : ''} actualizado${updates.length !== 1 ? 's' : ''}`,
          });
        }

        addGitOperation({
          type: 'fetch',
          status: 'success',
          message: `Auto-sync completed: ${updates.length} updates found`,
        });
      } catch (error) {
        console.error('Auto-sync error:', error);
        addGitOperation({
          type: 'fetch',
          status: 'error',
          message: 'Auto-sync failed',
          details: String(error),
        });
      }
    };

    // Initial fetch if configured
    if (autoSyncConfig.autoFetchOnStart) {
      performAutoSync();
    }

    // Set up interval
    const interval = setInterval(
      performAutoSync,
      autoSyncConfig.intervalMinutes * 60 * 1000
    );

    return () => clearInterval(interval);
  }, [autoSyncConfig, projects, activeEnvironment]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);
}
