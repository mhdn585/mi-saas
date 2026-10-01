import { cn } from '@/shared/utils/cn'

interface SpinnerProps {
  label?: string
  /** Pantalla completa (layouts) frente a bloque dentro de una página. */
  full?: boolean
  className?: string
}

export function Spinner({ label = 'Cargando…', full = false, className }: SpinnerProps) {
  const content = (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex items-center justify-center gap-2', className)}
    >
      <span
        aria-hidden
        className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-line border-t-accent"
      />
      <span className="text-sm text-muted">{label}</span>
    </div>
  )

  if (!full) return content

  return <div className="flex min-h-[100dvh] items-center justify-center">{content}</div>
}
