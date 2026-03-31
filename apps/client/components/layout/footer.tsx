'use client'

import Link from 'next/link'
import { Github, Twitter } from 'lucide-react'

import { BrandLogo } from '@/components/layout/brand-logo'

const footerSections = {
  product: [
    { href: '/pricing', label: 'Créditos' },
    { href: '/developers', label: 'Integraciones' },
    { href: '/about', label: 'Sobre OpenProof' },
  ],
  resources: [
    { href: '/api-docs', label: 'Documentación API' },
    { href: '/faq', label: 'Preguntas frecuentes' },
  ],
  legal: [
    { href: '/privacy', label: 'Privacidad' },
    { href: '/terms', label: 'Términos' },
  ],
}

export function Footer() {
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
              Infraestructura de prueba de existencia sobre Bitcoin para registrar,
              verificar y compartir constancias documentales con trazabilidad pública.
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
              {footerSections.product.map((link) => (
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
              {footerSections.resources.map((link) => (
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
              {footerSections.legal.map((link) => (
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
