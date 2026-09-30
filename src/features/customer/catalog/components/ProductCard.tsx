import { Link } from 'react-router-dom'
import { Badge } from '@/shared/ui/Badge'
import { Card } from '@/shared/ui/Card'
import { IconImage } from '@/shared/ui/icons'
import { formatPrice } from '@/shared/utils/format'
import { LOW_STOCK_THRESHOLD } from '@/config/constants'
import type { Product } from '@/shared/types/domain'

interface ProductCardProps {
  product: Product
  currency: string
}

export function ProductCard({ product, currency }: ProductCardProps) {
  return (
    <Link
      to={`products/${product.id}`}
      className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/40 rounded-lg"
    >
      <Card className="flex h-full flex-col overflow-hidden transition-colors group-hover:bg-fg/5">
        <span className="block aspect-square w-full overflow-hidden border-b border-line">
          {product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-muted">
              <IconImage width={24} height={24} />
            </span>
          )}
        </span>
        <span className="flex flex-1 flex-col gap-1 p-3">
          <span className="line-clamp-1 text-sm font-medium">{product.name}</span>
          <span className="line-clamp-2 flex-1 text-xs text-muted">
            {product.description || 'Sin descripción'}
          </span>
          <span className="mt-1 flex items-center justify-between gap-2">
            <span className="text-sm font-semibold">
              {formatPrice(product.price, currency)}
            </span>
            {product.stock === 0 ? (
              <Badge variant="solid">Agotado</Badge>
            ) : product.stock <= LOW_STOCK_THRESHOLD ? (
              <Badge variant="muted">Últimas unidades</Badge>
            ) : null}
          </span>
        </span>
      </Card>
    </Link>
  )
}
