'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  BookOpen,
  Copy,
  KeyRound,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { AuthGuard } from '@/components/auth/auth-guard'
import { useAuth } from '@/components/auth/auth-provider'
import { Header, Footer, MobileNav } from '@/components/layout'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createApiKey, listApiKeys, revokeApiKey, rotateApiKey } from '@/lib/api'
import type { CreateApiKeyResponse, DeveloperApiKey } from '@/types'

function formatTimestamp(value?: string) {
  if (!value) {
    return 'Nunca'
  }

  return new Date(value).toLocaleString('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function DevelopersPage() {
  const { isLoading: isAuthLoading, user } = useAuth()
  const [apiKeys, setApiKeys] = useState<DeveloperApiKey[]>([])
  const [name, setName] = useState('Produccion')
  const [generatedKey, setGeneratedKey] = useState<CreateApiKeyResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [activeKeyAction, setActiveKeyAction] = useState<string | null>(null)

  async function loadKeys() {
    const response = await listApiKeys()
    if (!response.success || !response.data) {
      throw new Error(response.error || 'No fue posible cargar las API keys.')
    }
    setApiKeys(response.data)
  }

  useEffect(() => {
    if (isAuthLoading) {
      return
    }

    if (!user?.emailVerified) {
      setApiKeys([])
      setIsLoading(false)
      return
    }

    async function fetchKeys() {
      try {
        await loadKeys()
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'No fue posible cargar las API keys.'
        )
      } finally {
        setIsLoading(false)
      }
    }

    void fetchKeys()
  }, [isAuthLoading, user?.emailVerified])

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsCreating(true)

    try {
      const response = await createApiKey(name)
      if (!response.success || !response.data) {
        setError(response.error || 'No fue posible crear la API key.')
        return
      }

      setGeneratedKey(response.data)
      setName('')
      await loadKeys()
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : 'No fue posible crear la API key.'
      )
    } finally {
      setIsCreating(false)
    }
  }

  async function handleRevoke(id: string) {
    setError(null)
    setActiveKeyAction(id)

    try {
      const response = await revokeApiKey(id)
      if (!response.success) {
        setError(response.error || 'No fue posible revocar la API key.')
        return
      }

      await loadKeys()
    } catch (revokeError) {
      setError(
        revokeError instanceof Error
          ? revokeError.message
          : 'No fue posible revocar la API key.'
      )
    } finally {
      setActiveKeyAction(null)
    }
  }

  async function handleRotate(id: string) {
    setError(null)
    setActiveKeyAction(id)

    try {
      const response = await rotateApiKey(id)
      if (!response.success || !response.data) {
        setError(response.error || 'No fue posible rotar la API key.')
        return
      }

      setGeneratedKey(response.data)
      await loadKeys()
    } catch (rotateError) {
      setError(
        rotateError instanceof Error
          ? rotateError.message
          : 'No fue posible rotar la API key.'
      )
    } finally {
      setActiveKeyAction(null)
    }
  }

  async function copyGeneratedKey() {
    if (!generatedKey?.plainTextKey) {
      return
    }

    await navigator.clipboard.writeText(generatedKey.plainTextKey)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pb-24 md:pb-0">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a la cuenta
          </Link>

          <div className="max-w-4xl mx-auto">
            <AuthGuard requireVerified>
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-foreground">
                  <KeyRound className="h-4 w-4" />
                  Developer portal
                </div>
                <h1 className="mt-4 text-2xl md:text-3xl font-bold text-foreground">
                  API keys para integraciones
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Gestiona las claves bearer que permiten registrar y consultar documentos desde sistemas externos bajo tu misma cuenta.
                </p>
              </div>

              {error ? (
                <Alert className="mb-6" variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              {generatedKey ? (
                <Alert className="mb-6 border-accent/30 bg-accent/5">
                  <ShieldCheck className="h-4 w-4" />
                  <AlertDescription className="space-y-3">
                    <p>
                      Guarda esta API key ahora. OpenProof solo muestra el valor completo una vez.
                    </p>
                    <div className="rounded-lg border border-border bg-background px-4 py-3 font-mono text-xs break-all text-foreground">
                      {generatedKey.plainTextKey}
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button type="button" onClick={() => void copyGeneratedKey()}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar clave
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setGeneratedKey(null)}
                      >
                        Ocultar valor
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : null}

              <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <Card>
                  <CardHeader>
                    <CardTitle>Crear nueva API key</CardTitle>
                    <CardDescription>
                      Usa nombres descriptivos por ambiente o integracion. Ejemplo: Produccion, ERP o Backoffice.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreate} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="api-key-name">Nombre</Label>
                        <Input
                          id="api-key-name"
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          placeholder="Produccion"
                          maxLength={80}
                          required
                        />
                      </div>

                      <Button type="submit" disabled={isCreating || !name.trim()}>
                        {isCreating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creando...
                          </>
                        ) : (
                          <>
                            <KeyRound className="mr-2 h-4 w-4" />
                            Crear API key
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Uso rapido</CardTitle>
                    <CardDescription>
                      La autenticacion programatica usa bearer tokens y comparte el ownership de tu cuenta.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg border border-border bg-secondary/30 p-4 font-mono text-xs text-foreground">
                      Authorization: Bearer OPENPROOF_API_KEY
                    </div>
                    <Button asChild variant="outline">
                      <Link href="/api-docs">
                        <BookOpen className="mr-2 h-4 w-4" />
                        Abrir documentacion API
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Claves existentes</CardTitle>
                  <CardDescription>
                    Revoca o rota cualquier clave comprometida sin afectar a las demas integraciones.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center gap-3 py-8 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Cargando API keys...
                    </div>
                  ) : apiKeys.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
                      Aun no has creado API keys. Genera la primera para habilitar integraciones server-to-server.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {apiKeys.map((apiKey) => {
                        const isBusy = activeKeyAction === apiKey.id
                        const isRevoked = Boolean(apiKey.revokedAt)

                        return (
                          <div
                            key={apiKey.id}
                            className="rounded-xl border border-border p-4"
                          >
                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                              <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h2 className="text-base font-semibold text-foreground">
                                    {apiKey.name}
                                  </h2>
                                  <Badge variant={isRevoked ? 'secondary' : 'default'}>
                                    {isRevoked ? 'Revocada' : 'Activa'}
                                  </Badge>
                                </div>
                                <p className="font-mono text-xs text-muted-foreground">
                                  {apiKey.keyPrefix}...
                                </p>
                                <div className="grid gap-1 text-sm text-muted-foreground">
                                  <p>Creada: {formatTimestamp(apiKey.createdAt)}</p>
                                  <p>Ultimo uso: {formatTimestamp(apiKey.lastUsedAt)}</p>
                                  {apiKey.revokedAt ? (
                                    <p>Revocada: {formatTimestamp(apiKey.revokedAt)}</p>
                                  ) : null}
                                </div>
                              </div>

                              {!isRevoked ? (
                                <div className="flex flex-col gap-2 sm:flex-row">
                                  <Button
                                    variant="outline"
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => {
                                      void handleRotate(apiKey.id)
                                    }}
                                  >
                                    {isBusy ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <RefreshCcw className="mr-2 h-4 w-4" />
                                    )}
                                    Rotar
                                  </Button>
                                  <Button
                                    variant="outline"
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => {
                                      void handleRevoke(apiKey.id)
                                    }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Revocar
                                  </Button>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
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