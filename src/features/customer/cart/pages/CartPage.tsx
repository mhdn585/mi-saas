import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Badge } from '@/shared/ui/Badge'
import { Button, buttonClasses } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Modal } from '@/shared/ui/Modal'
import { IconAlert, IconCart, IconImage, IconTrash } from '@/shared/ui/icons'
import { QuantityStepper } from '@/shared/ui/QuantityStepper'
import { useStoreById } from '@/shared/hooks/useScopedData'
import { useCartItems, useCartStore } from '@/store/cartStore'
import { useProductsStore } from '@/store/productsStore'
import { useUIStore } from '@/store/uiStore'
import { formatPrice } from '@/shared/utils/format'
import type { CartItem, Product } from '@/shared/types/domain'

interface CartEntry {
  item: CartItem
  product: Product
}

export function CartPage() {
  const { storeId } = useParams<{ storeId: string }>()
  const store = useStoreById(storeId)
  const items = useCartItems(storeId)
  const products = useProductsStore((state) => state.products)
  const setQuantity = useCartStore((state) => state.setQuantity)
  const removeItem = useCartStore((state) => state.removeItem)
  const showToast = useUIStore((state) => state.showToast)
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  const entries = useMemo<CartEntry[]>(() => {
    if (!storeId) return []
    return items.flatMap((item) => {
      const product = products.find(
        (candidate) => candidate.id === item.productId && candidate.storeId === storeId,
      )
      return product ? [{ item, product }] : []
    })
  }, [items, products, storeId])

  useEffect(() => {
    if (!storeId) return
    for (const item of items) {
      if (!products.some((product) => product.id === item.productId)) {
        removeItem(storeId, item.productId)
      }
    }
  }, [items, products, removeItem, storeId])

  if (!store) return null

  const total = entries.reduce(
    (sum, entry) => sum + entry.product.price * entry.item.quantity,
    0,
  )

  const handleQuantity = (entry: CartEntry, next: number) => {
    if (next > entry.product.stock) {
      showToast(`Solo hay ${entry.product.stock} unidades disponibles`)
      return
    }
    setQuantity(store.id, entry.product.id, next)
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={<IconCart width={28} height={28} />}
        title="Tu carrito está vacío"
        description="Explora el catálogo y agrega los productos que te interesan."
        action={
          <Link to=".." className={buttonClasses('primary', 'md')}>
            Ver catálogo
          </Link>
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold">
          Carrito
          <span className="ml-2 text-sm font-normal text-muted">
            {entries.length} {entries.length === 1 ? 'producto' : 'productos'}
          </span>
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card className="divide-y divide-line self-start">
          {entries.map(({ item, product }) => (
            <div key={product.id} className="flex items-center gap-3 p-3">
              <Link
                to={`products/${product.id}`}
                className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line"
              >
                {product.images[0] ? (
                  <img
                    src={product.images[0]}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <IconImage className="text-muted" />
                )}
              </Link>

              <div className="min-w-0 flex-1">
                <Link
                  to={`products/${product.id}`}
                  className="truncate text-sm font-medium hover:underline underline-offset-4"
                >
                  {product.name}
                </Link>
                <p className="text-xs text-muted">
                  {formatPrice(product.price, store.currency)} c/u
                  {product.stock === 0 ? (
                    <Badge variant="solid" className="ml-2 align-middle">
                      Agotado
                    </Badge>
                  ) : null}
                </p>
              </div>

              <QuantityStepper
                value={item.quantity}
                onChange={(next) => handleQuantity({ item, product }, next)}
                min={1}
                max={Math.max(1, product.stock)}
              />

              <span className="hidden w-24 text-right text-sm font-medium sm:block">
                {formatPrice(product.price * item.quantity, store.currency)}
              </span>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 shrink-0 px-0"
                aria-label={`Quitar ${product.name}`}
                onClick={() => {
                  removeItem(store.id, product.id)
                  showToast(`"${product.name}" quitado del carrito`)
                }}
              >
                <IconTrash width={20} height={20} />
              </Button>
            </div>
          ))}
        </Card>

        <Card className="sticky top-20 flex h-fit flex-col gap-4 p-5">
          <h2 className="text-sm font-semibold">Resumen</h2>
          <div className="flex items-center justify-between text-sm text-muted">
            <span>Subtotal</span>
            <span>{formatPrice(total, store.currency)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-muted">
            <span>Envío</span>
            <span>A coordinar con la tienda</span>
          </div>
          <div className="flex items-center justify-between border-t border-line pt-3 text-base font-semibold">
            <span>Total</span>
            <span>{formatPrice(total, store.currency)}</span>
          </div>
          <Button size="lg" onClick={() => setCheckoutOpen(true)}>
            Ir a pagar
          </Button>
          <Link to=".." className={buttonClasses('outline', 'md', 'w-full')}>
            Seguir comprando
          </Link>
        </Card>
      </div>

      <Modal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        title="Finalizar compra"
        footer={
          <Button variant="outline" size="sm" onClick={() => setCheckoutOpen(false)}>
            Entendido
          </Button>
        }
      >
        <div className="flex items-start gap-3">
          <IconAlert className="mt-0.5 shrink-0" />
          <p className="text-sm text-muted">
            Estás en un prototipo funcional: todavía no hay pasarela de pagos ni gestión
            de pedidos. En la siguiente fase, este botón conectará con pagos y órdenes de
            compra reales de la tienda. Tu pedido de hoy: {entries.length}{' '}
            {entries.length === 1 ? 'producto' : 'productos'} por{' '}
            {formatPrice(total, store.currency)}.
          </p>
        </div>
      </Modal>
    </div>
  )
}
