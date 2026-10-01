import { useRef, useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { IconImage, IconPlus, IconX } from '@/shared/ui/icons'
import { mediaUrl, uploadMedia } from '@/data/api/client'
import { useUIStore } from '@/store/uiStore'

interface ImageUploaderProps {
  value: string[]
  onChange: (images: string[]) => void
  max?: number
}

export function ImageUploader({ value, onChange, max = 12 }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const showToast = useUIStore((state) => state.showToast)
  const [uploading, setUploading] = useState(false)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const available = max - value.length
    if (available <= 0) {
      showToast(`Máximo ${max} imágenes por producto`, 'warning')
      return
    }
    setUploading(true)
    const accepted: string[] = []
    for (const file of Array.from(files).slice(0, available)) {
      if (!file.type.startsWith('image/')) {
        showToast(`"${file.name}" no es una imagen`, 'error')
        continue
      }
      try {
        const result = await uploadMedia(file)
        accepted.push(mediaUrl(result.url))
      } catch (error) {
        showToast(
          error instanceof Error
            ? `No se pudo subir "${file.name}": ${error.message}`
            : `No se pudo subir "${file.name}"`,
          'error',
        )
      }
    }
    setUploading(false)
    if (accepted.length > 0) onChange([...value, ...accepted])
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          void handleFiles(event.target.files)
          event.target.value = ''
        }}
      />

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {value.map((image, index) => (
          <div
            key={`${index}-${image.slice(-24)}`}
            className="group relative aspect-square overflow-hidden rounded-md border border-line"
          >
            <img src={image} alt={`Foto ${index + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              aria-label={`Quitar foto ${index + 1}`}
              onClick={() => onChange(value.filter((_, i) => i !== index))}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full border border-line bg-surface opacity-90 hover:bg-accent hover:text-accent-fg"
            >
              <IconX width={12} height={12} />
            </button>
            {index === 0 ? (
              <span className="absolute bottom-1 left-1 rounded-full border border-line bg-surface px-1.5 py-0.5 text-[10px]">
                Portada
              </span>
            ) : null}
          </div>
        ))}

        {value.length < max ? (
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-md border border-dashed border-line text-muted transition-colors hover:bg-fg/5 hover:text-fg disabled:opacity-40"
          >
            <IconPlus />
            <span className="text-[11px]">{uploading ? 'Subiendo…' : 'Agregar'}</span>
          </button>
        ) : null}
      </div>

      {value.length === 0 ? (
        <Button type="button" variant="outline" size="sm" className="self-start" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
          <IconImage />
          {uploading ? 'Subiendo…' : 'Subir fotos del producto'}
        </Button>
      ) : null}
    </div>
  )
}
