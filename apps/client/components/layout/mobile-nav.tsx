'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Code2, Home, Upload, FolderOpen, Wallet, MailCheck, Shield, CircleHelp } from 'lucide-react'

import { useAuth } from '@/components/auth/auth-provider'
import { cn } from '@/lib/utils'

const publicNavItems = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/pricing', label: 'Pricing', icon: Wallet },
  { href: '/faq', label: 'FAQ', icon: CircleHelp },
]

const verifiedNavItems = [
  { href: '/register', label: 'Registrar', icon: Upload },
  { href: '/history', label: 'Historial', icon: FolderOpen },
  { href: '/billing', label: 'Billing', icon: Wallet },
]

const authNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
]

function getNavItems(authState: ReturnType<typeof useAuth>['authState']) {
  if (authState === 'authenticated_admin') {
    return [
      { href: '/dashboard', label: 'Dashboard', icon: Home },
      { href: '/register', label: 'Registrar', icon: Upload },
      { href: '/history', label: 'Historial', icon: FolderOpen },
      { href: '/billing', label: 'Billing', icon: Wallet },
      { href: '/admin', label: 'Admin', icon: Shield },
    ]
  }

  if (authState === 'authenticated_verified') {
    return [
      { href: '/dashboard', label: 'Dashboard', icon: Home },
      { href: '/register', label: 'Registrar', icon: Upload },
      { href: '/history', label: 'Historial', icon: FolderOpen },
      { href: '/billing', label: 'Billing', icon: Wallet },
      { href: '/developers', label: 'Dev', icon: Code2 },
    ]
  }

  if (authState === 'authenticated_unverified') {
    return [
      { href: '/dashboard', label: 'Dashboard', icon: Home },
      { href: '/verify-email', label: 'Verificar', icon: MailCheck },
      { href: '/faq', label: 'Ayuda', icon: CircleHelp },
    ]
  }

  return publicNavItems
}

export function MobileNav() {
  const pathname = usePathname()
  const { authState, isLoading } = useAuth()
  const navItems = isLoading ? publicNavItems : getNavItems(authState)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-background/90 backdrop-blur-md border-t border-border">
        <div className="flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl',
                  'transition-colors duration-200 min-w-[64px]',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <div className={cn(
                  'p-1.5 rounded-xl transition-colors duration-200',
                  isActive && 'bg-primary/10'
                )}>
                  <Icon className={cn(
                    'w-5 h-5',
                    isActive && 'text-primary'
                  )} />
                </div>
                <span className={cn(
                  'text-[10px] font-medium',
                  isActive && 'text-primary'
                )}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
