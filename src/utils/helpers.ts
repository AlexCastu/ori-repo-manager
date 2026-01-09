import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Merge Tailwind classes with clsx
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date to relative time
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora mismo';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays} días`;

  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Get platform icon name
export function getPlatformIcon(platform: string | null): string {
  switch (platform) {
    case 'github': return 'Github';
    case 'gitlab': return 'Gitlab';
    case 'bitbucket': return 'Box';
    case 'azure': return 'Cloud';
    default: return 'GitBranch';
  }
}

// Get platform color
export function getPlatformColor(platform: string | null): string {
  switch (platform) {
    case 'github': return 'text-gray-100';
    case 'gitlab': return 'text-orange-400';
    case 'bitbucket': return 'text-blue-400';
    case 'azure': return 'text-cyan-400';
    default: return 'text-purple-400';
  }
}

// Truncate text
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

// Extract repo name from URL
export function extractRepoName(url: string): string {
  if (!url) return '';
  // Remove .git suffix and extract last part
  const cleaned = url.replace(/\.git$/, '');
  const parts = cleaned.split('/');
  return parts[parts.length - 1] || '';
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
