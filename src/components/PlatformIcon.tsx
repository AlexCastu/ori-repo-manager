import { memo } from 'react';
import type { GitPlatform } from '../types';

interface PlatformIconProps {
  platform: GitPlatform | null;
  size?: number;
  className?: string;
}

// Official platform logos as SVG components
export const PlatformIcon = memo(function PlatformIcon({
  platform,
  size = 16,
  className = ''
}: PlatformIconProps) {
  const style = { width: size, height: size };

  switch (platform) {
    case 'github':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          style={style}
          className={className}
        >
          <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
        </svg>
      );

    case 'gitlab':
      return (
        <svg
          viewBox="0 0 24 24"
          style={style}
          className={className}
        >
          <path fill="#E24329" d="m12 22.176-4.287-13.2h8.574z"/>
          <path fill="#FC6D26" d="M12 22.176 7.713 8.976H1.436z"/>
          <path fill="#FCA326" d="M1.436 8.976.072 13.17a.924.924 0 0 0 .337 1.033L12 22.176z"/>
          <path fill="#E24329" d="M1.436 8.976h6.277L5.198 1.64a.462.462 0 0 0-.879 0z"/>
          <path fill="#FC6D26" d="m12 22.176 4.287-13.2h6.277z"/>
          <path fill="#FCA326" d="m22.564 8.976 1.364 4.195a.924.924 0 0 1-.337 1.033L12 22.176z"/>
          <path fill="#E24329" d="M22.564 8.976h-6.277l2.515-7.336a.462.462 0 0 1 .879 0z"/>
        </svg>
      );

    case 'bitbucket':
      return (
        <svg
          viewBox="0 0 24 24"
          style={style}
          className={className}
        >
          <defs>
            <linearGradient id="bitbucket-gradient" x1="104.953%" x2="46.569%" y1="21.921%" y2="75.234%">
              <stop offset="7%" stopColor="#0052CC"/>
              <stop offset="100%" stopColor="#2684FF"/>
            </linearGradient>
          </defs>
          <path
            fill="url(#bitbucket-gradient)"
            d="M.778 1.211a.768.768 0 0 0-.768.892l3.263 19.81c.084.5.515.868 1.022.873H19.95a.772.772 0 0 0 .77-.646l3.27-20.03a.768.768 0 0 0-.768-.891zM14.52 15.53H9.522L8.17 8.466h7.561z"
          />
          <path
            fill="#2684FF"
            d="M23.235 8.466h-7.504l-1.26 7.064H9.522l-5.476 6.49a1.018 1.018 0 0 0 .645.232H19.95a.772.772 0 0 0 .77-.646z"
          />
        </svg>
      );

    case 'azure':
      return (
        <svg
          viewBox="0 0 24 24"
          style={style}
          className={className}
        >
          <path
            fill="#0078D4"
            d="M13.05 4.24 6.56 18.05a.5.5 0 0 1-.46.3H2.23a.5.5 0 0 1-.46-.7L8.21 4.54a1 1 0 0 1 .91-.59h3.47a.5.5 0 0 1 .46.29zm8.72 12.88-4.35 4.35a1 1 0 0 1-.71.29H9.29a.5.5 0 0 1-.35-.85l7.78-7.78a.5.5 0 0 1 .7 0l4.35 4.35a.5.5 0 0 1 0 .64zm-7.24-8.87 5.81 5.16a.5.5 0 0 1-.07.79l-7.25 4.35a.5.5 0 0 1-.76-.43V8.68a.5.5 0 0 1 .81-.39z"
          />
        </svg>
      );

    // Default Git icon for unknown platforms
    default:
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          style={style}
          className={className}
        >
          <path d="M23.546 10.93 13.067.452a1.55 1.55 0 0 0-2.188 0L8.708 2.627l2.76 2.76a1.838 1.838 0 0 1 2.327 2.341l2.658 2.66a1.838 1.838 0 0 1 1.9 3.039 1.837 1.837 0 0 1-2.6 0 1.846 1.846 0 0 1-.404-1.996L12.86 8.955v6.525a1.844 1.844 0 0 1 .485.37 1.844 1.844 0 0 1 0 2.603 1.843 1.843 0 0 1-2.604 0 1.843 1.843 0 0 1 0-2.603c.18-.18.387-.316.604-.405V8.835a1.834 1.834 0 0 1-.996-2.41L7.636 3.7.453 10.881a1.55 1.55 0 0 0 0 2.19l10.48 10.477a1.55 1.55 0 0 0 2.186 0l10.43-10.43a1.55 1.55 0 0 0 0-2.187"/>
        </svg>
      );
  }
});
