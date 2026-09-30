import { Link, NavLink, Outlet, useParams } from 'react-router-dom'
import { APP_NAME } from '@/config/constants'
import { buttonClasses } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ThemeToggle } from '@/shared/ui/ThemeToggle'
import { IconCart, IconStore } from '@/shared/ui/icons'
import { useStoreById } from '@/shared/hooks/useScopedData'
import { useCartItems } from '@/store/cartStore'
import { cn } from '@/shared/utils/cn'

export function StorefrontLayout() {
  const { storeId } = useParams<{ storeId: string }>()
  const store = useStoreById(storeId)
  const cartItems = useCartItems(storeId)
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0)

  if (!store) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <EmptyState
          icon={<IconStore width={28} height={28} />}
          title="Tienda no disponible"
          description="Esta tienda no existe o fue eliminada por su dueño."
          action={
            <Link to="/" className={buttonClasses('primary', 'md')}>
              Volver al inicio
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4">
          <Link to="." className="flex min-w-0 items-center gap-2 font-semibold">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line">
              {store.logo ? (
                <img src={store.logo} alt="" className="h-full w-full object-cover" />
              ) : (
                <IconStore />
              )}
            </span>
            <span className="truncate">{store.name}</span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            <NavLink
              to="."
              end
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'font-semibold underline underline-offset-8'
                    : 'text-muted hover:text-fg',
                )
              }
            >
              Catálogo
            </NavLink>
            <NavLink
              to="cart"
              className={({ isActive }) =>
                buttonClasses('ghost', 'sm', cn('relative', isActive && 'font-semibold'))
              }
            >
              <IconCart />
              <span className="hidden sm:inline">Carrito</span>
              {cartCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-line bg-accent px-1 text-[10px] font-semibold text-accent-fg">
                  {cartCount}
                </span>
              ) : null}
            </NavLink>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-line py-4 text-center text-xs text-muted">
        Tienda creada con {APP_NAME}
      </footer>
    </div>
  )
}
