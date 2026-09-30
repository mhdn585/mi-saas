export type DeviceType = 'mobile' | 'tablet' | 'desktop'

export const BREAKPOINTS = {
  mobileMax: 767,
  tabletMax: 1023,
} as const

function matches(query: string): boolean {
  return typeof window !== 'undefined' && window.matchMedia(query).matches
}

export function isMobileViewport(): boolean {
  return matches(`(max-width: ${BREAKPOINTS.mobileMax}px)`)
}

export function isTabletViewport(): boolean {
  return matches(
    `(min-width: ${BREAKPOINTS.mobileMax + 1}px) and (max-width: ${BREAKPOINTS.tabletMax}px)`,
  )
}

export function isDesktopViewport(): boolean {
  return matches(`(min-width: ${BREAKPOINTS.tabletMax + 1}px)`)
}

export function getDeviceType(): DeviceType {
  if (isMobileViewport()) return 'mobile'
  if (isTabletViewport()) return 'tablet'
  return 'desktop'
}

export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false
  const maxTouchPoints = navigator.maxTouchPoints ?? 0
  return matches('(pointer: coarse)') || maxTouchPoints > 0
}
