import { memo } from 'react';

interface IdeIconProps {
  ide: string;
  size?: number;
  className?: string;
}

// SVG icons for different IDEs
const VscodeIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <mask id="mask0" mask-type="alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
      <path fillRule="evenodd" clipRule="evenodd" d="M70.9119 99.3171C72.4869 99.9307 74.2828 99.8914 75.8725 99.1264L96.4608 89.2197C98.6242 88.1787 100 85.9892 100 83.5872V16.4133C100 14.0113 98.6243 11.8218 96.4609 10.7808L75.8725 0.873756C73.7862 -0.130129 71.3446 0.11576 69.5135 1.44695C69.2461 1.63711 68.9931 1.84943 68.7586 2.08341L29.3743 38.0414L12.1361 25.0096C10.5102 23.7965 8.27196 23.8959 6.75699 25.2461L1.28169 30.0765C-0.423567 31.6009 -0.423567 34.3996 1.28169 35.924L16.2733 50.0001L1.28169 64.0762C-0.423567 65.6007 -0.423567 68.3994 1.28169 69.9237L6.75699 74.7541C8.27196 76.1043 10.5102 76.2036 12.1361 74.9906L29.3743 61.9589L68.7586 97.9167C69.3312 98.4902 70.0113 98.9493 70.9119 99.3171Z" fill="white"/>
    </mask>
    <g mask="url(#mask0)">
      <path d="M96.4614 10.7962L75.8569 0.875542C73.4719 -0.272773 70.6217 0.211611 68.75 2.08333L1.29858 64.0833C-0.418246 65.6077 -0.418246 68.4065 1.29858 69.9308L6.76547 74.7534C8.2869 76.1036 10.5272 76.203 12.1584 74.9898L93.8327 17.2767C96.0858 15.6521 99.167 17.2519 99.167 20.0833V19.9167C99.167 17.5147 97.7913 15.3253 95.6267 14.2841L75.8569 4.37713C73.4719 3.22881 70.6217 3.71319 68.75 5.58491L1.29858 67.5849C-0.418246 69.1093 -0.418246 71.9081 1.29858 73.4324L6.76547 78.255C8.2869 79.6052 10.5272 79.7046 12.1584 78.4914L93.8327 20.7783C96.0858 19.1537 99.167 20.7535 99.167 23.5849V16.4167C99.167 14.0147 97.7913 11.8253 95.6267 10.7841L96.4614 10.7962Z" fill="#0065A9"/>
      <g filter="url(#filter0_d)">
        <path d="M96.4614 89.2038L75.8569 99.1245C73.4719 100.273 70.6217 99.7884 68.75 97.9167L1.29858 35.9167C-0.418246 34.3923 -0.418246 31.5936 1.29858 30.0692L6.76547 25.2466C8.2869 23.8964 10.5272 23.797 12.1584 25.0102L93.8327 82.7233C96.0858 84.3479 99.167 82.7481 99.167 79.9167V80.0833C99.167 82.4853 97.7913 84.6747 95.6267 85.7159L75.8569 95.6229C73.4719 96.7712 70.6217 96.2868 68.75 94.4151L1.29858 32.4151C-0.418246 30.8907 -0.418246 28.0919 1.29858 26.5676L6.76547 21.745C8.2869 20.3948 10.5272 20.2954 12.1584 21.5086L93.8327 79.2217C96.0858 80.8463 99.167 79.2465 99.167 76.4151V83.5833C99.167 85.9853 97.7913 88.1747 95.6267 89.2159L96.4614 89.2038Z" fill="#007ACC"/>
      </g>
      <g filter="url(#filter1_d)">
        <path d="M75.8578 99.1263C73.4721 100.274 70.6219 99.7885 68.75 97.9166C71.0564 100.223 75 98.5895 75 95.3278V4.67213C75 1.41039 71.0564 -0.223022 68.75 2.08329C70.6219 0.211402 73.4721 -0.273666 75.8578 0.googC78.0183 1.08574 79.3617 3.27679 79.3617 5.67954V94.3204C79.3617 96.7232 78.0183 98.9142 75.8578 99.1263Z" fill="#1F9CF0"/>
      </g>
      <g opacity="0.25">
        <path fillRule="evenodd" clipRule="evenodd" d="M70.8511 99.3171C72.4261 99.9306 74.2221 99.8913 75.8117 99.1264L96.4 89.2197C98.5634 88.1787 99.9392 85.9892 99.9392 83.5871V16.4133C99.9392 14.0112 98.5635 11.8217 96.4001 10.7807L75.8117 0.873695C73.7255 -0.13019 71.2838 0.115699 69.4527 1.44689C69.1853 1.63705 68.9323 1.84937 68.6978 2.08335L29.3135 38.0414L12.0753 25.0096C10.4494 23.7964 8.21115 23.8958 6.69618 25.246L1.22089 30.0765C-0.484375 31.6008 -0.484375 34.3995 1.22089 35.9239L16.2125 50L1.22089 64.0762C-0.484375 65.6006 -0.484375 68.3993 1.22089 69.9236L6.69618 74.7541C8.21115 76.1042 10.4494 76.2036 12.0753 74.9905L29.3135 61.9588L68.6978 97.9167C69.2704 98.4901 69.9505 98.9492 70.8511 99.3171Z" fill="url(#paint0_linear)"/>
      </g>
    </g>
    <defs>
      <filter id="filter0_d" x="-8.39411" y="15.8291" width="116.727" height="92.2456" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix"/>
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"/>
        <feOffset/>
        <feGaussianBlur stdDeviation="4.16667"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
        <feBlend mode="overlay" in2="BackgroundImageFix" result="effect1_dropShadow"/>
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
      </filter>
      <filter id="filter1_d" x="60.4167" y="-8.07558" width="27.2783" height="116.151" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix"/>
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"/>
        <feOffset/>
        <feGaussianBlur stdDeviation="4.16667"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
        <feBlend mode="overlay" in2="BackgroundImageFix" result="effect1_dropShadow"/>
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
      </filter>
      <linearGradient id="paint0_linear" x1="49.9392" y1="0.257812" x2="49.9392" y2="99.7423" gradientUnits="userSpaceOnUse">
        <stop stopColor="white"/>
        <stop offset="1" stopColor="white" stopOpacity="0"/>
      </linearGradient>
    </defs>
  </svg>
);

const SublimeIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="none">
    <rect width="256" height="256" rx="50" fill="#FF9800"/>
    <g transform="translate(35, 50)">
      <path d="M5 107L175 55V5L5 57V107Z" fill="#white" fillOpacity="0.8"/>
      <path d="M5 57L175 5V55L5 107V57Z" fill="white"/>
      <path d="M5 157L175 105V55L5 107V157Z" fill="white" fillOpacity="0.6"/>
    </g>
  </svg>
);

const AtomIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 256 256">
    <ellipse cx="128" cy="128" rx="40" ry="80" fill="none" stroke="#66595C" strokeWidth="8" transform="rotate(0 128 128)"/>
    <ellipse cx="128" cy="128" rx="40" ry="80" fill="none" stroke="#66595C" strokeWidth="8" transform="rotate(60 128 128)"/>
    <ellipse cx="128" cy="128" rx="40" ry="80" fill="none" stroke="#66595C" strokeWidth="8" transform="rotate(120 128 128)"/>
    <circle cx="128" cy="128" r="12" fill="#66595C"/>
  </svg>
);

const IntellijIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 70 70">
    <defs>
      <linearGradient id="intellij-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F97A12"/>
        <stop offset="50%" stopColor="#B07B58"/>
        <stop offset="100%" stopColor="#577BAE"/>
      </linearGradient>
    </defs>
    <rect width="70" height="70" rx="10" fill="url(#intellij-grad)"/>
    <rect x="12" y="12" width="46" height="46" fill="#000"/>
    <text x="16" y="32" fill="white" fontSize="12" fontWeight="bold" fontFamily="Arial">IJ</text>
    <rect x="16" y="42" width="24" height="3" fill="white"/>
  </svg>
);

const WebstormIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 70 70">
    <defs>
      <linearGradient id="webstorm-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#07C3F2"/>
        <stop offset="100%" stopColor="#087CFA"/>
      </linearGradient>
    </defs>
    <rect width="70" height="70" rx="10" fill="url(#webstorm-grad)"/>
    <rect x="12" y="12" width="46" height="46" fill="#000"/>
    <text x="16" y="32" fill="white" fontSize="12" fontWeight="bold" fontFamily="Arial">WS</text>
    <rect x="16" y="42" width="24" height="3" fill="white"/>
  </svg>
);

const FleetIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 70 70">
    <defs>
      <linearGradient id="fleet-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#7B68EE"/>
        <stop offset="100%" stopColor="#9932CC"/>
      </linearGradient>
    </defs>
    <rect width="70" height="70" rx="10" fill="url(#fleet-grad)"/>
    <polygon points="20,20 50,35 20,50" fill="white"/>
  </svg>
);

const NvimIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <defs>
      <linearGradient id="nvim-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#57A143"/>
        <stop offset="100%" stopColor="#3D7A2E"/>
      </linearGradient>
    </defs>
    <path d="M10 5 L32 32 L10 59 L10 5" fill="url(#nvim-grad)"/>
    <path d="M54 59 L32 32 L54 5 L54 59" fill="url(#nvim-grad)"/>
  </svg>
);

const VimIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <polygon points="5,5 32,32 5,59" fill="#019833"/>
    <polygon points="59,5 32,32 59,59" fill="#019833"/>
  </svg>
);

const EmacsIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="28" fill="none" stroke="#7F5AB6" strokeWidth="4"/>
    <text x="32" y="40" fill="#7F5AB6" fontSize="24" fontWeight="bold" textAnchor="middle" fontFamily="serif">E</text>
  </svg>
);

const CursorIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <defs>
      <linearGradient id="cursor-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF6B6B"/>
        <stop offset="50%" stopColor="#4ECDC4"/>
        <stop offset="100%" stopColor="#45B7D1"/>
      </linearGradient>
    </defs>
    <rect x="8" y="8" width="48" height="48" rx="8" fill="url(#cursor-grad)"/>
    <path d="M20 20 L44 32 L20 44 L28 32 Z" fill="white"/>
  </svg>
);

const ZedIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <rect width="64" height="64" rx="10" fill="#1E1E1E"/>
    <path d="M15 20 L49 20 L15 44 L49 44" fill="none" stroke="#FF6B35" strokeWidth="5" strokeLinecap="round"/>
  </svg>
);

const TerminalIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="8" width="56" height="48" rx="4"/>
    <path d="M16 24 L28 32 L16 40"/>
    <path d="M32 40 L48 40"/>
  </svg>
);

// Map of IDE commands to their icons and labels
export const IDE_OPTIONS = {
  code: { icon: VscodeIcon, label: 'VS Code' },
  'code-insiders': { icon: VscodeIcon, label: 'VS Code Insiders' },
  cursor: { icon: CursorIcon, label: 'Cursor' },
  subl: { icon: SublimeIcon, label: 'Sublime Text' },
  atom: { icon: AtomIcon, label: 'Atom' },
  idea: { icon: IntellijIcon, label: 'IntelliJ IDEA' },
  webstorm: { icon: WebstormIcon, label: 'WebStorm' },
  pycharm: { icon: IntellijIcon, label: 'PyCharm' },
  goland: { icon: IntellijIcon, label: 'GoLand' },
  phpstorm: { icon: IntellijIcon, label: 'PhpStorm' },
  rubymine: { icon: IntellijIcon, label: 'RubyMine' },
  clion: { icon: IntellijIcon, label: 'CLion' },
  rider: { icon: IntellijIcon, label: 'Rider' },
  fleet: { icon: FleetIcon, label: 'Fleet' },
  nvim: { icon: NvimIcon, label: 'Neovim' },
  vim: { icon: VimIcon, label: 'Vim' },
  emacs: { icon: EmacsIcon, label: 'Emacs' },
  zed: { icon: ZedIcon, label: 'Zed' },
} as const;

