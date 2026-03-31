'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, Loader2, MailCheck } from 'lucide-react'

import { AuthSplitLayout } from '@/components/auth/auth-split-layout'
import { deriveAuthState, useAuth } from '@/components/auth/auth-provider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getApiErrorMessage, resendVerification, verifyEmail } from '@/lib/api'
import { resolveAuthenticatedNext, sanitizeNextPath } from '@/lib/auth-routing'
import type { AuthUser } from '@/types'

function VerifyEmailPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { authState, isLoading, refreshSession, user } = useAuth()
  const initialToken = searchParams.get('token') || ''
  const autoSubmitted = useRef(false)
  const [token, setToken] = useState(initialToken)
  const [resendEmail, setResendEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [verifiedUser, setVerifiedUser] = useState<AuthUser | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)

  const nextPath = sanitizeNextPath(searchParams.get('next'))

  useEffect(() => {
    if (!isLoading && (authState === 'authenticated_verified' || authState === 'authenticated_admin')) {
      router.replace(resolveAuthenticatedNext(authState, nextPath))
    }
  }, [authState, isLoading, nextPath, router])

  async function submitToken(value: string) {
    setError(null)
    setVerifiedUser(null)
    setInfoMessage(null)
    setIsSubmitting(true)

    try {
      const response = await verifyEmail(value)
      if (!response.success || !response.data) {
        setError(getApiErrorMessage(response, 'No fue posible verificar el correo.'))
        return
      }

      setVerifiedUser(response.data.user)

      const refreshedUser = await refreshSession()
      if (refreshedUser) {
        router.replace(resolveAuthenticatedNext(deriveAuthState(refreshedUser), nextPath))
        return
      }

      setInfoMessage('Correo verificado. Inicia sesion para continuar con las rutas privadas.')
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

  async function handleResend() {
    const targetEmail = user?.email || resendEmail
    if (!targetEmail) {
      setError('Indica el correo al que quieres reenviar la verificacion.')
      return
    }

    setError(null)
    setInfoMessage(null)
    setIsResending(true)

    try {
      const response = await resendVerification(user ? undefined : targetEmail)
      if (!response.success || !response.data) {
        setError(getApiErrorMessage(response, 'No fue posible reenviar la verificacion.'))
        return
      }

      setInfoMessage(response.data.message)
      if (response.data.devVerificationToken) {
        setToken(response.data.devVerificationToken)
      }
    } finally {
      setIsResending(false)
    }
  }

  const loginParams = new URLSearchParams()
  if (nextPath) {
    loginParams.set('next', nextPath)
  }
  const loginHref = loginParams.size > 0 ? `/login?${loginParams.toString()}` : '/login'

  return (
    <AuthSplitLayout
      badge="Correo pendiente"
      title="Valida tu identidad antes de registrar o integrar"
      description="Este paso desbloquea las rutas verificadas. Si ya tienes sesion abierta, al confirmar el correo te devolvemos al destino permitido por el estado real de tu cuenta."
      backHref={loginHref}
      backLabel="Volver al login"
      sideTitle="El flujo de verificacion mezcla enlace, token manual y reenvio"
      sideDescription="La misma pantalla sirve para abrir el enlace del correo, pegar un token o pedir un reenvio. Asi evitamos caminos duplicados y estados inconsistentes."
      sideStats={[
        'Si ya existe una sesion, el refresh toma el estado actualizado desde /auth/session.',
        'Si llegas sin sesion, el correo queda verificado y luego vuelves al login.',
        'El parametro next solo se usa despues de validarlo y comprobar permisos.',
      ]}
    >
      <div className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {verifiedUser ? (
            <Alert className="border-success/30 bg-success/10 text-foreground">
              <MailCheck className="h-4 w-4" />
              <AlertDescription>
                Correo verificado correctamente para {verifiedUser.email}.
              </AlertDescription>
            </Alert>
          ) : null}

          {infoMessage ? (
            <Alert>
              <AlertDescription>{infoMessage}</AlertDescription>
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

        <div className="rounded-3xl border border-border bg-secondary/35 p-4">
          <div className="space-y-3 text-sm">
            <p className="font-medium text-foreground">Reenviar correo de verificacion</p>
            {user ? (
              <p className="text-muted-foreground">
                Se enviara un nuevo correo a {user.email}.
              </p>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="resend-email">Correo</Label>
                <Input
                  id="resend-email"
                  type="email"
                  autoComplete="email"
                  value={resendEmail}
                  onChange={(event) => setResendEmail(event.target.value)}
                />
              </div>
            )}
            <Button type="button" variant="outline" onClick={() => void handleResend()} disabled={isResending}>
              {isResending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Reenviar verificacion
            </Button>
          </div>
        </div>

        {verifiedUser ? (
          <Button asChild variant="outline" className="w-full">
            <Link href={loginHref}>Ir a iniciar sesion</Link>
          </Button>
        ) : null}
      </div>
    </AuthSplitLayout>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailPageContent />
    </Suspense>
  )
}