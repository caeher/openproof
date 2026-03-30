'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

import { useAuth } from '@/components/auth/auth-provider'
import { getAuthenticatedHome } from '@/lib/auth-routing'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export function GuestOnlyRoute({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { authState, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && authState !== 'anonymous') {
      router.replace(getAuthenticatedHome(authState))
    }
  }, [authState, isLoading, router])

  if (isLoading || authState !== 'anonymous') {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-3 py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Resolviendo sesión...
        </CardContent>
      </Card>
    )
  }

  return <>{children}</>
}