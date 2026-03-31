'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { FileText, Calendar, Blocks, Clock, CheckCircle2, Copy, Check, Info, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { BrandLogo } from '@/components/layout/brand-logo'
import { 
  HashPreview, 
  TimestampDisplay,
  TransactionExplorerLink,
  VerificationBadge,
  ProofProcess,
} from '@/components/proof'
import { getBitcoinTransaction, getDocumentByTransaction } from '@/lib/api'
import type { BitcoinTransaction, PublicDocumentProof } from '@/types'

/** Try to recover a 32-byte SHA-256 hex digest from OP_RETURN script hex (best-effort). */
function extractSha256FromOutputs(outputs: { opReturn?: string }[]): string {
  for (const o of outputs) {
    const raw = o.opReturn?.replace(/^0x/i, '') ?? ''
    if (raw.length >= 64) {
      const m = raw.match(/([a-f0-9]{64})/i)
      if (m) return m[1].toLowerCase()
    }
  }
  return ''
}

export default function PublicVerificationPage({ 
  params 
}: { 
  params: Promise<{ txid: string }> 
}) {
  const { txid } = use(params)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [transaction, setTransaction] = useState<BitcoinTransaction | null>(null)
  const [registryDoc, setRegistryDoc] = useState<PublicDocumentProof | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [txRes, docRes] = await Promise.all([
          getBitcoinTransaction(txid),
          getDocumentByTransaction(txid),
        ])
        if (cancelled) return
        if (!txRes.success || !txRes.data) {
          setError(txRes.error || 'Transacción no encontrada')
          return
        }
        setTransaction(txRes.data)
        if (docRes.success && docRes.data) {
          setRegistryDoc(docRes.data)
        }
      } catch {
        setError('Error al cargar la información')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [txid])

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Prueba de existencia verificada',
          text: `Verificación de documento en la blockchain de Bitcoin`,
          url: window.location.href,
        })
      } catch {
        // User cancelled
      }
    } else {
      handleCopyLink()
    }
  }

  const displayFilename = registryDoc
    ? registryDoc.filename
    : 'Registro en blockchain'
  const displayHash =
    registryDoc?.fileHash ||
    (transaction ? extractSha256FromOutputs(transaction.outputs) : '')
  const displayTimestamp = registryDoc?.timestamp ?? transaction?.timestamp ?? ''
  const displayBlockHeight = registryDoc?.blockHeight ?? transaction?.blockHeight ?? 0
  const displayConfirmations =
    registryDoc?.confirmations ?? transaction?.confirmations ?? 0
  const chainVerified = (transaction?.confirmations ?? 0) > 0

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container">
          <div className="flex items-center justify-between h-14">
            <Link href="/" aria-label="OpenProof">
              <BrandLogo markClassName="size-8" labelClassName="text-base" />
            </Link>
            
            <Button variant="outline" size="sm" onClick={handleShare}>
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Compartir
                </>
              )}
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        <div className="page-frame">
          {isLoading ? (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center">
                <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
                <Skeleton className="h-8 w-1/2 mx-auto mb-2" />
                <Skeleton className="h-4 w-3/4 mx-auto" />
              </div>
              <Card>
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-6 w-1/2" />
                </CardContent>
              </Card>
            </div>
          ) : error ? (
            <div className="max-w-xl mx-auto text-center py-12">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-foreground mb-2">
                {error}
              </h1>
              <p className="text-muted-foreground mb-6">
                La transacción que buscas no existe o no está relacionada con un registro de documento.
              </p>
              <Button asChild>
                <Link href="/verify">Verificar documento</Link>
              </Button>
            </div>
          ) : transaction ? (
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-accent" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  {chainVerified ? 'Documento verificado' : 'Transacción localizada'}
                </h1>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {chainVerified
                    ? 'Este documento fue registrado en la blockchain de Bitcoin y su existencia está verificada criptográficamente.'
                    : 'La transacción está en mempool o pendiente de confirmación.'}
                </p>
              </div>

              <Card className="mb-6">
                <CardContent className="pt-6">
                  <ProofProcess currentStep={chainVerified ? 3 : 2} />
                </CardContent>
              </Card>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Información del documento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-md bg-secondary">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Archivo</p>
                        <p className="text-sm font-medium text-foreground">
                          {displayFilename}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-md bg-secondary">
                        <Calendar className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Timestamp</p>
                        {displayTimestamp ? (
                          <TimestampDisplay 
                            timestamp={displayTimestamp} 
                            variant="compact"
                            className="text-sm font-medium"
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">—</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-md bg-secondary">
                        <Blocks className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Bloque</p>
                        <p className="text-sm font-medium text-foreground font-mono">
                          #{displayBlockHeight.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-md bg-secondary">
                        <Clock className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Confirmaciones</p>
                        <p className="text-sm font-medium text-foreground">
                          {displayConfirmations.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {registryDoc?.contentType ? (
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-md bg-secondary">
                          <Download className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Archivo almacenado</p>
                          <p className="text-sm font-medium text-foreground">
                            {registryDoc.contentType}
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {registryDoc?.publicFileUrl ? (
                    <Button asChild variant="outline">
                      <a href={registryDoc.publicFileUrl} target="_blank" rel="noreferrer">
                        Ver archivo almacenado
                      </a>
                    </Button>
                  ) : null}
                </CardContent>
              </Card>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Hash del documento</CardTitle>
                </CardHeader>
                <CardContent>
                  {displayHash ? (
                    <HashPreview 
                      hash={displayHash} 
                      variant="large"
                      label="SHA-256"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No se pudo extraer el hash SHA-256 desde el OP_RETURN de esta transacción.
                    </p>
                  )}
                  
                  <Alert className="mt-4 bg-secondary/50 border-border">
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Este hash es único para el documento original. 
                      Cualquier modificación al archivo generará un hash completamente diferente.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Transacción Bitcoin</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Transaction ID</p>
                    <div className="p-3 rounded-md bg-secondary/50 border border-border">
                      <code className="font-mono text-xs text-foreground break-all">
                        {txid}
                      </code>
                    </div>
                  </div>

                  {transaction.blockHash ? (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Block hash</p>
                      <div className="p-3 rounded-md bg-secondary/50 border border-border">
                        <code className="font-mono text-xs text-foreground break-all">
                          {transaction.blockHash}
                        </code>
                      </div>
                    </div>
                  ) : null}
                  
                  <TransactionExplorerLink 
                    txid={txid} 
                    variant="dropdown"
                  />
                </CardContent>
              </Card>

              <Card className="border-accent/20 bg-accent/5 mb-6">
                <CardContent className="pt-6">
                  <VerificationBadge verified={chainVerified} variant="detailed" />
                </CardContent>
              </Card>

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  ¿Tienes un documento que verificar?
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button asChild variant="outline">
                    <Link href="/verify">
                      Verificar documento
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href="/register">
                      Registrar documento
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>
      
      <footer className="border-t border-border py-6">
        <div className="container text-center">
          <p className="text-sm text-muted-foreground">
            Constancia pública emitida por <Link href="/" className="text-foreground hover:underline">OpenProof</Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
