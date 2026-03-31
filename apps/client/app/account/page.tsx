'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ImageUp, KeyRound, Loader2, ShieldCheck, MailCheck, Trash2 } from 'lucide-react'

import { AuthGuard } from '@/components/auth/auth-guard'
import { UserAvatar } from '@/components/auth/user-avatar'
import { useAuth } from '@/components/auth/auth-provider'
import { Footer, Header, MobileNav } from '@/components/layout'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { changeAccountPassword, getAccountProfile, getApiErrorMessage, updateAccountAvatar } from '@/lib/api'
import { buildVerifyEmailPath } from '@/lib/auth-routing'
import { compressAvatarImage, getUserDisplayName } from '@/lib/avatar'
import type { AccountProfile } from '@/types'

function formatTimestamp(value?: string) {
  if (!value) {
    return 'Nunca'
  }

  return new Date(value).toLocaleString('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function AccountPage() {
  const { isLoading: isAuthLoading, refreshSession, user } = useAuth()
  const [profile, setProfile] = useState<AccountProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const verifyHref = buildVerifyEmailPath('/billing')
  const displayName = getUserDisplayName(profile?.user || user)

  async function loadProfile() {
    const response = await getAccountProfile()
    if (!response.success || !response.data) {
      throw new Error(getApiErrorMessage(response, 'No fue posible cargar tu cuenta.'))
    }

    setProfile(response.data)
  }

  useEffect(() => {
    if (isAuthLoading) {
      return
    }

    async function fetchProfile() {
      try {
        await loadProfile()
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : 'No fue posible cargar tu cuenta.'
        )
      } finally {
        setIsLoading(false)
      }
    }

    void fetchProfile()
  }, [isAuthLoading])

  async function handlePasswordChange(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setIsSaving(true)

    try {
      const response = await changeAccountPassword(currentPassword, newPassword)
      if (!response.success) {
        setError(getApiErrorMessage(response, 'No fue posible actualizar la contraseña.'))
        return
      }

      await refreshSession()
      setCurrentPassword('')
      setNewPassword('')
      setSuccess(response.data?.message || 'Contraseña actualizada.')
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : 'No fue posible actualizar la contraseña.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function persistAvatar(avatarUrl: string | null, successMessage: string) {
    setError(null)
    setSuccess(null)
    setIsUpdatingAvatar(true)

    try {
      const response = await updateAccountAvatar(avatarUrl)
      if (!response.success || !response.data) {
        setError(getApiErrorMessage(response, 'No fue posible actualizar el avatar.'))
        return
      }

      setProfile((current) => {
        if (!current) {
          return current
        }

        return {
          ...current,
          user: response.data.user,
        }
      })
      await refreshSession()
      setSuccess(successMessage)
    } catch (avatarError) {
      setError(
        avatarError instanceof Error
          ? avatarError.message
          : 'No fue posible actualizar el avatar.'
      )
    } finally {
      setIsUpdatingAvatar(false)
    }
  }

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    try {
      const avatarUrl = await compressAvatarImage(file)
      await persistAvatar(avatarUrl, 'Avatar actualizado.')
    } catch (avatarError) {
      setError(
        avatarError instanceof Error
          ? avatarError.message
          : 'No fue posible procesar el avatar.'
      )
    }
  }

  async function handleAvatarRemove() {
    await persistAvatar(null, 'Avatar eliminado.')
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pb-24 md:pb-0">
        <div className="container max-w-6xl mx-auto px-4 py-8 md:py-12">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al dashboard
          </Link>

          <div>
            <AuthGuard>
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-foreground">
                  <ShieldCheck className="h-4 w-4" />
                  Cuenta y seguridad
                </div>
                <h1 className="mt-4 text-2xl md:text-3xl font-bold text-foreground">
                  Gestiona tu perfil operativo
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Consulta el estado de tu cuenta, tus creditos y rota la contraseña de acceso de la sesión web.
                </p>
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

              {!user?.emailVerified ? (
                <Alert className="mb-6 border-amber-200 bg-amber-50 text-amber-950">
                  <MailCheck className="h-4 w-4" />
                  <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <span>
                      Puedes administrar perfil y contrasena desde ahora, pero billing, registro y API keys siguen bloqueados hasta validar el correo.
                    </span>
                    <Button asChild size="sm" variant="outline">
                      <Link href={verifyHref}>Verificar correo</Link>
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : null}

              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <Card>
                  <CardHeader>
                    <CardTitle>Resumen</CardTitle>
                    <CardDescription>Estado actual de la cuenta autenticada.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading || !profile ? (
                      <div className="flex items-center gap-3 py-8 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Cargando cuenta...
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-secondary/25 p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-4">
                            <UserAvatar
                              user={profile?.user || user}
                              className="size-16 ring-1 ring-border/80"
                              fallbackClassName="text-lg"
                            />
                            <div>
                              <p className="font-semibold text-foreground">{displayName}</p>
                              <p className="text-sm text-muted-foreground">
                                Sube una imagen y la convertiremos a WebP comprimido antes de guardarla.
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 sm:items-end">
                            <Button asChild variant="outline" disabled={isUpdatingAvatar}>
                              <Label htmlFor="avatar-upload" className="cursor-pointer">
                                {isUpdatingAvatar ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <ImageUp className="mr-2 h-4 w-4" />
                                )}
                                Cambiar avatar
                              </Label>
                            </Button>
                            <input
                              id="avatar-upload"
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={handleAvatarChange}
                              disabled={isUpdatingAvatar}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              className="justify-start text-muted-foreground sm:justify-end"
                              disabled={isUpdatingAvatar || !profile.user.avatarUrl}
                              onClick={() => {
                                void handleAvatarRemove()
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Quitar avatar
                            </Button>
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="rounded-xl border border-border p-4">
                            <p className="text-sm text-muted-foreground">Nombre</p>
                            <p className="mt-2 font-semibold text-foreground">{profile.user.name}</p>
                          </div>
                          <div className="rounded-xl border border-border p-4">
                            <p className="text-sm text-muted-foreground">Correo</p>
                            <p className="mt-2 font-semibold text-foreground">{profile.user.email}</p>
                          </div>
                          <div className="rounded-xl border border-border p-4">
                            <p className="text-sm text-muted-foreground">Rol</p>
                            <p className="mt-2 font-semibold text-foreground">{profile.user.role}</p>
                          </div>
                          <div className="rounded-xl border border-border p-4">
                            <p className="text-sm text-muted-foreground">Creditos disponibles</p>
                            <p className="mt-2 text-3xl font-bold text-foreground">
                              {profile.creditAccount.balanceCredits}
                            </p>
                          </div>
                          <div className="rounded-xl border border-border p-4">
                            <p className="text-sm text-muted-foreground">API keys activas</p>
                            <p className="mt-2 text-3xl font-bold text-foreground">
                              {profile.activeApiKeys}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-xl border border-border p-4 text-sm text-muted-foreground space-y-2">
                          <p>
                            Correo verificado:{' '}
                            <span className="text-foreground">
                              {profile.user.emailVerified ? 'Sí' : 'No'}
                            </span>
                          </p>
                          <p>
                            Comprados:{' '}
                            <span className="text-foreground">
                              {profile.creditAccount.purchasedCredits}
                            </span>
                          </p>
                          <p>
                            Consumidos:{' '}
                            <span className="text-foreground">
                              {profile.creditAccount.consumedCredits}
                            </span>
                          </p>
                          <p>
                            Ultima actualizacion de saldo:{' '}
                            <span className="text-foreground">
                              {formatTimestamp(profile.creditAccount.updatedAt)}
                            </span>
                          </p>
                          <p>
                            Entorno:{' '}
                            <span className="text-foreground">{profile.environment}</span>
                          </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                          {profile.user.emailVerified ? (
                            <>
                              <Button asChild variant="outline">
                                <Link href="/billing">Ir a billing</Link>
                              </Button>
                              <Button asChild variant="outline">
                                <Link href="/developers">Gestionar API keys</Link>
                              </Button>
                            </>
                          ) : (
                            <Button asChild variant="outline">
                              <Link href={verifyHref}>Verificar correo</Link>
                            </Button>
                          )}
                          {user?.role === 'admin' ? (
                            <Button asChild>
                              <Link href="/admin">Abrir admin</Link>
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Rotar contraseña</CardTitle>
                      <CardDescription>
                        La sesión actual se renueva al cambiar la contraseña y el resto de sesiones previas se invalidan.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form className="space-y-4" onSubmit={handlePasswordChange}>
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword">Contraseña actual</Label>
                          <Input
                            id="currentPassword"
                            type="password"
                            value={currentPassword}
                            onChange={(event) => setCurrentPassword(event.target.value)}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="newPassword">Nueva contraseña</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            minLength={8}
                            value={newPassword}
                            onChange={(event) => setNewPassword(event.target.value)}
                            required
                          />
                        </div>

                        <Button type="submit" disabled={isSaving} className="w-full">
                          {isSaving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <KeyRound className="mr-2 h-4 w-4" />
                          )}
                          Actualizar contraseña
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </AuthGuard>
          </div>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  )
}