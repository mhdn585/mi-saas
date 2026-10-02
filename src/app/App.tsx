import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './routes'
import { ThemeProvider } from '@/theme/ThemeProvider'
import { Toaster } from '@/shared/ui/Toaster'
import { useAuthStore } from '@/store/authStore'

export default function App() {
  const bootstrap = useAuthStore((state) => state.bootstrap)

  // Bootstrap: valida la sesión persistida; las tiendas se cargan en ProtectedRoute.
  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster />
      </BrowserRouter>
    </ThemeProvider>
  )
}
