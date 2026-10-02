import { type ReactNode, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Spinner } from '@/shared/ui/Spinner'
import { useAuthStore } from '@/store/authStore'
import { useStoresStore } from '@/store/storesStore'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const status = useAuthStore((state) => state.status)
  const load = useStoresStore((state) => state.load)
  const location = useLocation()

  // Con sesión confirmada, el bootstrap de tiendas del usuario reemplaza al de App.
  useEffect(() => {
    if (status === 'authed') void load()
  }, [status, load])

  if (status === 'idle' || status === 'booting') {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (status === 'anon') {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <>{children}</>
}
