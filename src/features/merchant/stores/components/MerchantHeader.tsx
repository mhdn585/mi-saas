import { Link } from 'react-router-dom'
import { APP_NAME } from '@/config/constants'
import { Button } from '@/shared/ui/Button'
import { IconStore } from '@/shared/ui/icons'
import { ThemeToggle } from '@/shared/ui/ThemeToggle'
import { useAuthStore } from '@/store/authStore'

export function MerchantHeader() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link to="/app" className="flex items-center gap-2 font-semibold">
          <span className="flex h-7 w-7 items-center justify-center rounded-md border border-line">
            <IconStore />
          </span>
          {APP_NAME}
        </Link>
        <div className="flex items-center gap-2">
          {user && (
            <span className="hidden text-sm text-muted sm:inline">
              Hola, {user.name.split(' ')[0]}
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={logout}>
            Cerrar sesión
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
