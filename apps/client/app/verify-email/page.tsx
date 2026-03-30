'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react'
import { verifyEmail } from '@/lib/api'
import { Header, Footer, MobileNav } from '@/components/layout'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { AuthUser } from '@/types'

function VerifyEmailPageContent() {
  const searchParams = useSearchParams()
  const initialToken = searchParams.get('token') || ''
  const autoSubmitted = useRef(false)
  const [token, setToken] = useState(initialToken)
  const [error, setError] = useState<string | null>(null)
  const [verifiedUser, setVerifiedUser] = useState<AuthUser | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submitToken(value: string) {
    setError(null)
    setVerifiedUser(null)
    setIsSubmitting(true)

    try {
      const response = await verifyEmail(value)
      if (!response.success || !response.data) {
        setError(response.error || 'No fue posible verificar el correo.')
        return
      }

      setVerifiedUser(response.data.user)
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (initialToken && !autoSubmitted.current) {
      autoSubmitted.current = true
      void submitToken(initialToken)
    }
  }, [initialToken])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await submitToken(token)
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
                <CardTitle>Verificar correo</CardTitle>
                <CardDescription>
                  Pega el token recibido o abre el enlace enviado por correo.
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

                  {verifiedUser ? (
                    <Alert>
                      <AlertDescription>
                        Correo verificado correctamente para {verifiedUser.email}. Ya puedes iniciar sesion y usar las rutas privadas.
                      </AlertDescription>
                    </Alert>
                  ) : null}

                  <div className="space-y-2">
                    <Label htmlFor="token">Token</Label>
                    <Input
                      id="token"
                      value={token}
                      onChange={(event) => setToken(event.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      'Verificar correo'
                    )}
                  </Button>
                </form>

                {verifiedUser ? (
                  <Button asChild variant="outline" className="mt-4 w-full">
                    <Link href="/login">Ir a iniciar sesion</Link>
                  </Button>
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

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailPageContent />
    </Suspense>
  )
}