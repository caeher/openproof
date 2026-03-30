'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { getSession, login, logout, signup } from '@/lib/api'
import type {
  ApiResponse,
  AuthUser,
  SessionResponse,
  SignupResponse,
} from '@/types'

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  refreshSession: () => Promise<AuthUser | null>
  loginWithPassword: (
    email: string,
    password: string
  ) => Promise<ApiResponse<SessionResponse>>
  signupWithPassword: (
    email: string,
    password: string
  ) => Promise<ApiResponse<SignupResponse>>
  logoutCurrentSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  async function refreshSession() {
    const response = await getSession()
    if (response.success && response.data) {
      setUser(response.data.user)
      return response.data.user
    }

    setUser(null)
    return null
  }

  useEffect(() => {
    let cancelled = false
    function handleUnauthorized() {
      setUser(null)
    }

    async function loadSession() {
      try {
        const response = await getSession()
        if (cancelled) {
          return
        }

        if (response.success && response.data) {
          setUser(response.data.user)
        } else {
          setUser(null)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadSession()
    window.addEventListener('openproof:unauthorized', handleUnauthorized)

    return () => {
      cancelled = true
      window.removeEventListener('openproof:unauthorized', handleUnauthorized)
    }
  }, [])

  async function loginWithPassword(email: string, password: string) {
    const response = await login(email, password)
    if (response.success && response.data) {
      setUser(response.data.user)
    }
    return response
  }

  async function signupWithPassword(email: string, password: string) {
    return signup(email, password)
  }

  async function logoutCurrentSession() {
    try {
      await logout()
    } finally {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        refreshSession,
        loginWithPassword,
        signupWithPassword,
        logoutCurrentSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}