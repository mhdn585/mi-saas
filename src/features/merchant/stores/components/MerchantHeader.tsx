import { Link } from 'react-router-dom'
import { APP_NAME } from '@/config/constants'
import { IconStore } from '@/shared/ui/icons'
import { ThemeToggle } from '@/shared/ui/ThemeToggle'

export function MerchantHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="flex h-7 w-7 items-center justify-center rounded-md border border-line">
            <IconStore />
          </span>
          {APP_NAME}
        </Link>
        <ThemeToggle />
      </div>
    </header>
  )
}
