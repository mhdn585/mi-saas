import { Link } from 'react-router-dom'
import { buttonClasses } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { IconAlert } from '@/shared/ui/icons'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center p-6">
      <EmptyState
        icon={<IconAlert width={28} height={28} />}
        title="Página no encontrada"
        description="La ruta que buscas no existe o la tienda fue eliminada."
        action={
          <Link to="/" className={buttonClasses('primary', 'md')}>
            Ir a mis tiendas
          </Link>
        }
      />
    </div>
  )
}
