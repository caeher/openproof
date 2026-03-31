'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, Loader2, MailCheck } from 'lucide-react'

import { AuthSplitLayout } from '@/components/auth/auth-split-layout'
import { useAuth } from '@/components/auth/auth-provider'
import { GuestOnlyRoute } from '@/components/auth/guest-only-route'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getApiErrorMessage, resendVerification } from '@/lib/api'
import { sanitizeNextPath } from '@/lib/auth-routing'
import type { SignupResponse } from '@/types'

function SignupPageContent() {
  const searchParams = useSearchParams()
  const { signupWithPassword } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<SignupResponse | null>(null)
  const [resendMessage, setResendMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setResendMessage(null)

    if (password !== confirmPassword) {
      setError('Las contrasenas no coinciden.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await signupWithPassword(name, email, password)
      if (!response.success || !response.data) {
        setError(getApiErrorMessage(response, 'No fue posible crear la cuenta.'))
        return
      }

      setSuccess(response.data)
      setName('')
      setPassword('')
      setConfirmPassword('')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleResend() {
    const targetEmail = success?.user.email || email
    if (!targetEmail) {
      return
    }

    setIsResending(true)
    setError(null)
    setResendMessage(null)

    try {
      const response = await resendVerification(targetEmail)
      if (!response.success || !response.data) {
        setError(getApiErrorMessage(response, 'No fue posible reenviar la verificacion.'))
        return
      }

      setResendMessage(response.data.message)
    } finally {
      setIsResending(false)
    }
  }

  const nextPath = sanitizeNextPath(searchParams.get('next'))
  const loginHref = nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : '/login'

  return (
    <AuthSplitLayout
      badge="Nueva cuenta"
      title="Crea tu espacio de custodia documental"
      description="Tu nombre y correo quedan asociados a la cuenta desde el alta. El acceso a registros, historial y API keys se desbloquea en fases segun el estado de verificacion."
      backHref="/"
      backLabel="Volver al inicio"
      sideTitle="Una cuenta, multiples sesiones y una misma prueba auditada"
      sideDescription="El backend conserva el estado canonico: sesion, verificacion y permisos. El cliente solo consume ese contrato para evitar desalineaciones entre vistas y rutas."
      sideStats={[
        'El nombre del usuario ya forma parte del modelo persistido.',
        'La verificacion por correo puede reenviarse sin volver a crear la cuenta.',
        'La activación ocurre desde el enlace del correo, sin exponer tokens en la interfaz.',
        'Cada redireccion next se filtra antes de usarla en el navegador.',
      ]}
      footer={
        <p>
          Ya tienes cuenta?{' '}
          <Link href={loginHref} className="font-medium text-foreground underline-offset-4 hover:underline">
            Inicia sesion
          </Link>
        </p>
      }
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

            {success ? (
              <Alert className="border-success/30 bg-success/10 text-foreground">
                <MailCheck className="h-4 w-4" />
                <AlertDescription>
                  Cuenta creada para {success.user.name}. Revisa {success.user.email} y valida el correo antes de registrar documentos o emitir API keys.
                </AlertDescription>
              </Alert>
            ) : null}

            {resendMessage ? (
              <Alert>
                <AlertDescription>{resendMessage}</AlertDescription>
              </Alert>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="password">Contrasena</Label>
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
                  Creando cuenta...
                </>
              ) : (
                'Crear cuenta'
              )}
            </Button>
          </form>

          {success ? (
            <div className="rounded-3xl border border-border bg-secondary/35 p-4 text-sm">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="button" variant="outline" onClick={() => void handleResend()} disabled={isResending}>
                  {isResending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Reenviar verificacion
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </GuestOnlyRoute>
    </AuthSplitLayout>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupPageContent />
    </Suspense>
  )
}