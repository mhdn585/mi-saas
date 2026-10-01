import { useState } from 'react'
import { ImageUploader } from './ImageUploader'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { Label } from '@/shared/ui/Label'
import { Textarea } from '@/shared/ui/Textarea'
import type { Product } from '@/shared/types/domain'
import { parsePrice, parseStock } from '@/shared/utils/format'

export interface ProductFormValues {
  name: string
  description: string
  price: number
  stock: number
  images: string[]
  published: boolean
}

interface ProductFormProps {
  initial?: Product | null
  submitLabel: string
  busy?: boolean
  onSubmit: (values: ProductFormValues) => void
  onCancel: () => void
}

export function ProductForm({ initial, submitLabel, busy = false, onSubmit, onCancel }: ProductFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [price, setPrice] = useState(initial ? String(initial.price) : '')
  const [stock, setStock] = useState(initial ? String(initial.stock) : '0')
  const [images, setImages] = useState<string[]>(initial?.images ?? [])
  const [published, setPublished] = useState(initial?.published ?? true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = () => {
    if (busy) return
    const nextErrors: Record<string, string> = {}
    const trimmedName = name.trim()
    const parsedPrice = parsePrice(price)
    const parsedStock = parseStock(stock)

    if (!trimmedName) nextErrors.name = 'El nombre es obligatorio'
    if (parsedPrice === null) nextErrors.price = 'Ingresa un precio válido (≥ 0)'
    if (parsedStock === null) nextErrors.stock = 'Ingresa un stock válido (entero ≥ 0)'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    onSubmit({
      name: trimmedName,
      description: description.trim(),
      price: parsedPrice as number,
      stock: parsedStock as number,
      images,
      published,
    })
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        handleSubmit()
      }}
    >
      <div>
        <Label htmlFor="product-name">Nombre del producto *</Label>
        <Input
          id="product-name"
          value={name}
          maxLength={80}
          placeholder="Ej.: Pan de campo 500g"
          onChange={(event) => setName(event.target.value)}
        />
        {errors.name ? <p className="mt-1 text-xs text-danger">{errors.name}</p> : null}
      </div>

      <div>
        <Label htmlFor="product-description">Descripción</Label>
        <Textarea
          id="product-description"
          value={description}
          maxLength={1000}
          placeholder="Detalles, presentación, medidas, materiales…"
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="product-price">Precio *</Label>
          <Input
            id="product-price"
            inputMode="decimal"
            value={price}
            placeholder="0.00"
            onChange={(event) => setPrice(event.target.value)}
          />
          {errors.price ? <p className="mt-1 text-xs text-danger">{errors.price}</p> : null}
        </div>
        <div>
          <Label htmlFor="product-stock">Stock disponible</Label>
          <Input
            id="product-stock"
            inputMode="numeric"
            value={stock}
            onChange={(event) => setStock(event.target.value)}
          />
          {errors.stock ? <p className="mt-1 text-xs text-danger">{errors.stock}</p> : null}
        </div>
      </div>

      <div>
        <Label>Fotos del producto</Label>
        <ImageUploader value={images} onChange={setImages} />
      </div>

      <Card className="flex items-center justify-between gap-4 p-4">
        <div>
          <p className="text-sm font-medium">Publicar en la tienda</p>
          <p className="text-xs text-muted">
            Los productos ocultos solo los ves tú en el panel administrativo.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={published}
          onClick={() => setPublished((current) => !current)}
          className={`relative h-6 w-11 shrink-0 rounded-full border border-line transition-colors ${
            published ? 'bg-accent' : 'bg-transparent'
          }`}
        >
          <span
            className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-line transition-all ${
              published ? 'left-[calc(100%-1.25rem)] bg-accent-fg' : 'left-1 bg-bg'
            }`}
          />
        </button>
      </Card>

      <div className="mt-2 flex gap-2">
        <Button type="submit" disabled={busy}>{submitLabel}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
