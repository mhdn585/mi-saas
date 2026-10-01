import type { HTMLAttributes } from 'react'
import { cn } from '@/shared/utils/cn'

type BadgeVariant =
  | 'outline'
  | 'solid'
  | 'muted'
  | 'success'
  | 'danger'
  | 'warning'

const variants: Record<BadgeVariant, string> = {
  outline: 'border-line bg-transparent text-fg',
  solid: 'border-line bg-accent text-accent-fg',
  muted: 'border-transparent bg-fg/10 text-muted',
  success: 'border-success/40 bg-success/10 text-success',
  danger: 'border-danger/40 bg-danger/10 text-danger',
  warning: 'border-warning/40 bg-warning/10 text-warning',
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
