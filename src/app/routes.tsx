import { Route, Routes } from 'react-router-dom'
import { StoreDashboardLayout } from '@/features/merchant/stores/layouts/StoreDashboardLayout'
import { StoresListPage } from '@/features/merchant/stores/pages/StoresListPage'
import { CreateStorePage } from '@/features/merchant/stores/pages/CreateStorePage'
import { StoreOverviewPage } from '@/features/merchant/stores/pages/StoreOverviewPage'
import { SettingsPage } from '@/features/merchant/admin/pages/SettingsPage'
import { ProductsPage } from '@/features/merchant/admin/pages/ProductsPage'
import { ProductFormPage } from '@/features/merchant/admin/pages/ProductFormPage'
import { InventoryPage } from '@/features/merchant/admin/pages/InventoryPage'
import { StatisticsPage } from '@/features/merchant/statistics/pages/StatisticsPage'
import { StorefrontLayout } from '@/features/customer/storefront/pages/StorefrontLayout'
import { CatalogPage } from '@/features/customer/catalog/pages/CatalogPage'
import { ProductDetailPage } from '@/features/customer/product-viewer/pages/ProductDetailPage'
import { CartPage } from '@/features/customer/cart/pages/CartPage'
import { NotFoundPage } from '@/app/pages/NotFoundPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<StoresListPage />} />
      <Route path="/stores/new" element={<CreateStorePage />} />

      <Route path="/stores/:storeId" element={<StoreDashboardLayout />}>
        <Route index element={<StoreOverviewPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/new" element={<ProductFormPage />} />
        <Route path="products/:productId" element={<ProductFormPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="statistics" element={<StatisticsPage />} />
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
