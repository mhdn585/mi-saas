import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Input } from '@/shared/ui/Input'
import { IconBoxes, IconImage, IconSearch } from '@/shared/ui/icons'
import { useProductsByStore, useStoreById } from '@/shared/hooks/useScopedData'
import { formatPrice, parseStock } from '@/shared/utils/format'
import { LOW_STOCK_THRESHOLD } from '@/config/constants'
import { useProductsStore } from '@/store/productsStore'
import { useUIStore } from '@/store/uiStore'
import type { Product } from '@/shared/types/domain'

export function InventoryPage() {
  const { storeId } = useParams<{ storeId: string }>()
  const store = useStoreById(storeId)
  const products = useProductsByStore(storeId)
  const [query, setQuery] = useState('')
  const [onlyCritical, setOnlyCritical] = useState(false)

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return [...products]
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((product) => {
        if (normalized && !product.name.toLowerCase().includes(normalized)) return false
        if (onlyCritical && product.stock > LOW_STOCK_THRESHOLD) return false
        return true
      })
  }, [products, query, onlyCritical])

  if (!store) return null

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Inventario</h1>
        <p className="text-sm text-muted">
          Ajusta el stock disponible de cada producto. Los cambios se guardan al perder el foco.
        </p>
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={<IconBoxes width={28} height={28} />}
          title="Nada que controlar"
          description="Primero crea productos en el catálogo y aquí podrás gestionar su inventario."
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full max-w-xs">
              <IconSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <Input
                value={query}
                placeholder="Buscar producto…"
                className="pl-9"
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <Button
              variant={onlyCritical ? 'primary' : 'outline'}
              size="md"
              onClick={() => setOnlyCritical((current) => !current)}
            >
              Stock bajo o agotado
            </Button>
          </div>

          <Card className="overflow-hidden">
            <div className="hidden grid-cols-[1fr_auto_140px_160px_80px] items-center gap-3 border-b border-line px-4 py-2 text-xs uppercase tracking-wide text-muted sm:grid">
              <span>Producto</span>
              <span>Estado</span>
              <span className="text-right">Precio</span>
              <span className="text-right">Stock</span>
              <span className="text-right">Valor</span>
            </div>
            <div className="divide-y divide-line">
              {filtered.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted">
                  Sin resultados para el filtro actual.
                </p>
              ) : (
                filtered.map((product) => (
                  <InventoryRow key={product.id} product={product} currency={store.currency} />
                ))
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

function InventoryRow({ product, currency }: { product: Product; currency: string }) {
  const updateProduct = useProductsStore((state) => state.updateProduct)
  const showToast = useUIStore((state) => state.showToast)
  const [value, setValue] = useState(String(product.stock))

  useEffect(() => {
    setValue(String(product.stock))
  }, [product.stock])

  const commit = () => {
    const parsed = parseStock(value)
    if (parsed === null) {
      setValue(String(product.stock))
      showToast('Valor de stock no válido')
      return
    }
    if (parsed !== product.stock) {
      updateProduct(product.id, { stock: parsed })
      showToast(`Stock de "${product.name}" actualizado a ${parsed}`)
    }
  }

  const stockBadge =
    product.stock === 0 ? (
      <Badge variant="solid">Agotado</Badge>
    ) : product.stock <= LOW_STOCK_THRESHOLD ? (
      <Badge variant="outline">Stock bajo</Badge>
    ) : (
      <Badge variant="muted">Disponible</Badge>
    )

  return (
    <div className="grid grid-cols-1 gap-3 px-4 py-3 sm:grid-cols-[1fr_auto_140px_160px_80px] sm:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line">
          {product.images[0] ? (
            <img src={product.images[0]} alt="" className="h-full w-full object-cover" />
          ) : (
            <IconImage className="text-muted" />
          )}
        </span>
        <p className="truncate text-sm font-medium">{product.name}</p>
      </div>

      <div className="sm:justify-self-start">{stockBadge}</div>

      <span className="text-sm sm:text-right">{formatPrice(product.price, currency)}</span>

      <div className="flex items-center gap-2 sm:justify-end">
        <Input
          type="number"
          min={0}
          step={1}
          value={value}
          className="w-24 text-center"
          aria-label={`Stock de ${product.name}`}
          onChange={(event) => setValue(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') (event.target as HTMLInputElement).blur()
          }}
        />
      </div>

      <span className="text-right text-sm text-muted">
        {formatPrice(product.price * product.stock, currency)}
      </span>
    </div>
  )
}
