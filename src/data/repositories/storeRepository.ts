import { createRepository } from './repository'
import type { Store } from '@/shared/types/domain'

export const storeRepository = createRepository<Store>('stores')
