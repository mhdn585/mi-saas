import type { StoreTheme } from '@/shared/types/domain'
import { themeVarsStyle } from '@/shared/utils/theme'

interface ThemePreviewProps {
  theme: StoreTheme | null
}

/** Maqueta a escala del storefront que se pinta con el tema en edición. */
export function ThemePreview({ theme }: ThemePreviewProps) {
  return (
    <div
      style={themeVarsStyle(theme)}
      className="rounded-lg border border-line bg-bg p-4"
      aria-label="Vista previa de la tienda"
    >
      <div className="flex items-center justify-between border-b border-line pb-3">
        <span className="flex items-center gap-2 font-semibold text-fg">
          <span className="h-6 w-6 rounded-md bg-accent" />
          Mi Tienda
        </span>
        <span className="rounded-md bg-accent px-3 py-1 text-xs font-medium text-accent-fg">
          Comprar
        </span>
      </div>
      <div className="mt-3 flex gap-3 rounded-md border border-line bg-surface p-3">
        <span className="h-14 w-14 shrink-0 rounded-md bg-fg/10" />
        <div className="flex min-w-0 flex-col justify-between gap-1">
          <p className="truncate text-sm font-medium text-fg">Producto destacado</p>
          <p className="truncate text-xs text-muted">Descripción corta del producto</p>
          <p className="text-sm font-semibold text-accent">$19.99</p>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-muted">Tienda creada con CreaTienda</p>
    </div>
  )
}
