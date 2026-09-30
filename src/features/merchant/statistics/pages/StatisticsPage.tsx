import { Link, useParams } from 'react-router-dom'
import { Badge } from '@/shared/ui/Badge'
import { buttonClasses } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { IconChart } from '@/shared/ui/icons'

const plannedFeatures = [
  'Ventas por período',
  'Productos más vendidos',
  'Productos más visitados',
  'Horarios de mayor tráfico',
  'Exportación a XLSX',
  'Imagen de gráficas',
]

export function StatisticsPage() {
  const { storeId } = useParams<{ storeId: string }>()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Estadísticas</h1>
        <p className="text-sm text-muted">
          Métricas y reportes visuales del rendimiento de esta tienda.
        </p>
      </div>

      <EmptyState
        icon={<IconChart width={32} height={32} />}
        title="Módulo en desarrollo"
        description="La sección de estadísticas comerciales generará gráficas a partir de los datos que acumule esta tienda: ventas, visitas y productos destacados. Estará disponible en la siguiente fase del proyecto."
        action={
          <Link to=".." className={buttonClasses('outline', 'md')}>
            Volver al resumen
          </Link>
        }
      />

      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold">Funcionalidades reservadas</h2>
        <div className="flex flex-wrap gap-2">
          {plannedFeatures.map((feature) => (
            <Badge key={feature} variant="muted">
              {feature}
            </Badge>
          ))}
        </div>
      </Card>

      <p className="text-center text-xs text-muted">
        ID de tienda para integración futura: {storeId}
      </p>
    </div>
  )
}
