// Domain types for Proof of Existence platform

export interface Document {
  id: string
  fileHash: string
  filename: string
  contentType?: string
  fileSizeBytes?: number
  metadata?: DocumentMetadata
  transactionId?: string
  fileUrl?: string
  publicFileUrl?: string
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
  filename: string
  contentType?: string
  fileSizeBytes?: number
  transactionId?: string
  publicProofPath?: string
  publicFileUrl?: string
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
  name: string
  email: string
  role: string
  emailVerified: boolean
  avatarUrl?: string
  createdAt: string
}

export type User = AuthUser

export type AuthState =
  | 'anonymous'
  | 'authenticated_unverified'
  | 'authenticated_verified'
  | 'authenticated_admin'

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
  priceSats: number
  credits: number
}

export interface PaymentIntent {
  id: string
  packageId: string
  packageCode: string
  packageName: string
  amountSats: number
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
  creditPriceSats: number
  documentRegistrationCreditCost: number
}

export interface AccountProfile {
  user: AuthUser
  creditAccount: CreditAccountSummary
  activeApiKeys: number
  environment: string
}

export interface AdminStats {
  totalUsers: number
  verifiedUsers: number
  adminUsers: number
  totalCreditBalance: number
  totalDocuments: number
  pendingDocuments: number
  processingDocuments: number
  confirmedDocuments: number
  failedDocuments: number
  pendingPaymentIntents: number
  stalePendingPaymentIntents: number
  failedWebhookEvents: number
}

export interface AdminWallet {
  walletName: string
  loaded: boolean
  primaryAddress: string
  balanceSats: number
  confirmedBalanceSats: number
  unconfirmedBalanceSats: number
  txCount: number
  network: string
}

export interface AdminPricing {
  creditPriceSats: number
  documentRegistrationCreditCost: number
}

export interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  emailVerifiedAt?: string
  balanceCredits: number
  createdAt: string
  updatedAt: string
}

export interface AdminDocument {
  id: string
  userId: string
  userEmail: string
  filename: string
  status: string
  transactionId?: string
  blockHeight?: number
  confirmations?: number
  failureReason?: string
  createdAt: string
  updatedAt: string
}

export interface CreditLedgerEntry {
  id: string
  userId: string
  userEmail: string
  paymentIntentId?: string
  kind: string
  deltaCredits: number
  balanceAfterCredits: number
  description?: string
  referenceType?: string
  referenceId?: string
  createdAt: string
}

export interface AdminPaymentIntent {
  id: string
  userId: string
  userEmail: string
  packageCode: string
  packageName: string
  amountSats: number
  credits: number
  status: string
  blinkInvoiceStatus: string
  paymentHash?: string
  expiresAt?: string
  paidAt?: string
  createdAt: string
  updatedAt: string
}

export interface WebhookEvent {
  id: string
  webhookMessageId?: string
  eventType: string
  paymentHash?: string
  processedAt?: string
  processingError?: string
  createdAt: string
}

export interface AuditEvent {
  id: string
  actorUserId?: string
  actorEmail?: string
  actorRole?: string
  action: string
  targetType?: string
  targetId?: string
  status: string
  message?: string
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface AdminOverviewResponse {
  environment: string
  stats: AdminStats
  wallet: AdminWallet
  pricing: AdminPricing
  alerts: string[]
  users: AdminUser[]
  documents: AdminDocument[]
  ledger: CreditLedgerEntry[]
  payments: AdminPaymentIntent[]
  webhookEvents: WebhookEvent[]
  auditEvents: AuditEvent[]
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  statusCode?: number
}

export interface RegisterDocumentRequest {
  fileHash: string
  filename: string
  metadata?: DocumentMetadata
}

export interface RegisterDocumentResponse {
  documentId: string
  fileHash: string
  /** Present after the outbox worker broadcasts the OP_RETURN tx. */
  transactionId?: string
  fileUrl?: string
  status: DocumentStatus
  createdAt: string
}

export interface VerifyDocumentRequest {
  fileHash: string
}

export interface VerifyDocumentResponse {
  exists: boolean
  transactionId?: string
  publicProofPath?: string
  blockHeight?: number
  timestamp?: string
  confirmations?: number
}

export interface SessionResponse {
  user: AuthUser
}

export interface UpdateAvatarResponse {
  message: string
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

export interface ResendVerificationResponse {
  message: string
  devVerificationToken?: string
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
