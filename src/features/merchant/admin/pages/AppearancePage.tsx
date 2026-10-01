import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ColorField } from '@/features/merchant/admin/components/ColorField'
import { PaletteCard } from '@/features/merchant/admin/components/PaletteCard'
import { ThemePreview } from '@/features/merchant/admin/components/ThemePreview'
import { DEFAULT_STORE_THEME, PRESET_PALETTES } from '@/config/palettes'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Input } from '@/shared/ui/Input'
import { Label } from '@/shared/ui/Label'
import { Modal } from '@/shared/ui/Modal'
import { IconAlert, IconArrowLeft, IconTrash } from '@/shared/ui/icons'
import { useStoreById } from '@/shared/hooks/useScopedData'
import { cn } from '@/shared/utils/cn'
import {
  ALL_TOKENS,
  SIMPLE_TOKENS,
  THEME_TOKEN_LABELS,
  deriveTheme,
  themeToSimple,
} from '@/shared/utils/color'
import type { SimpleThemeInput } from '@/shared/utils/color'
import type { StoreTheme, ThemeToken } from '@/shared/types/domain'
import { usePalettesStore } from '@/store/palettesStore'
import { useStoresStore } from '@/store/storesStore'
import { useUIStore } from '@/store/uiStore'

type EditMode = 'simple' | 'advanced'

