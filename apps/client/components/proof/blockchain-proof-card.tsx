'use client'

import { ExternalLink, Shield, Clock, Blocks, Hash, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { HashPreview } from './hash-preview'
import { TransactionExplorerLink } from './transaction-explorer-link'
import { TimestampDisplay } from './timestamp-display'

interface BlockchainProofCardProps {
  fileHash: string
  transactionId: string
  blockHeight: number
  timestamp: string
  confirmations: number
  className?: string
}

export function BlockchainProofCard({
  fileHash,
  transactionId,
  blockHeight,
  timestamp,
  confirmations,
  className,
}: BlockchainProofCardProps) {
  const isFullyConfirmed = confirmations >= 6

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-accent/10">
              <Shield className="w-5 h-5 text-accent" />
            </div>
            <CardTitle className="text-lg">Prueba Blockchain</CardTitle>
          </div>
          <Badge 
            variant={isFullyConfirmed ? 'default' : 'secondary'}
            className={cn(
              isFullyConfirmed && 'bg-accent text-accent-foreground'
            )}
          >
            {isFullyConfirmed ? (
              <>
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Confirmado
              </>
            ) : (
              `${confirmations} confirmaciones`
            )}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Document Hash */}
        <HashPreview
          hash={fileHash}
          label="Hash del documento"
          variant="default"
          truncate
        />

        {/* Transaction ID */}
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Transaction ID
          </span>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-2 font-mono text-xs bg-secondary/50 border border-border rounded-md truncate">
              {transactionId}
            </code>
            <TransactionExplorerLink txid={transactionId} />
          </div>
        </div>

        {/* Grid de información */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-3 rounded-lg bg-secondary/30 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <Blocks className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Bloque</span>
            </div>
            <p className="font-mono text-sm font-medium text-foreground">
              #{blockHeight.toLocaleString()}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-secondary/30 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Timestamp</span>
            </div>
            <TimestampDisplay 
              timestamp={timestamp} 
              variant="compact"
            />
          </div>
        </div>

        {/* Confirmations bar */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Confirmaciones</span>
            <span className="font-mono font-medium text-foreground">
              {confirmations.toLocaleString()}
            </span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                isFullyConfirmed ? 'bg-accent' : 'bg-muted-foreground'
              )}
              style={{
                width: `${Math.min((confirmations / 6) * 100, 100)}%`,
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {isFullyConfirmed
              ? 'Registro completamente confirmado e inmutable'
              : `${6 - confirmations} confirmaciones restantes para seguridad total`}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
