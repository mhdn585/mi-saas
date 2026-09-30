import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ImageGallery } from '../components/ImageGallery'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { IconAlert, IconCart, IconChevronLeft } from '@/shared/ui/icons'
import { QuantityStepper } from '@/shared/ui/QuantityStepper'
import { useProductById, useStoreById } from '@/shared/hooks/useScopedData'
import { useCartItems, useCartStore } from '@/store/cartStore'
import { useUIStore } from '@/store/uiStore'
import { formatPrice } from '@/shared/utils/format'

export function ProductDetailPage() {
  const { storeId, productId } = useParams<{ storeId: string; productId: string }>()
  const store = useStoreById(storeId)
  const product = useProductById(storeId, productId)
  const cartItems = useCartItems(storeId)
  const addItem = useCartStore((state) => state.addItem)
  const showToast = useUIStore((state) => state.showToast)
  const [quantity, setQuantity] = useState(1)

  if (!store || !product) {
    return (
      <EmptyState
        icon={<IconAlert width={24} height={24} />}
        title="Producto no disponible"
        description="El producto fue eliminado o ya no está publicado en esta tienda."
        action={
          <Link to=".." className="rounded-md border border-line px-4 py-2 text-sm hover:bg-accent hover:text-accent-fg">
            Volver al catálogo
          </Link>
        }
      />
    )
  }

  const inCart = cartItems.find((item) => item.productId === product.id)?.quantity ?? 0
  const remaining = Math.max(0, product.stock - inCart)
  const soldOut = product.stock === 0

  const handleAdd = () => {
    addItem(store.id, product.id, quantity)
    showToast(`"${product.name}" agregado al carrito (${quantity})`)
    setQuantity(1)
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        to=".."
        className="inline-flex w-fit items-center gap-1 text-sm text-muted hover:text-fg"
      >
        <IconChevronLeft />
        Volver al catálogo
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        <ImageGallery key={product.id} images={product.images} name={product.name} />

        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-semibold leading-tight">{product.name}</h1>

          <p className="text-2xl font-semibold">
            {formatPrice(product.price, store.currency)}
          </p>

          <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
            {soldOut ? (
              <Badge variant="solid">Agotado</Badge>
            ) : (
              <>
                <Badge variant="outline">{product.stock} disponibles</Badge>
                {inCart > 0 ? (
                  <span>{inCart} en tu carrito</span>
                ) : null}
              </>
            )}
          </div>

          <p className="whitespace-pre-line text-sm leading-relaxed">
            {product.description || 'Este producto no tiene descripción.'}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <QuantityStepper
              value={Math.min(quantity, Math.max(1, remaining))}
              onChange={setQuantity}
              min={1}
              max={Math.max(1, remaining)}
            />
            <Button size="lg" disabled={soldOut || remaining === 0} onClick={handleAdd}>
              <IconCart />
              {soldOut
                ? 'No disponible'
                : remaining === 0
                  ? 'Todo en el carrito'
                  : 'Agregar al carrito'}
            </Button>
          </div>

          {!soldOut && remaining === 0 ? (
            <p className="text-xs text-muted">
              Ya agregaste todas las unidades disponibles de este producto.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
