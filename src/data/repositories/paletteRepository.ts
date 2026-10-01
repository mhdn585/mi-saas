import { request } from '@/data/api/client'
import type { NewSavedPalette, SavedPalette } from '@/shared/types/domain'

export const paletteRepository = {
  findAllByStore(storeId: string): Promise<SavedPalette[]> {
    return request<SavedPalette[]>(`/stores/${storeId}/palettes`)
  },

  create(storeId: string, data: NewSavedPalette): Promise<SavedPalette> {
    return request<SavedPalette>(`/stores/${storeId}/palettes`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  update(
    storeId: string,
    paletteId: string,
    patch: Partial<NewSavedPalette>,
  ): Promise<SavedPalette> {
    return request<SavedPalette>(`/stores/${storeId}/palettes/${paletteId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
  },

  remove(storeId: string, paletteId: string): Promise<void> {
    return request<void>(`/stores/${storeId}/palettes/${paletteId}`, {
      method: 'DELETE',
    })
  },
}
