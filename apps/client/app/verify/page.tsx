'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, AlertCircle, Info, Upload, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header, Footer, MobileNav } from '@/components/layout'
import { 
  FileUploadDropzone, 
  HashPreview, 
  VerificationBadge,
  BlockchainProofCard,
} from '@/components/proof'
import { calculateSHA256, verifyDocument } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/api'
import type { VerifyDocumentResponse } from '@/types'

type VerificationState = 'idle' | 'verifying' | 'found' | 'not-found' | 'error'

export default function VerifyPage() {
  const [state, setState] = useState<VerificationState>('idle')
  const [hash, setHash] = useState<string>('')
  const [inputHash, setInputHash] = useState<string>('')
  const [isHashing, setIsHashing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<VerifyDocumentResponse | null>(null)

  const handleVerify = useCallback(async (hashToVerify: string) => {
    if (!hashToVerify.trim()) return
    
    setState('verifying')
    setError(null)
    setHash(hashToVerify)
    
    try {
      const response = await verifyDocument(hashToVerify)
      
      if (response.success && response.data) {
        setResult(response.data)
        setState(response.data.exists ? 'found' : 'not-found')
      } else {
        throw new Error(getApiErrorMessage(response, 'Error desconocido'))
      }
    } catch (err) {
      setError('Error al verificar el documento. Por favor, intenta de nuevo.')
      setState('error')
    }
  }, [])

  const handleFileSelect = useCallback(async (file: File) => {
    setIsHashing(true)
    setError(null)
    
    try {
      const fileHash = await calculateSHA256(file)
      setHash(fileHash)
      setInputHash(fileHash)
      await handleVerify(fileHash)
    } catch (err) {
      setError('Error al calcular el hash del archivo.')
      setState('error')
    } finally {
      setIsHashing(false)
    }
  }, [handleVerify])

  const handleHashSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (inputHash.trim()) {
      handleVerify(inputHash.trim())
    }
  }, [inputHash, handleVerify])

  const handleReset = useCallback(() => {
    setState('idle')
    setHash('')
    setInputHash('')
    setResult(null)
    setError(null)
  }, [])

  const publicProofPath = result?.publicProofPath || (result?.transactionId ? `/p/${result.transactionId}` : null)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 pb-24 md:pb-0">
        <div className="page-frame">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>

          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Verificar documento
              </h1>
              <p className="mt-2 text-muted-foreground">
                Comprueba si un documento ha sido registrado en la blockchain
              </p>
            </div>

            {/* Privacy notice */}
            <Alert className="mb-6 bg-secondary/50 border-border">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                La verificación es pública y no requiere cuenta. Si existe una constancia anclada,
                el sistema te entregará el enlace público para compartir la evidencia.
              </AlertDescription>
            </Alert>

            {/* Error message */}
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Verification input */}
            {(state === 'idle' || state === 'error') && (
              <Card>
                <CardHeader>
                  <CardTitle>Verificar existencia</CardTitle>
                  <CardDescription>
                    Sube un archivo o ingresa el hash SHA-256 directamente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="file" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="file" className="gap-2">
                        <Upload className="w-4 h-4" />
                        <span className="hidden sm:inline">Subir archivo</span>
                        <span className="sm:hidden">Archivo</span>
                      </TabsTrigger>
                      <TabsTrigger value="hash" className="gap-2">
                        <Hash className="w-4 h-4" />
                        <span className="hidden sm:inline">Ingresar hash</span>
                        <span className="sm:hidden">Hash</span>
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="file">
                      <FileUploadDropzone
                        onFileSelect={handleFileSelect}
                        isProcessing={isHashing}
                      />
                    </TabsContent>
                    
                    <TabsContent value="hash">
                      <form onSubmit={handleHashSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <label htmlFor="hash" className="text-sm font-medium text-foreground">
                            Hash SHA-256
                          </label>
                          <Input
                            id="hash"
                            type="text"
                            value={inputHash}
                            onChange={(e) => setInputHash(e.target.value)}
                            placeholder="Ingresa el hash del documento..."
                            className="font-mono text-sm"
                          />
                          <p className="text-xs text-muted-foreground">
                            El hash debe tener 64 caracteres hexadecimales
                          </p>
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={!inputHash.trim()}
                        >
                          <Search className="w-4 h-4 mr-2" />
                          Verificar
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}

            {/* Verifying state */}
            {state === 'verifying' && (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <Search className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Verificando documento...
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Buscando en la blockchain de Bitcoin
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Found state */}
            {state === 'found' && result && (
              <div className="space-y-6">
                <Card className="border-accent/20">
                  <CardContent className="pt-6">
                    <div className="text-center mb-6">
                      <VerificationBadge verified={true} variant="detailed" />
                    </div>
                    
                    <p className="text-center text-sm text-muted-foreground mb-6">
                      Este documento fue registrado en la blockchain de Bitcoin 
                      y su existencia está verificada criptográficamente.
                    </p>

                    {publicProofPath ? (
                      <Alert className="mb-6 border-accent/20 bg-accent/5 text-left">
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-sm text-foreground">
                          Comparte la constancia pública para que terceros revisen bloque,
                          confirmaciones y datos del registro sin exponer tu panel privado.
                        </AlertDescription>
                      </Alert>
                    ) : null}
                    
                    <HashPreview hash={hash} variant="large" label="Hash verificado" />
                  </CardContent>
                </Card>

                <BlockchainProofCard
                  fileHash={hash}
                  transactionId={result.transactionId!}
                  blockHeight={result.blockHeight!}
                  timestamp={result.timestamp!}
                  confirmations={result.confirmations!}
                />

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="outline" onClick={handleReset} className="sm:flex-1">
                    Nueva verificación
                  </Button>
                  {publicProofPath ? (
                    <Button asChild className="sm:flex-1">
                      <Link href={publicProofPath}>
                        Abrir constancia pública
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </div>
            )}

            {/* Not found state */}
            {state === 'not-found' && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center mb-6">
                    <VerificationBadge verified={false} size="lg" />
                    <h2 className="mt-4 text-lg font-semibold text-foreground">
                      Documento no encontrado
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      No se encontró ningún registro de este documento en la blockchain.
                    </p>
                  </div>
                  
                  <HashPreview 
                    hash={hash} 
                    variant="default" 
                    label="Hash buscado"
                  />

                  <Alert className="mt-6 bg-secondary/50 border-border">
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Si crees que este documento debería estar registrado, 
                      verifica que el archivo sea exactamente el mismo. 
                      Cualquier modificación generará un hash diferente.
                    </AlertDescription>
                  </Alert>

                  <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <Button variant="outline" onClick={handleReset} className="sm:flex-1">
                      Nueva verificación
                    </Button>
                    <Button asChild className="sm:flex-1">
                      <Link href="/register">
                        Registrar documento
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
      <MobileNav />
    </div>
  )
}
