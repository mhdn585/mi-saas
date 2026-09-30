import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ProductCard } from '../components/ProductCard'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Input } from '@/shared/ui/Input'
import { IconPackage, IconSearch } from '@/shared/ui/icons'
import { useProductsByStore, useStoreById } from '@/shared/hooks/useScopedData'

export function CatalogPage() {
  const { storeId } = useParams<{ storeId: string }>()
  const store = useStoreById(storeId)
  const products = useProductsByStore(storeId)
  const [query, setQuery] = useState('')

  const catalog = useMemo(() => {
    const published = products
      .filter((product) => product.published)
      .sort((a, b) => b.createdAt - a.createdAt)
    const normalized = query.trim().toLowerCase()
    if (!normalized) return published
    return published.filter(
      (product) =>
        product.name.toLowerCase().includes(normalized) ||
        product.description.toLowerCase().includes(normalized),
    )
  }, [products, query])

  if (!store) return null

  return (
    <div className="flex flex-col gap-6">
      {store.description ? (
        <p className="max-w-2xl text-sm leading-relaxed text-muted">{store.description}</p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">
          Catálogo
          <span className="ml-2 text-sm font-normal text-muted">
            {catalog.length} {catalog.length === 1 ? 'producto' : 'productos'}
          </span>
        </h1>
        {catalog.length > 0 ? (
          <div className="relative w-full max-w-xs">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input
              value={query}
              placeholder="Buscar en la tienda…"
              className="pl-9"
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        ) : null}
      </div>

      {catalog.length === 0 ? (
        <EmptyState
          icon={<IconPackage width={28} height={28} />}
          title={query ? 'Sin resultados' : 'Esta tienda aún no tiene productos'}
          description={
            query
              ? `No encontramos productos para «${query}». Prueba con otra búsqueda.`
              : 'El comerciante aún no ha publicado productos. ¡Vuelve pronto!'
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {catalog.map((product) => (
            <ProductCard key={product.id} product={product} currency={store.currency} />
          ))}
        </div>
      )}
    </div>
  )
}
