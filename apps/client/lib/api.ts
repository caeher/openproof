// REST client for the OpenProof Rust API (proxied via Next.js rewrites from /api/v1 -> backend)

import type {
  AccountProfile,
  AdminOverviewResponse,
  AdminUser,
  ApiResponse,
  CreditLedgerEntry,
  BitcoinTransaction,
  BillingOverviewResponse,
  CreditPackage,
  CreateApiKeyResponse,
  DeveloperApiKey,
  Document,
  ForgotPasswordResponse,
  PublicDocumentProof,
  PaymentIntent,
  RegisterDocumentRequest,
  RegisterDocumentResponse,
  SessionResponse,
  SignupResponse,
  StatusResponse,
  VerifyDocumentResponse,
} from '@/types'

const API_BASE = '/api/v1'

function broadcastUnauthorized() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('openproof:unauthorized'))
  }
}

function defaultErrorMessage(statusCode: number, fallback: string, apiError?: string) {
  if (statusCode === 401) {
    return 'Tu sesión ya no es válida. Inicia sesión de nuevo.'
  }

  if (statusCode === 402) {
    return apiError || 'No tienes créditos suficientes para completar la operación.'
  }

  if (statusCode === 403) {
    if (apiError?.toLowerCase().includes('email verification')) {
      return 'Verifica tu correo antes de continuar.'
    }
    return apiError || 'No tienes permisos para realizar esta operación.'
  }

  if (statusCode === 429) {
    return 'Se alcanzó el límite de solicitudes. Espera un momento y vuelve a intentarlo.'
  }

  return apiError || fallback
}

export function getApiErrorMessage<T>(
  response: ApiResponse<T>,
  fallback: string
) {
  if (typeof response.statusCode === 'number') {
    return defaultErrorMessage(response.statusCode, fallback, response.error)
  }

  return response.error || fallback
}

async function fetchJson<T>(
  path: string,
  init?: RequestInit
): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  const contentType = res.headers.get('content-type') || ''
  const rawBody = contentType.includes('application/json')
    ? await res.json()
    : await res.text()

  if (res.status === 401) {
    broadcastUnauthorized()
  }

  if (typeof rawBody === 'object' && rawBody !== null && 'success' in rawBody) {
    return {
      ...(rawBody as ApiResponse<T>),
      statusCode: res.status,
    }
  }

  if (res.ok) {
    return {
      success: true,
      data: rawBody as T,
      statusCode: res.status,
    }
  }

  return {
    success: false,
    error:
      typeof rawBody === 'string' && rawBody.trim().length > 0
        ? rawBody
        : undefined,
    statusCode: res.status,
  }
}

