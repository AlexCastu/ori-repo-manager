import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useActiveEnvironment } from '../store/useStore';
import { environmentColors, defaultEnvironmentColor } from '../utils/colors';
import type { EnvironmentColor } from '../types';

interface ThemeContextType {
  color: EnvironmentColor;
  colors: typeof environmentColors[EnvironmentColor];
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    // Default theme when no context is available
    return {
      color: defaultEnvironmentColor,
      colors: environmentColors[defaultEnvironmentColor],
    };
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const activeEnvironment = useActiveEnvironment();

  const currentColor = useMemo(() => {
    return activeEnvironment?.color || defaultEnvironmentColor;
  }, [activeEnvironment?.color]);

  const themeValue = useMemo(() => ({
    color: currentColor,
    colors: environmentColors[currentColor],
  }), [currentColor]);

  // Apply CSS variables to document root for full theme change
  useEffect(() => {
    const colors = environmentColors[currentColor];
    const root = document.documentElement;

    // Set all theme variables
    root.style.setProperty('--theme-primary', colors.primary);
    root.style.setProperty('--theme-secondary', colors.secondary);

    // Generate background colors with transparency from theme color
    const primaryRgb = hexToRgb(colors.primary);
    if (primaryRgb) {
      // Background gradient mesh with theme color
      root.style.setProperty('--theme-bg-glow-1', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.12)`);
      root.style.setProperty('--theme-bg-glow-2', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.08)`);
      root.style.setProperty('--theme-bg-glow-3', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.06)`);
    }

    // Also update meta theme color for mobile browsers
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', colors.primary);
    }
  }, [currentColor]);

  return (
    <ThemeContext.Provider value={themeValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// Helper function to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}
