const PREFIX = 'creatienda:'

/** Clave con prefijo para lo único que persiste en localStorage: carrito y tema. */
export function storageKey(name: string): string {
  return `${PREFIX}${name}`
}
