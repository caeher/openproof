import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { Footer } from './footer'
import { Header } from './header'
import { MobileNav } from './mobile-nav'

interface SiteShellProps {
  children: ReactNode
  mainClassName?: string
}

export function SiteShell({ children, mainClassName }: SiteShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className={cn('flex-1 pb-24 md:pb-0', mainClassName)}>{children}</main>
      <Footer />
      <MobileNav />
    </div>
  )
}