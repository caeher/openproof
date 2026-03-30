'use client'

import Link from 'next/link'
import { FileText, ChevronRight, Calendar, Hash } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { TransactionStatus } from './transaction-status'
import { TimestampDisplay } from './timestamp-display'
import type { Document } from '@/types'

interface DocumentCardProps {
  document: Document
  className?: string
  href?: string
}

export function DocumentCard({ document, className, href }: DocumentCardProps) {
  const CardWrapper = href ? Link : 'div'
  
  return (
    <CardWrapper
      href={href || '#'}
      className={cn(
        'block group',
        href && 'cursor-pointer'
      )}
    >
      <Card className={cn(
        'transition-all duration-200',
        href && 'hover:border-muted-foreground/50 hover:shadow-md',
        className
      )}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* File icon */}
            <div className="p-2 rounded-md bg-secondary shrink-0">
              <FileText className="w-5 h-5 text-muted-foreground" />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-medium text-foreground truncate">
                  {document.filename}
                </h3>
                <TransactionStatus status={document.status} size="sm" />
              </div>
              
              {/* Hash preview */}
              <div className="flex items-center gap-1.5 mt-1.5">
                <Hash className="w-3 h-3 text-muted-foreground" />
                <code className="font-mono text-xs text-muted-foreground truncate">
                  {document.fileHash.slice(0, 16)}...
                </code>
              </div>
              
              {/* Timestamp */}
              <div className="flex items-center gap-1.5 mt-1.5">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                <TimestampDisplay 
                  timestamp={document.createdAt} 
                  variant="relative"
                  className="text-xs text-muted-foreground"
                />
              </div>
            </div>
            
            {/* Arrow indicator */}
            {href && (
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            )}
          </div>
        </CardContent>
      </Card>
    </CardWrapper>
  )
}
