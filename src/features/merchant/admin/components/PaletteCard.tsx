import type { StoreTheme } from '@/shared/types/domain'
import { IconCheck } from '@/shared/ui/icons'
import { cn } from '@/shared/utils/cn'
import { themeVarsStyle } from '@/shared/utils/theme'

interface PaletteCardProps {
  name: string
  theme: StoreTheme
  selected: boolean
  onClick: () => void
}

export function PaletteCard({ name, theme, selected, onClick }: PaletteCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg border border-line p-3 text-left transition-colors',
        selected ? 'ring-2 ring-fg' : 'hover:bg-fg/5',
      )}
    >
      <div
        style={themeVarsStyle(theme)}
        className="overflow-hidden rounded-md border border-line"
      >
        <div className="flex items-center justify-between bg-bg px-2 py-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-accent" />
          <span className="h-2 w-8 rounded-full bg-line" />
        </div>
        <div className="flex gap-1 bg-bg p-1.5">
          <span className="h-8 flex-1 rounded-sm border border-line bg-surface" />
          <span className="h-8 w-6 rounded-sm bg-accent" />
        </div>
      </div>
      <span className="mt-2 flex items-center gap-1.5 text-sm font-medium text-fg">
        {selected ? <IconCheck /> : null}
        {name}
      </span>
    </button>
  )
}
