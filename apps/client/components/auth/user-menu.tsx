'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Code2,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  MailCheck,
  Moon,
  Shield,
  Sun,
  Upload,
  User,
  Wallet,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTheme } from 'next-themes'

import { useAuth } from '@/components/auth/auth-provider'
import { UserAvatar } from '@/components/auth/user-avatar'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { buildVerifyEmailPath } from '@/lib/auth-routing'
import { getUserDisplayName } from '@/lib/avatar'
import { cn } from '@/lib/utils'
import type { AuthState } from '@/types'

interface UserMenuItem {
  href: string
  label: string
  icon: typeof LayoutDashboard
}

function getItemPath(href: string) {
  return href.split('?')[0]?.split('#')[0] || href
}

export function getUserMenuItems(authState: AuthState): UserMenuItem[] {
  const items: UserMenuItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/account', label: 'Cuenta', icon: User },
  ]

  if (authState === 'authenticated_verified' || authState === 'authenticated_admin') {
    items.push(
      { href: '/register', label: 'Registrar', icon: Upload },
      { href: '/history', label: 'Historial', icon: FolderOpen },
      { href: '/billing', label: 'Billing', icon: Wallet },
      { href: '/developers', label: 'Developers', icon: Code2 },
    )
  }

  if (authState === 'authenticated_unverified') {
    items.push({
      href: buildVerifyEmailPath('/register'),
      label: 'Verificar correo',
      icon: MailCheck,
    })
  }

  if (authState === 'authenticated_admin') {
    items.push({ href: '/admin', label: 'Admin', icon: Shield })
  }

  return items
}

interface UserMenuPanelProps {
  className?: string
  onNavigate?: () => void
}

export function UserMenuPanel({ className, onNavigate }: UserMenuPanelProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()
  const { authState, logoutCurrentSession, user } = useAuth()
  const items = useMemo(() => getUserMenuItems(authState), [authState])
  const displayName = getUserDisplayName(user)
  const isDark = mounted && resolvedTheme === 'dark'

  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleLogout() {
    await logoutCurrentSession()
    onNavigate?.()
    router.push('/')
  }

  if (!user) {
    return null
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="px-3 pt-3">
        <div className="flex items-center gap-3">
          <UserAvatar
            user={user}
            className="size-11 ring-1 ring-border/80"
            fallbackClassName="text-sm"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          {authState === 'authenticated_unverified' ? (
            <MailCheck className="size-3.5" />
          ) : authState === 'authenticated_admin' ? (
            <Shield className="size-3.5" />
          ) : (
            <User className="size-3.5" />
          )}
          <span>
            {authState === 'authenticated_unverified'
              ? 'Correo pendiente de verificación'
              : authState === 'authenticated_admin'
                ? 'Administrador'
                : 'Cuenta activa'}
          </span>
        </div>
      </div>

      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon
          const itemPath = getItemPath(item.href)
          const isActive = pathname === itemPath || (itemPath !== '/' && pathname.startsWith(`${itemPath}/`))

          return (
            <Button
              key={item.href}
              variant="ghost"
              className={cn(
                'w-full justify-start rounded-xl px-3',
                isActive && 'bg-secondary text-foreground',
              )}
              asChild
            >
              <Link href={item.href} onClick={onNavigate}>
                <Icon className="mr-2 size-4" />
                {item.label}
              </Link>
            </Button>
          )
        })}
      </div>

      <Button
        variant="outline"
        className="w-full justify-start rounded-xl"
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
      >
        {isDark ? <Sun className="mr-2 size-4" /> : <Moon className="mr-2 size-4" />}
        {isDark ? 'Modo claro' : 'Modo oscuro'}
      </Button>

      <div className="border-t border-border pt-3">
        <Button
          variant="ghost"
          className="w-full justify-start rounded-xl text-destructive hover:text-destructive"
          onClick={() => {
            void handleLogout()
          }}
        >
          <LogOut className="mr-2 size-4" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  )
}

interface UserMenuProps {
  className?: string
}

export function UserMenu({ className }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('rounded-full p-0 hover:bg-transparent', className)}
        >
          <UserAvatar
            user={user}
            className="size-9 ring-1 ring-border/80 transition-shadow hover:ring-foreground/20"
            fallbackClassName="text-xs"
          />
          <span className="sr-only">Abrir menú de usuario</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[320px] p-3">
        <UserMenuPanel onNavigate={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  )
}