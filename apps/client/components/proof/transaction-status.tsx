'use client'

import { CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DocumentStatus } from '@/types'

interface TransactionStatusProps {
  status: DocumentStatus
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const statusConfig: Record<
  DocumentStatus,
  {
    icon: React.ElementType
    label: string
    color: string
    bgColor: string
  }
> = {
  pending: {
    icon: Clock,
    label: 'Pendiente',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
  processing: {
    icon: Loader2,
    label: 'Procesando',
    color: 'text-warning-foreground',
    bgColor: 'bg-warning/10',
  },
  confirmed: {
    icon: CheckCircle2,
    label: 'Confirmado',
    color: 'text-accent',
    bgColor: 'bg-accent/10',
  },
  failed: {
    icon: AlertCircle,
    label: 'Fallido',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
  },
}

const sizeConfig = {
  sm: {
    icon: 'w-3 h-3',
    text: 'text-xs',
    padding: 'px-2 py-0.5',
    gap: 'gap-1',
  },
  md: {
    icon: 'w-4 h-4',
    text: 'text-sm',
    padding: 'px-2.5 py-1',
    gap: 'gap-1.5',
  },
  lg: {
    icon: 'w-5 h-5',
    text: 'text-base',
    padding: 'px-3 py-1.5',
    gap: 'gap-2',
  },
}

export function TransactionStatus({
  status,
  className,
  showLabel = true,
  size = 'md',
}: TransactionStatusProps) {
  const config = statusConfig[status]
  const sizes = sizeConfig[size]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full',
        sizes.padding,
        sizes.gap,
        config.bgColor,
        className
      )}
    >
      <Icon
        className={cn(
          sizes.icon,
          config.color,
          status === 'processing' && 'animate-spin'
        )}
      />
      {showLabel && (
        <span className={cn(sizes.text, 'font-medium', config.color)}>
          {config.label}
        </span>
      )}
    </div>
  )
}
