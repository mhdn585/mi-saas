import { useEffect } from 'react'
import { useUIStore, type Toast, type ToastTone } from '@/store/uiStore'
import { IconAlert, IconCheck, IconCircleX, IconX } from './icons'

const toneStyles: Record<ToastTone, { container: string; Icon: typeof IconCheck }> = {
  success: {
    container:
      'border-success/40 bg-[color-mix(in_srgb,rgb(var(--success))_10%,rgb(var(--surface)))] text-success',
    Icon: IconCheck,
  },
  error: {
    container:
      'border-danger/40 bg-[color-mix(in_srgb,rgb(var(--danger))_10%,rgb(var(--surface)))] text-danger',
    Icon: IconCircleX,
  },
  warning: {
    container:
      'border-warning/40 bg-[color-mix(in_srgb,rgb(var(--warning))_12%,rgb(var(--surface)))] text-warning',
    Icon: IconAlert,
  },
}

export function Toaster() {
  const toasts = useUIStore((state) => state.toasts)
  const dismissToast = useUIStore((state) => state.dismissToast)

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex w-[min(20rem,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDone={dismissToast} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDone }: { toast: Toast; onDone: (id: number) => void }) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDone(toast.id), 3200)
    return () => window.clearTimeout(timer)
  }, [toast.id, onDone])

  const { container, Icon } = toneStyles[toast.tone ?? 'success']

  return (
    <div
      role="status"
      aria-live={toast.tone === 'error' ? 'assertive' : 'polite'}
      className={`animate-fade-up flex items-center justify-between gap-3 rounded-md border bg-surface px-3 py-2 text-sm shadow-lg ${container}`}
    >
      <span className="flex items-center gap-2">
        <Icon className="shrink-0" />
        {toast.message}
      </span>
      <button
        type="button"
        onClick={() => onDone(toast.id)}
        aria-label="Cerrar aviso"
        className="shrink-0 text-muted hover:text-fg"
      >
        <IconX />
      </button>
    </div>
  )
}
