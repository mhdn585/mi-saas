import type { StoreTheme, ThemeToken } from '@/shared/types/domain'

const HEX_RE = /^#[0-9a-fA-F]{6}$/

export function isValidHex(value: string): boolean {
  return HEX_RE.test(value)
}

export function normalizeHex(value: string): string {
  return value.toLowerCase()
}

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
  return `#${[clamp(r), clamp(g), clamp(b)].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

/** Tríada "r g b" compatible con rgb(var(--token) / <alpha-value>) de Tailwind. */
export function hexToTriplet(hex: string): string {
  return hexToRgb(hex).join(' ')
}

export function mixHex(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a)
  const [r2, g2, b2] = hexToRgb(b)
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t)
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex)
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}

/** El mejor texto posible sobre `bg`: negro o blanco. */
export function bestContrastFg(bg: string): string {
  return relativeLuminance(bg) > 0.55 ? '#0a0a0a' : '#ffffff'
}

export interface SimpleThemeInput {
  bg: string
  fg: string
  surface: string
  accent: string
}

/**
 * Modo simple: el usuario edita fondo, texto, tarjetas y acento;
 * el resto se deriva con mezclas de color y contraste automático.
 */
export function deriveTheme(simple: SimpleThemeInput): StoreTheme {
  return {
    bg: simple.bg,
    fg: simple.fg,
    surface: simple.surface,
    muted: mixHex(simple.fg, simple.bg, 0.45),
    line: mixHex(simple.fg, simple.bg, 0.18),
    accent: simple.accent,
    accentFg: bestContrastFg(simple.accent),
  }
}

/** Extrae los tokens editables en modo simple desde un tema completo. */
export function themeToSimple(theme: StoreTheme): SimpleThemeInput {
  return { bg: theme.bg, fg: theme.fg, surface: theme.surface, accent: theme.accent }
}

export const THEME_TOKEN_LABELS: Record<ThemeToken, string> = {
  bg: 'Fondo',
  fg: 'Texto',
  surface: 'Tarjetas y superficies',
  muted: 'Texto secundario',
  line: 'Bordes y líneas',
  accent: 'Acento (botones y enlaces)',
  accentFg: 'Texto sobre el acento',
}

export const SIMPLE_TOKENS: (keyof SimpleThemeInput)[] = ['bg', 'fg', 'surface', 'accent']

export const ALL_TOKENS: ThemeToken[] = [
  'bg',
  'fg',
  'surface',
  'muted',
  'line',
  'accent',
  'accentFg',
]
