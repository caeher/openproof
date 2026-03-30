'use client'

import { CheckCircle2, XCircle, Shield, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VerificationBadgeProps {
  verified: boolean
  pending?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'minimal' | 'detailed'
}

export function VerificationBadge({
  verified,
  pending = false,
  className,
  size = 'md',
  variant = 'default',
}: VerificationBadgeProps) {
  const sizeConfig = {
    sm: {
      icon: 'w-4 h-4',
      text: 'text-xs',
      padding: 'px-2 py-1',
    },
    md: {
      icon: 'w-5 h-5',
      text: 'text-sm',
      padding: 'px-3 py-1.5',
    },
    lg: {
      icon: 'w-6 h-6',
      text: 'text-base',
      padding: 'px-4 py-2',
    },
  }

  const sizes = sizeConfig[size]

  if (pending) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-full',
          'bg-warning/10 text-warning-foreground',
          sizes.padding,
          className
        )}
      >
        <AlertTriangle className={sizes.icon} />
        {variant !== 'minimal' && (
          <span className={cn(sizes.text, 'font-medium')}>Pendiente</span>
        )}
      </div>
    )
  }

  if (verified) {
    if (variant === 'detailed') {
      return (
        <div
          className={cn(
            'flex items-center gap-3 p-4 rounded-lg',
            'bg-accent/10 border border-accent/20',
            className
          )}
        >
          <div className="p-2 rounded-full bg-accent/20">
            <Shield className="w-6 h-6 text-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Documento Verificado
            </p>
            <p className="text-xs text-muted-foreground">
              Registrado en la blockchain de Bitcoin
            </p>
          </div>
        </div>
      )
    }

    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-full',
          'bg-accent/10 text-accent',
          sizes.padding,
          className
        )}
      >
        <CheckCircle2 className={sizes.icon} />
        {variant !== 'minimal' && (
          <span className={cn(sizes.text, 'font-medium')}>Verificado</span>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full',
        'bg-destructive/10 text-destructive',
        sizes.padding,
        className
      )}
    >
      <XCircle className={sizes.icon} />
      {variant !== 'minimal' && (
        <span className={cn(sizes.text, 'font-medium')}>No encontrado</span>
      )}
    </div>
  )
}
