'use client'

import { ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TransactionExplorerLinkProps {
  txid: string
  className?: string
  variant?: 'button' | 'link' | 'dropdown'
}

const explorers = [
  {
    name: 'Mempool.space',
    url: (txid: string) => `https://mempool.space/tx/${txid}`,
    icon: '🔍',
  },
  {
    name: 'Blockstream',
    url: (txid: string) => `https://blockstream.info/tx/${txid}`,
    icon: '⛓️',
  },
  {
    name: 'Blockchain.com',
    url: (txid: string) => `https://www.blockchain.com/btc/tx/${txid}`,
    icon: '🌐',
  },
]

export function TransactionExplorerLink({
  txid,
  className,
  variant = 'button',
}: TransactionExplorerLinkProps) {
  const defaultExplorer = explorers[0]

  if (variant === 'link') {
    return (
      <a
        href={defaultExplorer.url(txid)}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors',
          className
        )}
      >
        Ver en explorador
        <ExternalLink className="w-3 h-3" />
      </a>
    )
  }

  if (variant === 'dropdown') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={cn(className)}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Ver en explorador
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {explorers.map((explorer) => (
            <DropdownMenuItem key={explorer.name} asChild>
              <a
                href={explorer.url(txid)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <span>{explorer.icon}</span>
                <span>{explorer.name}</span>
                <ExternalLink className="w-3 h-3 ml-auto" />
              </a>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <Button
      variant="outline"
      size="icon"
      asChild
      className={cn(className)}
    >
      <a
        href={defaultExplorer.url(txid)}
        target="_blank"
        rel="noopener noreferrer"
      >
        <ExternalLink className="w-4 h-4" />
        <span className="sr-only">Ver transacción en {defaultExplorer.name}</span>
      </a>
    </Button>
  )
}
