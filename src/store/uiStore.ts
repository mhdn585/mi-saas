import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { storageKey } from '@/data/storage/localStorageAdapter'

export type Theme = 'light' | 'dark'

export interface Toast {
  id: number
  message: string
}

interface UIState {
  theme: Theme
  toasts: Toast[]
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  showToast: (message: string) => void
  dismissToast: (id: number) => void
}

let toastSeq = 0

const prefersDark =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-color-scheme: dark)').matches === true

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: prefersDark ? 'dark' : 'light',
      toasts: [],
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      showToast: (message) =>
        set((state) => ({ toasts: [...state.toasts, { id: ++toastSeq, message }] })),
      dismissToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
    }),
    {
      name: storageKey('ui'),
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
)
