'use client'

import { useState } from 'react'
import { Copy, Check, Hash } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface HashPreviewProps {
  hash: string
  label?: string
  truncate?: boolean
  showCopy?: boolean
  className?: string
  variant?: 'default' | 'compact' | 'large'
}

export function HashPreview({
  hash,
  label = 'SHA-256 Hash',
  truncate = false,
  showCopy = true,
  className,
  variant = 'default',
}: HashPreviewProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(hash)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const displayHash = truncate
    ? `${hash.slice(0, 8)}...${hash.slice(-8)}`
    : hash

  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleCopy}
              className={cn(
                'inline-flex items-center gap-1.5 px-2 py-1',
                'font-mono text-xs bg-secondary rounded-md',
                'hover:bg-secondary/80 transition-colors',
                className
              )}
            >
              <Hash className="w-3 h-3 text-muted-foreground" />
              <span className="text-foreground">{displayHash}</span>
              {showCopy && (
                copied ? (
                  <Check className="w-3 h-3 text-accent" />
                ) : (
                  <Copy className="w-3 h-3 text-muted-foreground" />
                )
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="font-mono text-xs break-all">{hash}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (variant === 'large') {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">{label}</span>
          {showCopy && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8 px-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1 text-accent" />
                  <span className="text-xs">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  <span className="text-xs">Copiar</span>
                </>
              )}
            </Button>
          )}
        </div>
        <div className="p-4 rounded-lg bg-secondary/50 border border-border">
          <code className="font-mono text-sm text-foreground break-all leading-relaxed">
            {hash}
          </code>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0 p-2 rounded-md bg-secondary/50 border border-border">
          <code className="font-mono text-xs text-foreground break-all">
            {truncate ? displayHash : hash}
          </code>
        </div>
        {showCopy && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleCopy}
            className="shrink-0"
          >
            {copied ? (
              <Check className="w-4 h-4 text-accent" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            <span className="sr-only">Copiar hash</span>
          </Button>
        )}
      </div>
    </div>
  )
}
