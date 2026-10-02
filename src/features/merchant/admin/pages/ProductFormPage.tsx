import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ProductForm } from '../components/ProductForm'
import type { ProductFormValues } from '../components/ProductForm'
import { Card } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Spinner } from '@/shared/ui/Spinner'
import { buttonClasses } from '@/shared/ui/Button'
import { IconAlert } from '@/shared/ui/icons'
import {
  useProductById,
  useProductsStatus,
  useStoreById,
} from '@/shared/hooks/useScopedData'
import { useProductsStore } from '@/store/productsStore'
import { useUIStore } from '@/store/uiStore'

export function ProductFormPage() {
  const { storeId, productId } = useParams<{ storeId: string; productId?: string }>()
  const navigate = useNavigate()
  const store = useStoreById(storeId)
  const product = useProductById(storeId, productId)
  const { loading: productsLoading } = useProductsStatus(storeId)
  const addProduct = useProductsStore((state) => state.addProduct)
  const updateProduct = useProductsStore((state) => state.updateProduct)
  const showToast = useUIStore((state) => state.showToast)
  const [busy, setBusy] = useState(false)

  const isEditing = Boolean(productId)

  const backUrl = useMemo(() => `/app/stores/${storeId}/products`, [storeId])

  if (!store) {
    return (
      <EmptyState
        icon={<IconAlert width={24} height={24} />}
        title="Tienda no encontrada"
        action={
          <Link to="/app" className={buttonClasses('primary', 'md')}>
            Ir a mis tiendas
          </Link>
        }
      />
    )
  }

  if (isEditing && !product) {
    if (productsLoading) return <Spinner className="py-16" />
    return (
      <EmptyState
        icon={<IconAlert width={24} height={24} />}
        title="Producto no encontrado"
        action={
          <Link to={backUrl} className={buttonClasses('primary', 'md')}>
            Volver a productos
          </Link>
        }
      />
    )
  }

  const handleSubmit = async (values: ProductFormValues) => {
    setBusy(true)
    try {
      if (product) {
        await updateProduct(product.id, values)
        showToast('Producto actualizado')
      } else if (storeId) {
        await addProduct({ storeId, ...values })
        showToast('Producto creado')
      }
      navigate(backUrl)
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'No se pudo guardar el producto',
        'error',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">
          {product ? `Editar: ${product.name}` : 'Nuevo producto'}
        </h1>
        <p className="text-sm text-muted">
          Tienda {store.name} · moneda {store.currency}
        </p>
      </div>

      <Card className="p-6">
        <ProductForm
          initial={product}
          submitLabel={busy ? 'Guardando…' : product ? 'Guardar cambios' : 'Crear producto'}
          busy={busy}
          onSubmit={(values) => {
            void handleSubmit(values)
          }}
          onCancel={() => navigate(backUrl)}
        />
      </Card>
    </div>
  )
}
