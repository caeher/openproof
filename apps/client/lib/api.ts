// REST client for the OpenProof Rust API (proxied via Next.js rewrites from /api/v1 -> backend)

import type {
  ApiResponse,
  BitcoinTransaction,
  Document,
  ForgotPasswordResponse,
  PublicDocumentProof,
  RegisterDocumentRequest,
  RegisterDocumentResponse,
  SessionResponse,
  SignupResponse,
  StatusResponse,
  VerifyDocumentResponse,
} from '@/types'

const API_BASE = '/api/v1'

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
  const json = (await res.json()) as ApiResponse<T>
  return json
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

export async function calculateSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('')
  return hashHex
}