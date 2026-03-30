'use client'

import { cn } from '@/lib/utils'

interface TimestampDisplayProps {
  timestamp: string
  variant?: 'full' | 'compact' | 'relative' | 'date-only'
  className?: string
}

export function TimestampDisplay({
  timestamp,
  variant = 'full',
  className,
}: TimestampDisplayProps) {
  const date = new Date(timestamp)

  const formatRelative = (date: Date): string => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return 'hace unos segundos'
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) {
      return `hace ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`
    }

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
      return `hace ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`
    }

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 30) {
      return `hace ${diffInDays} ${diffInDays === 1 ? 'día' : 'días'}`
    }

    const diffInMonths = Math.floor(diffInDays / 30)
    if (diffInMonths < 12) {
      return `hace ${diffInMonths} ${diffInMonths === 1 ? 'mes' : 'meses'}`
    }

    const diffInYears = Math.floor(diffInMonths / 12)
    return `hace ${diffInYears} ${diffInYears === 1 ? 'año' : 'años'}`
  }

  const formatFull = (date: Date): string => {
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    })
  }

  const formatCompact = (date: Date): string => {
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDateOnly = (date: Date): string => {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getFormattedDate = () => {
    switch (variant) {
      case 'relative':
        return formatRelative(date)
      case 'compact':
        return formatCompact(date)
      case 'date-only':
        return formatDateOnly(date)
      case 'full':
      default:
        return formatFull(date)
    }
  }

  return (
    <time
      dateTime={timestamp}
      className={cn(
        variant === 'compact' ? 'text-xs font-medium' : 'text-sm',
        'text-foreground',
        className
      )}
      title={formatFull(date)}
    >
      {getFormattedDate()}
    </time>
  )
}
