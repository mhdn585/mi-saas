import { create } from 'zustand'
import { paletteRepository } from '@/data/repositories/paletteRepository'
import type { NewSavedPalette, SavedPalette } from '@/shared/types/domain'

interface PalettesState {
  palettes: SavedPalette[]
  loadedStores: Record<string, boolean>
  loadingByStore: Record<string, boolean>
  loadForStore: (storeId: string, options?: { force?: boolean }) => Promise<void>
  savePalette: (storeId: string, data: NewSavedPalette) => Promise<SavedPalette>
  deletePalette: (storeId: string, paletteId: string) => Promise<void>
  removeStorePalettes: (storeId: string) => void
}

export const usePalettesStore = create<PalettesState>((set, get) => ({
  palettes: [],
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
      const items = await paletteRepository.findAllByStore(storeId)
      set((current) => ({
        palettes: [
          ...current.palettes.filter((palette) => palette.storeId !== storeId),
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

  savePalette: async (storeId, data) => {
    const palette = await paletteRepository.create(storeId, data)
    set((state) => ({ palettes: [...state.palettes, palette] }))
    return palette
  },

  deletePalette: async (storeId, paletteId) => {
    await paletteRepository.remove(storeId, paletteId)
    set((state) => ({
      palettes: state.palettes.filter((palette) => palette.id !== paletteId),
    }))
  },

  removeStorePalettes: (storeId) => {
    set((state) => ({
      palettes: state.palettes.filter((palette) => palette.storeId !== storeId),
      loadedStores: (() => {
        const next = { ...state.loadedStores }
        delete next[storeId]
        return next
      })(),
    }))
  },
}))
