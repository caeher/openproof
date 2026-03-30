'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react'
import { forgotPassword } from '@/lib/api'
import { Header, Footer, MobileNav } from '@/components/layout'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ForgotPasswordResponse } from '@/types'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<ForgotPasswordResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setResult(null)
    setIsSubmitting(true)

    try {
      const response = await forgotPassword(email)
      if (!response.success || !response.data) {
        setError(response.error || 'No fue posible generar la recuperacion.')
        return
      }

      setResult(response.data)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pb-24 md:pb-0">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al login
          </Link>

          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Recuperar contrasena</CardTitle>
                <CardDescription>
                  Genera un enlace de recuperacion para restablecer tu acceso.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  ) : null}

                  {result ? (
                    <Alert>
                      <AlertDescription>{result.message}</AlertDescription>
                    </Alert>
                  ) : null}

                  <div className="space-y-2">
                    <Label htmlFor="email">Correo</Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generando enlace...
                      </>
                    ) : (
                      'Enviar instrucciones'
                    )}
                  </Button>
                </form>

                {result?.devResetToken ? (
                  <div className="mt-6 rounded-lg border border-border bg-secondary/40 p-4 text-sm">
                    <p className="font-medium text-foreground">Token de recuperacion para desarrollo</p>
                    <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                      {result.devResetToken}
                    </p>
                    <Button asChild size="sm" className="mt-3">
                      <Link href={`/reset-password?token=${encodeURIComponent(result.devResetToken)}`}>
                        Continuar con este token
                      </Link>
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  )
}