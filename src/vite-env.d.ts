/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Origen de la API Flask. Vacío = mismo origen (proxy de Vite en dev). */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
