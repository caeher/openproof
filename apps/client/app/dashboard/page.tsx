'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText, CheckCircle2, ArrowRight, Plus, Settings, LogOut } from 'lucide-react'
import { AuthGuard } from '@/components/auth/auth-guard'
import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Header, Footer, MobileNav } from '@/components/layout'
import { DocumentCard, TimestampDisplay } from '@/components/proof'
import { getDocuments } from '@/lib/api'
import type { Document } from '@/types'

export default function DashboardPage() {
  const { isLoading: isAuthLoading, logoutCurrentSession, user } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isAuthLoading) {
      return
    }

    if (!user?.emailVerified) {
      setDocuments([])
      setIsLoading(false)
      return
    }

    async function fetchDocuments() {
      try {
        const response = await getDocuments()
        if (response.success && response.data) {
          setDocuments(response.data)
        }
      } catch (error) {
        console.error('Error fetching documents:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDocuments()
  }, [isAuthLoading, user?.emailVerified])

  const stats = {
    total: documents.length,
    confirmed: documents.filter((d) => d.status === 'confirmed').length,
    pending: documents.filter((d) => d.status !== 'confirmed').length,
  }

  const recentDocuments = documents.slice(0, 3)
  const displayName = user?.email.split('@')[0] || 'Cuenta'
  const avatarFallback = displayName.slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 pb-24 md:pb-0">
        <div className="container mx-auto px-4 py-8 md:py-12">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>

          <div className="max-w-4xl mx-auto">
            <AuthGuard requireVerified>
            {/* User profile header */}
            <Card className="mb-8">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="text-lg bg-secondary">
                      {avatarFallback}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <h1 className="text-xl font-bold text-foreground">
                      {displayName}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      {user?.email}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Miembro desde <TimestampDisplay timestamp={user?.createdAt || new Date().toISOString()} variant="date-only" />
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none" asChild>
                      <Link href="/account">
                      <Settings className="w-4 h-4 mr-2" />
                      Configuración
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <Card className="group hover:border-foreground/20 transition-colors">
                <Link href="/register" className="block">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-accent/10">
                        <Plus className="w-6 h-6 text-accent" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">Registrar documento</h3>
                        <p className="text-sm text-muted-foreground">
                          Crea una nueva prueba de existencia
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </CardContent>
                </Link>
              </Card>

              <Card className="group hover:border-foreground/20 transition-colors">
                <Link href="/verify" className="block">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-secondary">
                        <CheckCircle2 className="w-6 h-6 text-foreground" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">Verificar documento</h3>
                        <p className="text-sm text-muted-foreground">
                          Comprueba la existencia de un archivo
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </CardContent>
                </Link>
              </Card>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total documentos</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-accent">{stats.confirmed}</p>
                  <p className="text-sm text-muted-foreground">Confirmados</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-foreground">{stats.pending}</p>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent documents */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Documentos recientes</CardTitle>
                    <CardDescription>
                      Tus últimos registros en la blockchain
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/history">
                      Ver todos
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <Skeleton className="w-9 h-9 rounded-md" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentDocuments.length > 0 ? (
                  <div className="space-y-4">
                    {recentDocuments.map((document) => (
                      <DocumentCard
                        key={document.id}
                        document={document}
                        href={`/documents/${document.id}`}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      No tienes documentos registrados
                    </p>
                    <Button asChild className="mt-4">
                      <Link href="/register">Registrar documento</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account actions */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Cuenta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link href="/account">
                    <Settings className="w-4 h-4 mr-3" />
                    Perfil y seguridad
                  </Link>
                </Button>
                <Separator />
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link href="/billing">
                    <Settings className="w-4 h-4 mr-3" />
                    Billing y creditos
                  </Link>
                </Button>
                <Separator />
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link href="/developers">
                    <Settings className="w-4 h-4 mr-3" />
                    Developers y API keys
                  </Link>
                </Button>
                <Separator />
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link href="/api-docs">
                    <Settings className="w-4 h-4 mr-3" />
                    Documentacion API
                  </Link>
                </Button>
                <Separator />
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive"
                  onClick={() => {
                    void logoutCurrentSession()
                  }}
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Cerrar sesión
                </Button>
              </CardContent>
            </Card>
            </AuthGuard>
          </div>
        </div>
      </main>
      
      <Footer />
      <MobileNav />
    </div>
  )
}
