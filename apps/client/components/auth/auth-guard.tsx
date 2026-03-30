'use client'

import { useEffect, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Loader2, MailCheck } from 'lucide-react'
import { useAuth } from './auth-provider'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface AuthGuardProps {
  children: ReactNode
  requireVerified?: boolean
}

export function AuthGuard({
  children,
  requireVerified = false,
}: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading, logoutCurrentSession, user } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const next = encodeURIComponent(pathname || '/dashboard')
      router.replace(`/login?next=${next}`)
    }
  }, [isAuthenticated, isLoading, pathname, router])

  if (isLoading || !isAuthenticated) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-3 py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Validando sesion...
        </CardContent>
      </Card>
    )
  }

  if (requireVerified && user && !user.emailVerified) {
    return (
      <Card>
        <CardContent className="py-8">
          <Alert>
            <MailCheck className="h-4 w-4" />
            <AlertTitle>Verifica tu correo antes de continuar</AlertTitle>
            <AlertDescription>
              Tu cuenta ya existe, pero el backend exige correo verificado para registrar y consultar documentos privados.
            </AlertDescription>
          </Alert>

          <div className="mt-6 space-y-3 text-sm text-muted-foreground">
            <p>Abre el enlace de verificacion enviado a {user.email} o introduce el token manualmente.</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/verify-email">Verificar correo</Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  void logoutCurrentSession()
                }}
              >
                Cerrar sesion
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return <>{children}</>
}