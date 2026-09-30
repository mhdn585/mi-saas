import { Link, useParams } from 'react-router-dom'
import { Badge } from '@/shared/ui/Badge'
import { buttonClasses } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { IconExternal, IconImage, IconPlus } from '@/shared/ui/icons'
import { useProductsByStore, useStoreById } from '@/shared/hooks/useScopedData'
import { formatPrice } from '@/shared/utils/format'
import type { ReactNode } from 'react'

export function StoreOverviewPage() {
  const { storeId } = useParams<{ storeId: string }>()
  const store = useStoreById(storeId)
  const products = useProductsByStore(storeId)

  if (!store) return null

  const publishedCount = products.filter((product) => product.published).length
  const outOfStockCount = products.filter((product) => product.stock === 0).length
  const inventoryValue = products.reduce(
    (total, product) => total + product.price * product.stock,
    0,
  )
  const recentProducts = [...products]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 4)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{store.name}</h1>
          <p className="text-sm text-muted">
            {store.description || 'Sin descripción'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="products/new" className={buttonClasses('primary', 'sm')}>
            <IconPlus />
            Nuevo producto
          </Link>
          <Link
            to={`/shop/${store.id}`}
            target="_blank"
            rel="noreferrer"
            className={buttonClasses('outline', 'sm')}
          >
            Ver tienda
            <IconExternal />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Productos" value={String(products.length)} />
        <StatTile label="Publicados" value={String(publishedCount)} />
        <StatTile label="Sin stock" value={String(outOfStockCount)} />
        <StatTile label="Valor de inventario" value={formatPrice(inventoryValue, store.currency)} />
      </div>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Productos recientes</h2>
          <Link to="products" className="text-sm text-muted underline-offset-4 hover:underline">
            Ver todos
          </Link>
        </div>

        {recentProducts.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            Todavía no hay productos.{' '}
            <Link to="products/new" className="underline underline-offset-4">
              Agrega el primero
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {recentProducts.map((product) => (
              <li key={product.id} className="flex items-center gap-3 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line">
                  {product.images[0] ? (
                    <img src={product.images[0]} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <IconImage className="text-muted" />
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{product.name}</span>
                {product.published ? (
                  <Badge variant="outline">Publicado</Badge>
                ) : (
                  <Badge variant="muted">Oculto</Badge>
                )}
                <span className="w-24 text-right text-sm">
                  {formatPrice(product.price, store.currency)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

function StatTile({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </Card>
  )
}
