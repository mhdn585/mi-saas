import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/shared/utils/cn'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          'h-10 w-full rounded-md border border-line bg-bg px-3 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-fg/30 disabled:opacity-50',
          className,
        )}
        {...props}
      />
    )
  },
)
