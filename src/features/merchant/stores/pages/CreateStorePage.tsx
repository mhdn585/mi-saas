import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MerchantHeader } from '../components/MerchantHeader'
import { StoreForm } from '../components/StoreForm'
import type { StoreFormValues } from '../components/StoreForm'
import { Card } from '@/shared/ui/Card'
import { useStoresStore } from '@/store/storesStore'
import { useUIStore } from '@/store/uiStore'

export function CreateStorePage() {
  const navigate = useNavigate()
  const createStore = useStoresStore((state) => state.createStore)
  const showToast = useUIStore((state) => state.showToast)
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (values: StoreFormValues) => {
    setBusy(true)
    try {
      const store = await createStore(values)
      showToast(`Tienda "${store.name}" creada`)
      navigate(`/stores/${store.id}`)
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'No se pudo crear la tienda',
        'error',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <MerchantHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10">
        <Card className="p-6">
          <h1 className="mb-6 text-xl font-semibold">Nueva tienda</h1>
          <StoreForm
            submitLabel={busy ? 'Creando…' : 'Crear tienda'}
            busy={busy}
            onSubmit={(values) => {
              void handleSubmit(values)
            }}
            onCancel={() => navigate('/')}
          />
        </Card>
      </main>
    </div>
  )
}
