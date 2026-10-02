import { request } from '@/data/api/client'
import type { AuthSession, NewAccount, User } from '@/shared/types/domain'

export const authRepository = {
  register(data: NewAccount): Promise<AuthSession> {
    return request<AuthSession>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  login(email: string, password: string): Promise<AuthSession> {
    return request<AuthSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  me(): Promise<User> {
    return request<User>('/auth/me')
  },
}
