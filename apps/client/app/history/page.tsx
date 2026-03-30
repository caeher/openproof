'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, Filter, FileText, Clock, CheckCircle2, Loader2 } from 'lucide-react'
import { AuthGuard } from '@/components/auth/auth-guard'
import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Empty } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { Header, Footer, MobileNav } from '@/components/layout'
import { DocumentCard } from '@/components/proof'
import { getDocuments } from '@/lib/api'
import type { Document, DocumentStatus } from '@/types'

export default function HistoryPage() {
  const { isLoading: isAuthLoading, user } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all')

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

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = 
      doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.fileHash.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: documents.length,
    confirmed: documents.filter((d) => d.status === 'confirmed').length,
    processing: documents.filter((d) => d.status === 'processing').length,
    pending: documents.filter((d) => d.status === 'pending').length,
  }

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

          <AuthGuard requireVerified>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Historial de registros
            </h1>
            <p className="mt-2 text-muted-foreground">
              Todos tus documentos registrados en la blockchain
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-secondary">
                    <FileText className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-accent/10">
                    <CheckCircle2 className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.confirmed}</p>
                    <p className="text-xs text-muted-foreground">Confirmados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-warning/10">
                    <Loader2 className="w-5 h-5 text-warning-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.processing}</p>
                    <p className="text-xs text-muted-foreground">Procesando</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-muted">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                    <p className="text-xs text-muted-foreground">Pendientes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por nombre o hash..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as DocumentStatus | 'all')}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="confirmed">Confirmados</SelectItem>
                <SelectItem value="processing">Procesando</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="failed">Fallidos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results count */}
          {!isLoading && filteredDocuments.length > 0 && (
            <p className="text-sm text-muted-foreground mb-4">
              Mostrando {filteredDocuments.length} de {documents.length} documentos
            </p>
          )}

          {/* Documents list */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Skeleton className="w-9 h-9 rounded-md" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredDocuments.length > 0 ? (
            <div className="space-y-4">
              {filteredDocuments.map((document) => (
                <DocumentCard
                  key={document.id}
                  document={document}
                  href={`/documents/${document.id}`}
                />
              ))}
            </div>
          ) : documents.length > 0 ? (
            <Empty
              icon={Search}
              title="No se encontraron resultados"
              description="Intenta con otros términos de búsqueda o filtros"
            />
          ) : (
            <Empty
              icon={FileText}
              title="Sin documentos"
              description="Aún no has registrado ningún documento"
              action={
                <Button asChild>
                  <Link href="/register">Registrar documento</Link>
                </Button>
              }
            />
          )}
          </AuthGuard>
        </div>
      </main>
      
      <Footer />
      <MobileNav />
    </div>
  )
}
