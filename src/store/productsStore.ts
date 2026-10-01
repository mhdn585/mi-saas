import { create } from 'zustand'
import { productRepository } from '@/data/repositories/productRepository'
import type { NewProduct, Product } from '@/shared/types/domain'

interface ProductsState {
  products: Product[]
  loadedStores: Record<string, boolean>
  loadingByStore: Record<string, boolean>
  loadForStore: (storeId: string, options?: { force?: boolean }) => Promise<void>
  addProduct: (data: NewProduct) => Promise<Product>
  updateProduct: (
    id: string,
    patch: Partial<Omit<NewProduct, 'storeId'>>,
  ) => Promise<Product>
  removeProduct: (id: string) => Promise<void>
  removeStoreProducts: (storeId: string) => void
}

export const useProductsStore = create<ProductsState>((set, get) => ({
  products: [],
  loadedStores: {},
  loadingByStore: {},

  loadForStore: async (storeId, options) => {
    const state = get()
    if (state.loadingByStore[storeId]) return
    if (state.loadedStores[storeId] && !options?.force) return

    set((current) => ({
      loadingByStore: { ...current.loadingByStore, [storeId]: true },
    }))
    try {
      const items = await productRepository.findAllByStore(storeId)
      set((current) => ({
        products: [
          ...current.products.filter((product) => product.storeId !== storeId),
          ...items,
        ],
        loadedStores: { ...current.loadedStores, [storeId]: true },
        loadingByStore: { ...current.loadingByStore, [storeId]: false },
      }))
    } catch (error) {
      set((current) => ({
        loadingByStore: { ...current.loadingByStore, [storeId]: false },
      }))
      throw error
    }
  },

  addProduct: async (data) => {
    const product = await productRepository.create(data)
    set((state) => ({ products: [...state.products, product] }))
    return product
  },

  updateProduct: async (id, patch) => {
    const updated = await productRepository.update(id, patch)
    set((state) => ({
      products: state.products.map((product) =>
        product.id === id ? updated : product,
      ),
    }))
    return updated
  },

  removeProduct: async (id) => {
    await productRepository.remove(id)
    set((state) => ({
      products: state.products.filter((product) => product.id !== id),
    }))
  },

  removeStoreProducts: (storeId) =>
    set((state) => ({
      products: state.products.filter((product) => product.storeId !== storeId),
    })),
}))
