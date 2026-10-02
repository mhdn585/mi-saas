import { Link } from 'react-router-dom'
import { APP_NAME } from '@/config/constants'
import { buttonClasses } from '@/shared/ui/Button'
import { IconStore } from '@/shared/ui/icons'
import { ThemeToggle } from '@/shared/ui/ThemeToggle'
import { useAuthStore } from '@/store/authStore'

export function WelcomePage() {
  const isAuthed = useAuthStore((state) => state.status === 'authed')
  const userName = useAuthStore((state) => state.user?.name ?? '')

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
          <span className="flex items-center gap-2 font-semibold">
            <span className="flex h-7 w-7 items-center justify-center rounded-md border border-line">
              <IconStore />
            </span>
            {APP_NAME}
          </span>
          <div className="flex items-center gap-2">
            {isAuthed ? (
              <Link to="/app" className={buttonClasses('primary', 'sm')}>
                Entrar a mis tiendas
              </Link>
            ) : (
              <>
                <Link to="/login" className={buttonClasses('ghost', 'sm')}>
                  Iniciar sesión
                </Link>
                <Link to="/registro" className={buttonClasses('primary', 'sm')}>
                  Crear cuenta
                </Link>
              </>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="max-w-2xl text-center">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            {isAuthed && userName
              ? `Hola de nuevo, ${userName.split(' ')[0]}`
              : 'Tu tienda online, lista en minutos'}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted sm:text-lg">
            Con {APP_NAME} creás tu catálogo, publicás productos con fotos, elegís tus
            colores y compartís un link para vender. Sin servidores, sin letra chica.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {isAuthed ? (
              <Link to="/app" className={buttonClasses('primary', 'lg')}>
                Entrar a mis tiendas
              </Link>
            ) : (
              <>
                <Link to="/registro" className={buttonClasses('primary', 'lg')}>
                  Crear cuenta gratis
                </Link>
                <Link to="/login" className={buttonClasses('outline', 'lg')}>
                  Iniciar sesión
                </Link>
              </>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-line py-4 text-center text-xs text-muted">
        Hecho con Flask + React — {APP_NAME}
      </footer>
    </div>
  )
}
