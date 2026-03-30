// Domain types for Proof of Existence platform

export interface Document {
  id: string
  fileHash: string
  filename: string
  metadata?: DocumentMetadata
  userId: string
  transactionId?: string
  blockHeight?: number
  timestamp?: string
  confirmations?: number
  status: DocumentStatus
  createdAt: string
  updatedAt: string
}

export interface DocumentMetadata {
  description?: string
  tags?: string[]
  fileSize?: number
  fileType?: string
}

export type DocumentStatus = 
  | 'pending' 
  | 'processing' 
  | 'confirmed' 
  | 'failed'

export interface VerificationResult {
  exists: boolean
  document?: Document
  transactionId?: string
  blockHeight?: number
  timestamp?: string
  confirmations?: number
}

export interface BitcoinTransaction {
  txid: string
  blockHeight: number
  blockHash: string
  timestamp: string
  confirmations: number
  fee: number
  inputs: TxInput[]
  outputs: TxOutput[]
}

export interface TxInput {
  address: string
  value: number
}

export interface TxOutput {
  address: string
  value: number
  opReturn?: string
}

export interface User {
  id: string
  email: string
  name?: string
  createdAt: string
  documentsCount: number
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface RegisterDocumentRequest {
  fileHash: string
  filename: string
  metadata?: DocumentMetadata
  userId: string
}

export interface RegisterDocumentResponse {
  documentId: string
  /** Present after the outbox worker broadcasts the OP_RETURN tx. */
  transactionId?: string
  status: DocumentStatus
  createdAt: string
}

export interface VerifyDocumentRequest {
  fileHash: string
}

export interface VerifyDocumentResponse {
  exists: boolean
  transactionId?: string
  blockHeight?: number
  timestamp?: string
  confirmations?: number
}

// UI State types
export interface UploadState {
  file: File | null
  hash: string | null
  isHashing: boolean
  isUploading: boolean
  error: string | null
}

export interface VerificationState {
  isVerifying: boolean
  result: VerificationResult | null
  error: string | null
}
