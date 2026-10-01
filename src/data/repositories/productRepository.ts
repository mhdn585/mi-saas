import { request } from '@/data/api/client'
import type { NewProduct, Product } from '@/shared/types/domain'

interface ProductsPageResult {
  items: Product[]
  page: number
  per_page: number
  total: number
  pages: number
}

/** Máximo permitido por el backend; la búsqueda y los filtros siguen en cliente. */
const PER_PAGE = 200

export const productRepository = {
  findAllByStore(storeId: string): Promise<Product[]> {
    return request<ProductsPageResult>(
      `/stores/${storeId}/products?per_page=${PER_PAGE}`,
    ).then((result) => result.items)
  },

  findById(id: string): Promise<Product> {
    return request<Product>(`/products/${id}`)
  },

  create(data: NewProduct): Promise<Product> {
    const { storeId, ...payload } = data
    return request<Product>(`/stores/${storeId}/products`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  update(id: string, patch: Partial<Omit<NewProduct, 'storeId'>>): Promise<Product> {
    return request<Product>(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
  },

  remove(id: string): Promise<void> {
    return request<void>(`/products/${id}`, { method: 'DELETE' })
  },
}
