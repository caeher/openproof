'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowLeft,
  CreditCard,
  Loader2,
  RefreshCcw,
  Shield,
  UserCog,
} from 'lucide-react'
import { AuthGuard } from '@/components/auth/auth-guard'
import { useAuth } from '@/components/auth/auth-provider'
import { Footer, Header, MobileNav } from '@/components/layout'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  adjustAdminCredits,
  getAdminOverview,
  getApiErrorMessage,
  updateAdminUserRole,
} from '@/lib/api'
import type { AdminOverviewResponse } from '@/types'

function formatTimestamp(value?: string) {
  if (!value) {
    return 'Nunca'
  }

  return new Date(value).toLocaleString('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function formatUsd(cents: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

export default function AdminPage() {
  const { isLoading: isAuthLoading, user } = useAuth()
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSubmittingAdjustment, setIsSubmittingAdjustment] = useState(false)
  const [actingUserId, setActingUserId] = useState<string | null>(null)
  const [adjustUserId, setAdjustUserId] = useState('')
  const [adjustDeltaCredits, setAdjustDeltaCredits] = useState('')
  const [adjustReason, setAdjustReason] = useState('')

  async function loadOverview() {
    const response = await getAdminOverview()
    if (!response.success || !response.data) {
      throw new Error(getApiErrorMessage(response, 'No fue posible cargar admin.'))
    }

    setOverview(response.data)
  }

  useEffect(() => {
    if (isAuthLoading) {
      return
    }

    async function fetchOverview() {
      try {
        await loadOverview()
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No fue posible cargar admin.')
      } finally {
        setIsLoading(false)
      }
    }

    void fetchOverview()
  }, [isAuthLoading])

  async function handleRefresh() {
    setError(null)
    setIsRefreshing(true)
    try {
      await loadOverview()
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'No fue posible recargar admin.')
    } finally {
      setIsRefreshing(false)
    }
  }

  async function handleRoleUpdate(targetUserId: string, role: string) {
    setError(null)
    setSuccess(null)
    setActingUserId(targetUserId)

    try {
      const response = await updateAdminUserRole(targetUserId, role)
      if (!response.success) {
        setError(getApiErrorMessage(response, 'No fue posible actualizar el rol.'))
        return
      }

      setSuccess(`Rol actualizado a ${role}.`)
      await loadOverview()
    } catch (updateError) {
      setError(
        updateError instanceof Error ? updateError.message : 'No fue posible actualizar el rol.'
      )
    } finally {
      setActingUserId(null)
    }
  }

  async function handleCreditAdjustment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setIsSubmittingAdjustment(true)

    try {
      const response = await adjustAdminCredits(
        adjustUserId,
        Number(adjustDeltaCredits),
        adjustReason
      )

      if (!response.success) {
        setError(getApiErrorMessage(response, 'No fue posible ajustar creditos.'))
        return
      }

      setAdjustDeltaCredits('')
      setAdjustReason('')
      setSuccess('Ajuste manual aplicado.')
      await loadOverview()
    } catch (adjustError) {
      setError(
        adjustError instanceof Error ? adjustError.message : 'No fue posible ajustar creditos.'
      )
    } finally {
      setIsSubmittingAdjustment(false)
    }
  }

  const statCards = useMemo(() => {
    if (!overview) {
      return []
    }

    return [
      { label: 'Usuarios', value: overview.stats.totalUsers.toString() },
      { label: 'Verificados', value: overview.stats.verifiedUsers.toString() },
      { label: 'Admins', value: overview.stats.adminUsers.toString() },
      { label: 'Saldo global', value: overview.stats.totalCreditBalance.toString() },
      { label: 'Pagos pendientes', value: overview.stats.pendingPaymentIntents.toString() },
      { label: 'Pagos envejecidos', value: overview.stats.stalePendingPaymentIntents.toString() },
      { label: 'Webhooks fallidos', value: overview.stats.failedWebhookEvents.toString() },
    ]
  }, [overview])

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
            Volver al dashboard
          </Link>

          <div className="max-w-7xl mx-auto">
            <AuthGuard requireVerified requireAdmin>
              <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-foreground">
                    <Shield className="h-4 w-4" />
                    Admin
                  </div>
                  <h1 className="mt-4 text-2xl md:text-3xl font-bold text-foreground">
                    Operación SaaS y hardening
                  </h1>
                  <p className="mt-2 text-muted-foreground">
                    Supervisa usuarios, ledger, pagos, webhooks y auditoría desde el entorno {overview?.environment || user?.role}.
                  </p>
                </div>

                <Button type="button" variant="outline" onClick={() => void handleRefresh()} disabled={isRefreshing}>
                  {isRefreshing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCcw className="mr-2 h-4 w-4" />
                  )}
                  Recargar panel
                </Button>
              </div>

              {error ? (
                <Alert className="mb-6" variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              {success ? (
                <Alert className="mb-6">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              ) : null}

              {isLoading || !overview ? (
                <Card>
                  <CardContent className="flex items-center gap-3 py-10 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Cargando panel admin...
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {overview.alerts.length > 0 ? (
                    <Card className="border-amber-500/30">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-amber-500" />
                          Alertas operativas
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {overview.alerts.map((alert) => (
                          <Alert key={alert}>
                            <AlertDescription>{alert}</AlertDescription>
                          </Alert>
                        ))}
                      </CardContent>
                    </Card>
                  ) : null}

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {statCards.map((stat) => (
                      <Card key={stat.label}>
                        <CardContent className="p-5">
                          <p className="text-sm text-muted-foreground">{stat.label}</p>
                          <p className="mt-3 text-3xl font-bold text-foreground">{stat.value}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    <Card>
                      <CardHeader>
                        <CardTitle>Usuarios recientes</CardTitle>
                        <CardDescription>
                          Cambia roles y toma un usuario como objetivo para ajustes manuales.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {overview.users.map((account) => (
                          <div key={account.id} className="rounded-xl border border-border p-4">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-semibold text-foreground">{account.email}</p>
                                  <Badge>{account.role}</Badge>
                                  {account.emailVerifiedAt ? (
                                    <Badge variant="secondary">verified</Badge>
                                  ) : (
                                    <Badge variant="outline">pending</Badge>
                                  )}
                                </div>
                                <p className="mt-2 text-sm text-muted-foreground">
                                  Balance: {account.balanceCredits} creditos. Alta: {formatTimestamp(account.createdAt)}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground break-all">{account.id}</p>
                              </div>

                              <div className="flex flex-col gap-2 sm:flex-row">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setAdjustUserId(account.id)}
                                >
                                  <CreditCard className="mr-2 h-4 w-4" />
                                  Usar en ajuste
                                </Button>
                                {account.role === 'user' ? (
                                  <Button
                                    type="button"
                                    disabled={actingUserId === account.id}
                                    onClick={() => void handleRoleUpdate(account.id, 'admin')}
                                  >
                                    {actingUserId === account.id ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <UserCog className="mr-2 h-4 w-4" />
                                    )}
                                    Promover
                                  </Button>
                                ) : user?.id !== account.id ? (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    disabled={actingUserId === account.id}
                                    onClick={() => void handleRoleUpdate(account.id, 'user')}
                                  >
                                    {actingUserId === account.id ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <UserCog className="mr-2 h-4 w-4" />
                                    )}
                                    Degradar
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Ajuste manual de creditos</CardTitle>
                        <CardDescription>
                          Inserta un movimiento manual en el ledger para corregir saldo de un usuario.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form className="space-y-4" onSubmit={handleCreditAdjustment}>
                          <div className="space-y-2">
                            <Label htmlFor="adjustUserId">User ID</Label>
                            <Input
                              id="adjustUserId"
                              value={adjustUserId}
                              onChange={(event) => setAdjustUserId(event.target.value)}
                              placeholder="UUID del usuario"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="adjustDeltaCredits">Delta de creditos</Label>
                            <Input
                              id="adjustDeltaCredits"
                              type="number"
                              value={adjustDeltaCredits}
                              onChange={(event) => setAdjustDeltaCredits(event.target.value)}
                              placeholder="Ej. 25 o -10"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="adjustReason">Motivo</Label>
                            <Textarea
                              id="adjustReason"
                              value={adjustReason}
                              onChange={(event) => setAdjustReason(event.target.value)}
                              placeholder="Motivo auditable del ajuste"
                              required
                            />
                          </div>
                          <Button type="submit" disabled={isSubmittingAdjustment} className="w-full">
                            {isSubmittingAdjustment ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <CreditCard className="mr-2 h-4 w-4" />
                            )}
                            Aplicar ajuste
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid gap-6 xl:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Ledger reciente</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {overview.ledger.map((entry) => (
                          <div key={entry.id} className="rounded-xl border border-border p-4 text-sm">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-foreground">{entry.userEmail}</p>
                              <Badge variant={entry.deltaCredits >= 0 ? 'secondary' : 'outline'}>
                                {entry.deltaCredits >= 0 ? `+${entry.deltaCredits}` : entry.deltaCredits}
                              </Badge>
                              <Badge>{entry.kind}</Badge>
                            </div>
                            <p className="mt-2 text-muted-foreground">
                              Balance posterior: {entry.balanceAfterCredits}. {entry.description}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatTimestamp(entry.createdAt)}
                            </p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Pagos recientes</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {overview.payments.map((payment) => (
                          <div key={payment.id} className="rounded-xl border border-border p-4 text-sm">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-foreground">{payment.userEmail}</p>
                              <Badge>{payment.status}</Badge>
                              <Badge variant="secondary">{payment.blinkInvoiceStatus}</Badge>
                            </div>
                            <p className="mt-2 text-muted-foreground">
                              {payment.packageName} · {formatUsd(payment.amountUsdCents)} · {payment.credits} creditos
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatTimestamp(payment.createdAt)}
                            </p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid gap-6 xl:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Webhooks Blink</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {overview.webhookEvents.map((event) => (
                          <div key={event.id} className="rounded-xl border border-border p-4 text-sm">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-foreground">{event.eventType}</p>
                              {event.processingError ? (
                                <Badge variant="destructive">error</Badge>
                              ) : (
                                <Badge variant="secondary">ok</Badge>
                              )}
                            </div>
                            <p className="mt-2 text-muted-foreground break-all">
                              {event.processingError || event.paymentHash || 'Sin error registrado.'}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatTimestamp(event.createdAt)}
                            </p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Auditoría</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {overview.auditEvents.map((event) => (
                          <div key={event.id} className="rounded-xl border border-border p-4 text-sm">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-foreground">{event.action}</p>
                              <Badge>{event.status}</Badge>
                            </div>
                            <p className="mt-2 text-muted-foreground">
                              {event.actorEmail || 'system'} · {event.message || 'Sin mensaje'}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatTimestamp(event.createdAt)}
                            </p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </div>
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