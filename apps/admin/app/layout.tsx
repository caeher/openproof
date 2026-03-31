import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { IBM_Plex_Mono, Space_Grotesk } from 'next/font/google'

import './globals.css'

const display = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
})

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'OpenProof Admin',
  description: 'Panel administrativo para wallet, usuarios, créditos y documentos.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="es">
      <body
        className={`${display.variable} ${mono.variable} min-h-screen bg-transparent font-[family-name:var(--font-display)] text-[var(--ink-strong)] antialiased`}
      >
        {children}
      </body>
    </html>
  )
}