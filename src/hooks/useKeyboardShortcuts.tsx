import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';

export function useKeyboardShortcuts() {
  const {
    scanCurrentEnvironment,
    deselectAllProjects,
  } = useStore();
  const [showQuickSwitcher, setShowQuickSwitcher] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
        scanCurrentEnvironment();
      }

      // Escape: Clear selections / Close quick switcher
      if (e.key === 'Escape') {
        deselectAllProjects();
        setShowQuickSwitcher(false);
      }

      // Cmd/Ctrl + A: Select All Projects (when not in input)
      if (modKey && e.key === 'a' && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        // Handle in component
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    showQuickSwitcher,
    setShowQuickSwitcher,
  };
}