// Installation instructions for each IDE
export const IDE_INSTALL_INSTRUCTIONS: Record<string, { macOS?: string; windows?: string; linux?: string }> = {
  code: {
    macOS: 'Cmd+Shift+P → "Install \'code\' command in PATH"',
    windows: 'Se instala automáticamente con VS Code',
    linux: 'sudo ln -s /usr/share/code/bin/code /usr/local/bin/code',
  },
  'code-insiders': {
    macOS: 'Cmd+Shift+P → "Install \'code-insiders\' command"',
    windows: 'Se instala automáticamente con VS Code Insiders',
    linux: 'Similar a VS Code regular',
  },
  cursor: {
    macOS: 'Cmd+Shift+P → "Install \'cursor\' command in PATH"',
    windows: 'Se instala automáticamente con Cursor',
    linux: 'Añadir a PATH manualmente',
  },
  subl: {
    macOS: 'sudo ln -s "/Applications/Sublime Text.app/Contents/SharedSupport/bin/subl" /usr/local/bin/subl',
    windows: 'Añadir "C:\\Program Files\\Sublime Text" a PATH',
    linux: 'sudo ln -s /opt/sublime_text/sublime_text /usr/local/bin/subl',
  },
  atom: {
    macOS: 'Se instala automáticamente con Atom',
    windows: 'Se instala automáticamente con Atom',
    linux: 'Se instala automáticamente con Atom',
  },
  idea: {
    macOS: 'Tools → Create Command-line Launcher',
    windows: 'Tools → Create Command-line Launcher',
    linux: 'Tools → Create Command-line Launcher',
  },
  webstorm: {
    macOS: 'Tools → Create Command-line Launcher',
    windows: 'Tools → Create Command-line Launcher',
    linux: 'Tools → Create Command-line Launcher',
  },
  pycharm: {
    macOS: 'Tools → Create Command-line Launcher',
    windows: 'Tools → Create Command-line Launcher',
    linux: 'Tools → Create Command-line Launcher',
  },
  goland: {
    macOS: 'Tools → Create Command-line Launcher',
    windows: 'Tools → Create Command-line Launcher',
    linux: 'Tools → Create Command-line Launcher',
  },
  phpstorm: {
    macOS: 'Tools → Create Command-line Launcher',
    windows: 'Tools → Create Command-line Launcher',
    linux: 'Tools → Create Command-line Launcher',
  },
  rubymine: {
    macOS: 'Tools → Create Command-line Launcher',
    windows: 'Tools → Create Command-line Launcher',
    linux: 'Tools → Create Command-line Launcher',
  },
  clion: {
    macOS: 'Tools → Create Command-line Launcher',
    windows: 'Tools → Create Command-line Launcher',
    linux: 'Tools → Create Command-line Launcher',
  },
  rider: {
    macOS: 'Tools → Create Command-line Launcher',
    windows: 'Tools → Create Command-line Launcher',
    linux: 'Tools → Create Command-line Launcher',
  },
  fleet: {
    macOS: 'Se instala automáticamente con Fleet',
    windows: 'Se instala automáticamente con Fleet',
    linux: 'Se instala automáticamente con Fleet',
  },
  nvim: {
    macOS: 'brew install neovim',
    windows: 'choco install neovim o winget install Neovim.Neovim',
    linux: 'sudo apt install neovim o sudo pacman -S neovim',
  },
  vim: {
    macOS: 'Preinstalado en macOS',
    windows: 'choco install vim o descargar de vim.org',
    linux: 'Preinstalado en la mayoría de distribuciones',
  },
  emacs: {
    macOS: 'brew install emacs',
    windows: 'choco install emacs',
    linux: 'sudo apt install emacs o sudo pacman -S emacs',
  },
  zed: {
    macOS: 'Se instala automáticamente con Zed',
    windows: 'En desarrollo',
    linux: 'curl https://zed.dev/install.sh | sh',
  },
};

export type IdeCommand = keyof typeof IDE_OPTIONS;

export const IdeIcon = memo(function IdeIcon({ ide, size = 16 }: IdeIconProps) {
  const lowerIde = ide.toLowerCase();

  // Try to match the IDE command
  for (const [key, value] of Object.entries(IDE_OPTIONS)) {
    if (lowerIde.includes(key)) {
      const Icon = value.icon;
      return <Icon size={size} />;
    }
  }

  // Default to terminal icon
  return <TerminalIcon size={size} />;
});

export const getIdeLabel = (ide: string): string => {
  const lowerIde = ide.toLowerCase();

  for (const [key, value] of Object.entries(IDE_OPTIONS)) {
    if (lowerIde.includes(key)) {
      return value.label;
    }
  }

  return 'IDE';
};
