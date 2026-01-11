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
  // Océano profundo (azul-verde original)
  ocean: {
    primary: '#184664',
    secondary: '#4eb490',
    gradient: 'linear-gradient(135deg, #000032 0%, #184664 50%, #4eb490 100%)',
    accent: 'bg-[#184664]',
    bg: 'bg-[#184664]/10',
    bgHover: 'hover:bg-[#184664]/20',
    border: 'border-[#184664]/30',
    text: 'text-[#4eb490]',
  },
  // Bosque (verde profundo)
  forest: {
    primary: '#196a4c',
    secondary: '#39b943',
    gradient: 'linear-gradient(135deg, #39b943 0%, #389c4f 20%, #2b8252 40%, #196a4c 60%, #08543d 80%, #02422d 100%)',
    accent: 'bg-[#196a4c]',
    bg: 'bg-[#196a4c]/10',
    bgHover: 'hover:bg-[#196a4c]/20',
    border: 'border-[#196a4c]/30',
    text: 'text-[#39b943]',
  },
  // Atardecer (amarillo-naranja-púrpura)
  sunset: {
    primary: '#ff952f',
    secondary: '#dcca5b',
    gradient: 'linear-gradient(135deg, #dcca5b 0%, #feb639 20%, #ff952f 40%, #f46e4b 60%, #ca4869 80%, #872863 100%)',
    accent: 'bg-[#ff952f]',
    bg: 'bg-[#ff952f]/10',
    bgHover: 'hover:bg-[#ff952f]/20',
    border: 'border-[#ff952f]/30',
    text: 'text-[#dcca5b]',
  },
  // Ártico (cyan-azul vibrante)
  arctic: {
    primary: '#48c6ef',
    secondary: '#6f86d6',
    gradient: 'linear-gradient(to top, #48c6ef 0%, #6f86d6 100%)',
    accent: 'bg-[#48c6ef]',
    bg: 'bg-[#48c6ef]/10',
    bgHover: 'hover:bg-[#48c6ef]/20',
    border: 'border-[#48c6ef]/30',
    text: 'text-[#6f86d6]',
  },
  // Violeta (púrpura-rosa)
  violet: {
    primary: '#c471f5',
    secondary: '#fa71cd',
    gradient: 'linear-gradient(to top, #c471f5 0%, #fa71cd 100%)',
    accent: 'bg-[#c471f5]',
    bg: 'bg-[#c471f5]/10',
    bgHover: 'hover:bg-[#c471f5]/20',
    border: 'border-[#c471f5]/30',
    text: 'text-[#fa71cd]',
  },
  // Coral (rosa-salmón cálido)
  coral: {
    primary: '#f9748f',
    secondary: '#fe9a8b',
    gradient: 'linear-gradient(to right, #f78ca0 0%, #f9748f 19%, #fd868c 60%, #fe9a8b 100%)',
    accent: 'bg-[#f9748f]',
    bg: 'bg-[#f9748f]/10',
    bgHover: 'hover:bg-[#f9748f]/20',
    border: 'border-[#f9748f]/30',
    text: 'text-[#fe9a8b]',
  },
  // Esmeralda (verde menta fresco)
  emerald: {
    primary: '#0ba360',
    secondary: '#3cba92',
    gradient: 'linear-gradient(to top, #0ba360 0%, #3cba92 100%)',
    accent: 'bg-[#0ba360]',
    bg: 'bg-[#0ba360]/10',
    bgHover: 'hover:bg-[#0ba360]/20',
    border: 'border-[#0ba360]/30',
    text: 'text-[#3cba92]',
  },
  // Eléctrico (azul intenso)
  electric: {
    primary: '#005bea',
    secondary: '#00c6fb',
    gradient: 'linear-gradient(to top, #00c6fb 0%, #005bea 100%)',
    accent: 'bg-[#005bea]',
    bg: 'bg-[#005bea]/10',
    bgHover: 'hover:bg-[#005bea]/20',
    border: 'border-[#005bea]/30',
    text: 'text-[#00c6fb]',
  },
  // Plata (azul gris elegante)
  silver: {
    primary: '#6a85b6',
    secondary: '#bac8e0',
    gradient: 'linear-gradient(to top, #6a85b6 0%, #bac8e0 100%)',
    accent: 'bg-[#6a85b6]',
    bg: 'bg-[#6a85b6]/10',
    bgHover: 'hover:bg-[#6a85b6]/20',
    border: 'border-[#6a85b6]/30',
    text: 'text-[#bac8e0]',
  },
  // Aurora (verde-púrpura mágico)
  aurora: {
    primary: '#6e45e2',
    secondary: '#88d3ce',
    gradient: 'linear-gradient(to top, #88d3ce 0%, #6e45e2 100%)',
    accent: 'bg-[#6e45e2]',
    bg: 'bg-[#6e45e2]/10',
    bgHover: 'hover:bg-[#6e45e2]/20',
    border: 'border-[#6e45e2]/30',
    text: 'text-[#88d3ce]',
  },
  // Teal (cyan-verde profundo)
  teal: {
    primary: '#13547a',
    secondary: '#80d0c7',
    gradient: 'linear-gradient(15deg, #13547a 0%, #80d0c7 100%)',
    accent: 'bg-[#13547a]',
    bg: 'bg-[#13547a]/10',
    bgHover: 'hover:bg-[#13547a]/20',
    border: 'border-[#13547a]/30',
    text: 'text-[#80d0c7]',
  },
  // Pizarra (gris oscuro profesional)
  slate: {
    primary: '#596164',
    secondary: '#868f96',
    gradient: 'linear-gradient(to right, #868f96 0%, #596164 100%)',
    accent: 'bg-[#596164]',
    bg: 'bg-[#596164]/10',
    bgHover: 'hover:bg-[#596164]/20',
    border: 'border-[#596164]/30',
    text: 'text-[#868f96]',
  },
  // Cobre (marrón cálido)
  copper: {
    primary: '#c79081',
    secondary: '#dfa579',
    gradient: 'linear-gradient(to top, #c79081 0%, #dfa579 100%)',
    accent: 'bg-[#c79081]',
    bg: 'bg-[#c79081]/10',
    bgHover: 'hover:bg-[#c79081]/20',
    border: 'border-[#c79081]/30',
    text: 'text-[#dfa579]',
  },
  // Marino (azul profundo clásico)
  navy: {
    primary: '#1e3c72',
    secondary: '#2a5298',
    gradient: 'linear-gradient(to top, #1e3c72 0%, #1e3c72 1%, #2a5298 100%)',
    accent: 'bg-[#1e3c72]',
    bg: 'bg-[#1e3c72]/10',
    bgHover: 'hover:bg-[#1e3c72]/20',
    border: 'border-[#1e3c72]/30',
    text: 'text-[#2a5298]',
  },
  // Llama (naranja-rojo vibrante)
  flame: {
    primary: '#fc6076',
    secondary: '#ff9a44',
    gradient: 'linear-gradient(-20deg, #fc6076 0%, #ff9a44 100%)',
    accent: 'bg-[#fc6076]',
    bg: 'bg-[#fc6076]/10',
    bgHover: 'hover:bg-[#fc6076]/20',
    border: 'border-[#fc6076]/30',
    text: 'text-[#ff9a44]',
  },
};

// Available colors as array for selection
export const availableColors: EnvironmentColor[] = [
  'ocean', 'forest', 'sunset', 'arctic', 'violet', 'coral',
  'emerald', 'electric', 'silver', 'aurora', 'teal', 'slate',
  'copper', 'navy', 'flame'
];

// Available icons as array for selection
export const availableIcons: EnvironmentIcon[] = [
  'folder', 'code', 'server', 'database', 'cloud',
  'globe', 'rocket', 'star', 'zap', 'box', 'layers', 'git-branch'
];

// Default color and icon for new environments
export const defaultEnvironmentColor: EnvironmentColor = 'ocean';
export const defaultEnvironmentIcon: EnvironmentIcon = 'folder';
