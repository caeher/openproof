'use client'

import { useEffect, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

import { useAuth } from './auth-provider'
import { Card, CardContent } from '@/components/ui/card'
import { buildVerifyEmailPath, sanitizeNextPath } from '@/lib/auth-routing'

interface AuthGuardProps {
  children: ReactNode
  requireVerified?: boolean
  requireAdmin?: boolean
}

export function AuthGuard({
  children,
  requireVerified = false,
  requireAdmin = false,
}: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { authState, isAuthenticated, isLoading } = useAuth()

  const nextPath = sanitizeNextPath(pathname || '/dashboard') || '/dashboard'

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const next = encodeURIComponent(nextPath)
      router.replace(`/login?next=${next}`)
    }
  }, [isAuthenticated, isLoading, nextPath, router])

  useEffect(() => {
    if (!isLoading && requireVerified && authState === 'authenticated_unverified') {
      router.replace(buildVerifyEmailPath(nextPath))
    }
  }, [authState, isLoading, nextPath, requireVerified, router])

  useEffect(() => {
    if (!isLoading && requireAdmin && authState !== 'authenticated_admin' && authState !== 'anonymous') {
      router.replace('/dashboard')
    }
  }, [authState, isLoading, requireAdmin, router])

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

  if (requireVerified && authState === 'authenticated_unverified') {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-3 py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Redirigiendo a verificación...
        </CardContent>
      </Card>
    )
  }

  if (requireAdmin && authState !== 'authenticated_admin') {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-3 py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Redirigiendo al dashboard...
        </CardContent>
      </Card>
    )
  }

  return <>{children}</>
}