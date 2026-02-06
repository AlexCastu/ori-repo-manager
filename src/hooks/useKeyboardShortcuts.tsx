import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';

export function useKeyboardShortcuts() {
  const [showQuickSwitcher, setShowQuickSwitcher] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modKey = isMac ? e.metaKey : e.ctrlKey;

    // Cmd/Ctrl + P: Quick Switcher
    if (modKey && e.key === 'p') {
      e.preventDefault();
      setShowQuickSwitcher(true);
    }

    // Cmd/Ctrl + F: Focus Search
    if (modKey && e.key === 'f') {
      e.preventDefault();
      const searchInput = document.getElementById('search-input');
      searchInput?.focus();
    }

    // Cmd/Ctrl + R: Refresh/Scan
    if (modKey && e.key === 'r') {
      e.preventDefault();
      useStore.getState().scanCurrentEnvironment();
    }

    // Escape: Clear selections / Close quick switcher
    if (e.key === 'Escape') {
      useStore.getState().deselectAllProjects();
      setShowQuickSwitcher(false);
    }

    // Cmd/Ctrl + A: Select All Projects (when not in input)
    if (modKey && e.key === 'a' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
      e.preventDefault();
      useStore.getState().selectAllProjects();
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    showQuickSwitcher,
    setShowQuickSwitcher,
  };
}
