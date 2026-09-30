import { useMediaQuery } from './useMediaQuery'

export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)')
}

export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)')
}

export function useDeviceType() {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
  if (isMobile) return 'mobile' as const
  if (isTablet) return 'tablet' as const
  return 'desktop' as const
}

export function useIsTouch(): boolean {
  const coarsePointer = useMediaQuery('(pointer: coarse)')
  if (typeof window === 'undefined') return false
  return coarsePointer || (navigator.maxTouchPoints ?? 0) > 0
}
