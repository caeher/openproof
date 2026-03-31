import type { ReactNode } from 'react'
import { CalendarDays, FileLock2, ShieldCheck } from 'lucide-react'

import { Footer, Header, MobileNav } from '@/components/layout'

interface LegalSection {
  title: string
  body: string[]
  highlights?: string[]
}

interface LegalDocumentProps {
  badge: string
  title: string
  summary: string
  updatedAt: string
  highlights: string[]
  sections: LegalSection[]
  footerNote?: ReactNode
}

export function LegalDocument({
  badge,
  title,
  summary,
  updatedAt,
  highlights,
  sections,
  footerNote,
}: LegalDocumentProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pb-24 md:pb-0">
        <div className="page-frame">
          <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
            <aside className="space-y-4 lg:sticky lg:top-24">
              <div className="rounded-3xl border border-border bg-card p-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-foreground">
                  <FileLock2 className="size-4" />
                  {badge}
                </div>
                <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                  {title}
                </h1>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  {summary}
                </p>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <CalendarDays className="size-4 text-muted-foreground" />
                  Vigencia
                </div>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {updatedAt}
                </p>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <ShieldCheck className="size-4 text-muted-foreground" />
                  Puntos clave
                </div>
                <div className="mt-4 space-y-4">
                  {highlights.map((highlight) => (
                    <div key={highlight} className="rounded-2xl bg-secondary/50 px-4 py-4 text-sm leading-7 text-muted-foreground">
                      {highlight}
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            <article className="space-y-6">
              {sections.map((section) => (
                <section key={section.title} className="rounded-3xl border border-border bg-card p-6 md:p-8">
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                      {section.title}
                    </h2>
                    {section.body.map((paragraph) => (
                      <p key={paragraph} className="text-sm leading-8 text-muted-foreground md:text-base">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  {section.highlights && section.highlights.length > 0 ? (
                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      {section.highlights.map((item) => (
                        <div key={item} className="rounded-2xl border border-border bg-secondary/35 px-4 py-4 text-sm leading-7 text-foreground">
                          {item}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </section>
              ))}

              {footerNote ? (
                <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
                  <div className="text-sm leading-8 text-muted-foreground">{footerNote}</div>
                </section>
              ) : null}
            </article>
          </div>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  )
}