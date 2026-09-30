import type { SelectHTMLAttributes } from 'react'
import { cn } from '@/shared/utils/cn'

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'h-10 w-full appearance-none rounded-md border border-line bg-bg px-3 text-base focus:outline-none focus:ring-2 focus:ring-fg/30 disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
