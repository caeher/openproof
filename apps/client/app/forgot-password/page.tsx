'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, Loader2 } from 'lucide-react'

import { AuthSplitLayout } from '@/components/auth/auth-split-layout'
import { GuestOnlyRoute } from '@/components/auth/guest-only-route'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { forgotPassword, getApiErrorMessage } from '@/lib/api'
import { sanitizeNextPath } from '@/lib/auth-routing'
import type { ForgotPasswordResponse } from '@/types'

function ForgotPasswordPageContent() {
  const searchParams = useSearchParams()
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
        setError(getApiErrorMessage(response, 'No fue posible generar la recuperacion.'))
        return
      }

      setResult(response.data)
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextPath = sanitizeNextPath(searchParams.get('next'))
  const loginHref = nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : '/login'

  return (
    <AuthSplitLayout
      badge="Recuperacion"
      title="Recupera el acceso sin invalidar la trazabilidad"
      description="Solicita un enlace de restablecimiento. Cuando cambies la contrasena, las sesiones anteriores quedan revocadas desde el backend."
      backHref={loginHref}
      backLabel="Volver al login"
      sideTitle="Rotar password tambien limpia sesiones antiguas"
      sideDescription="El nuevo flujo mantiene varias sesiones activas al iniciar sesion, pero endurece el sistema cuando se cambia o recupera la credencial principal."
      sideStats={[
        'No se revela si el correo existe o no; el backend responde con un mensaje generico.',
        'La recuperación se completa desde el enlace enviado por correo, sin mostrar tokens en pantalla.',
        'Despues del reset, el siguiente acceso empieza desde una sesion limpia.',
      ]}
    >
      <GuestOnlyRoute>
        <div className="space-y-4">
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

        </div>
      </GuestOnlyRoute>
    </AuthSplitLayout>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordPageContent />
    </Suspense>
  )
}