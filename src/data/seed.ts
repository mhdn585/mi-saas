import { DEFAULT_CURRENCY } from '@/config/constants'
import type { NewStore } from '@/shared/types/domain'

export const EMPTY_STORE_DRAFT: NewStore = {
  name: '',
  description: '',
  currency: DEFAULT_CURRENCY,
  logo: null,
}

export function ensureSeed(): void {
  /* El prototipo arranca sin tiendas ni productos: estado inicial limpio. */
}