export async function registerDocument(
  request: RegisterDocumentRequest
): Promise<ApiResponse<RegisterDocumentResponse>> {
  return fetchJson<RegisterDocumentResponse>('/documents', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export async function verifyDocument(
  fileHash: string
): Promise<ApiResponse<VerifyDocumentResponse>> {
  return fetchJson<VerifyDocumentResponse>('/documents/verify', {
    method: 'POST',
    body: JSON.stringify({ fileHash }),
  })
}

export async function getDocument(id: string): Promise<ApiResponse<Document>> {
  return fetchJson<Document>(`/documents/${encodeURIComponent(id)}`)
}

export async function getDocuments(): Promise<ApiResponse<Document[]>> {
  return fetchJson<Document[]>('/documents')
}

export async function getBitcoinTransaction(
  txid: string
): Promise<ApiResponse<BitcoinTransaction>> {
  return fetchJson<BitcoinTransaction>(
    `/transactions/${encodeURIComponent(txid)}`
  )
}

export async function getDocumentByTransaction(
  txid: string
): Promise<ApiResponse<PublicDocumentProof>> {
  return fetchJson<PublicDocumentProof>(
    `/documents/by-transaction/${encodeURIComponent(txid)}`
  )
}

export async function signup(
  email: string,
  password: string
): Promise<ApiResponse<SignupResponse>> {
  return fetchJson<SignupResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function login(
  email: string,
  password: string
): Promise<ApiResponse<SessionResponse>> {
  return fetchJson<SessionResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function logout(): Promise<ApiResponse<StatusResponse>> {
  return fetchJson<StatusResponse>('/auth/logout', {
    method: 'POST',
  })
}

export async function getSession(): Promise<ApiResponse<SessionResponse>> {
  return fetchJson<SessionResponse>('/auth/session', {
    cache: 'no-store',
  })
}

export async function verifyEmail(
  token: string
): Promise<ApiResponse<SessionResponse>> {
  return fetchJson<SessionResponse>('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
  })
}

export async function forgotPassword(
  email: string
): Promise<ApiResponse<ForgotPasswordResponse>> {
  return fetchJson<ForgotPasswordResponse>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function resetPassword(
  token: string,
  password: string
): Promise<ApiResponse<StatusResponse>> {
  return fetchJson<StatusResponse>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  })
}

export async function listApiKeys(): Promise<ApiResponse<DeveloperApiKey[]>> {
  return fetchJson<DeveloperApiKey[]>('/developers/api-keys', {
    cache: 'no-store',
  })
}

export async function createApiKey(
  name: string
): Promise<ApiResponse<CreateApiKeyResponse>> {
  return fetchJson<CreateApiKeyResponse>('/developers/api-keys', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export async function revokeApiKey(
  id: string
): Promise<ApiResponse<DeveloperApiKey>> {
  return fetchJson<DeveloperApiKey>(
    `/developers/api-keys/${encodeURIComponent(id)}/revoke`,
    {
      method: 'POST',
    }
  )
}

export async function rotateApiKey(
  id: string
): Promise<ApiResponse<CreateApiKeyResponse>> {
  return fetchJson<CreateApiKeyResponse>(
    `/developers/api-keys/${encodeURIComponent(id)}/rotate`,
    {
      method: 'POST',
    }
  )
}

export async function getBillingOverview(): Promise<ApiResponse<BillingOverviewResponse>> {
  return fetchJson<BillingOverviewResponse>('/billing/overview', {
    cache: 'no-store',
  })
}

export async function createBillingPaymentIntent(
  packageId: string
): Promise<ApiResponse<PaymentIntent>> {
  return fetchJson<PaymentIntent>('/billing/payment-intents', {
    method: 'POST',
    body: JSON.stringify({ packageId }),
  })
}

export async function reconcileBillingPaymentIntent(
  id: string
): Promise<ApiResponse<PaymentIntent>> {
  return fetchJson<PaymentIntent>(
    `/billing/payment-intents/${encodeURIComponent(id)}/reconcile`,
    {
      method: 'POST',
    }
  )
}

export async function getPricingPackages(): Promise<ApiResponse<CreditPackage[]>> {
  return fetchJson<CreditPackage[]>('/billing/packages', {
    cache: 'no-store',
  })
}

export async function getAccountProfile(): Promise<ApiResponse<AccountProfile>> {
  return fetchJson<AccountProfile>('/account/profile', {
    cache: 'no-store',
  })
}

export async function changeAccountPassword(
  currentPassword: string,
  newPassword: string
): Promise<ApiResponse<StatusResponse>> {
  return fetchJson<StatusResponse>('/account/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  })
}

export async function getAdminOverview(): Promise<ApiResponse<AdminOverviewResponse>> {
  return fetchJson<AdminOverviewResponse>('/admin/overview', {
    cache: 'no-store',
  })
}

export async function updateAdminUserRole(
  id: string,
  role: string
): Promise<ApiResponse<AdminUser>> {
  return fetchJson<AdminUser>(`/admin/users/${encodeURIComponent(id)}/role`, {
    method: 'POST',
    body: JSON.stringify({ role }),
  })
}

export async function adjustAdminCredits(
  userId: string,
  deltaCredits: number,
  reason: string
): Promise<ApiResponse<CreditLedgerEntry>> {
  return fetchJson<CreditLedgerEntry>('/admin/credits/adjust', {
    method: 'POST',
    body: JSON.stringify({ userId, deltaCredits, reason }),
  })
}

export async function calculateSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('')
  return hashHex
}