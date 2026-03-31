import type { ReactNode } from 'react'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { ArrowLeft } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface MarketingStat {
  value: string
  label: string
  description?: string
}

export interface MarketingCardItem {
  icon: LucideIcon
  title: string
  description: string
  eyebrow?: string
}

interface PageIntroProps {
  title: string
  description: string
  badge?: string
  badgeIcon?: LucideIcon
  actions?: ReactNode
  backHref?: string
  backLabel?: string
  align?: 'left' | 'center'
  className?: string
}

interface SectionHeadingProps {
  title: string
  description?: string
  eyebrow?: string
  align?: 'left' | 'center'
  className?: string
}

interface StatGridProps {
  items: MarketingStat[]
  className?: string
}

interface IconCardGridProps {
  items: MarketingCardItem[]
  className?: string
  columns?: '2' | '3' | '4'
}

export function PageIntro({
  title,
  description,
  badge,
  badgeIcon: BadgeIcon,
  actions,
  backHref,
  backLabel,
  align = 'left',
  className,
}: PageIntroProps) {
  const isCentered = align === 'center'

  return (
    <div className={cn('space-y-6', isCentered && 'text-center', className)}>
      {backHref && backLabel ? (
        <Link
          href={backHref}
          className={cn(
            'inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors',
            isCentered && 'justify-center'
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
      ) : null}

      <div className={cn('space-y-5', isCentered && 'mx-auto max-w-3xl')}>
        {badge ? (
          <div
            className={cn(
              'inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1.5 text-sm font-medium text-primary',
              isCentered && 'mx-auto'
            )}
          >
            {BadgeIcon ? <BadgeIcon className="h-4 w-4" /> : null}
            {badge}
          </div>
        ) : null}

        <div className="space-y-4">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-foreground md:text-5xl">
            {title}
          </h1>
          <p className="max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
            {description}
          </p>
        </div>

        {actions ? (
          <div
            className={cn(
              'flex flex-col gap-3 sm:flex-row',
              isCentered && 'justify-center'
            )}
          >
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function SectionHeading({
  title,
  description,
  eyebrow,
  align = 'left',
  className,
}: SectionHeadingProps) {
  const isCentered = align === 'center'

  return (
    <div className={cn('space-y-3', isCentered && 'mx-auto max-w-3xl text-center', className)}>
      {eyebrow ? (
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
        {title}
      </h2>
      {description ? (
        <p className="text-base leading-8 text-muted-foreground md:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  )
}

export function StatGrid({ items, className }: StatGridProps) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-4', className)}>
      {items.map((item) => (
        <Card key={`${item.value}-${item.label}`} className="border-border/70 bg-card/80 shadow-none">
          <CardContent className="space-y-2 p-6">
            <p className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              {item.value}
            </p>
            <p className="text-sm font-medium text-foreground">{item.label}</p>
            {item.description ? (
              <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function IconCardGrid({
  items,
  className,
  columns = '3',
}: IconCardGridProps) {
  const columnClassName =
    columns === '2'
      ? 'md:grid-cols-2'
      : columns === '4'
        ? 'sm:grid-cols-2 xl:grid-cols-4'
        : 'md:grid-cols-2 xl:grid-cols-3'

  return (
    <div className={cn('grid gap-5', columnClassName, className)}>
      {items.map((item) => {
        const Icon = item.icon
        return (
          <Card key={item.title} className="border-border/70 bg-card/85 shadow-none">
            <CardContent className="space-y-4 p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                {item.eyebrow ? (
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    {item.eyebrow}
                  </p>
                ) : null}
                <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm leading-7 text-muted-foreground">{item.description}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}