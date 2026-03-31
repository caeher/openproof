'use client'

import Link from 'next/link'
import { Github, Twitter } from 'lucide-react'

import { useAuth } from '@/components/auth/auth-provider'
import { BrandLogo } from '@/components/layout/brand-logo'
import { buildVerifyEmailPath } from '@/lib/auth-routing'

const footerLinks = {
  resources: [
    { href: '/api-docs', label: 'Documentación API' },
    { href: '/faq', label: 'FAQ' },
    { href: '/about', label: 'Sobre el proyecto' },
  ],
  legal: [
    { href: '/privacy', label: 'Privacidad' },
    { href: '/terms', label: 'Términos' },
  ],
}

function getProductLinks(authState: ReturnType<typeof useAuth>['authState']) {
  if (authState === 'authenticated_admin') {
    return [
      { href: '/pricing', label: 'Pricing' },
      { href: '/register', label: 'Registrar documento' },
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/admin', label: 'Admin' },
    ]
  }

  if (authState === 'authenticated_verified') {
    return [
      { href: '/pricing', label: 'Pricing' },
      { href: '/register', label: 'Registrar documento' },
      { href: '/history', label: 'Historial' },
      { href: '/dashboard', label: 'Dashboard' },
    ]
  }

  if (authState === 'authenticated_unverified') {
    return [
      { href: buildVerifyEmailPath('/register'), label: 'Confirmar correo' },
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/account', label: 'Cuenta' },
      { href: '/api-docs', label: 'Documentación API' },
    ]
  }

  return [
    { href: '/pricing', label: 'Pricing' },
    { href: '/login?next=%2Fregister', label: 'Registrar documento' },
    { href: '/login?next=%2Fdashboard', label: 'Dashboard' },
    { href: '/api-docs', label: 'Documentación API' },
  ]
}

export function Footer() {
  const { authState, isLoading } = useAuth()
  const productLinks = isLoading ? getProductLinks('anonymous') : getProductLinks(authState)

  return (
    <footer className="border-t border-border bg-card/50 pb-20 md:pb-0">
      <div className="container py-12">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" aria-label="OpenProof">
              <BrandLogo markClassName="size-9" />
            </Link>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              Infraestructura de prueba de existencia sobre Bitcoin para emitir,
              compartir y auditar constancias documentales con trazabilidad pública.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <Github className="w-5 h-5" />
                <span className="sr-only">GitHub</span>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <Twitter className="w-5 h-5" />
                <span className="sr-only">Twitter</span>
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Producto</h3>
            <ul className="space-y-2">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Recursos</h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground text-center">
            {new Date().getFullYear()} OpenProof. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
