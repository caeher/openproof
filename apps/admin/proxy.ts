import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const SESSION_COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME ||
  process.env.NEXT_PUBLIC_SESSION_COOKIE_NAME ||
  'openproof_session'

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const hasSessionCookie = request.cookies.has(SESSION_COOKIE_NAME)

  if (pathname.startsWith('/dashboard') && !hasSessionCookie) {
    const loginUrl = new URL('/', request.url)
    loginUrl.searchParams.set('next', `${pathname}${search}`)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}