import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { setAuthToken, setOnUnauthorized } from '@/data/api/client'
import { authRepository } from '@/data/repositories/authRepository'
import { storageKey } from '@/data/storage/localStorageAdapter'
import { useStoresStore } from '@/store/storesStore'
import type { NewAccount, User } from '@/shared/types/domain'

export type AuthStatus = 'idle' | 'booting' | 'authed' | 'anon'

interface AuthState {
  token: string | null
  user: User | null
  status: AuthStatus
  bootstrap: () => Promise<void>
  register: (data: NewAccount) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      status: 'idle',

      bootstrap: async () => {
        if (get().status !== 'idle') return
        const { token } = get()
        if (!token) {
          set({ status: 'anon' })
          return
        }
        set({ status: 'booting' })
        try {
          const user = await authRepository.me()
          set({ user, status: 'authed' })
        } catch {
          set({ token: null, user: null, status: 'anon' })
        }
      },

      register: async (data) => {
        const session = await authRepository.register(data)
        set({ token: session.token, user: session.user, status: 'authed' })
      },

      login: async (email, password) => {
        const session = await authRepository.login(email, password)
        set({ token: session.token, user: session.user, status: 'authed' })
      },

      logout: () => {
        set({ token: null, user: null, status: 'anon' })
        // Las tiendas son por usuario: hay que volver a cargarlas tras un nuevo login.
        useStoresStore.getState().reset()
      },
    }),
    {
      name: storageKey('session'),
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
)

// El client.ts de la API siempre lleva el token vigente.
useAuthStore.subscribe((state) => setAuthToken(state.token))
setAuthToken(useAuthStore.getState().token)

// Un 401 del servidor (token expirado/inválido) cierra la sesión local.
setOnUnauthorized(() => {
  const state = useAuthStore.getState()
  if (state.token) state.logout()
})
