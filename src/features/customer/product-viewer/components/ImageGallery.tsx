import { useState } from 'react'
import { IconChevronLeft, IconChevronRight, IconImage } from '@/shared/ui/icons'
import { cn } from '@/shared/utils/cn'

interface ImageGalleryProps {
  images: string[]
  name: string
}

export function ImageGallery({ images, name }: ImageGalleryProps) {
  const [index, setIndex] = useState(0)

  if (images.length === 0) {
    return (
      <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line text-muted">
        <IconImage width={32} height={32} />
        <span className="text-xs">Este producto no tiene fotos</span>
      </div>
    )
  }

  const safeIndex = Math.min(index, images.length - 1)
  const move = (delta: number) =>
    setIndex((safeIndex + delta + images.length) % images.length)

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-line bg-bg">
        <img
          src={images[safeIndex]}
          alt={`${name}, foto ${safeIndex + 1} de ${images.length}`}
          className="h-full w-full object-contain"
        />
        {images.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Foto anterior"
              onClick={() => move(-1)}
              className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-bg/80 hover:bg-accent hover:text-accent-fg"
            >
              <IconChevronLeft />
            </button>
            <button
              type="button"
              aria-label="Foto siguiente"
              onClick={() => move(1)}
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-bg/80 hover:bg-accent hover:text-accent-fg"
            >
              <IconChevronRight />
            </button>
            <span className="absolute bottom-2 right-2 rounded-full border border-line bg-bg/80 px-2 py-0.5 text-xs">
              {safeIndex + 1} / {images.length}
            </span>
          </>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, position) => (
            <button
              key={`${position}-${image.slice(-24)}`}
              type="button"
              onClick={() => setIndex(position)}
              aria-label={`Ver foto ${position + 1}`}
              className={cn(
                'h-14 w-14 shrink-0 overflow-hidden rounded-md border transition-opacity',
                position === safeIndex
                  ? 'border-fg ring-1 ring-fg'
                  : 'border-line opacity-60 hover:opacity-100',
              )}
            >
              <img src={image} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
