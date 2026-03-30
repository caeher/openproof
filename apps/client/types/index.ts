// Domain types for Proof of Existence platform

export interface Document {
  id: string
  fileHash: string
  filename: string
  metadata?: DocumentMetadata
  transactionId?: string
  blockHeight?: number
  timestamp?: string
  confirmations?: number
  status: DocumentStatus
  createdAt: string
  updatedAt: string
  failureReason?: string
}

export interface PublicDocumentProof {
  documentId: string
  fileHash: string
  transactionId?: string
  blockHeight?: number
  timestamp?: string
  confirmations?: number
  status: DocumentStatus
  createdAt: string
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
  document?: Document | PublicDocumentProof
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

export interface AuthUser {
  id: string
  email: string
  role: string
  emailVerified: boolean
  createdAt: string
}

export type User = AuthUser

export interface DeveloperApiKey {
  id: string
  name: string
  keyPrefix: string
  lastUsedAt?: string
  revokedAt?: string
  rotatedAt?: string
  createdAt: string
  updatedAt: string
}

export interface CreditAccountSummary {
  balanceCredits: number
  purchasedCredits: number
  consumedCredits: number
  updatedAt: string
}

export interface CreditPackage {
  id: string
  code: string
  name: string
  description?: string
  priceUsdCents: number
  credits: number
}

export interface PaymentIntent {
  id: string
  packageId: string
  packageCode: string
  packageName: string
  amountUsdCents: number
  credits: number
  status: string
  blinkInvoiceStatus: string
  paymentRequest?: string
  paymentHash?: string
  expiresAt?: string
  paidAt?: string
  createdAt: string
  updatedAt: string
}

export interface BillingOverviewResponse {
  account: CreditAccountSummary
  packages: CreditPackage[]
  paymentIntents: PaymentIntent[]
  documentRegistrationCreditCost: number
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

export interface SessionResponse {
  user: AuthUser
}

export interface SignupResponse {
  user: AuthUser
  emailVerificationRequired: boolean
  devVerificationToken?: string
}

export interface CreateApiKeyResponse {
  apiKey: DeveloperApiKey
  plainTextKey: string
}

export interface ForgotPasswordResponse {
  message: string
  devResetToken?: string
}

export interface StatusResponse {
  message: string
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
