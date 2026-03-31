'use client'

import {
  Suspense,
  startTransition,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  KeyRound,
  Loader2,
  LockKeyhole,
  LogOut,
  Shield,
  ShieldAlert,
  UserRoundPlus,
} from 'lucide-react'

import {
  createInitialAdmin,
  getAdminSetupStatus,
  getApiErrorMessage,
  getSession,
  login,
  logout,
} from '@/lib/api'
import type { SessionUser } from '@/types'

type ScreenMode = 'loading' | 'login' | 'register'

export default function HomePage() {
  return (
    <Suspense fallback={<LoadingShell />}>
      <HomePageContent />
    </Suspense>
  )
}

function HomePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<ScreenMode>('loading')
  const [existingSessionUser, setExistingSessionUser] = useState<SessionUser | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const nextPath = searchParams.get('next') || '/dashboard'

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      try {
        const [setupResponse, sessionResponse] = await Promise.all([
          getAdminSetupStatus(),
          getSession(),
        ])

        if (cancelled) {
          return
        }

        if (sessionResponse.success && sessionResponse.data?.user.role === 'admin') {
          startTransition(() => {
            router.replace(nextPath)
          })
          return
        }

        setExistingSessionUser(sessionResponse.success ? sessionResponse.data?.user || null : null)

        if (!setupResponse.success || !setupResponse.data) {
          setError(getApiErrorMessage(setupResponse, 'No fue posible obtener el estado inicial del panel.'))
          setMode('login')
          return
        }

        setMode(setupResponse.data.registrationEnabled ? 'register' : 'login')
      } catch (bootstrapError) {
        if (!cancelled) {
          setError(
            bootstrapError instanceof Error
              ? bootstrapError.message
              : 'No fue posible abrir el panel admin.'
          )
          setMode('login')
        }
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
    }
  }, [nextPath, router])

  const modeCopy = useMemo(() => {
    if (mode === 'register') {
      return {
        badge: 'Bootstrap inicial',
        title: 'Crea el primer administrador del sistema',
        description:
          'Este paso sólo aparece mientras no exista ningún usuario con rol admin en OpenProof.',
        button: 'Crear administrador',
        icon: UserRoundPlus,
      }
    }

    return {
      badge: 'Acceso operativo',
      title: 'Ingresa al panel de control',
      description:
        'Usa una cuenta admin existente para revisar wallet, usuarios, créditos y documentos registrados.',
      button: 'Entrar al dashboard',
      icon: LockKeyhole,
    }
  }, [mode])

  async function handleLogout() {
    await logout()
    setExistingSessionUser(null)
    setError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const response =
        mode === 'register'
          ? await createInitialAdmin(name, email, password)
          : await login(email, password)

      if (!response.success || !response.data) {
        setError(
          getApiErrorMessage(
            response,
            mode === 'register'
              ? 'No fue posible crear el administrador inicial.'
              : 'No fue posible iniciar sesión.'
          )
        )
        return
      }

      if (response.data.user.role !== 'admin') {
        await logout()
        setError('La cuenta autenticada no tiene rol admin.')
        return
      }

      startTransition(() => {
        router.replace(nextPath)
      })
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'No fue posible completar la operación.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const PanelIcon = modeCopy.icon

  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-10 md:px-10 lg:px-14">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <section className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-black/20 px-4 py-2 text-sm text-[var(--ink-soft)] backdrop-blur">
            <Shield className="h-4 w-4 text-[var(--accent)]" />
            OpenProof Admin Console
          </div>

          <div className="space-y-6">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white md:text-6xl">
              Controla la wallet operativa y la salud completa del registro on-chain.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[var(--ink-soft)]">
              Este panel se separa del cliente público para concentrar la operación sensible: wallet del nodo,
              balance spendable, usuarios, créditos, documentos y trazabilidad administrativa.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <InfoTile
              eyebrow="Wallet"
              title="Bootstrap automático"
              description="La wallet configurada se crea y carga en Bitcoin Core al arrancar el API."
            />
            <InfoTile
              eyebrow="Pricing"
              title="Precio unitario"
              description="Los paquetes ya no guardan precio propio; el costo sale de créditos x env."
            />
            <InfoTile
              eyebrow="Auditoría"
              title="Visibilidad operacional"
              description="Usuarios, documentos y movimientos clave visibles desde el dashboard admin."
            />
          </div>
        </section>

        <section className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-2xl shadow-black/30 backdrop-blur md:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs uppercase tracking-[0.24em] text-[var(--accent-strong)]">
                <PanelIcon className="h-3.5 w-3.5" />
                {modeCopy.badge}
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-white">{modeCopy.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{modeCopy.description}</p>
            </div>
          </div>

          {mode === 'loading' ? (
            <div className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-black/20 px-4 py-6 text-sm text-[var(--ink-soft)]">
              <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" />
              Verificando estado del panel y sesiones activas...
            </div>
          ) : (
            <>
              {existingSessionUser && existingSessionUser.role !== 'admin' ? (
                <div className="mb-5 rounded-2xl border border-[rgba(255,122,122,0.25)] bg-[rgba(255,122,122,0.08)] p-4 text-sm text-[var(--ink-soft)]">
                  <div className="flex items-center gap-2 text-white">
                    <ShieldAlert className="h-4 w-4 text-[var(--bad)]" />
                    Hay una sesión activa sin privilegios admin.
                  </div>
                  <p className="mt-2 break-all">{existingSessionUser.email}</p>
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-4 py-2 text-white transition hover:border-[var(--accent)]"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar esa sesión
                  </button>
                </div>
              ) : null}

              {error ? (
                <div className="mb-5 rounded-2xl border border-[rgba(255,122,122,0.25)] bg-[rgba(255,122,122,0.08)] p-4 text-sm text-[var(--ink-soft)]">
                  {error}
                </div>
              ) : null}

              <form className="space-y-4" onSubmit={handleSubmit}>
                {mode === 'register' ? (
                  <label className="block space-y-2">
                    <span className="text-sm text-[var(--ink-soft)]">Nombre del administrador</span>
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="w-full rounded-2xl border border-[var(--line)] bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-neutral-500 focus:border-[var(--accent)]"
                      placeholder="Ej. Operaciones OpenProof"
                      required
                    />
                  </label>
                ) : null}

                <label className="block space-y-2">
                  <span className="text-sm text-[var(--ink-soft)]">Correo</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-2xl border border-[var(--line)] bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-neutral-500 focus:border-[var(--accent)]"
                    placeholder="admin@openproof.app"
                    required
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm text-[var(--ink-soft)]">Contraseña</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-2xl border border-[var(--line)] bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-neutral-500 focus:border-[var(--accent)]"
                    placeholder="Mínimo 8 caracteres"
                    required
                  />
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-5 py-3 font-medium text-black transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  {modeCopy.button}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  )
}

function LoadingShell() {
  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-10 md:px-10 lg:px-14">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl items-center justify-center rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-6 text-sm text-[var(--ink-soft)] backdrop-blur">
        <Loader2 className="mr-3 h-4 w-4 animate-spin text-[var(--accent)]" />
        Preparando el acceso administrativo...
      </div>
    </main>
  )
}

function InfoTile({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface)] p-5 backdrop-blur">
      <p className="text-xs uppercase tracking-[0.22em] text-[var(--accent-strong)]">{eyebrow}</p>
      <h2 className="mt-3 text-lg font-medium text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{description}</p>
    </div>
  )
}