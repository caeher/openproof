export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  statusCode?: number
}

export interface SessionUser {
  id: string
  name: string
  email: string
  role: string
  emailVerified: boolean
  avatarUrl?: string
  createdAt: string
}

export interface SessionResponse {
  user: SessionUser
}

export interface AdminSetupStatusResponse {
  adminExists: boolean
  registrationEnabled: boolean
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
  payments: AdminPaymentIntent[]
  auditEvents: AuditEvent[]
}