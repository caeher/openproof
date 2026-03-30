'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CreditCard, Loader2, ShieldCheck, Wallet } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { Footer, Header, MobileNav } from '@/components/layout'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getPricingPackages } from '@/lib/api'
import type { CreditPackage } from '@/types'

function formatUsd(cents: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

export default function PricingPage() {
  const { isAuthenticated } = useAuth()
  const [packages, setPackages] = useState<CreditPackage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadPackages() {
      try {
        const response = await getPricingPackages()
        if (!response.success || !response.data) {
          throw new Error(response.error || 'No fue posible cargar pricing.')
        }
        setPackages(response.data)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No fue posible cargar pricing.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadPackages()
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pb-24 md:pb-0">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-foreground">
              <Wallet className="h-4 w-4" />
              Pricing por créditos
            </div>
            <h1 className="mt-4 text-3xl md:text-5xl font-bold text-foreground">
              Compra capacidad cuando la necesites
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
              OpenProof no usa suscripciones. Compras paquetes fijos, pagas con Lightning en USD y el saldo queda disponible para registrar documentos bajo demanda.
            </p>
          </div>

          {error ? (
            <div className="max-w-3xl mx-auto mt-8">
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          ) : null}

          <div className="max-w-6xl mx-auto mt-10 grid gap-6 md:grid-cols-3">
            {isLoading ? (
              <Card className="md:col-span-3">
                <CardContent className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Cargando paquetes...
                </CardContent>
              </Card>
            ) : (
              packages.map((creditPackage) => (
                <Card key={creditPackage.id} className="relative overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-1 bg-accent" />
                  <CardHeader>
                    <CardTitle>{creditPackage.name}</CardTitle>
                    <CardDescription>{creditPackage.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold text-foreground">
                      {formatUsd(creditPackage.priceUsdCents)}
                    </p>
                    <p className="mt-2 text-muted-foreground">
                      {creditPackage.credits} créditos cargados al liquidar el invoice.
                    </p>

                    <div className="mt-6 rounded-xl border border-border p-4 text-sm text-muted-foreground space-y-2">
                      <p className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-foreground" />
                        Pago server-to-server con Blink
                      </p>
                      <p className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-foreground" />
                        Acreditación idempotente con webhook y reconciliación
                      </p>
                    </div>

                    <Button asChild className="mt-6 w-full">
                      <Link href={isAuthenticated ? '/billing' : '/signup'}>
                        {isAuthenticated ? 'Comprar desde billing' : 'Crear cuenta y comprar'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  )
}