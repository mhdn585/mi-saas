import { IconMinus, IconPlus } from './icons'

interface QuantityStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = Number.MAX_SAFE_INTEGER,
}: QuantityStepperProps) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next))

  return (
    <div className="inline-flex h-10 items-center rounded-md border border-line">
      <button
        type="button"
        aria-label="Restar"
        disabled={value <= min}
        onClick={() => onChange(clamp(value - 1))}
        className="flex h-full w-9 items-center justify-center disabled:opacity-30 hover:bg-fg/10"
      >
        <IconMinus />
      </button>
      <input
        type="number"
        aria-label="Cantidad"
        value={value}
        min={min}
        max={max}
        onChange={(event) => {
          const parsed = Number(event.target.value)
          if (Number.isFinite(parsed)) onChange(clamp(parsed))
        }}
        className="h-full w-12 border-x border-line bg-transparent text-center text-sm focus:outline-none"
      />
      <button
        type="button"
        aria-label="Sumar"
        disabled={value >= max}
        onClick={() => onChange(clamp(value + 1))}
        className="flex h-full w-9 items-center justify-center disabled:opacity-30 hover:bg-fg/10"
      >
        <IconPlus />
      </button>
    </div>
  )
}
