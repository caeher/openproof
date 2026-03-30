'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, Loader2 } from 'lucide-react'

import { AuthSplitLayout } from '@/components/auth/auth-split-layout'
import { deriveAuthState, useAuth } from '@/components/auth/auth-provider'
import { GuestOnlyRoute } from '@/components/auth/guest-only-route'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getApiErrorMessage } from '@/lib/api'
import { resolveAuthenticatedNext, sanitizeNextPath } from '@/lib/auth-routing'

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { loginWithPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await loginWithPassword(email, password)
      if (!response.success || !response.data) {
        setError(getApiErrorMessage(response, 'No fue posible iniciar sesion.'))
        return
      }

      const nextPath = sanitizeNextPath(searchParams.get('next'))
      router.push(resolveAuthenticatedNext(deriveAuthState(response.data.user), nextPath))
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextPath = sanitizeNextPath(searchParams.get('next'))
  const signupHref = nextPath ? `/signup?next=${encodeURIComponent(nextPath)}` : '/signup'
  const forgotPasswordHref = nextPath
    ? `/forgot-password?next=${encodeURIComponent(nextPath)}`
    : '/forgot-password'

  return (
    <AuthSplitLayout
      badge="Acceso seguro"
      title="Inicia sesion y retoma tu flujo"
      description="Tu sesion vive en el backend y el navegador solo conserva la cookie. Entra, continua donde lo dejaste y manten el control de tus pruebas."
      backHref="/"
      backLabel="Volver al inicio"
      sideTitle="Cada documento queda vinculado a una identidad auditable"
      sideDescription="OpenProof separa sesion, verificacion y permisos para que el acceso a dashboard, billing y developer portal responda al estado real de la cuenta."
      sideStats={[
        'Dashboard y cuenta disponibles apenas autenticas la sesion.',
        'Las rutas sensibles exigen correo verificado antes de permitir registros o API keys.',
        'El destino next se valida para evitar redirecciones inseguras.',
        'Las sesiones concurrentes siguen activas hasta cerrar la actual o rotar password.',
      ]}
      footer={
        <p>
          No tienes cuenta?{' '}
          <Link href={signupHref} className="font-medium text-foreground underline-offset-4 hover:underline">
            Crear cuenta
          </Link>
        </p>
      }
    >
      <GuestOnlyRoute>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
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

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="password">Contrasena</Label>
              <Link href={forgotPasswordHref} className="text-sm text-foreground underline-offset-4 hover:underline">
                Olvidaste tu contrasena?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ingresando...
              </>
            ) : (
              'Entrar'
            )}
          </Button>
        </form>
      </GuestOnlyRoute>
    </AuthSplitLayout>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  )
}