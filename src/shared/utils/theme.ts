import type { CSSProperties } from 'react'
import type { StoreTheme } from '@/shared/types/domain'
import { hexToTriplet } from './color'

const CSS_VAR_BY_TOKEN: Record<keyof StoreTheme, string> = {
  bg: '--bg',
  fg: '--fg',
  surface: '--surface',
  muted: '--muted',
  line: '--line',
  accent: '--accent',
  accentFg: '--accent-fg',
}

/**
 * Estilo inline que sobreescribe las variables de tema del sistema solo
 * dentro del subtree donde se aplique (cascada de CSS). Sin tema → undefined
 * y quedan los colores por defecto de `src/index.css`.
 */
export function themeVarsStyle(theme: StoreTheme | null | undefined): CSSProperties | undefined {
  if (!theme) return undefined
  const vars: Record<string, string> = {}
  for (const [token, cssVar] of Object.entries(CSS_VAR_BY_TOKEN)) {
    vars[cssVar] = hexToTriplet(theme[token as keyof StoreTheme])
  }
  return vars as CSSProperties
}
