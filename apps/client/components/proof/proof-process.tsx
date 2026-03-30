'use client'

import { FileText, Hash, Blocks, Clock, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProofProcessProps {
  className?: string
  variant?: 'horizontal' | 'vertical'
  currentStep?: number
}

const steps = [
  {
    icon: FileText,
    title: 'Documento',
    description: 'Selecciona tu archivo',
  },
  {
    icon: Hash,
    title: 'Hash',
    description: 'Se genera SHA-256',
  },
  {
    icon: Blocks,
    title: 'Blockchain',
    description: 'Registro en Bitcoin',
  },
  {
    icon: Clock,
    title: 'Timestamp',
    description: 'Prueba de existencia',
  },
]

export function ProofProcess({
  className,
  variant = 'horizontal',
  currentStep,
}: ProofProcessProps) {
  if (variant === 'vertical') {
    return (
      <div className={cn('space-y-4', className)}>
        {steps.map((step, index) => {
          const Icon = step.icon
          const isActive = currentStep !== undefined && index <= currentStep
          const isCurrent = currentStep === index

          return (
            <div key={step.title} className="flex items-start gap-4">
              <div className="relative flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    'transition-colors duration-300',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-secondary text-muted-foreground'
                  )}
                >
                  {isActive && index < (currentStep ?? 0) ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'w-0.5 h-12 mt-2',
                      'transition-colors duration-300',
                      isActive && index < (currentStep ?? 0)
                        ? 'bg-accent'
                        : 'bg-border'
                    )}
                  />
                )}
              </div>
              <div className={cn('pt-2', isCurrent && 'animate-pulse')}>
                <h4 className="text-sm font-medium text-foreground">
                  {step.title}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isActive = currentStep !== undefined && index <= currentStep
          const isCurrent = currentStep === index

          return (
            <div
              key={step.title}
              className={cn(
                'flex flex-col items-center flex-1',
                index < steps.length - 1 && 'relative'
              )}
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'absolute top-5 left-1/2 w-full h-0.5',
                    'transition-colors duration-300',
                    isActive && index < (currentStep ?? 0)
                      ? 'bg-accent'
                      : 'bg-border'
                  )}
                />
              )}

              {/* Icon */}
              <div
                className={cn(
                  'relative z-10 w-10 h-10 rounded-full flex items-center justify-center',
                  'transition-all duration-300',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-secondary text-muted-foreground',
                  isCurrent && 'ring-4 ring-accent/20'
                )}
              >
                {isActive && index < (currentStep ?? 0) ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>

              {/* Label */}
              <div className="mt-2 text-center">
                <h4
                  className={cn(
                    'text-xs font-medium',
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </h4>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {step.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
