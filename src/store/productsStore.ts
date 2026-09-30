import { create } from 'zustand'
import { productRepository } from '@/data/repositories/productRepository'
import type { NewProduct, Product } from '@/shared/types/domain'

interface ProductsState {
  products: Product[]
  addProduct: (data: NewProduct) => Product
  updateProduct: (id: string, patch: Partial<Omit<NewProduct, 'storeId'>>) => void
  removeProduct: (id: string) => void
  removeStoreProducts: (storeId: string) => void
}

export const useProductsStore = create<ProductsState>((set) => ({
  products: productRepository.findAll(),

  addProduct: (data) => {
    const product = productRepository.create(data)
    set((state) => ({ products: [...state.products, product] }))
    return product
  },

  updateProduct: (id, patch) => {
    const updated = productRepository.update(id, patch)
    set((state) => ({
      products: state.products.map((product) =>
        product.id === id ? updated : product,
      ),
    }))
  },

  removeProduct: (id) => {
    productRepository.remove(id)
    set((state) => ({
      products: state.products.filter((product) => product.id !== id),
    }))
  },

  removeStoreProducts: (storeId) =>
    set((state) => ({
      products: state.products.filter((product) => product.storeId !== storeId),
    })),
}))
