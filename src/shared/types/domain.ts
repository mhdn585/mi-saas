export interface StoreTheme {
  bg: string
  fg: string
  surface: string
  muted: string
  line: string
  accent: string
  accentFg: string
}

export type ThemeToken = keyof StoreTheme

export interface Store {
  id: string
  name: string
  description: string
  currency: string
  logo: string | null
  theme: StoreTheme | null
  createdAt: number
  updatedAt: number
}

export type NewStore = Omit<Store, 'id' | 'createdAt' | 'updatedAt' | 'theme'> & {
  theme?: StoreTheme | null
}

export interface SavedPalette {
  id: string
  storeId: string
  name: string
  colors: StoreTheme
  createdAt: number
  updatedAt: number
}

export type NewSavedPalette = Omit<SavedPalette, 'id' | 'storeId' | 'createdAt' | 'updatedAt'>

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
