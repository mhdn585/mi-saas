import type { StoreTheme } from '@/shared/types/domain'

export interface PresetPalette {
  id: string
  name: string
  theme: StoreTheme
}

/** Copia de los tokens claros del sistema (src/index.css); punto de partida del editor. */
export const DEFAULT_STORE_THEME: StoreTheme = {
  bg: '#ffffff',
  fg: '#0a0a0a',
  surface: '#ffffff',
  muted: '#737373',
  line: '#0a0a0a',
  accent: '#0a0a0a',
  accentFg: '#ffffff',
}

/**
 * Paletas precargadas de la plataforma para la tienda pública.
 * Los colores por defecto del sistema (index.css) NO se modifican:
 * estas paletas se aplican solo al subtree del storefront.
 */
export const PRESET_PALETTES: PresetPalette[] = [
  {
    id: 'ambar',
    name: 'Ámbar cálido',
    theme: {
      bg: '#fff8f0',
      fg: '#3b2a1a',
      surface: '#ffffff',
      muted: '#8a7666',
      line: '#e5d8cc',
      accent: '#e8632a',
      accentFg: '#ffffff',
    },
  },
  {
    id: 'marino',
    name: 'Marino',
    theme: {
      bg: '#f5f8ff',
      fg: '#16243d',
      surface: '#ffffff',
      muted: '#5d6f8c',
      line: '#d4e0f2',
      accent: '#2563eb',
      accentFg: '#ffffff',
    },
  },
  {
    id: 'esmeralda',
    name: 'Esmeralda',
    theme: {
      bg: '#f4fbf6',
      fg: '#14281c',
      surface: '#ffffff',
      muted: '#5b7265',
      line: '#d2e8d9',
      accent: '#16a34a',
      accentFg: '#ffffff',
    },
  },
  {
    id: 'violeta',
    name: 'Violeta',
    theme: {
      bg: '#faf5ff',
      fg: '#2a1a3d',
      surface: '#ffffff',
      muted: '#7a6a8c',
      line: '#e8dcf5',
      accent: '#7c3aed',
      accentFg: '#ffffff',
    },
  },
  {
    id: 'rosa',
    name: 'Rosa vintage',
    theme: {
      bg: '#fff5f7',
      fg: '#3d1620',
      surface: '#ffffff',
      muted: '#8c6a72',
      line: '#f5d9df',
      accent: '#db2777',
      accentFg: '#ffffff',
    },
  },
  {
    id: 'cafe',
    name: 'Café tostado',
    theme: {
      bg: '#f8f5f1',
      fg: '#2b2118',
      surface: '#fffdf9',
      muted: '#7d7166',
      line: '#e2d9cc',
      accent: '#92602a',
      accentFg: '#ffffff',
    },
  },
  {
    id: 'crema',
    name: 'Crema y mostaza',
    theme: {
      bg: '#fbf7ef',
      fg: '#33302a',
      surface: '#ffffff',
      muted: '#857f72',
      line: '#e8e0cf',
      accent: '#b45309',
      accentFg: '#ffffff',
    },
  },
  {
    id: 'noche',
    name: 'Noche azulada',
    theme: {
      bg: '#101418',
      fg: '#eef2f6',
      surface: '#1a2027',
      muted: '#93a0ad',
      line: '#2c3641',
      accent: '#38bdf8',
      accentFg: '#082f49',
    },
  },
  {
    id: 'carbon',
    name: 'Carbón dorado',
    theme: {
      bg: '#18181b',
      fg: '#fafafa',
      surface: '#27272a',
      muted: '#a1a1aa',
      line: '#3f3f46',
      accent: '#fbbf24',
      accentFg: '#1c1917',
    },
  },
  {
    id: 'bosque',
    name: 'Bosque nocturno',
    theme: {
      bg: '#101c14',
      fg: '#e6f2ea',
      surface: '#18291d',
      muted: '#90a99a',
      line: '#2b4233',
      accent: '#4ade80',
      accentFg: '#052e16',
    },
  },
]
