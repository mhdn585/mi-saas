import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/shared/utils/cn'

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'min-h-24 w-full rounded-md border border-line bg-bg px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-fg/30 disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
})
