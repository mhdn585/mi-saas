import { create } from 'zustand'
import { storeRepository } from '@/data/repositories/storeRepository'
import { useCartStore } from '@/store/cartStore'
import { usePalettesStore } from '@/store/palettesStore'
import { useProductsStore } from '@/store/productsStore'
import type { NewStore, Store } from '@/shared/types/domain'

interface StoresState {
  stores: Store[]
  loading: boolean
  loaded: boolean
  error: string | null
  load: (options?: { force?: boolean }) => Promise<void>
  createStore: (data: NewStore) => Promise<Store>
  updateStore: (id: string, patch: Partial<NewStore>) => Promise<Store>
  deleteStore: (id: string) => Promise<void>
}

export const useStoresStore = create<StoresState>((set, get) => ({
  stores: [],
  loading: false,
  loaded: false,
  error: null,

  load: async (options) => {
    if (get().loading || (get().loaded && !options?.force)) return
    set({ loading: true, error: null })
    try {
      const stores = await storeRepository.findAll()
      set({ stores, loading: false, loaded: true })
    } catch (error) {
      set({
        loading: false,
        loaded: false,
        error:
          error instanceof Error
            ? error.message
            : 'No se pudieron cargar las tiendas.',
      })
    }
  },

  createStore: async (data) => {
    const store = await storeRepository.create(data)
    set((state) => ({ stores: [...state.stores, store] }))
    return store
  },

  updateStore: async (id, patch) => {
    const updated = await storeRepository.update(id, patch)
    set((state) => ({
      stores: state.stores.map((store) => (store.id === id ? updated : store)),
    }))
    return updated
  },

  deleteStore: async (id) => {
    await storeRepository.remove(id)
    // El servidor elimina productos y paletas en cascada; solo queda limpiar el estado local.
    useProductsStore.getState().removeStoreProducts(id)
    useCartStore.getState().clearStore(id)
    usePalettesStore.getState().removeStorePalettes(id)
    set((state) => ({
      stores: state.stores.filter((store) => store.id !== id),
    }))
  },
}))
