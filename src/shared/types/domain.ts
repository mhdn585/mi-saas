export interface Store {
  id: string
  name: string
  description: string
  currency: string
  logo: string | null
  createdAt: number
  updatedAt: number
}

export type NewStore = Omit<Store, 'id' | 'createdAt' | 'updatedAt'>

export interface Product {
  id: string
  storeId: string
  name: string
  description: string
  price: number
  stock: number
  images: string[]
  published: boolean
  createdAt: number
  updatedAt: number
}

export type NewProduct = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>

export interface CartItem {
  productId: string
  quantity: number
}
