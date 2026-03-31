'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { AuthGuard } from '@/components/auth/auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Header, Footer, MobileNav } from '@/components/layout'
import { 
  FileUploadDropzone, 
  HashPreview, 
  ProofProcess, 
  DocumentMetadataForm,
  TransactionExplorerLink,
} from '@/components/proof'
import { calculateSHA256, getApiErrorMessage, registerDocument } from '@/lib/api'
import type { DocumentMetadata } from '@/types'

type Step = 'upload' | 'preview' | 'confirm' | 'processing' | 'success'

export default function RegisterPage() {
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [hash, setHash] = useState<string | null>(null)
  const [isHashing, setIsHashing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<DocumentMetadata>({})
  const [result, setResult] = useState<{
    transactionId?: string
    documentId: string
  } | null>(null)
  const needsCredits = Boolean(error && error.toLowerCase().includes('insufficient credits'))

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile)
    setIsHashing(true)
    setError(null)
    
    try {
      const fileHash = await calculateSHA256(selectedFile)
      setHash(fileHash)
      setStep('preview')
    } catch (err) {
      setError('Error al calcular el hash del archivo. Por favor, intenta de nuevo.')
    } finally {
      setIsHashing(false)
    }
  }, [])

  const handleClear = useCallback(() => {
    setFile(null)
    setHash(null)
    setStep('upload')
    setError(null)
    setMetadata({})
  }, [])

  const handleConfirm = useCallback(() => {
    setStep('confirm')
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!hash || !file) return
    
    setIsSubmitting(true)
    setStep('processing')
    setError(null)
    
    try {
      const response = await registerDocument(file, metadata)
      
      if (response.success && response.data) {
        setResult({
          transactionId: response.data.transactionId,
          documentId: response.data.documentId,
        })
        setStep('success')
      } else {
        throw new Error(getApiErrorMessage(response, 'Error desconocido'))
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al registrar el documento. Por favor, intenta de nuevo.'
      setError(message)
      setStep('confirm')
    } finally {
      setIsSubmitting(false)
    }
  }, [hash, file, metadata])

  const currentStepIndex = 
    step === 'upload' ? 0 : 
    step === 'preview' ? 1 : 
    step === 'confirm' || step === 'processing' ? 2 : 
    3

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 pb-24 md:pb-0">
        <div className="container max-w-6xl mx-auto px-4 py-8 md:py-12">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>

          <div>
            <AuthGuard requireVerified>
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Registrar documento
              </h1>
              <p className="mt-2 text-muted-foreground">
                Genera una prueba de existencia inmutable en la blockchain de Bitcoin
              </p>
            </div>

            {/* Progress indicator */}
            <div className="mb-8">
              <ProofProcess currentStep={currentStepIndex} />
            </div>

            {/* Privacy notice */}
            <Alert className="mb-6 bg-secondary/50 border-border">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                El archivo se almacena en el backend con un límite de 20 MB.
                El sistema calcula el hash SHA-256 y solo ese digest es el que se ancla en Bitcoin mediante OP_RETURN.
              </AlertDescription>
            </Alert>

            {/* Error message */}
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {needsCredits ? (
              <Card className="mb-6 border-accent/20">
                <CardContent className="pt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-semibold text-foreground">Necesitas saldo para registrar</h2>
                    <p className="text-sm text-muted-foreground">
                      Compra un paquete de creditos y vuelve a intentar el registro.
                    </p>
                  </div>
                  <Button asChild>
                    <Link href="/billing">Ir a billing</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            {/* Step content */}
            {step === 'upload' && (
              <Card>
                <CardHeader>
                  <CardTitle>Sube tu archivo</CardTitle>
                  <CardDescription>
                    Arrastra y suelta o selecciona el archivo que deseas registrar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FileUploadDropzone
                    onFileSelect={handleFileSelect}
                    onClear={handleClear}
                    isProcessing={isHashing}
                    maxSize={20 * 1024 * 1024}
                  />
                </CardContent>
              </Card>
            )}

            {step === 'preview' && hash && file && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Hash generado</CardTitle>
                    <CardDescription>
                      Este es el digest SHA-256 del archivo almacenado y será el dato anclado en Bitcoin
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">
                          {file.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClear}
                        >
                          Cambiar
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    
                    <HashPreview hash={hash} variant="large" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Información adicional</CardTitle>
                    <CardDescription>
                      Añade metadatos opcionales para identificar tu documento
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DocumentMetadataForm
                      onMetadataChange={setMetadata}
                      initialMetadata={metadata}
                    />
                  </CardContent>
                </Card>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={handleClear}
                    className="sm:flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    className="sm:flex-1"
                  >
                    Continuar
                  </Button>
                </div>
              </div>
            )}

            {(step === 'confirm' || step === 'processing') && hash && file && (
              <Card>
                <CardHeader>
                  <CardTitle>Confirmar registro</CardTitle>
                  <CardDescription>
                      Revisa los datos antes de almacenar el archivo y registrar su hash en la blockchain
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">Archivo</span>
                      <span className="text-sm font-medium text-foreground">{file.name}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">Tamaño</span>
                      <span className="text-sm font-medium text-foreground">
                        {(file.size / 1024).toFixed(2)} KB
                      </span>
                    </div>
                    {metadata.description && (
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-sm text-muted-foreground">Descripción</span>
                        <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                          {metadata.description}
                        </span>
                      </div>
                    )}
                  </div>

                  <HashPreview hash={hash} variant="default" truncate />

                  <Alert className="bg-accent/10 border-accent/20">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    <AlertDescription className="text-sm">
                      Una vez registrado, la prueba será permanente e inmutable.
                    </AlertDescription>
                  </Alert>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setStep('preview')}
                      disabled={isSubmitting}
                      className="sm:flex-1"
                    >
                      Volver
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="sm:flex-1"
                    >
                      {isSubmitting ? 'Registrando...' : 'Registrar en Bitcoin'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 'success' && result && hash && (
              <Card className="border-accent/20">
                <CardContent className="pt-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-accent" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">
                      Registro exitoso
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                      Tu archivo quedó almacenado y su hash SHA-256 fue enviado al flujo de anclaje en la blockchain de Bitcoin
                    </p>
                  </div>

                  <div className="space-y-4">
                    {result.transactionId ? (
                      <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                        <p className="text-xs text-muted-foreground mb-1">Transaction ID</p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono text-foreground flex-1 truncate">
                            {result.transactionId}
                          </code>
                          <TransactionExplorerLink txid={result.transactionId} />
                        </div>
                      </div>
                    ) : (
                      <Alert className="bg-secondary/50 border-border">
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          Tu registro está en cola; la transacción Bitcoin aparecerá en unos
                          segundos. Consulta el detalle del documento para ver el TXID.
                        </AlertDescription>
                      </Alert>
                    )}

                    <HashPreview hash={hash} variant="default" truncate />
                  </div>

                  <div className="flex flex-col gap-3 mt-6">
                    <Button asChild>
                      <Link href={`/documents/${result.documentId}`}>
                        Ver detalles del registro
                      </Link>
                    </Button>
                    <Button variant="outline" onClick={handleClear}>
                      Registrar otro documento
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            </AuthGuard>
          </div>
        </div>
      </main>
      
      <Footer />
      <MobileNav />
    </div>
  )
}
