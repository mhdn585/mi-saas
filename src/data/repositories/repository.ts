import { storage } from '@/data/storage/localStorageAdapter'
import { generateId } from '@/shared/utils/id'

export interface Timestamped {
  id: string
  createdAt: number
  updatedAt: number
}

export interface Repository<T extends Timestamped> {
  findAll(): T[]
  findById(id: string): T | null
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): T
  update(id: string, patch: Partial<Omit<T, 'id' | 'createdAt'>>): T
  remove(id: string): void
  removeWhere(predicate: (item: T) => boolean): void
}

export function createRepository<T extends Timestamped>(name: string): Repository<T> {
  const readAll = (): T[] => storage.read<T[]>(name) ?? []
  const writeAll = (items: T[]): void => storage.write(name, items)

  return {
    findAll: readAll,

    findById(id) {
      return readAll().find((item) => item.id === id) ?? null
    },

    create(data) {
      const now = Date.now()
      const item = {
        ...data,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      } as T
      writeAll([...readAll(), item])
      return item
    },

    update(id, patch) {
      const items = readAll()
      const index = items.findIndex((item) => item.id === id)
      if (index === -1) {
        throw new Error(`Registro no encontrado: ${id}`)
      }
      const current = items[index]
      const updated = {
        ...current,
        ...patch,
        id: current.id,
        createdAt: current.createdAt,
        updatedAt: Date.now(),
      }
      items[index] = updated
      writeAll(items)
      return updated
    },

    remove(id) {
      writeAll(readAll().filter((item) => item.id !== id))
    },

    removeWhere(predicate) {
      writeAll(readAll().filter((item) => !predicate(item)))
    },
  }
}
