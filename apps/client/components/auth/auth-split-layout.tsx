import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowLeft, CheckCircle2, Shield } from 'lucide-react'

import { cn } from '@/lib/utils'

interface AuthSplitLayoutProps {
  badge: string
  title: string
  description: string
  backHref: string
  backLabel: string
  sideTitle: string
  sideDescription: string
  sideStats?: string[]
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function AuthSplitLayout({
  badge,
  title,
  description,
  backHref,
  backLabel,
  sideTitle,
  sideDescription,
  sideStats = [],
  children,
  footer,
  className,
}: AuthSplitLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(440px,50%)]">
        <section className="flex items-center justify-center p-6 sm:px-8 lg:px-12 xl:px-16">
          <div className={cn('w-full max-w-xl', className)}>
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              {backLabel}
            </Link>

            <div className="mt-6 space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                {title}
              </h1>
              <p className="max-w-xl text-base leading-7 text-muted-foreground">
                {description}
              </p>
            </div>

            <div className="mt-10">{children}</div>

            {footer ? <div className="mt-8 text-sm text-muted-foreground">{footer}</div> : null}
          </div>
        </section>

        <aside className="relative hidden overflow-hidden border-l border-border/70 lg:flex lg:min-h-screen lg:flex-col lg:justify-between lg:p-10 lg:text-white xl:p-14" style={{ background: 'linear-gradient(180deg, #4a8cf6 0%, #2d79e8 100%)' }}>
          {/* Soft grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:28px_28px]" />
          
          <div className="relative z-10">
            <Link
              href="/"
              className="flex items-center gap-3 font-medium text-white/95 transition-opacity hover:opacity-90"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/20 bg-white/15 backdrop-blur-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 40 42"
                  className="size-7 fill-current"
                >
                  <path
                    fill="currentColor"
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M17.2 5.633 8.6.855 0 5.633v26.51l16.2 9 16.2-9v-8.442l7.6-4.223V9.856l-8.6-4.777-8.6 4.777V18.3l-5.6 3.111V5.633ZM38 18.301l-5.6 3.11v-6.157l5.6-3.11V18.3Zm-1.06-7.856-5.54 3.078-5.54-3.079 5.54-3.078 5.54 3.079ZM24.8 18.3v-6.157l5.6 3.111v6.158L24.8 18.3Zm-1 1.732 5.54 3.078-13.14 7.302-5.54-3.078 13.14-7.3v-.002Zm-16.2 7.89 7.6 4.222V38.3L2 30.966V7.92l5.6 3.111v16.892ZM8.6 9.3 3.06 6.222 8.6 3.143l5.54 3.08L8.6 9.3Zm21.8 15.51-13.2 7.334V38.3l13.2-7.334v-6.156ZM9.6 11.034l5.6-3.11v14.6l-5.6 3.11v-14.6Z"
                  />
                </svg>
              </div>
              <span className="text-2xl font-semibold tracking-tight">Laravel</span>
            </Link>
          </div>

          <div className="relative z-10 mt-auto max-w-lg space-y-8">
            <blockquote className="space-y-6">
              <div className="font-serif text-6xl leading-none text-white/25">"</div>
              <p className="text-2xl font-medium leading-[1.4] text-white/95">
                A production-ready foundation to build your next SaaS. Authentication,
                subscriptions, beautiful UI components—focus on what makes your product unique.
              </p>
              <footer className="flex items-center gap-4 text-sm font-medium text-white/70">
                <div className="h-px w-10 bg-white/30" />
                Laravel
              </footer>
            </blockquote>
          </div>
        </aside>
      </div>
    </div>
  )
}