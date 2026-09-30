import { createRepository } from './repository'
import type { Product } from '@/shared/types/domain'

export const productRepository = createRepository<Product>('products')
