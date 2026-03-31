'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  BookOpen,
  Copy,
  CreditCard,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  Wallet,
} from 'lucide-react'
import { AuthGuard } from '@/components/auth/auth-guard'
import { useAuth } from '@/components/auth/auth-provider'
import { Header, Footer, MobileNav } from '@/components/layout'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  createBillingPaymentIntent,
  getApiErrorMessage,
  getBillingOverview,
  reconcileBillingPaymentIntent,
} from '@/lib/api'
import type { BillingOverviewResponse, PaymentIntent } from '@/types'

function formatSats(sats: number) {
  return `${new Intl.NumberFormat('es-ES').format(sats)} sats`
}

function formatTimestamp(value?: string) {
  if (!value) {
    return 'Nunca'
  }

  return new Date(value).toLocaleString('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function BillingPage() {
  const { isLoading: isAuthLoading, user } = useAuth()
  const [overview, setOverview] = useState<BillingOverviewResponse | null>(null)
  const [activeInvoice, setActiveInvoice] = useState<PaymentIntent | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [creatingPackageId, setCreatingPackageId] = useState<string | null>(null)
  const [reconcilingPaymentId, setReconcilingPaymentId] = useState<string | null>(null)

  async function loadOverview() {
    const response = await getBillingOverview()
    if (!response.success || !response.data) {
      throw new Error(getApiErrorMessage(response, 'No fue posible cargar billing.'))
    }

    setOverview(response.data)
  }

  useEffect(() => {
    if (isAuthLoading) {
      return
    }

    if (!user?.emailVerified) {
      setOverview(null)
      setIsLoading(false)
      return
    }

    async function fetchOverview() {
      try {
        await loadOverview()
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : 'No fue posible cargar billing.'
        )
      } finally {
        setIsLoading(false)
      }
    }

    void fetchOverview()
  }, [isAuthLoading, user?.emailVerified])

  async function handleCreatePaymentIntent(packageId: string) {
    setError(null)
    setCreatingPackageId(packageId)

    try {
      const response = await createBillingPaymentIntent(packageId)
      if (!response.success || !response.data) {
        setError(getApiErrorMessage(response, 'No fue posible crear el invoice.'))
        return
      }

      setActiveInvoice(response.data)
      await loadOverview()
    } catch (createError) {
      setError(
        createError instanceof Error ? createError.message : 'No fue posible crear el invoice.'
      )
    } finally {
      setCreatingPackageId(null)
    }
  }

  async function handleReconcile(paymentIntent: PaymentIntent) {
    setError(null)
    setReconcilingPaymentId(paymentIntent.id)

    try {
      const response = await reconcileBillingPaymentIntent(paymentIntent.id)
      if (!response.success || !response.data) {
        setError(getApiErrorMessage(response, 'No fue posible reconciliar el pago.'))
        return
      }

      setActiveInvoice(response.data.status === 'pending' ? response.data : null)
      await loadOverview()
    } catch (reconcileError) {
      setError(
        reconcileError instanceof Error
          ? reconcileError.message
          : 'No fue posible reconciliar el pago.'
      )
    } finally {
      setReconcilingPaymentId(null)
    }
  }

  async function copyInvoice(paymentRequest?: string) {
    if (!paymentRequest) {
      return
    }

    await navigator.clipboard.writeText(paymentRequest)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pb-24 md:pb-0">
        <div className="container max-w-6xl mx-auto py-8 md:py-12">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a la cuenta
          </Link>

          <div>
            <AuthGuard requireVerified>
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-foreground">
                  <Wallet className="h-4 w-4" />
                  Billing y creditos
                </div>
                <h1 className="mt-4 text-2xl md:text-3xl font-bold text-foreground">
                  Compra paquetes y financia tus registros
                </h1>
                <p className="mt-2 text-muted-foreground">
                  OpenProof cobra por créditos. Cada registro consume el saldo configurado en backend y las compras se liquidan con invoices Lightning en satoshis.
                </p>
              </div>

              {error ? (
                <Alert className="mb-6" variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              {activeInvoice ? (
                <Card className="mb-6 border-accent/20">
                  <CardHeader>
                    <CardTitle>Invoice activa</CardTitle>
                    <CardDescription>
                      Usa tu wallet Lightning para pagar el invoice actual y luego pulsa reconciliar para actualizar el saldo.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{activeInvoice.status}</Badge>
                      <Badge variant="secondary">{activeInvoice.blinkInvoiceStatus}</Badge>
                      <Badge variant="outline">{activeInvoice.packageName}</Badge>
                    </div>

                    <div className="rounded-lg border border-border bg-secondary/30 p-4 font-mono text-xs break-all text-foreground">
                      {activeInvoice.paymentRequest}
                    </div>

                    <div className="grid gap-3 md:grid-cols-3 text-sm text-muted-foreground">
                      <p>Monto: <span className="text-foreground">{formatSats(activeInvoice.amountSats)}</span></p>
                      <p>Creditos: <span className="text-foreground">{activeInvoice.credits}</span></p>
                      <p>Expira: <span className="text-foreground">{formatTimestamp(activeInvoice.expiresAt)}</span></p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button type="button" onClick={() => void copyInvoice(activeInvoice.paymentRequest)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar invoice
                      </Button>
                      <Button asChild variant="outline">
                        <a href={activeInvoice.paymentRequest ? `lightning:${activeInvoice.paymentRequest}` : '#'}>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Abrir wallet
                        </a>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={reconcilingPaymentId === activeInvoice.id}
                        onClick={() => {
                          void handleReconcile(activeInvoice)
                        }}
                      >
                        {reconcilingPaymentId === activeInvoice.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCcw className="mr-2 h-4 w-4" />
                        )}
                        Reconciliar pago
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <Card>
                  <CardHeader>
                    <CardTitle>Saldo actual</CardTitle>
                    <CardDescription>
                      Resumen de creditos disponibles y consumo acumulado.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading || !overview ? (
                      <div className="flex items-center gap-3 py-8 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Cargando resumen...
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div className="rounded-xl border border-border p-4">
                            <p className="text-sm text-muted-foreground">Disponibles</p>
                            <p className="mt-2 text-3xl font-bold text-foreground">
                              {overview.account.balanceCredits}
                            </p>
                          </div>
                          <div className="rounded-xl border border-border p-4">
                            <p className="text-sm text-muted-foreground">Comprados</p>
                            <p className="mt-2 text-3xl font-bold text-foreground">
                              {overview.account.purchasedCredits}
                            </p>
                          </div>
                          <div className="rounded-xl border border-border p-4">
                            <p className="text-sm text-muted-foreground">Consumidos</p>
                            <p className="mt-2 text-3xl font-bold text-foreground">
                              {overview.account.consumedCredits}
                            </p>
                          </div>
                        </div>

                        <Alert>
                          <ShieldCheck className="h-4 w-4" />
                          <AlertDescription>
                            Cada registro consume {overview.documentRegistrationCreditCost} crédito(s). Cada crédito equivale a 10.000 sats. Última actualización: {formatTimestamp(overview.account.updatedAt)}.
                          </AlertDescription>
                        </Alert>

                        <Button asChild variant="outline">
                          <Link href="/api-docs">
                            <BookOpen className="mr-2 h-4 w-4" />
                            Revisar API docs
                          </Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Paquetes disponibles</CardTitle>
                    <CardDescription>
                      Los invoices se crean en BTC/sats y el backend acredita los créditos una sola vez cuando Blink confirma el pago.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading || !overview ? null : (
                      <div className="space-y-4">
                        {overview.packages.map((creditPackage) => (
                          <div key={creditPackage.id} className="rounded-xl border border-border p-4">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <h2 className="text-base font-semibold text-foreground">
                                  {creditPackage.name}
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {creditPackage.description}
                                </p>
                                <p className="mt-3 text-sm text-muted-foreground">
                                  {creditPackage.credits} créditos por {formatSats(creditPackage.priceSats)}
                                </p>
                              </div>
                              <Button
                                type="button"
                                disabled={creatingPackageId === creditPackage.id}
                                onClick={() => {
                                  void handleCreatePaymentIntent(creditPackage.id)
                                }}
                              >
                                {creatingPackageId === creditPackage.id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <CreditCard className="mr-2 h-4 w-4" />
                                )}
                                Comprar
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Pagos recientes</CardTitle>
                  <CardDescription>
                    Historial de intents generados para esta cuenta, con su estado local y el estado reportado por Blink.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading || !overview ? null : overview.paymentIntents.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
                      Aun no has generado intents de compra.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {overview.paymentIntents.map((paymentIntent) => (
                        <div key={paymentIntent.id} className="rounded-xl border border-border p-4">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <h2 className="font-semibold text-foreground">
                                  {paymentIntent.packageName}
                                </h2>
                                <Badge>{paymentIntent.status}</Badge>
                                <Badge variant="secondary">
                                  {paymentIntent.blinkInvoiceStatus}
                                </Badge>
                              </div>
                              <div className="grid gap-1 text-sm text-muted-foreground">
                                <p>Monto: {formatSats(paymentIntent.amountSats)}</p>
                                <p>Créditos: {paymentIntent.credits}</p>
                                <p>Creado: {formatTimestamp(paymentIntent.createdAt)}</p>
                                <p>Pagado: {formatTimestamp(paymentIntent.paidAt)}</p>
                              </div>
                              {paymentIntent.paymentRequest ? (
                                <div className="rounded-lg border border-border bg-secondary/20 px-3 py-2 font-mono text-[11px] break-all text-muted-foreground">
                                  {paymentIntent.paymentRequest}
                                </div>
                              ) : null}
                            </div>

                            {paymentIntent.status === 'pending' ? (
                              <div className="flex flex-col gap-2 sm:flex-row">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => void copyInvoice(paymentIntent.paymentRequest)}
                                >
                                  <Copy className="mr-2 h-4 w-4" />
                                  Copiar
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  disabled={reconcilingPaymentId === paymentIntent.id}
                                  onClick={() => {
                                    void handleReconcile(paymentIntent)
                                  }}
                                >
                                  {reconcilingPaymentId === paymentIntent.id ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <RefreshCcw className="mr-2 h-4 w-4" />
                                  )}
                                  Reconciliar
                                </Button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ))}
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