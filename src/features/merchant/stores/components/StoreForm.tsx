import { useRef, useState } from 'react'
import { CURRENCIES, DEFAULT_CURRENCY } from '@/config/constants'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Label } from '@/shared/ui/Label'
import { Select } from '@/shared/ui/Select'
import { Textarea } from '@/shared/ui/Textarea'
import { IconImage, IconX } from '@/shared/ui/icons'
import { mediaUrl, uploadMedia } from '@/data/api/client'
import { useUIStore } from '@/store/uiStore'

export interface StoreFormValues {
  name: string
  description: string
  currency: string
  logo: string | null
}

interface StoreFormProps {
  initial?: Partial<StoreFormValues>
  submitLabel: string
  busy?: boolean
  onSubmit: (values: StoreFormValues) => void
  onCancel?: () => void
}

export function StoreForm({ initial, submitLabel, busy = false, onSubmit, onCancel }: StoreFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [currency, setCurrency] = useState(initial?.currency ?? DEFAULT_CURRENCY)
  const [logo, setLogo] = useState<string | null>(initial?.logo ?? null)
  const [nameError, setNameError] = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const showToast = useUIStore((state) => state.showToast)

  const handleLogoFile = async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast('El archivo debe ser una imagen', 'error')
      return
    }
    setUploadingLogo(true)
    try {
      const result = await uploadMedia(file)
      setLogo(mediaUrl(result.url))
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'No se pudo subir el logo',
        'error',
      )
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleSubmit = () => {
    if (busy) return
    const trimmed = name.trim()
    if (!trimmed) {
      setNameError('El nombre de la tienda es obligatorio')
      return
    }
    onSubmit({
      name: trimmed,
      description: description.trim(),
      currency,
      logo,
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
        <Label htmlFor="store-name">Nombre de la tienda</Label>
        <Input
          id="store-name"
          value={name}
          maxLength={60}
          placeholder="Ej.: Panadería La Espiga"
          onChange={(event) => {
            setName(event.target.value)
            setNameError('')
          }}
        />
        {nameError ? <p className="mt-1 text-xs text-danger">{nameError}</p> : null}
      </div>

      <div>
        <Label htmlFor="store-description">Descripción</Label>
        <Textarea
          id="store-description"
          value={description}
          maxLength={280}
          placeholder="¿Qué vende tu tienda?"
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="sm:w-40">
          <Label htmlFor="store-currency">Moneda</Label>
          <Select
            id="store-currency"
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
          >
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex-1">
          <Label>Logo (opcional)</Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              void handleLogoFile(event.target.files?.[0])
              event.target.value = ''
            }}
          />
          {logo ? (
            <div className="relative inline-flex">
              <img
                src={logo}
                alt="Logo de la tienda"
                className="h-16 w-16 rounded-md border border-line object-cover"
              />
              <button
                type="button"
                aria-label="Quitar logo"
                onClick={() => setLogo(null)}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-line bg-surface hover:bg-accent hover:text-accent-fg"
              >
                <IconX width={12} height={12} />
              </button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="md"
              className="border-dashed"
              disabled={uploadingLogo}
              onClick={() => fileInputRef.current?.click()}
            >
              <IconImage />
              {uploadingLogo ? 'Subiendo…' : 'Subir logo'}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-2 flex gap-2">
        <Button type="submit" disabled={busy}>
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
      </div>
    </form>
  )
}
