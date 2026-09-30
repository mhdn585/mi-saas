const PREFIX = 'creatienda:'

export interface KeyValueStorage {
  read<T>(key: string): T | null
  write<T>(key: string, value: T): void
  remove(key: string): void
}

function fullKey(key: string): string {
  return key.startsWith(PREFIX) ? key : `${PREFIX}${key}`
}

class LocalStorageAdapter implements KeyValueStorage {
  read<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(fullKey(key))
      return raw === null ? null : (JSON.parse(raw) as T)
    } catch {
      return null
    }
  }

  write<T>(key: string, value: T): void {
    try {
      localStorage.setItem(fullKey(key), JSON.stringify(value))
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new Error('El almacenamiento local está lleno. Elimina imágenes o productos.')
      }
      throw error
    }
  }

  remove(key: string): void {
    localStorage.removeItem(fullKey(key))
  }
}

export const storage: KeyValueStorage = new LocalStorageAdapter()

export function storageKey(name: string): string {
  return fullKey(name)
}
