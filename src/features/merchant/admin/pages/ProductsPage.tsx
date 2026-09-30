import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Badge } from '@/shared/ui/Badge'
import { Button, buttonClasses } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Input } from '@/shared/ui/Input'
import { IconCheck, IconExternal, IconImage, IconPackage, IconPencil, IconPlus, IconSearch, IconTrash, IconX } from '@/shared/ui/icons'
import { useProductsByStore, useStoreById } from '@/shared/hooks/useScopedData'
import { formatPrice } from '@/shared/utils/format'
import { useProductsStore } from '@/store/productsStore'
import { useUIStore } from '@/store/uiStore'
import type { Product } from '@/shared/types/domain'

export function ProductsPage() {
  const { storeId } = useParams<{ storeId: string }>()
  const store = useStoreById(storeId)
  const products = useProductsByStore(storeId)
  const updateProduct = useProductsStore((state) => state.updateProduct)
  const removeProduct = useProductsStore((state) => state.removeProduct)
  const showToast = useUIStore((state) => state.showToast)
  const [query, setQuery] = useState('')
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null)

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const sorted = [...products].sort((a, b) => b.createdAt - a.createdAt)
    if (!normalized) return sorted
    return sorted.filter(
      (product) =>
        product.name.toLowerCase().includes(normalized) ||
        product.description.toLowerCase().includes(normalized),
    )
  }, [products, query])

  if (!store) return null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Productos</h1>
          <p className="text-sm text-muted">
            {products.length} {products.length === 1 ? 'producto' : 'productos'} en {store.name}
          </p>
        </div>
        <Link to="new" className={buttonClasses('primary', 'sm')}>
          <IconPlus />
          Nuevo producto
        </Link>
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={<IconPackage width={28} height={28} />}
          title="Esta tienda no tiene productos"
          description="Agrega tu primer producto para empezar a vender: foto, precio y descripción."
          action={
            <Link to="new" className={buttonClasses('primary', 'md')}>
              <IconPlus />
              Agregar producto
            </Link>
          }
        />
      ) : (
        <>
          <div className="relative max-w-sm">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input
              value={query}
              placeholder="Buscar producto…"
              className="pl-9"
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              Ningún producto coincide con «{query}».
            </p>
          ) : (
            <Card className="divide-y divide-line">
              {filtered.map((product) => (
                <div key={product.id} className="flex items-center gap-3 p-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line">
                    {product.images[0] ? (
                      <img src={product.images[0]} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <IconImage className="text-muted" />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{product.name}</p>
                    <p className="line-clamp-1 text-xs text-muted">
                      {product.description || 'Sin descripción'}
                    </p>
                  </div>

                  <div className="hidden w-32 flex-col items-end gap-1 text-right sm:flex">
                    <span className="text-sm font-medium">
                      {formatPrice(product.price, store.currency)}
                    </span>
                    <span className="text-xs text-muted">
                      Stock: {product.stock}
                    </span>
                  </div>

                  <div className="flex flex-wrap justify-end gap-1">
                    {product.published ? (
                      <Badge variant="outline">Publicado</Badge>
                    ) : (
                      <Badge variant="muted">Oculto</Badge>
                    )}
                    {product.stock === 0 ? <Badge variant="solid">Agotado</Badge> : null}
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      title={product.published ? 'Ocultar de la tienda' : 'Publicar en la tienda'}
                      aria-label={product.published ? 'Ocultar' : 'Publicar'}
                      onClick={() => {
                        updateProduct(product.id, { published: !product.published })
                        showToast(
                          product.published
                            ? `"${product.name}" ocultada`
                            : `"${product.name}" publicada`,
                        )
                      }}
                    >
                      {product.published ? <IconX /> : <IconCheck />}
                    </Button>
                    <Link
                      to={product.id}
                      className={buttonClasses('ghost', 'sm', 'h-8 w-8 px-0')}
                      title="Editar producto"
                      aria-label="Editar producto"
                    >
                      <IconPencil />
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 px-0"
                      title="Eliminar producto"
                      aria-label="Eliminar producto"
                      onClick={() => setPendingDelete(product)}
                    >
                      <IconTrash />
                    </Button>
                    <Link
                      to={`/shop/${store.id}/products/${product.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonClasses('ghost', 'sm', 'hidden h-8 w-8 px-0 sm:inline-flex')}
                      title="Ver en tienda"
                      aria-label="Ver en tienda"
                    >
                      <IconExternal />
                    </Link>
                  </div>
                </div>
              ))}
            </Card>
          )}
        </>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title="Eliminar producto"
        message={`¿Seguro que deseas eliminar "${pendingDelete?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        onConfirm={() => {
          if (!pendingDelete) return
          removeProduct(pendingDelete.id)
          showToast(`"${pendingDelete.name}" eliminado`)
        }}
      />
    </div>
  )
}
