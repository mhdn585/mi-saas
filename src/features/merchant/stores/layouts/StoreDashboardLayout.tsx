import { Link, NavLink, Outlet, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { Button, buttonClasses } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Spinner } from '@/shared/ui/Spinner'
import { ThemeToggle } from '@/shared/ui/ThemeToggle'
import {
  IconArrowLeft,
  IconBoxes,
  IconChart,
  IconDashboard,
  IconExternal,
  IconPackage,
  IconPalette,
  IconSettings,
} from '@/shared/ui/icons'
import { useStoreById, useStoresStatus } from '@/shared/hooks/useScopedData'
import { useProductsStore } from '@/store/productsStore'
import { useStoresStore } from '@/store/storesStore'
import { useUIStore } from '@/store/uiStore'
import { cn } from '@/shared/utils/cn'

const navItems = [
  { to: '.', label: 'Resumen', Icon: IconDashboard, end: true },
  { to: 'products', label: 'Productos', Icon: IconPackage, end: false },
  { to: 'inventory', label: 'Inventario', Icon: IconBoxes, end: false },
  { to: 'statistics', label: 'Estadísticas', Icon: IconChart, end: false },
  { to: 'appearance', label: 'Apariencia', Icon: IconPalette, end: false },
  { to: 'settings', label: 'Ajustes', Icon: IconSettings, end: false },
]

export function StoreDashboardLayout() {
  const { storeId } = useParams<{ storeId: string }>()
  const store = useStoreById(storeId)
  const { loading, error } = useStoresStatus()
  const loadForStore = useProductsStore((state) => state.loadForStore)
  const showToast = useUIStore((state) => state.showToast)

  useEffect(() => {
    if (!storeId) return
    void loadForStore(storeId).catch(() =>
      showToast('No se pudieron cargar los productos de la tienda', 'error'),
    )
  }, [storeId, loadForStore, showToast])

  if (!store) {
    if (loading) return <Spinner full label="Cargando tienda…" />
    return (
      <div className="flex min-h-[100dvh] items-center justify-center p-6">
        <EmptyState
          title={error ? 'Sin conexión con el servidor' : 'Tienda no encontrada'}
          description={
            error ?? 'La tienda que buscas no existe o fue eliminada.'
          }
          action={
            error ? (
              <Button
                onClick={() =>
                  void useStoresStore.getState().load({ force: true })
                }
              >
                Reintentar
              </Button>
            ) : (
              <Link to="/app" className={buttonClasses('primary', 'md')}>
                Ir a mis tiendas
              </Link>
            )
          }
        />
      </div>
    )
  }

  return (
    <div className="flex min-h-[100dvh] flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col border-b border-line md:sticky md:top-0 md:h-screen md:w-64 md:overflow-y-auto md:border-b-0 md:border-r">
        <div className="flex items-center justify-between gap-2 border-b border-line p-3">
          <Link
            to="/app"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-muted hover:bg-fg/10 hover:text-fg"
          >
            <IconArrowLeft />
            Tiendas
          </Link>
          <ThemeToggle />
        </div>

        <div className="px-4 py-3">
          <p className="truncate text-sm font-semibold">{store.name}</p>
          <p className="text-xs text-muted">Panel del comerciante</p>
        </div>

        <nav className="flex gap-1 overflow-x-auto p-2 md:flex-col">
          {navItems.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-accent text-accent-fg'
                    : 'text-muted hover:bg-fg/10 hover:text-fg',
                )
              }
            >
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto hidden p-4 md:block">
          <Link
            to={`/shop/${store.id}`}
            target="_blank"
            rel="noreferrer"
            className={buttonClasses('outline', 'sm', 'w-full')}
          >
            Ver tienda pública
            <IconExternal />
          </Link>
        </div>
      </aside>

      <main className="mx-auto w-full max-w-5xl flex-1 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  )
}
