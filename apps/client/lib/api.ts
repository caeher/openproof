// REST client for the OpenProof Rust API (proxied via Next.js rewrites from /api/v1 → backend)

import type {
  Document,
  RegisterDocumentRequest,
  RegisterDocumentResponse,
  VerifyDocumentResponse,
  BitcoinTransaction,
  ApiResponse,
} from '@/types'

const API_BASE = '/api/v1'

async function fetchJson<T>(
  path: string,
  init?: RequestInit
): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
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

/** List documents; pass `userId` to filter, or omit to fetch all (demo / admin). */
export async function getDocuments(userId?: string): Promise<ApiResponse<Document[]>> {
  const q = userId ? `?userId=${encodeURIComponent(userId)}` : ''
  return fetchJson<Document[]>(`/documents${q}`)
}

export async function getBitcoinTransaction(
  txid: string
): Promise<ApiResponse<BitcoinTransaction>> {
  return fetchJson<BitcoinTransaction>(
    `/transactions/${encodeURIComponent(txid)}`
  )
}

/** Resolve a registered document by its Bitcoin transaction id (if stored). */
export async function getDocumentByTransaction(
  txid: string
): Promise<ApiResponse<Document>> {
  return fetchJson<Document>(
    `/documents/by-transaction/${encodeURIComponent(txid)}`
  )
}

// Hash calculation utility (using Web Crypto API)
export async function calculateSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}
