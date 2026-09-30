import { useNavigate } from 'react-router-dom'
import { MerchantHeader } from '../components/MerchantHeader'
import { StoreForm } from '../components/StoreForm'
import { Card } from '@/shared/ui/Card'
import { useStoresStore } from '@/store/storesStore'
import { useUIStore } from '@/store/uiStore'

export function CreateStorePage() {
  const navigate = useNavigate()
  const createStore = useStoresStore((state) => state.createStore)
  const showToast = useUIStore((state) => state.showToast)

  return (
    <div className="flex min-h-screen flex-col">
      <MerchantHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10">
        <Card className="p-6">
          <h1 className="mb-6 text-xl font-semibold">Nueva tienda</h1>
          <StoreForm
            submitLabel="Crear tienda"
            onSubmit={(values) => {
              const store = createStore(values)
              showToast(`Tienda "${store.name}" creada`)
              navigate(`/stores/${store.id}`)
            }}
            onCancel={() => navigate('/')}
          />
        </Card>
      </main>
    </div>
  )
}
