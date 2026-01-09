import type { EnvironmentColor, EnvironmentIcon } from '../types';

// Color definitions with gradients and accents
export const environmentColors: Record<EnvironmentColor, {
  primary: string;
  secondary: string;
  gradient: string;
  accent: string;
  bg: string;
  bgHover: string;
  border: string;
  text: string;
}> = {
  emerald: {
    primary: '#10b981',
    secondary: '#34d399',
    gradient: 'from-emerald-500 to-emerald-600',
    accent: 'bg-emerald-500',
    bg: 'bg-emerald-500/10',
    bgHover: 'hover:bg-emerald-500/20',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
  },
  teal: {
    primary: '#14b8a6',
    secondary: '#2dd4bf',
    gradient: 'from-teal-500 to-teal-600',
    accent: 'bg-teal-500',
    bg: 'bg-teal-500/10',
    bgHover: 'hover:bg-teal-500/20',
    border: 'border-teal-500/30',
    text: 'text-teal-400',
  },
  cyan: {
    primary: '#06b6d4',
    secondary: '#22d3ee',
    gradient: 'from-cyan-500 to-cyan-600',
    accent: 'bg-cyan-500',
    bg: 'bg-cyan-500/10',
    bgHover: 'hover:bg-cyan-500/20',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
  },
  sky: {
    primary: '#0ea5e9',
    secondary: '#38bdf8',
    gradient: 'from-sky-500 to-sky-600',
    accent: 'bg-sky-500',
    bg: 'bg-sky-500/10',
    bgHover: 'hover:bg-sky-500/20',
    border: 'border-sky-500/30',
    text: 'text-sky-400',
  },
  blue: {
    primary: '#3b82f6',
    secondary: '#60a5fa',
    gradient: 'from-blue-500 to-blue-600',
    accent: 'bg-blue-500',
    bg: 'bg-blue-500/10',
    bgHover: 'hover:bg-blue-500/20',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
  },
  indigo: {
    primary: '#6366f1',
    secondary: '#818cf8',
    gradient: 'from-indigo-500 to-indigo-600',
    accent: 'bg-indigo-500',
    bg: 'bg-indigo-500/10',
    bgHover: 'hover:bg-indigo-500/20',
    border: 'border-indigo-500/30',
    text: 'text-indigo-400',
  },
  violet: {
    primary: '#8b5cf6',
    secondary: '#a78bfa',
    gradient: 'from-violet-500 to-violet-600',
    accent: 'bg-violet-500',
    bg: 'bg-violet-500/10',
    bgHover: 'hover:bg-violet-500/20',
    border: 'border-violet-500/30',
    text: 'text-violet-400',
  },
  purple: {
    primary: '#a855f7',
    secondary: '#c084fc',
    gradient: 'from-purple-500 to-purple-600',
    accent: 'bg-purple-500',
    bg: 'bg-purple-500/10',
    bgHover: 'hover:bg-purple-500/20',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
  },
  fuchsia: {
    primary: '#d946ef',
    secondary: '#e879f9',
    gradient: 'from-fuchsia-500 to-fuchsia-600',
    accent: 'bg-fuchsia-500',
    bg: 'bg-fuchsia-500/10',
    bgHover: 'hover:bg-fuchsia-500/20',
    border: 'border-fuchsia-500/30',
    text: 'text-fuchsia-400',
  },
  pink: {
    primary: '#ec4899',
    secondary: '#f472b6',
    gradient: 'from-pink-500 to-pink-600',
    accent: 'bg-pink-500',
    bg: 'bg-pink-500/10',
    bgHover: 'hover:bg-pink-500/20',
    border: 'border-pink-500/30',
    text: 'text-pink-400',
  },
  rose: {
    primary: '#f43f5e',
    secondary: '#fb7185',
    gradient: 'from-rose-500 to-rose-600',
    accent: 'bg-rose-500',
    bg: 'bg-rose-500/10',
    bgHover: 'hover:bg-rose-500/20',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
  },
  amber: {
    primary: '#f59e0b',
    secondary: '#fbbf24',
    gradient: 'from-amber-500 to-amber-600',
    accent: 'bg-amber-500',
    bg: 'bg-amber-500/10',
    bgHover: 'hover:bg-amber-500/20',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
  },
  orange: {
    primary: '#f97316',
    secondary: '#fb923c',
    gradient: 'from-orange-500 to-orange-600',
    accent: 'bg-orange-500',
    bg: 'bg-orange-500/10',
    bgHover: 'hover:bg-orange-500/20',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
  },
};

// Available colors as array for selection
export const availableColors: EnvironmentColor[] = [
  'emerald', 'teal', 'cyan', 'sky', 'blue',
  'indigo', 'violet', 'purple', 'fuchsia',
  'pink', 'rose', 'amber', 'orange'
];

// Available icons as array for selection
export const availableIcons: EnvironmentIcon[] = [
  'folder', 'code', 'server', 'database', 'cloud',
  'globe', 'rocket', 'star', 'zap', 'box', 'layers', 'git-branch'
];

// Default color and icon for new environments
export const defaultEnvironmentColor: EnvironmentColor = 'emerald';
export const defaultEnvironmentIcon: EnvironmentIcon = 'folder';

// Get color styles for an environment
export function getEnvironmentColorStyles(color: EnvironmentColor = 'emerald') {
  return environmentColors[color] || environmentColors.emerald;
}

// Generate CSS variables for dynamic theming
export function generateThemeVariables(color: EnvironmentColor): Record<string, string> {
  const colors = environmentColors[color];
  return {
    '--theme-primary': colors.primary,
    '--theme-secondary': colors.secondary,
  };
}
