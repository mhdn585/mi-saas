import { Link } from 'react-router-dom'
import { Card } from '@/shared/ui/Card'
import { Badge } from '@/shared/ui/Badge'
import { buttonClasses } from '@/shared/ui/Button'
import { IconExternal, IconStore } from '@/shared/ui/icons'
import { formatDate } from '@/shared/utils/format'
import { useProductCountByStore, useProductsStatus } from '@/shared/hooks/useScopedData'
import type { Store } from '@/shared/types/domain'

export function StoreCard({ store }: { store: Store }) {
  const productCount = useProductCountByStore(store.id)
  // En el listado no se cargan los productos de cada tienda: el conteo solo
  // aparece si esa tienda ya se visitó (evita mostrar "Sin productos" falso).
  const { loaded } = useProductsStatus(store.id)

  return (
    <Card className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line">
          {store.logo ? (
            <img src={store.logo} alt="" className="h-full w-full object-cover" />
          ) : (
            <IconStore width={20} height={20} />
          )}
        </span>
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{store.name}</h3>
          <p className="text-xs text-muted">
            {loaded ? (
              <>
                {productCount === 0
                  ? 'Sin productos'
                  : `${productCount} ${productCount === 1 ? 'producto' : 'productos'}`}
                {' · '}
              </>
            ) : null}
            Creada el {formatDate(store.createdAt)}
          </p>
        </div>
      </div>

      <p className="line-clamp-2 text-sm text-muted">
        {store.description || 'Sin descripción'}
      </p>

      <div className="mt-auto flex flex-wrap gap-2">
        <Badge variant="muted">{store.currency}</Badge>
      </div>

      <div className="flex gap-2">
        <Link
          to={`/app/stores/${store.id}`}
          className={buttonClasses('primary', 'sm', 'flex-1')}
        >
          Administrar
        </Link>
        <Link
          to={`/shop/${store.id}`}
          target="_blank"
          rel="noreferrer"
          className={buttonClasses('outline', 'sm')}
        >
          Abrir tienda
          <IconExternal />
        </Link>
      </div>
    </Card>
  )
}
