import { request } from '@/data/api/client'
import type { NewStore, Store } from '@/shared/types/domain'

export const storeRepository = {
  findAll(): Promise<Store[]> {
    return request<Store[]>('/stores')
  },

  findById(id: string): Promise<Store> {
    return request<Store>(`/stores/${id}`)
  },

  create(data: NewStore): Promise<Store> {
    return request<Store>('/stores', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  update(id: string, patch: Partial<NewStore>): Promise<Store> {
    return request<Store>(`/stores/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
  },

  remove(id: string): Promise<void> {
    return request<void>(`/stores/${id}`, { method: 'DELETE' })
  },
}
