import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/app/ProtectedRoute'
import { StoreDashboardLayout } from '@/features/merchant/stores/layouts/StoreDashboardLayout'
import { StoresListPage } from '@/features/merchant/stores/pages/StoresListPage'
import { CreateStorePage } from '@/features/merchant/stores/pages/CreateStorePage'
import { StoreOverviewPage } from '@/features/merchant/stores/pages/StoreOverviewPage'
import { SettingsPage } from '@/features/merchant/admin/pages/SettingsPage'
import { AppearancePage } from '@/features/merchant/admin/pages/AppearancePage'
import { ProductsPage } from '@/features/merchant/admin/pages/ProductsPage'
import { ProductFormPage } from '@/features/merchant/admin/pages/ProductFormPage'
import { InventoryPage } from '@/features/merchant/admin/pages/InventoryPage'
import { StatisticsPage } from '@/features/merchant/statistics/pages/StatisticsPage'
import { StorefrontLayout } from '@/features/customer/storefront/pages/StorefrontLayout'
import { CatalogPage } from '@/features/customer/catalog/pages/CatalogPage'
import { ProductDetailPage } from '@/features/customer/product-viewer/pages/ProductDetailPage'
import { CartPage } from '@/features/customer/cart/pages/CartPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { WelcomePage } from '@/features/landing/WelcomePage'
import { NotFoundPage } from '@/app/pages/NotFoundPage'

export function AppRoutes() {
  return (
    <Routes>
      {/* Público: bienvenida + login/registro + tiendas públicas */}
      <Route path="/" element={<WelcomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />

      {/* Panel merchant: requiere sesión */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <StoresListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/stores/new"
        element={
          <ProtectedRoute>
            <CreateStorePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/stores/:storeId"
        element={
          <ProtectedRoute>
            <StoreDashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StoreOverviewPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/new" element={<ProductFormPage />} />
        <Route path="products/:productId" element={<ProductFormPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="statistics" element={<StatisticsPage />} />
        <Route path="appearance" element={<AppearancePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="/shop/:storeId" element={<StorefrontLayout />}>
        <Route index element={<CatalogPage />} />
        <Route path="products/:productId" element={<ProductDetailPage />} />
        <Route path="cart" element={<CartPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