function sameTheme(a: StoreTheme | null, b: StoreTheme | null): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function AppearancePage() {
  const { storeId } = useParams<{ storeId: string }>()
  const navigate = useNavigate()
  const store = useStoreById(storeId)
  const updateStore = useStoresStore((state) => state.updateStore)
  const showToast = useUIStore((state) => state.showToast)

  const palettes = usePalettesStore((state) => state.palettes)
  const loadForStore = usePalettesStore((state) => state.loadForStore)
  const savePalette = usePalettesStore((state) => state.savePalette)
  const deletePalette = usePalettesStore((state) => state.deletePalette)

  const [mode, setMode] = useState<EditMode>('simple')
  const [draft, setDraft] = useState<StoreTheme | null>(store?.theme ?? null)
  const [saving, setSaving] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [paletteModalOpen, setPaletteModalOpen] = useState(false)
  const [paletteName, setPaletteName] = useState('')
  const [savingPalette, setSavingPalette] = useState(false)

  const savedPalettes = useMemo(
    () => palettes.filter((palette) => palette.storeId === storeId),
    [palettes, storeId],
  )

  useEffect(() => {
    if (!storeId) return
    void loadForStore(storeId).catch(() =>
      showToast('No se pudieron cargar tus paletas guardadas', 'error'),
    )
  }, [storeId, loadForStore, showToast])

  if (!store) {
    return (
      <EmptyState
        icon={<IconAlert width={24} height={24} />}
        title="Tienda no encontrada"
        action={
          <Button onClick={() => navigate('/')}>Volver a mis tiendas</Button>
        }
      />
    )
  }

  const current = draft ?? DEFAULT_STORE_THEME
  const dirty = !sameTheme(draft, store.theme)

  const setSimpleToken = (key: keyof SimpleThemeInput, value: string) => {
    setDraft(deriveTheme({ ...themeToSimple(current), [key]: value }))
  }

  const setAdvancedToken = (token: ThemeToken, value: string) => {
    setDraft({ ...current, [token]: value })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateStore(store.id, { theme: draft })
      showToast(
        draft ? 'Colores de la tienda actualizados' : 'Se restauraron los colores del sistema',
        'success',
      )
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudieron guardar los colores', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    setDraft(null)
    try {
      await updateStore(store.id, { theme: null })
      showToast('Se restauraron los colores por defecto del sistema', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudieron restaurar los colores', 'error')
    }
  }

  const handleSavePalette = async () => {
    if (!draft || !paletteName.trim()) return
    setSavingPalette(true)
    try {
      const palette = await savePalette(store.id, {
        name: paletteName.trim(),
        colors: draft,
      })
      setPaletteModalOpen(false)
      setPaletteName('')
      showToast(`Paleta "${palette.name}" guardada`, 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo guardar la paleta', 'error')
    } finally {
      setSavingPalette(false)
    }
  }

  const handleDeletePalette = async (paletteId: string, name: string) => {
    try {
      await deletePalette(store.id, paletteId)
      showToast(`Paleta "${name}" eliminada`, 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo eliminar la paleta', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Apariencia de la tienda</h1>
        <p className="text-sm text-muted">
          Elige una paleta precargada o ajusta los colores a tu gusto. Se aplica
          solo a tu tienda pública; el panel de administración no cambia.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold">Modo de personalización</h2>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={mode === 'simple' ? 'primary' : 'outline'}
                  onClick={() => setMode('simple')}
                >
                  Simple
                </Button>
                <Button
                  size="sm"
                  variant={mode === 'advanced' ? 'primary' : 'outline'}
                  onClick={() => setMode('advanced')}
                >
                  Avanzado
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted">
              {mode === 'simple'
                ? 'Edita lo esencial (fondo, texto, tarjetas y acento); el resto se deriva automáticamente.'
                : 'Control total: puedes cambiar los 7 elementos de color de la tienda.'}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {mode === 'simple'
                ? SIMPLE_TOKENS.map((key) => (
                    <ColorField
                      key={key}
                      label={THEME_TOKEN_LABELS[key]}
                      value={current[key]}
                      onChange={(value) => setSimpleToken(key, value)}
                    />
                  ))
                : ALL_TOKENS.map((token) => (
                    <ColorField
                      key={token}
                      label={THEME_TOKEN_LABELS[token]}
                      value={current[token]}
                      onChange={(value) => setAdvancedToken(token, value)}
                    />
                  ))}
            </div>
          </Card>

          <Card className="flex flex-col gap-4 p-6">
            <h2 className="text-sm font-semibold">Paletas de la plataforma</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              <button
                type="button"
                onClick={() => setDraft(null)}
                className={cn(
                  'flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line p-4 text-sm text-muted transition-colors hover:bg-fg/5',
                  draft === null && 'border-fg font-medium text-fg',
                )}
              >
                <IconArrowLeft width={16} height={16} />
                Predeterminado del sistema
              </button>
              {PRESET_PALETTES.map((palette) => (
                <PaletteCard
                  key={palette.id}
                  name={palette.name}
                  theme={palette.theme}
                  selected={sameTheme(draft, palette.theme)}
                  onClick={() => setDraft(palette.theme)}
                />
              ))}
            </div>
          </Card>

          <Card className="flex flex-col gap-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Mis paletas guardadas</h2>
              <Button
                size="sm"
                variant="outline"
                disabled={!draft}
                onClick={() => setPaletteModalOpen(true)}
              >
                Guardar personalización
              </Button>
            </div>
            {savedPalettes.length === 0 ? (
              <p className="text-sm text-muted">
                Aún no guardaste ninguna. Ajusta los colores a tu gusto y pulsa
                «Guardar personalización» para reutilizarlos cuando quieras.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {savedPalettes.map((palette) => (
                  <div key={palette.id} className="relative">
                    <PaletteCard
                      name={palette.name}
                      theme={palette.colors}
                      selected={sameTheme(draft, palette.colors)}
                      onClick={() => setDraft(palette.colors)}
                    />
                    <button
                      type="button"
                      aria-label={`Eliminar paleta ${palette.name}`}
                      onClick={() => {
                        void handleDeletePalette(palette.id, palette.name)
                      }}
                      className="absolute right-4 top-4 rounded-md bg-bg/80 p-1 text-muted transition-colors hover:text-danger"
                    >
                      <IconTrash width={14} height={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-4 lg:sticky lg:top-6">
          <Card className="flex flex-col gap-4 p-4">
            <div>
              <h2 className="text-sm font-semibold">Vista previa</h2>
              <p className="text-xs text-muted">
                Así se verá tu tienda pública con estos colores.
              </p>
            </div>
            <ThemePreview theme={draft} />
            <div className="flex flex-col gap-2">
              <Button disabled={!dirty || saving} onClick={() => void handleSave()}>
                {saving ? 'Guardando…' : 'Guardar colores'}
              </Button>
              {store.theme ? (
                <Button variant="ghost" size="sm" onClick={() => setResetOpen(true)}>
                  Restaurar colores del sistema
                </Button>
              ) : null}
            </div>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={() => void handleReset()}
        title="Restaurar colores del sistema"
        message="Tu tienda pública volverá a los colores por defecto de la plataforma. Tus paletas guardadas no se eliminan."
        confirmLabel="Restaurar"
      />

      <Modal
        open={paletteModalOpen}
        onClose={() => setPaletteModalOpen(false)}
        title="Guardar personalización como paleta"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setPaletteModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              disabled={!paletteName.trim() || savingPalette}
              onClick={() => void handleSavePalette()}
            >
              {savingPalette ? 'Guardando…' : 'Guardar paleta'}
            </Button>
          </>
        }
      >
        <div>
          <Label htmlFor="palette-name">Nombre de la paleta</Label>
          <Input
            id="palette-name"
            value={paletteName}
            maxLength={40}
            placeholder="P. ej. Mi tienda de verano"
            onChange={(event) => setPaletteName(event.target.value)}
          />
        </div>
      </Modal>
    </div>
  )
}
