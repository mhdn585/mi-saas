import { Link } from 'react-router-dom'
import { APP_NAME } from '@/config/constants'
import { MerchantHeader } from '../components/MerchantHeader'
import { StoreCard } from '../components/StoreCard'
import { Button, buttonClasses } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Spinner } from '@/shared/ui/Spinner'
import { IconAlert, IconPlus, IconStore } from '@/shared/ui/icons'
import { useStoresStatus } from '@/shared/hooks/useScopedData'
import { useStoresStore } from '@/store/storesStore'

export function StoresListPage() {
  const stores = useStoresStore((state) => state.stores)
  const load = useStoresStore((state) => state.load)
  const { loading, loaded, error } = useStoresStatus()

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <MerchantHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Mis tiendas</h1>
            <p className="mt-1 text-sm text-muted">
              Crea y gestiona varias tiendas online desde {APP_NAME}. Cada tienda es
              independiente: productos, inventario y estadísticas propios.
            </p>
          </div>
          <Link to="/app/stores/new" className={buttonClasses('primary', 'md')}>
            <IconPlus />
            Crear tienda
          </Link>
        </div>

        {loading && !loaded ? (
          <Spinner className="py-16" />
        ) : stores.length === 0 ? (
          error ? (
            <EmptyState
              icon={<IconAlert width={24} height={24} />}
              title="No se pudo conectar con el servidor"
              description={error}
              action={
                <Button onClick={() => void load({ force: true })}>
                  Reintentar
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={<IconStore width={28} height={28} />}
              title="Aún no tienes tiendas"
              description="Crea tu primera tienda online y empieza a publicar productos en minutos."
              action={
                <Link to="/app/stores/new" className={buttonClasses('primary', 'md')}>
                  <IconPlus />
                  Crear mi primera tienda
                </Link>
              }
            />
          )
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {stores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        )}
      </main>
      <footer className="border-t border-line py-4 text-center text-xs text-muted">
        Datos servidos por la API de {APP_NAME} (Flask + SQLAlchemy)
      </footer>
    </div>
  )
}
