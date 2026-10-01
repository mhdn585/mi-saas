const API_BASE = import.meta.env.VITE_API_URL ?? ''

export class ApiError extends Error {
  code: string
  status: number

  constructor(message: string, code = 'error', status = 0) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

interface ErrorPayload {
  error?: { code?: string; message?: string }
}

async function parseError(response: Response): Promise<never> {
  let code = 'error'
  let message = `La petición falló (${response.status}).`
  try {
    const payload = (await response.json()) as ErrorPayload
    if (payload.error) {
      code = payload.error.code ?? code
      message = payload.error.message ?? message
    }
  } catch {
    /* respuesta sin JSON */
  }
  throw new ApiError(message, code, response.status)
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}/api/v1${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    })
  } catch {
    throw new ApiError(
      'No se pudo conectar con el servidor. ¿Está el backend corriendo?',
      'network_error',
    )
  }

  if (!response.ok) await parseError(response)
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export interface MediaUploadResult {
  url: string
  filename: string
}

export async function uploadMedia(file: File): Promise<MediaUploadResult> {
  const body = new FormData()
  body.append('file', file)

  let response: Response
  try {
    response = await fetch(`${API_BASE}/api/v1/media`, {
      method: 'POST',
      body,
    })
  } catch {
    throw new ApiError(
      'No se pudo conectar con el servidor. ¿Está el backend corriendo?',
      'network_error',
    )
  }

  if (!response.ok) await parseError(response)
  return (await response.json()) as MediaUploadResult
}

/** Convierte una `/media/<archivo>` devuelta por la API en una URL visible desde el frontend. */
export function mediaUrl(url: string | null | undefined): string {
  if (!url || !url.startsWith('/')) return url ?? ''
  return `${API_BASE}${url}`
}
