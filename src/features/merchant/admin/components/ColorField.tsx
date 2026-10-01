import { useEffect, useState } from 'react'
import { Input } from '@/shared/ui/Input'
import { Label } from '@/shared/ui/Label'
import { cn } from '@/shared/utils/cn'
import { isValidHex, normalizeHex } from '@/shared/utils/color'

interface ColorFieldProps {
  label: string
  value: string
  onChange: (hex: string) => void
}

export function ColorField({ label, value, onChange }: ColorFieldProps) {
  const [draft, setDraft] = useState(value)
  useEffect(() => {
    setDraft(value)
  }, [value])

  const valid = isValidHex(draft)

  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`Selector de color: ${label}`}
          value={valid ? draft : '#000000'}
          onChange={(event) => {
            setDraft(event.target.value)
            onChange(event.target.value)
          }}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-md border border-line bg-bg p-1"
        />
        <Input
          value={draft}
          spellCheck={false}
          placeholder="#rrggbb"
          onChange={(event) => {
            const next = event.target.value
            setDraft(next)
            if (isValidHex(next)) onChange(normalizeHex(next))
          }}
          className={cn('font-mono', !valid && 'border-danger text-danger')}
        />
      </div>
      {!valid ? (
        <p className="mt-1 text-xs text-danger">Usa formato hexadecimal, p. ej. #e8632a</p>
      ) : null}
    </div>
  )
}
