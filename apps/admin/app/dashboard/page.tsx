'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  FileStack,
  Loader2,
  LogOut,
  RefreshCcw,
  ShieldCheck,
  Wallet,
} from 'lucide-react'

import { getAdminOverview, getApiErrorMessage, getSession, logout } from '@/lib/api'
import type { AdminDocument, AdminOverviewResponse, SessionUser } from '@/types'

function formatSats(value: number) {
  return `${new Intl.NumberFormat('es-ES').format(value)} sats`
}

function formatDate(value?: string) {
  if (!value) {
    return 'Sin fecha'
  }

  return new Date(value).toLocaleString('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function compact(value: string, head = 12, tail = 10) {
  if (value.length <= head + tail + 3) {
    return value
  }

  return `${value.slice(0, head)}...${value.slice(-tail)}`
}

function configStateLabel(enabled: boolean) {
  return enabled ? 'Configurado' : 'Pendiente'
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  async function loadDashboard() {
    const [sessionResponse, overviewResponse] = await Promise.all([
      getSession(),
      getAdminOverview(),
    ])

    if (sessionResponse.success && sessionResponse.data) {
      setUser(sessionResponse.data.user)
    }

    if (!overviewResponse.success || !overviewResponse.data) {
      throw new Error(getApiErrorMessage(overviewResponse, 'No fue posible cargar el dashboard admin.'))
    }

    setOverview(overviewResponse.data)
  }

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      try {
        await loadDashboard()
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'No fue posible cargar el dashboard admin.'
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
    }
  }, [])

  async function handleRefresh() {
    setError(null)
    setIsRefreshing(true)
    try {
      await loadDashboard()
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : 'No fue posible refrescar el dashboard.'
      )
    } finally {
      setIsRefreshing(false)
    }
  }

  async function handleLogout() {
    await logout()
    router.replace('/')
  }

  const statCards = useMemo(() => {
    if (!overview) {
      return []
    }

    return [
      { label: 'Usuarios', value: overview.stats.totalUsers.toString() },
      { label: 'Usuarios verificados', value: overview.stats.verifiedUsers.toString() },
      { label: 'Admins', value: overview.stats.adminUsers.toString() },
      { label: 'Créditos en balance', value: overview.stats.totalCreditBalance.toString() },
      { label: 'Documentos', value: overview.stats.totalDocuments.toString() },
      { label: 'Confirmados', value: overview.stats.confirmedDocuments.toString() },
      { label: 'Fallidos', value: overview.stats.failedDocuments.toString() },
      { label: 'Pagos pendientes', value: overview.stats.pendingPaymentIntents.toString() },
    ]
  }, [overview])

  return (
    <main className="min-h-screen px-4 py-4 sm:px-6 sm:py-6 md:px-10 lg:px-14">
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
        <header className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface-strong)] p-5 shadow-2xl shadow-black/20 backdrop-blur sm:p-6 md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-black/20 px-4 py-2 text-sm text-[var(--ink-soft)]">
                <ShieldCheck className="h-4 w-4 text-[var(--accent)]" />
                Dashboard operativo
              </div>
              <h1 className="mt-4 text-3xl font-semibold text-white md:text-5xl">
                Estado del sistema, wallet y operación on-chain.
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--ink-soft)] md:text-base">
                Revisa la wallet cargada en el nodo, el precio efectivo del crédito, los usuarios,
                el saldo global y los documentos que ya están en proceso o confirmados en blockchain.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => void handleRefresh()}
                disabled={isRefreshing}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--line)] px-5 py-3 text-sm text-white transition hover:border-[var(--accent)] disabled:opacity-60 sm:w-auto"
              >
                {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                Refrescar
              </button>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-black transition hover:bg-[var(--accent-strong)] sm:w-auto"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-[var(--ink-soft)]">
            <span className="rounded-full border border-[var(--line)] px-3 py-1">
              Entorno: {overview?.environment || 'cargando'}
            </span>
            {user ? (
              <span className="rounded-full border border-[var(--line)] px-3 py-1">
                Sesión: {user.email}
              </span>
            ) : null}
            {overview ? (
              <span className="rounded-full border border-[var(--line)] px-3 py-1">
                Wallet: {overview.wallet.walletName}
              </span>
            ) : null}
          </div>
        </header>

        {error ? (
          <div className="rounded-[1.5rem] border border-[rgba(255,122,122,0.25)] bg-[rgba(255,122,122,0.08)] p-4 text-sm text-[var(--ink-soft)]">
            {error}
          </div>
        ) : null}

        {isLoading || !overview ? (
          <section className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-6 text-[var(--ink-soft)] backdrop-blur">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--accent)]" />
              Cargando métricas y estado del nodo...
            </div>
          </section>
        ) : (
          <>
            <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
              {statCards.map((item) => (
                <article
                  key={item.label}
                  className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface)] p-4 backdrop-blur sm:p-5"
                >
                  <p className="text-sm text-[var(--ink-soft)]">{item.label}</p>
                  <p className="mt-3 text-2xl font-semibold text-white sm:text-3xl">{item.value}</p>
                </article>
              ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <article className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-6 backdrop-blur">
                <div className="flex items-center gap-3">
                  <Wallet className="h-5 w-5 text-[var(--accent)]" />
                  <div>
                    <h2 className="text-xl font-semibold text-white">Wallet del nodo</h2>
                    <p className="text-sm text-[var(--ink-soft)]">
                      La misma wallet usada por el worker para registrar hashes en blockchain.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <WalletCard label="Wallet" value={overview.wallet.walletName} />
                  <WalletCard label="Red" value={overview.wallet.network} />
                  <WalletCard label="Cargada" value={overview.wallet.loaded ? 'Sí' : 'No'} />
                  <WalletCard label="TXs wallet" value={overview.wallet.txCount.toString()} />
                  <WalletCard label="Saldo confirmado" value={formatSats(overview.wallet.confirmedBalanceSats)} />
                  <WalletCard label="Saldo no confirmado" value={formatSats(overview.wallet.unconfirmedBalanceSats)} />
                  <WalletCard label="Saldo total" value={formatSats(overview.wallet.balanceSats)} />
                </div>

                <div className="mt-5 rounded-[1.5rem] border border-[var(--line)] bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--ink-soft)]">Dirección principal</p>
                  <p className="mt-3 break-all font-[family-name:var(--font-mono)] text-sm text-white">
                    {overview.wallet.primaryAddress}
                  </p>
                </div>
              </article>

              <article className="space-y-6">
                <div className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-6 backdrop-blur">
                  <h2 className="text-xl font-semibold text-white">Pricing efectivo</h2>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <WalletCard
                      label="Precio por crédito"
                      value={formatSats(overview.pricing.creditPriceSats)}
                    />
                    <WalletCard
                      label="Costo por registro"
                      value={`${overview.pricing.documentRegistrationCreditCost} crédito(s)`}
                    />
                  </div>
                </div>

                <div className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-6 backdrop-blur">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-[var(--accent)]" />
                    <div>
                      <h2 className="text-xl font-semibold text-white">Diagnóstico Blink</h2>
                      <p className="text-sm text-[var(--ink-soft)]">
                        Estado del billing Lightning, webhook público y endpoint GraphQL activo.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <WalletCard
                      label="API Blink"
                      value={configStateLabel(overview.blink.apiConfigured)}
                    />
                    <WalletCard
                      label="Webhook verificado"
                      value={configStateLabel(overview.blink.webhookConfigured)}
                    />
                  </div>

                  <div className="mt-5 space-y-4 rounded-[1.5rem] border border-[var(--line)] bg-black/20 p-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--ink-soft)]">GraphQL Blink</p>
                      <p className="mt-2 break-all font-[family-name:var(--font-mono)] text-sm text-white">
                        {overview.blink.apiUrl}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--ink-soft)]">Webhook público</p>
                      <p className="mt-2 break-all font-[family-name:var(--font-mono)] text-sm text-white">
                        {overview.blink.webhookUrl}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-6 backdrop-blur">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-[var(--warn)]" />
                    <h2 className="text-xl font-semibold text-white">Alertas activas</h2>
                  </div>
                  {overview.alerts.length === 0 ? (
                    <p className="mt-4 text-sm text-[var(--good)]">No hay alertas críticas en este momento.</p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {overview.alerts.map((alert) => (
                        <div
                          key={alert}
                          className="rounded-[1.25rem] border border-[rgba(255,179,71,0.24)] bg-[rgba(255,179,71,0.08)] p-4 text-sm text-[var(--ink-soft)]"
                        >
                          {alert}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <UsersPanel users={overview.users} />
              <DocumentsPanel documents={overview.documents} />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <article className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-6 backdrop-blur">
                <h2 className="text-xl font-semibold text-white">Pagos recientes</h2>
                <div className="mt-4 space-y-4">
                  {overview.payments.length === 0 ? (
                    <EmptyState text="Aún no existen intents de pago registrados." />
                  ) : (
                    overview.payments.slice(0, 6).map((payment) => (
                      <div key={payment.id} className="rounded-[1.25rem] border border-[var(--line)] bg-black/20 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-white">{payment.userEmail}</p>
                            <p className="mt-1 text-sm text-[var(--ink-soft)]">
                              {payment.packageName} · {payment.credits} créditos · {formatSats(payment.amountSats)}
                            </p>
                            <p className="mt-1 text-xs text-[var(--ink-soft)]">
                              Estado Blink: {payment.blinkInvoiceStatus}
                              {payment.paymentHash ? ` · hash ${compact(payment.paymentHash, 10, 8)}` : ''}
                            </p>
                          </div>
                          <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                            {payment.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </article>

              <article className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-6 backdrop-blur">
                <h2 className="text-xl font-semibold text-white">Auditoría reciente</h2>
                <div className="mt-4 space-y-4">
                  {overview.auditEvents.length === 0 ? (
                    <EmptyState text="Aún no hay eventos de auditoría para mostrar." />
                  ) : (
                    overview.auditEvents.slice(0, 6).map((event) => (
                      <div key={event.id} className="rounded-[1.25rem] border border-[var(--line)] bg-black/20 p-4">
                        <p className="font-medium text-white">{event.action}</p>
                        <p className="mt-1 text-sm text-[var(--ink-soft)]">
                          {event.actorEmail || 'sistema'} · {event.status} · {formatDate(event.createdAt)}
                        </p>
                        {event.message ? (
                          <p className="mt-2 text-sm text-[var(--ink-soft)]">{event.message}</p>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </article>
            </section>

            <footer className="flex justify-end text-xs text-[var(--ink-soft)]">
              <a
                href="https://caeher.com"
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-white"
              >
                Created By Caeher
              </a>
            </footer>
          </>
        )}
      </div>
    </main>
  )
}

function WalletCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-[var(--line)] bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-[var(--ink-soft)]">{label}</p>
      <p className="mt-3 text-lg font-medium text-white">{value}</p>
    </div>
  )
}

function UsersPanel({ users }: { users: AdminOverviewResponse['users'] }) {
  return (
    <article className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-6 backdrop-blur">
      <h2 className="text-xl font-semibold text-white">Usuarios y créditos</h2>
      <div className="mt-4 space-y-4">
        {users.length === 0 ? (
          <EmptyState text="No hay usuarios registrados aún." />
        ) : (
          users.map((user) => (
            <div key={user.id} className="rounded-[1.25rem] border border-[var(--line)] bg-black/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{user.email}</p>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">{user.name} · {user.role}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[var(--ink-soft)]">Créditos</p>
                  <p className="text-xl font-semibold text-white">{user.balanceCredits}</p>
                </div>
              </div>
              <p className="mt-3 font-[family-name:var(--font-mono)] text-xs text-[var(--ink-soft)]">
                {user.id}
              </p>
            </div>
          ))
        )}
      </div>
    </article>
  )
}

function DocumentsPanel({ documents }: { documents: AdminDocument[] }) {
  return (
    <article className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <FileStack className="h-5 w-5 text-[var(--accent)]" />
        <h2 className="text-xl font-semibold text-white">Documentos recientes</h2>
      </div>
      <div className="mt-4 space-y-4">
        {documents.length === 0 ? (
          <EmptyState text="Todavía no hay documentos registrados." />
        ) : (
          documents.map((document) => (
            <div key={document.id} className="rounded-[1.25rem] border border-[var(--line)] bg-black/20 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{document.filename}</p>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">{document.userEmail}</p>
                </div>
                <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                  {document.status}
                </span>
              </div>

              <div className="mt-4 grid gap-2 text-sm text-[var(--ink-soft)]">
                <p>Creado: {formatDate(document.createdAt)}</p>
                <p>Actualizado: {formatDate(document.updatedAt)}</p>
                <p>Confirmaciones: {document.confirmations ?? 0}</p>
                {document.transactionId ? (
                  <p className="font-[family-name:var(--font-mono)] text-xs text-white">
                    TXID: {compact(document.transactionId)}
                  </p>
                ) : null}
                {document.failureReason ? <p className="text-[var(--bad)]">{document.failureReason}</p> : null}
              </div>
            </div>
          ))
        )}
      </div>
    </article>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[1.25rem] border border-dashed border-[var(--line)] bg-black/10 p-4 text-sm text-[var(--ink-soft)]">
      {text}
    </div>
  )
}