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
      <div className="container pt-14 pb-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" aria-label="OpenProof">
              <BrandLogo markClassName="size-8" />
            </Link>
            <p className="mt-5 text-sm text-muted-foreground leading-relaxed">
              Infraestructura de prueba de existencia sobre Bitcoin para registrar,
              verificar y compartir constancias documentales con trazabilidad pública.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-200"
              >
                <Github className="w-4.5 h-4.5" />
                <span className="sr-only">GitHub</span>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-200"
              >
                <Twitter className="w-4.5 h-4.5" />
                <span className="sr-only">Twitter</span>
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 text-sm">Producto</h3>
            <ul className="space-y-3">
              {footerSections.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 text-sm">Recursos</h3>
            <ul className="space-y-3">
              {footerSections.resources.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 text-sm">Legal</h3>
            <ul className="space-y-3">
              {footerSections.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-14 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} OpenProof. Todos los derechos reservados.
            {/* Created By Caeher — subtle bottom-right signature */}
            <br />
            <a
              href="https://caeher.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-medium text-muted-foreground/60 hover:text-muted-foreground"
            >
              Created by Caeher
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
