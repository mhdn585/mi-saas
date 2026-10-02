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

export type LogoFit = 'contain' | 'cover'

export interface StoreLogoConfig {
  fit: LogoFit
  height: number
  positionX: number
  positionY: number
  background: string | null
}

export interface Store {
  id: string
  ownerId: string | null
  name: string
  description: string
  currency: string
  logo: string | null
  logoConfig: StoreLogoConfig | null
  theme: StoreTheme | null
  createdAt: number
  updatedAt: number
}

export type NewStore = Omit<
  Store,
  'id' | 'ownerId' | 'createdAt' | 'updatedAt' | 'theme' | 'logoConfig'
> & {
  theme?: StoreTheme | null
  logoConfig?: StoreLogoConfig | null
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

export interface User {
  id: string
  name: string
  email: string
  createdAt: number
  updatedAt: number
}

export interface NewAccount {
  name: string
  email: string
  password: string
}

export interface AuthSession {
  user: User
  token: string
}
