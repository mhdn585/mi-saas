import { useEffect } from 'react'
import { useUIStore, type Toast } from '@/store/uiStore'
import { IconCheck, IconX } from './icons'

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

  return (
    <div className="animate-fade-up flex items-center justify-between gap-3 rounded-md border border-line bg-surface px-3 py-2 text-sm shadow-lg">
      <span className="flex items-center gap-2">
        <IconCheck className="shrink-0" />
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
