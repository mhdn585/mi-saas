import { useUIStore } from '@/store/uiStore'
import { cn } from '@/shared/utils/cn'
import { IconMoon, IconSun } from './icons'

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useUIStore((state) => state.theme)
  const toggleTheme = useUIStore((state) => state.toggleTheme)

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-md border border-line transition-colors hover:bg-accent hover:text-accent-fg',
        className,
      )}
    >
      {theme === 'dark' ? <IconMoon width={17} height={17} /> : <IconSun width={17} height={17} />}
    </button>
  )
}
