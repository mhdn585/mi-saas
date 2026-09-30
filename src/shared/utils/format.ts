export function formatPrice(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat('es', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(value)
  } catch {
    return `${currency} ${value.toFixed(2)}`
  }
}

export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('es', { dateStyle: 'medium' }).format(
    new Date(timestamp),
  )
}

export function parsePrice(raw: string): number | null {
  const normalized = raw.replace(',', '.').trim()
  if (normalized === '') return null
  const value = Number(normalized)
  if (!Number.isFinite(value) || value < 0) return null
  return Math.round(value * 100) / 100
}

export function parseStock(raw: string): number | null {
  const value = Number(raw.trim())
  if (!Number.isInteger(value) || value < 0) return null
  return value
}
