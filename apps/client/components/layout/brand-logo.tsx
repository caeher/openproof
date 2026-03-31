import { cn } from '@/lib/utils'
import { Shield } from 'lucide-react'

interface BrandMarkProps {
  className?: string
  alt?: string
}

interface BrandLogoProps {
  className?: string
  markClassName?: string
  labelClassName?: string
  hideLabel?: boolean
}

export function BrandMark({ className, alt = '' }: BrandMarkProps) {
  return (
    <div className={cn('p-1.5 rounded-lg bg-primary', className)}>
      <Shield className="w-5 h-5 text-primary-foreground" />
    </div>
  )
}

export function BrandLogo({
  className,
  markClassName,
  labelClassName,
  hideLabel = false,
}: BrandLogoProps) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <BrandMark className={markClassName} />
      {hideLabel ? null : (
        <span className={cn('text-lg font-semibold tracking-tight text-foreground', labelClassName)}>
          OpenProof
        </span>
      )}
    </span>
  )
}