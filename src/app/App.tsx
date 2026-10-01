import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './routes'
import { ThemeProvider } from '@/theme/ThemeProvider'
import { Toaster } from '@/shared/ui/Toaster'
import { useStoresStore } from '@/store/storesStore'

export default function App() {
  const load = useStoresStore((state) => state.load)

  // Bootstrap: todas las tiendas del comerciante al montar (fuente de verdad: backend).
  useEffect(() => {
    void load()
  }, [load])

  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster />
      </BrowserRouter>
    </ThemeProvider>
  )
}
