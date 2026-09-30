import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { StoreForm } from '@/features/merchant/stores/components/StoreForm'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { EmptyState } from '@/shared/ui/EmptyState'
import { IconAlert, IconTrash } from '@/shared/ui/icons'
import { useStoreById } from '@/shared/hooks/useScopedData'
import { useStoresStore } from '@/store/storesStore'
import { useUIStore } from '@/store/uiStore'

export function SettingsPage() {
  const { storeId } = useParams<{ storeId: string }>()
  const navigate = useNavigate()
  const store = useStoreById(storeId)
  const updateStore = useStoresStore((state) => state.updateStore)
  const deleteStore = useStoresStore((state) => state.deleteStore)
  const showToast = useUIStore((state) => state.showToast)
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (!store) {
    return (
      <EmptyState
        icon={<IconAlert width={24} height={24} />}
        title="Tienda no encontrada"
        action={
          <Button onClick={() => navigate('/')}>Volver a mis tiendas</Button>
        }
      />
    )
  }

  const publicUrl = `${window.location.origin}/shop/${store.id}`

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Ajustes de la tienda</h1>
        <p className="text-sm text-muted">
          Nombre, descripción, moneda y logo visibles para tus clientes.
        </p>
      </div>

      <Card className="p-6">
        <StoreForm
          key={store.updatedAt}
          initial={{
            name: store.name,
            description: store.description,
            currency: store.currency,
            logo: store.logo,
          }}
          submitLabel="Guardar cambios"
          onSubmit={(values) => {
            updateStore(store.id, values)
            showToast('Tienda actualizada')
          }}
        />
      </Card>

      <Card className="flex flex-col gap-3 p-6">
        <div>
          <h2 className="text-sm font-semibold">Enlace público de la tienda</h2>
          <p className="text-xs text-muted">
            Compártelo en tus redes sociales para que los clientes visiten tu catálogo.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-md border border-line bg-bg px-3 py-2 text-xs">
            {publicUrl}
          </code>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void navigator.clipboard
                .writeText(publicUrl)
                .then(() => showToast('Enlace copiado al portapapeles'))
                .catch(() => showToast('No se pudo copiar el enlace'))
            }}
          >
            Copiar
          </Button>
        </div>
      </Card>

      <Card className="flex flex-col gap-3 border-dashed p-6">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <IconTrash />
            Eliminar tienda
          </h2>
          <p className="mt-1 text-xs text-muted">
            Se eliminarán también todos sus productos y los carritos guardados en este
            navegador. Esta acción no se puede deshacer.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => setConfirmOpen(true)}
        >
          Eliminar «{store.name}»
        </Button>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          deleteStore(store.id)
          showToast(`Tienda "${store.name}" eliminada`)
          navigate('/')
        }}
        title="¿Eliminar tienda definitivamente?"
        message={`Se eliminará "${store.name}" junto con todo su catálogo y estadísticas locales.`}
        confirmLabel="Sí, eliminar"
      />
    </div>
  )
}
