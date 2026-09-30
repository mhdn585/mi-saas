import { create } from 'zustand'
import { storeRepository } from '@/data/repositories/storeRepository'
import { productRepository } from '@/data/repositories/productRepository'
import { useCartStore } from '@/store/cartStore'
import { useProductsStore } from '@/store/productsStore'
import type { NewStore, Store } from '@/shared/types/domain'

interface StoresState {
  stores: Store[]
  createStore: (data: NewStore) => Store
  updateStore: (id: string, patch: Partial<NewStore>) => void
  deleteStore: (id: string) => void
}

export const useStoresStore = create<StoresState>((set) => ({
  stores: storeRepository.findAll(),

  createStore: (data) => {
    const store = storeRepository.create(data)
    set((state) => ({ stores: [...state.stores, store] }))
    return store
  },

  updateStore: (id, patch) => {
    const updated = storeRepository.update(id, patch)
    set((state) => ({
      stores: state.stores.map((store) => (store.id === id ? updated : store)),
    }))
  },

  deleteStore: (id) => {
    storeRepository.remove(id)
    productRepository.removeWhere((product) => product.storeId === id)
    useProductsStore.getState().removeStoreProducts(id)
    useCartStore.getState().clearStore(id)
    set((state) => ({
      stores: state.stores.filter((store) => store.id !== id),
    }))
  },
}))
