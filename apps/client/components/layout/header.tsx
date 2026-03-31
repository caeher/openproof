'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Sun, Moon } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useAuth } from '@/components/auth/auth-provider'
import { UserMenu, UserMenuPanel } from '@/components/auth/user-menu'
import { BrandLogo } from '@/components/layout/brand-logo'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'

const publicNavLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/faq', label: 'FAQ' },
  { href: '/api-docs', label: 'API' },
]

const verifiedNavLinks = [
  { href: '/register', label: 'Registrar' },
  { href: '/history', label: 'Historial' },
  { href: '/developers', label: 'Developers' },
  { href: '/billing', label: 'Billing' },
]

function getNavLinks(authState: ReturnType<typeof useAuth>['authState']) {
  if (authState === 'authenticated_admin' || authState === 'authenticated_verified') {
    return [...publicNavLinks, ...verifiedNavLinks]
  }

  return publicNavLinks
}

export function Header() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { authState, isAuthenticated, isLoading, user } = useAuth()
  const navLinks = isLoading ? publicNavLinks : getNavLinks(authState)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = resolvedTheme === 'dark'

  return (
    <header className="sticky top-0 z-40 w-full bg-background/90 backdrop-blur-md border-b border-border">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          <Link href="/" aria-label="OpenProof" className="shrink-0">
            <BrandLogo markClassName="size-8" labelClassName="text-base md:text-lg" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {publicNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3.5 py-2 text-sm font-medium rounded-xl transition-colors duration-200',
                  pathname === link.href ||
                    (link.href !== '/' && pathname.startsWith(link.href))
                    ? 'text-foreground bg-secondary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="hidden sm:flex"
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Cambiar tema</span>
            </Button>
            {isLoading ? null : isAuthenticated && user ? (
              <UserMenu className="hidden sm:inline-flex" />
            ) : (
              <>
                <Button asChild variant="ghost" className="hidden sm:flex">
                  <Link href="/login">Iniciar sesión</Link>
                </Button>
                {/* <Button asChild className="hidden sm:flex">
                  <Link href="/signup">Crear cuenta</Link>
                </Button> */}
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
                  <SheetContent side="right" className="w-full max-w-xs bg-background border-l border-border">
                    <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
                    <div className="flex flex-col gap-6 mt-8">
                      <nav className="flex flex-col gap-1 p-4">
                        {navLinks.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                              'px-4 py-3 text-base font-medium rounded-xl transition-colors duration-200',
                              pathname === link.href
                                ? 'text-foreground bg-secondary'
                                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
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
                              className="px-4 py-3 text-base font-medium rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                            >
                              Iniciar sesión
                            </Link>
                            <Link
                              href="/signup"
                              onClick={() => setOpen(false)}
                              className="px-4 py-3 text-base font-medium rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                            >
                              Crear cuenta
                            </Link>
                          </>
                        ) : null}
                      </nav>

                      {!isLoading && isAuthenticated ? (
                        <UserMenuPanel
                          className="mx-4 border border-border rounded-2xl p-4"
                          onNavigate={() => setOpen(false)}
                        />
                      ) : !isLoading ? (
                        <>
                          <div className="flex items-center justify-between px-6 pt-4 border-t border-border">
                            <span className="text-sm text-muted-foreground">Tema</span>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setTheme(isDark ? 'light' : 'dark')}
                            >
                              {isDark ? (
                                <>
                                  <Sun className="h-4 w-4" />
                                  {/* Claro */}
                                </>
                              ) : (
                                <>
                                  <Moon className="h-4 w-4" />
                                  {/* Oscuro */}
                                </>
                              )}
                            </Button>
                          </div>
                          <Button asChild className="mx-6">
                            <Link href="/signup" onClick={() => setOpen(false)}>
                              Crear cuenta
                            </Link>
                          </Button>
                        </>
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
