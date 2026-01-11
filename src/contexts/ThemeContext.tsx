import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useStore, useActiveEnvironment } from '../store/useStore';
import { environmentColors, defaultEnvironmentColor } from '../utils/colors';
import type { EnvironmentColor, AppSettings } from '../types';

type ThemeMode = AppSettings['theme'];

interface ThemeContextType {
  color: EnvironmentColor;
  colors: typeof environmentColors[EnvironmentColor];
  themeMode: ThemeMode;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    // Default theme when no context is available
    return {
      color: defaultEnvironmentColor,
      colors: environmentColors[defaultEnvironmentColor],
      themeMode: 'dark' as ThemeMode,
      isDark: true,
    };
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const activeEnvironment = useActiveEnvironment();
  const config = useStore((state) => state.config);
  const themeMode = config?.settings?.theme || 'dark';

  // Track system preference
  const [systemPrefersDark, setSystemPrefersDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Determine if we're in dark mode
  const isDark = useMemo(() => {
    if (themeMode === 'system') {
      return systemPrefersDark;
    }
    return themeMode === 'dark';
  }, [themeMode, systemPrefersDark]);

  const currentColor = useMemo(() => {
    return activeEnvironment?.color || defaultEnvironmentColor;
  }, [activeEnvironment?.color]);

  const themeValue = useMemo(() => ({
    color: currentColor,
    colors: environmentColors[currentColor],
    themeMode,
    isDark,
  }), [currentColor, themeMode, isDark]);

  // Apply CSS variables and theme class to document root
  useEffect(() => {
    const colors = environmentColors[currentColor];
    const root = document.documentElement;

    // Apply dark/light class
    root.classList.remove('dark', 'light');
    root.classList.add(isDark ? 'dark' : 'light');

    // Set all theme variables
    root.style.setProperty('--theme-primary', colors.primary);
    root.style.setProperty('--theme-secondary', colors.secondary);

    // Background gradient mesh - ALWAYS BLUE for consistency
    // The environment color is only used for icons/badges, not the background
    const blueColor = { r: 59, g: 130, b: 246 }; // #3B82F6
    root.style.setProperty('--theme-bg-glow-1', `rgba(${blueColor.r}, ${blueColor.g}, ${blueColor.b}, 0.15)`);
    root.style.setProperty('--theme-bg-glow-2', `rgba(${blueColor.r}, ${blueColor.g}, ${blueColor.b}, 0.08)`);
    root.style.setProperty('--theme-bg-glow-3', `rgba(${blueColor.r}, ${blueColor.g}, ${blueColor.b}, 0.20)`);

    // Also update meta theme color for mobile browsers
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', colors.primary);
    }
  }, [currentColor, isDark]);

  return (
    <ThemeContext.Provider value={themeValue}>
      {children}
    </ThemeContext.Provider>
  );
}
