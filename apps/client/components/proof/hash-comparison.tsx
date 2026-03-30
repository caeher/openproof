'use client'

import { Check, X, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface HashComparisonProps {
  originalHash: string
  verificationHash: string
  className?: string
}

export function HashComparison({
  originalHash,
  verificationHash,
  className,
}: HashComparisonProps) {
  const isMatch = originalHash.toLowerCase() === verificationHash.toLowerCase()

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Comparación de Hash</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Original hash */}
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Hash registrado
          </span>
          <div className="p-3 rounded-md bg-secondary/50 border border-border">
            <code className="font-mono text-xs text-foreground break-all">
              {originalHash}
            </code>
          </div>
        </div>

        {/* Arrow indicator */}
        <div className="flex justify-center">
          <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90" />
        </div>

        {/* Verification hash */}
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Hash del archivo verificado
          </span>
          <div className="p-3 rounded-md bg-secondary/50 border border-border">
            <code className="font-mono text-xs text-foreground break-all">
              {verificationHash}
            </code>
          </div>
        </div>

        {/* Result */}
        <div
          className={cn(
            'flex items-center justify-center gap-2 p-3 rounded-lg',
            isMatch
              ? 'bg-accent/10 text-accent'
              : 'bg-destructive/10 text-destructive'
          )}
        >
          {isMatch ? (
            <>
              <Check className="w-5 h-5" />
              <span className="text-sm font-medium">
                Los hashes coinciden - Documento verificado
              </span>
            </>
          ) : (
            <>
              <X className="w-5 h-5" />
              <span className="text-sm font-medium">
                Los hashes no coinciden - Documento diferente
              </span>
            </>
          )}
        </div>

        {/* Character by character comparison for mismatch */}
        {!isMatch && (
          <div className="pt-2">
            <p className="text-xs text-muted-foreground mb-2">
              Diferencias detectadas:
            </p>
            <div className="p-3 rounded-md bg-secondary/30 overflow-x-auto">
              <div className="font-mono text-xs flex flex-wrap">
                {originalHash.split('').map((char, index) => {
                  const matches =
                    char.toLowerCase() ===
                    verificationHash[index]?.toLowerCase()
                  return (
                    <span
                      key={index}
                      className={cn(
                        matches
                          ? 'text-muted-foreground'
                          : 'text-destructive bg-destructive/10 rounded px-0.5'
                      )}
                    >
                      {char}
                    </span>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
