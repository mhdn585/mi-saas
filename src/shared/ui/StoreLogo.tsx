import { useEffect, useState } from 'react'
import type { HTMLAttributes, ReactNode, SyntheticEvent } from 'react'
import type { StoreLogoConfig } from '@/shared/types/domain'
import { cn } from '@/shared/utils/cn'
import { IconStore } from './icons'

type StoreLogoProps = {
  logo: string | null
  config: StoreLogoConfig | null
  alt?: string
  fallback?: ReactNode
  widthCap?: number
} & Pick<
  HTMLAttributes<HTMLImageElement>,
  'className' | 'draggable' | 'onPointerDown' | 'onPointerMove' | 'onPointerUp'
>

export const LOGO_CONFIG_DEFAULTS = {
  fit: 'contain',
  height: 40,
  positionX: 50,
  positionY: 50,
  background: null,
} satisfies StoreLogoConfig

export const LOGO_HEIGHT_MIN = 24
export const LOGO_HEIGHT_MAX = 56

export function resolveLogoConfig(config: StoreLogoConfig | null): Required<StoreLogoConfig> {
  return {
    fit: config?.fit ?? LOGO_CONFIG_DEFAULTS.fit,
    height: config?.height ?? LOGO_CONFIG_DEFAULTS.height,
    positionX: config?.positionX ?? LOGO_CONFIG_DEFAULTS.positionX,
    positionY: config?.positionY ?? LOGO_CONFIG_DEFAULTS.positionY,
    background: config?.background ?? null,
  }
}

function coverBoxWidth(height: number, natural: { width: number; height: number }, widthCap: number) {
  const aspect = natural.width / natural.height
  return Math.min(Math.max(aspect * height, height), widthCap)
}

export function StoreLogo({
  logo,
  config,
  alt = '',
  fallback,
  widthCap = 200,
  className,
  draggable,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: StoreLogoProps) {
  const [natural, setNatural] = useState<{ width: number; height: number } | null>(null)

  useEffect(() => {
    setNatural(null)
  }, [logo])

  if (!logo) {
    return (
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line',
          className,
        )}
      >
        {fallback ?? <IconStore />}
      </span>
    )
  }

  const { fit, height, positionX, positionY, background } = resolveLogoConfig(config)
  const imageProps = {
    src: logo,
    alt,
    draggable,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onLoad: (event: SyntheticEvent<HTMLImageElement>) =>
      setNatural({
        width: event.currentTarget.naturalWidth,
        height: event.currentTarget.naturalHeight,
      }),
  }

  if (fit === 'contain' || !natural) {
    return (
      <img
        {...imageProps}
        style={{ height, maxWidth: widthCap, background: background ?? 'transparent' }}
        className={cn('shrink-0 rounded-md border border-line object-contain', className)}
      />
    )
  }

  return (
    <img
      {...imageProps}
      style={{
        height,
        width: coverBoxWidth(height, natural, widthCap),
        background: background ?? 'transparent',
        objectPosition: `${positionX}% ${positionY}%`,
      }}
      className={cn('shrink-0 rounded-md border border-line object-cover', className)}
    />
  )
}
