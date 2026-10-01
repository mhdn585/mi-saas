import { useMemo } from 'react'
import { useProductsStore } from '@/store/productsStore'
import { useStoresStore } from '@/store/storesStore'
import type { Product, Store } from '@/shared/types/domain'

export function useStoreById(storeId: string | undefined): Store | null {
  return useStoresStore((state) =>
    storeId ? (state.stores.find((store) => store.id === storeId) ?? null) : null,
  )
}

export function useProductsByStore(storeId: string | undefined): Product[] {
  const products = useProductsStore((state) => state.products)
  return useMemo(
    () => (storeId ? products.filter((product) => product.storeId === storeId) : []),
    [products, storeId],
  )
}

export function useProductById(
  storeId: string | undefined,
  productId: string | undefined,
): Product | null {
  const products = useProductsStore((state) => state.products)
  return useMemo(() => {
    if (!storeId || !productId) return null
    return (
      products.find(
        (product) => product.id === productId && product.storeId === storeId,
      ) ?? null
    )
  }, [products, storeId, productId])
}

export function useProductCountByStore(storeId: string): number {
  return useProductsStore(
    (state) => state.products.filter((product) => product.storeId === storeId).length,
  )
}

/** Estado de la carga inicial de tiendas (bootstrap de App). */
export function useStoresStatus(): {
  loading: boolean
  loaded: boolean
  error: string | null
} {
  const loading = useStoresStore((state) => state.loading)
  const loaded = useStoresStore((state) => state.loaded)
  const error = useStoresStore((state) => state.error)
  return { loading, loaded, error }
}

/** Estado de la carga de productos de una tienda concreta. */
export function useProductsStatus(storeId: string | undefined): {
  loading: boolean
  loaded: boolean
} {
  const loading = useProductsStore((state) =>
    storeId ? Boolean(state.loadingByStore[storeId]) : false,
  )
  const loaded = useProductsStore((state) =>
    storeId ? Boolean(state.loadedStores[storeId]) : false,
  )
  return { loading, loaded }
}
