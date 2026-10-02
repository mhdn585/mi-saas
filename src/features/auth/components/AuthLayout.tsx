import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { APP_NAME } from '@/config/constants'
import { Card } from '@/shared/ui/Card'
import { IconStore } from '@/shared/ui/icons'
import { ThemeToggle } from '@/shared/ui/ThemeToggle'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-[100dvh] flex-col">
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

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <Card className="p-6 sm:p-8">
            <h1 className="text-xl font-semibold">{title}</h1>
            <p className="mt-1 text-sm text-muted">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </Card>
          <p className="mt-4 text-center text-sm text-muted">{footer}</p>
        </div>
      </main>
    </div>
  )
}
