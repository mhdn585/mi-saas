import type { HTMLAttributes } from 'react'
import { cn } from '@/shared/utils/cn'

type BadgeVariant = 'outline' | 'solid' | 'muted'

const variants: Record<BadgeVariant, string> = {
  outline: 'border-line bg-transparent text-fg',
  solid: 'border-line bg-accent text-accent-fg',
  muted: 'border-transparent bg-fg/10 text-muted',
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

export function Badge({ className, variant = 'outline', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}
