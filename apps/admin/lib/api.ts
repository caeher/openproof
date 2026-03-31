import type {
  AdminOverviewResponse,
  AdminSetupStatusResponse,
  ApiResponse,
  SessionResponse,
} from '@/types'

const API_BASE = '/api/v1'

function defaultErrorMessage(statusCode: number, fallback: string, apiError?: string) {
  if (statusCode === 401) {
    return 'Tu sesión ya no es válida. Inicia sesión de nuevo.'
  }

  if (statusCode === 403) {
    return apiError || 'No tienes permisos para ingresar a este panel.'
  }

  if (statusCode === 409) {
    return apiError || 'El setup inicial ya fue completado.'
  }

  return apiError || fallback
}

export function getApiErrorMessage<T>(response: ApiResponse<T>, fallback: string) {
  if (typeof response.statusCode === 'number') {
    return defaultErrorMessage(response.statusCode, fallback, response.error)
  }

  return response.error || fallback
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    cache: 'no-store',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  const contentType = response.headers.get('content-type') || ''
  const rawBody = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (typeof rawBody === 'object' && rawBody !== null && 'success' in rawBody) {
    return {
      ...(rawBody as ApiResponse<T>),
      statusCode: response.status,
    }
  }

  if (response.ok) {
    return {
      success: true,
      data: rawBody as T,
      statusCode: response.status,
    }
  }

  return {
    success: false,
    error: typeof rawBody === 'string' ? rawBody : undefined,
    statusCode: response.status,
  }
}

export function getSession() {
  return fetchJson<SessionResponse>('/auth/session')
}

export function login(email: string, password: string) {
  return fetchJson<SessionResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function logout() {
  return fetchJson<{ message: string }>('/auth/logout', {
    method: 'POST',
  })
}

export function getAdminSetupStatus() {
  return fetchJson<AdminSetupStatusResponse>('/admin/setup')
}

export function createInitialAdmin(name: string, email: string, password: string) {
  return fetchJson<SessionResponse>('/admin/setup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  })
}

export function getAdminOverview() {
  return fetchJson<AdminOverviewResponse>('/admin/overview')
}