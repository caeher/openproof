'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Share2, Download, FileText, Calendar, Hash, Blocks, Clock, ExternalLink } from 'lucide-react'
import { AuthGuard } from '@/components/auth/auth-guard'
import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Header, Footer, MobileNav } from '@/components/layout'
import { 
  HashPreview, 
  TransactionStatus, 
  BlockchainProofCard,
  TimestampDisplay,
  TransactionExplorerLink,
  VerificationBadge,
} from '@/components/proof'
import { getApiErrorMessage, getDocument } from '@/lib/api'
import type { Document } from '@/types'

export default function DocumentDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = use(params)
  const { isLoading: isAuthLoading, user } = useAuth()
  const [document, setDocument] = useState<Document | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthLoading) {
      return
    }

    if (!user?.emailVerified) {
      setDocument(null)
      setError(null)
      setIsLoading(false)
      return
    }

    async function fetchDocument() {
      try {
        const response = await getDocument(id)
        if (response.success && response.data) {
          setDocument(response.data)
        } else {
          setError(getApiErrorMessage(response, 'Documento no encontrado'))
        }
      } catch (err) {
        setError('Error al cargar el documento')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDocument()
  }, [id, isAuthLoading, user?.emailVerified])

  const handleShare = async () => {
    if (!document) return
    
    const shareUrl = `${window.location.origin}/p/${document.transactionId}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Prueba de existencia',
          text: `Verificación de documento: ${document.filename}`,
          url: shareUrl,
        })
      } catch (err) {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(shareUrl)
      alert('Enlace copiado al portapapeles')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 pb-24 md:pb-0">
        <div className="container mx-auto px-4 py-8 md:py-12">
          {/* Back link */}
          <Link
            href="/history"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al historial
          </Link>

          <AuthGuard requireVerified>
            {isLoading ? (
              <div className="max-w-3xl mx-auto space-y-6">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-6 w-1/2" />
                  </CardContent>
                </Card>
              </div>
            ) : error || !document ? (
              <div className="max-w-xl mx-auto text-center py-12">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h1 className="text-xl font-semibold text-foreground mb-2">
                  {error || 'Documento no encontrado'}
                </h1>
                <p className="text-muted-foreground mb-6">
                  El documento que buscas no existe o ha sido eliminado.
                </p>
                <Button asChild>
                  <Link href="/history">Ver historial</Link>
                </Button>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">
                      {document.filename}
                    </h1>
                    <TransactionStatus status={document.status} size="sm" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Registrado el <TimestampDisplay timestamp={document.createdAt} variant="date-only" />
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Compartir
                  </Button>
                </div>
              </div>

              <div className="space-y-6">
                {/* Document summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Resumen del documento</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-md bg-secondary">
                          <FileText className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Nombre del archivo</p>
                          <p className="text-sm font-medium text-foreground truncate">
                            {document.filename}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-md bg-secondary">
                          <Calendar className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Fecha de registro</p>
                          <TimestampDisplay 
                            timestamp={document.createdAt} 
                            variant="compact"
                            className="text-sm font-medium"
                          />
                        </div>
                      </div>

                      {document.blockHeight && (
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-md bg-secondary">
                            <Blocks className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Bloque Bitcoin</p>
                            <p className="text-sm font-medium text-foreground font-mono">
                              #{document.blockHeight.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}

                      {document.confirmations !== undefined && (
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-md bg-secondary">
                            <Clock className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Confirmaciones</p>
                            <p className="text-sm font-medium text-foreground">
                              {document.confirmations.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {document.metadata?.description && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Descripción</p>
                          <p className="text-sm text-foreground">
                            {document.metadata.description}
                          </p>
                        </div>
                      </>
                    )}

                    {document.metadata?.tags && document.metadata.tags.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Etiquetas</p>
                        <div className="flex flex-wrap gap-2">
                          {document.metadata.tags.map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Hash information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Hash del documento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <HashPreview 
                      hash={document.fileHash} 
                      variant="large"
                      label="SHA-256"
                    />
                  </CardContent>
                </Card>

                {/* Blockchain proof */}
                {document.status === 'confirmed' && document.transactionId && document.blockHeight && document.timestamp && document.confirmations !== undefined && (
                  <BlockchainProofCard
                    fileHash={document.fileHash}
                    transactionId={document.transactionId}
                    blockHeight={document.blockHeight}
                    timestamp={document.timestamp}
                    confirmations={document.confirmations}
                  />
                )}

                {/* Transaction details */}
                {document.transactionId && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Transacción Bitcoin</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Transaction ID</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 p-3 font-mono text-xs bg-secondary/50 border border-border rounded-md break-all">
                            {document.transactionId}
                          </code>
                        </div>
                      </div>
                      
                      <TransactionExplorerLink 
                        txid={document.transactionId} 
                        variant="dropdown"
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Verification status */}
                <Card className="border-accent/20 bg-accent/5">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <VerificationBadge 
                        verified={document.status === 'confirmed'} 
                        pending={document.status === 'processing'}
                        size="lg"
                      />
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {document.status === 'confirmed' 
                            ? 'Documento verificado'
                            : document.status === 'processing'
                            ? 'Verificación en progreso'
                            : 'Pendiente de verificación'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {document.status === 'confirmed' 
                            ? 'La existencia de este documento está verificada criptográficamente en la blockchain de Bitcoin.'
                            : document.status === 'processing'
                            ? 'El registro está siendo procesado y confirmado en la blockchain.'
                            : 'El documento está pendiente de ser registrado en la blockchain.'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="outline" asChild className="flex-1">
                    <Link href="/history">
                      Volver al historial
                    </Link>
                  </Button>
                  {document.transactionId && (
                    <Button asChild className="flex-1">
                      <Link href={`/p/${document.transactionId}`}>
                        Ver página pública
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
            )}
          </AuthGuard>
        </div>
      </main>
      
      <Footer />
      <MobileNav />
    </div>
  )
}
