'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, Shield, Sun, Moon, LogOut, LayoutDashboard, MailCheck } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useAuth } from '@/components/auth/auth-provider'
import { buildVerifyEmailPath } from '@/lib/auth-routing'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'

const publicNavLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/verify', label: 'Verificar' },
  { href: '/faq', label: 'FAQ' },
  { href: '/api-docs', label: 'API' },
]

const verifiedNavLinks = [
  { href: '/register', label: 'Registrar' },
  { href: '/history', label: 'Historial' },
  { href: '/developers', label: 'Developers' },
  { href: '/billing', label: 'Billing' },
]

const authNavLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/account', label: 'Cuenta' },
]

function getNavLinks(authState: ReturnType<typeof useAuth>['authState']) {
  if (authState === 'authenticated_admin') {
    return [...publicNavLinks, ...verifiedNavLinks, ...authNavLinks, { href: '/admin', label: 'Admin' }]
  }

  if (authState === 'authenticated_verified') {
    return [...publicNavLinks, ...verifiedNavLinks, ...authNavLinks]
  }

  if (authState === 'authenticated_unverified') {
    return [...publicNavLinks, ...authNavLinks, { href: '/verify-email', label: 'Verificar correo' }]
  }

  return publicNavLinks
}

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { authState, isAuthenticated, isLoading, logoutCurrentSession, user } = useAuth()
  const navLinks = isLoading ? publicNavLinks : getNavLinks(authState)
  const primaryActionHref = authState === 'authenticated_unverified'
    ? buildVerifyEmailPath('/register')
    : '/dashboard'
  const displayName = user?.name || user?.email || 'Cuenta'

  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleLogout() {
    await logoutCurrentSession()
    setOpen(false)
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur-lg border-b border-border">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-foreground">
              <Shield className="w-5 h-5 text-background" />
            </div>
            <span className="font-semibold text-lg text-foreground">
              ProofChain
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  pathname === link.href || 
                  (link.href !== '/' && pathname.startsWith(link.href))
                    ? 'text-foreground bg-secondary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {isAuthenticated && user ? (
              <div className="hidden lg:flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-sm text-muted-foreground">
                {authState === 'authenticated_unverified' ? (
                  <MailCheck className="h-4 w-4" />
                ) : (
                  <LayoutDashboard className="h-4 w-4" />
                )}
                <span className="max-w-[160px] truncate">{displayName}</span>
              </div>
            ) : null}

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="hidden sm:flex"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Cambiar tema</span>
            </Button>

            {isLoading ? null : isAuthenticated ? (
              <>
                <Button asChild variant="outline" className="hidden sm:flex">
                  <Link href={primaryActionHref}>
                    {authState === 'authenticated_unverified' ? 'Verificar correo' : 'Dashboard'}
                  </Link>
                </Button>
                <Button className="hidden sm:flex" onClick={() => void handleLogout()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesion
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="outline" className="hidden sm:flex">
                  <Link href="/login">Iniciar sesion</Link>
                </Button>
                <Button asChild className="hidden sm:flex">
                  <Link href="/signup">Crear cuenta</Link>
                </Button>
              </>
            )}

            {/* Mobile Menu */}
            <div className="md:hidden" suppressHydrationWarning>
              {mounted && (
                <Sheet open={open} onOpenChange={setOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Abrir menú</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full max-w-xs">
                    <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
                    <div className="flex flex-col gap-6 mt-8">
                      <nav className="flex flex-col gap-2">
                        {navLinks.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                              'px-4 py-3 text-base font-medium rounded-lg transition-colors',
                              pathname === link.href
                                ? 'text-foreground bg-secondary'
                                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                            )}
                          >
                            {link.label}
                          </Link>
                        ))}
                        {!isLoading && !isAuthenticated ? (
                          <>
                            <Link
                              href="/login"
                              onClick={() => setOpen(false)}
                              className="px-4 py-3 text-base font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                            >
                              Iniciar sesion
                            </Link>
                            <Link
                              href="/signup"
                              onClick={() => setOpen(false)}
                              className="px-4 py-3 text-base font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                            >
                              Crear cuenta
                            </Link>
                          </>
                        ) : null}
                      </nav>

                      <div className="flex items-center justify-between px-4 pt-4 border-t border-border">
                        <span className="text-sm text-muted-foreground">Tema</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        >
                          {theme === 'dark' ? (
                            <>
                              <Sun className="h-4 w-4 mr-2" />
                              Claro
                            </>
                          ) : (
                            <>
                              <Moon className="h-4 w-4 mr-2" />
                              Oscuro
                            </>
                          )}
                        </Button>
                      </div>

                      {!isLoading && isAuthenticated ? (
                        <Button className="mx-4" onClick={() => void handleLogout()}>
                          <LogOut className="mr-2 h-4 w-4" />
                          Cerrar sesion
                        </Button>
                      ) : !isLoading ? (
                        <Button asChild className="mx-4">
                          <Link href="/signup" onClick={() => setOpen(false)}>
                            Crear cuenta
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </SheetContent>
                </Sheet>
              )}
              {!mounted && (
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Abrir menú</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
