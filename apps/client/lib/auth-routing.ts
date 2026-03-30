import type { AuthState } from '@/types'

const GUEST_ONLY_PREFIXES = ['/login', '/signup', '/forgot-password', '/reset-password']
const AUTH_ONLY_PREFIXES = ['/dashboard', '/account']
const VERIFIED_ONLY_PREFIXES = ['/register', '/history', '/documents', '/billing', '/developers']
const ADMIN_ONLY_PREFIXES = ['/admin']

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export function isGuestOnlyRoute(pathname: string) {
  return matchesPrefix(pathname, GUEST_ONLY_PREFIXES)
}

export function requiresAuthenticatedUser(pathname: string) {
  return matchesPrefix(pathname, [...AUTH_ONLY_PREFIXES, ...VERIFIED_ONLY_PREFIXES, ...ADMIN_ONLY_PREFIXES])
}

export function requiresVerifiedUser(pathname: string) {
  return matchesPrefix(pathname, [...VERIFIED_ONLY_PREFIXES, ...ADMIN_ONLY_PREFIXES])
}

export function requiresAdminUser(pathname: string) {
  return matchesPrefix(pathname, ADMIN_ONLY_PREFIXES)
}

export function sanitizeNextPath(candidate: string | null | undefined) {
  if (!candidate) {
    return null
  }

  const trimmed = candidate.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return null
  }

  try {
    const url = new URL(trimmed, 'http://localhost')
    if (url.origin !== 'http://localhost') {
      return null
    }

    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}

export function buildVerifyEmailPath(nextPath?: string | null) {
  const verifyPath = new URL('/verify-email', 'http://localhost')
  const safeNext = sanitizeNextPath(nextPath)
  if (safeNext) {
    verifyPath.searchParams.set('next', safeNext)
  }
  return `${verifyPath.pathname}${verifyPath.search}`
}

export function getAuthenticatedHome(authState: AuthState) {
  if (authState === 'authenticated_unverified') {
    return '/verify-email'
  }

  return '/dashboard'
}

export function resolveAuthenticatedNext(authState: AuthState, nextPath?: string | null) {
  const safeNext = sanitizeNextPath(nextPath)
  if (!safeNext) {
    return getAuthenticatedHome(authState)
  }

  if (requiresAdminUser(safeNext)) {
    return authState === 'authenticated_admin' ? safeNext : '/dashboard'
  }

  if (requiresVerifiedUser(safeNext)) {
    if (authState === 'authenticated_unverified') {
      return buildVerifyEmailPath(safeNext)
    }

    return safeNext
  }

  if (requiresAuthenticatedUser(safeNext)) {
    return safeNext
  }

  if (isGuestOnlyRoute(safeNext)) {
    return getAuthenticatedHome(authState)
  }

  return safeNext
}