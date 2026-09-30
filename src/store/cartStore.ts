import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { storageKey } from '@/data/storage/localStorageAdapter'
import type { CartItem } from '@/shared/types/domain'

interface CartState {
  itemsByStore: Record<string, CartItem[]>
  addItem: (storeId: string, productId: string, quantity?: number) => void
  setQuantity: (storeId: string, productId: string, quantity: number) => void
  removeItem: (storeId: string, productId: string) => void
  clearStore: (storeId: string) => void
}

const EMPTY_ITEMS: CartItem[] = []

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      itemsByStore: {},

      addItem: (storeId, productId, quantity = 1) =>
        set((state) => {
          const items = state.itemsByStore[storeId] ?? []
          const existing = items.find((item) => item.productId === productId)
          const next = existing
            ? items.map((item) =>
                item.productId === productId
                  ? { ...item, quantity: item.quantity + quantity }
                  : item,
              )
            : [...items, { productId, quantity }]
          return { itemsByStore: { ...state.itemsByStore, [storeId]: next } }
        }),

      setQuantity: (storeId, productId, quantity) =>
        set((state) => {
          const items = state.itemsByStore[storeId] ?? []
          const next =
            quantity <= 0
              ? items.filter((item) => item.productId !== productId)
              : items.map((item) =>
                  item.productId === productId ? { ...item, quantity } : item,
                )
          return { itemsByStore: { ...state.itemsByStore, [storeId]: next } }
        }),

      removeItem: (storeId, productId) =>
        set((state) => {
          const items = state.itemsByStore[storeId] ?? []
          return {
            itemsByStore: {
              ...state.itemsByStore,
              [storeId]: items.filter((item) => item.productId !== productId),
            },
          }
        }),

      clearStore: (storeId) =>
        set((state) => {
          const next = { ...state.itemsByStore }
          delete next[storeId]
          return { itemsByStore: next }
        }),
    }),
    { name: storageKey('cart') },
  ),
)

export function useCartItems(storeId: string | undefined): CartItem[] {
  return useCartStore((state) =>
    storeId ? (state.itemsByStore[storeId] ?? EMPTY_ITEMS) : EMPTY_ITEMS,
  )
}
