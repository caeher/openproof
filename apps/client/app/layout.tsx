import type { Metadata, Viewport } from 'next'
import { DM_Sans, Fira_Code } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/components/auth/auth-provider'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: 'OpenProof | Pruebas de existencia sobre Bitcoin',
  description: 'Registra hashes, comparte constancias públicas y verifica autenticidad documental sobre la blockchain de Bitcoin.',
  keywords: ['openproof', 'proof of existence', 'bitcoin', 'blockchain', 'timestamp', 'hash', 'documento'],
  authors: [{ name: 'Caeher' }],
  generator: 'Next.js',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-light-32x32.png', sizes: '32x32', type: 'image/png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', sizes: '32x32', type: 'image/png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.ico',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f5f0' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1714' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${firaCode.variable} font-sans antialiased`}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            {/* Created By Caeher — subtle bottom-right signature */}
            <a
              href="https://caeher.com"
              target="_blank"
              rel="noopener noreferrer"
              className="fixed bottom-3 right-3 z-[99] px-2.5 py-1 rounded-full text-[10px] font-medium text-muted-foreground/60 hover:text-muted-foreground bg-card/80 border border-border/50 transition-colors duration-300"
            >
              Created by Caeher
            </a>
          </ThemeProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
