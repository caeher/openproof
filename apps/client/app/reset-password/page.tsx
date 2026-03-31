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
import { getApiErrorMessage, resetPassword } from '@/lib/api'

function ResetPasswordPageContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (password !== confirmPassword) {
      setError('Las contrasenas no coinciden.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await resetPassword(token, password)
      if (!response.success || !response.data) {
        setError(getApiErrorMessage(response, 'No fue posible restablecer la contrasena.'))
        return
      }

      setSuccessMessage(response.data.message)
      setPassword('')
      setConfirmPassword('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthSplitLayout
      badge="Nuevo secreto"
      title="Define una contrasena nueva"
      description="El token de recuperacion y la nueva credencial se procesan en backend para limpiar sesiones antiguas y dejar una sola verdad sobre el acceso."
      backHref="/login"
      backLabel="Volver al login"
      sideTitle="La recuperacion corta el acceso previo y restablece el control"
      sideDescription="Usa este flujo para completar el reset desde el enlace firmado que llega por correo."
      sideStats={[
        'El cambio invalida todas las sesiones activas del usuario.',
        'El token no se expone ni se pega manualmente desde la interfaz.',
        'Al terminar, el siguiente paso natural es iniciar sesion de nuevo.',
      ]}
    >
      <GuestOnlyRoute>
        <div className="space-y-4">
          {!token ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                El enlace de recuperación es inválido o ya no incluye el token necesario. Solicita un nuevo correo desde recuperación de contraseña.
              </AlertDescription>
            </Alert>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            {error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            {successMessage ? (
              <Alert>
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="password">Nueva contrasena</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar contrasena</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Actualizando contrasena...
                </>
              ) : (
                'Guardar nueva contrasena'
              )}
            </Button>
          </form>

          {successMessage ? (
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">Ir a iniciar sesion</Link>
            </Button>
          ) : !token ? (
            <Button asChild variant="outline" className="w-full">
              <Link href="/forgot-password">Solicitar nuevo enlace</Link>
            </Button>
          ) : null}
        </div>
      </GuestOnlyRoute>
    </AuthSplitLayout>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPageContent />
    </Suspense>
  )
}