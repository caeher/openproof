'use client'

import { Suspense, startTransition, useEffect, useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, KeyRound, Loader2, LockKeyhole, Shield, UserRoundPlus } from 'lucide-react'

import {
  adminLogin,
  createInitialAdmin,
  getAdminSetupStatus,
  getApiErrorMessage,
  getSession,
} from '@/lib/api'

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const response =
        mode === 'register'
          ? await createInitialAdmin(name, email, password)
          : await adminLogin(email, password)

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

  const isRegisterMode = mode === 'register'
  const PanelIcon = isRegisterMode ? UserRoundPlus : LockKeyhole
  const badge = isRegisterMode ? 'Registro inicial' : 'Acceso admin'
  const title = isRegisterMode ? 'Crear administrador' : 'Iniciar sesión'
  const buttonLabel = isRegisterMode ? 'Crear administrador' : 'Entrar al panel'

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 sm:py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(243,167,18,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(141,214,148,0.12),transparent_24%)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-md items-center justify-center">
        <section className="w-full rounded-[2rem] border border-[var(--line)] bg-[var(--surface-strong)] p-5 shadow-2xl shadow-black/35 backdrop-blur sm:p-7">

          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-black/20 px-3 py-1.5 text-[11px] uppercase tracking-[0.24em] text-[var(--ink-soft)]">
            <PanelIcon className="h-3.5 w-3.5 text-[var(--accent)]" />
            {badge}
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-[2.2rem]">{title}</h1>
          </div>

          {mode === 'loading' ? (
            <div className="mt-6 flex items-center gap-3 rounded-[1.5rem] border border-[var(--line)] bg-black/20 px-4 py-5 text-sm text-[var(--ink-soft)]">
              <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" />
              Validando estado del panel...
            </div>
          ) : (
            <>
              {error ? (
                <div className="mt-6 rounded-[1.5rem] border border-[rgba(255,122,122,0.25)] bg-[rgba(255,122,122,0.08)] px-4 py-3 text-sm text-[var(--ink-soft)]">
                  {error}
                </div>
              ) : null}

              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                {isRegisterMode ? (
                  <label className="block space-y-2">
                    <span className="text-sm text-[var(--ink-soft)]">Nombre</span>
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="w-full rounded-[1.25rem] border border-[var(--line)] bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-neutral-500 focus:border-[var(--accent)]"
                      placeholder="Operaciones OpenProof"
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
                    className="w-full rounded-[1.25rem] border border-[var(--line)] bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-neutral-500 focus:border-[var(--accent)]"
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
                    className="w-full rounded-[1.25rem] border border-[var(--line)] bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-neutral-500 focus:border-[var(--accent)]"
                    placeholder="Mínimo 8 caracteres"
                    required
                  />
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[1.25rem] bg-[var(--accent)] px-5 py-3.5 font-medium text-black transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  {buttonLabel}
                  {!isSubmitting ? <ArrowRight className="h-4 w-4" /> : null}
                </button>
              </form>
            </>
          )}

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-[var(--line)] pt-4 text-xs text-[var(--ink-soft)]">
            <span>{isRegisterMode ? 'Bootstrap inicial habilitado' : 'Acceso restringido'}</span>
          </div>
        </section>
      </div>
    </main>
  )
}

function LoadingShell() {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md items-center justify-center rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-6 text-sm text-[var(--ink-soft)] backdrop-blur">
        <Loader2 className="mr-3 h-4 w-4 animate-spin text-[var(--accent)]" />
        Preparando el acceso administrativo...
      </div>
    </main>
  )
}
