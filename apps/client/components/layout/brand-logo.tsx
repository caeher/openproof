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
     <div className="p-1.5 rounded-md bg-foreground">
        <Shield className="w-5 h-5 text-background" />
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
    <span className={cn('flex items-center gap-3', className)}>
      <BrandMark className={markClassName} />
      {hideLabel ? null : (
        <span className={cn('text-lg font-semibold tracking-tight', labelClassName)}>
          OpenProof
        </span>
      )}
    </span>
  )
}