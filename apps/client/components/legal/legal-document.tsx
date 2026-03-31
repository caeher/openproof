import type { ReactNode } from 'react'
import { CalendarDays, FileLock2, ShieldCheck } from 'lucide-react'

import { SiteShell } from '@/components/layout'

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
    <SiteShell>
      <div className="container py-8 md:py-12">
        <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
          <aside className="space-y-8 lg:sticky lg:top-24">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <FileLock2 className="size-4 text-muted-foreground" />
                {badge}
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <CalendarDays className="size-4 text-muted-foreground" />
                Vigencia
              </div>
              <p className="text-sm leading-7 text-muted-foreground">{updatedAt}</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <ShieldCheck className="size-4 text-muted-foreground" />
                Puntos clave
              </div>
              <ul className="space-y-3 border-l border-border/80 pl-4">
                {highlights.map((highlight) => (
                  <li key={highlight} className="text-sm leading-7 text-muted-foreground">
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <article className="overflow-hidden lg:-my-12 lg:pb-12 border border-border/80 bg-card shadow-[0_18px_70px_rgba(15,23,42,0.05)] dark:shadow-[0_28px_90px_rgba(2,6,23,0.35)]">
            <header className="border-b border-border/70 bg-[linear-gradient(180deg,rgba(248,250,252,0.92)_0%,rgba(255,255,255,0.86)_100%)] px-6 py-8 md:px-10 md:py-12 dark:bg-[linear-gradient(180deg,rgba(18,18,18,0.96)_0%,rgba(12,12,12,0.92)_100%)]">
              <h1 className="mt-6 max-w-4xl font-serif text-4xl leading-tight tracking-tight text-foreground md:text-5xl">
                {title}
              </h1>
              <p className="mt-6 max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
                {summary}
              </p>
            </header>

            <div className="px-6 py-8 md:px-10 md:py-12">
              {sections.map((section, index) => (
                <section
                  key={section.title}
                  className={index === 0 ? '' : 'border-t border-border/70 pt-10 mt-10'}
                >
                  <h2 className="font-serif text-2xl leading-tight tracking-tight text-foreground md:text-3xl">
                    {section.title}
                  </h2>
                  <div className="mt-5 space-y-5">
                    {section.body.map((paragraph) => (
                      <p key={paragraph} className="text-[15px] leading-8 text-muted-foreground md:text-[17px]">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  {section.highlights && section.highlights.length > 0 ? (
                    <div className="mt-7 border-l-2 border-accent/45 pl-5 space-y-3">
                      {section.highlights.map((item) => (
                        <p key={item} className="text-sm leading-7 text-foreground/90 md:text-base">
                          {item}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </section>
              ))}

              {footerNote ? (
                <footer className="mt-10 border-t border-border/70 pt-8 text-sm leading-8 text-muted-foreground md:text-base">
                  {footerNote}
                </footer>
              ) : null}
            </div>
          </article>
        </div>
      </div>
    </SiteShell>
  )
}