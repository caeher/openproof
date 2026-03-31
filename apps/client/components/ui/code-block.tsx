import { cache } from 'react'
import { codeToHtml } from 'shiki'

import { cn } from '@/lib/utils'

type CodeLanguage = 'bash' | 'javascript' | 'json' | 'python' | 'rust' | 'typescript'

interface CodeBlockProps {
  code: string
  language: CodeLanguage
  title?: string
  className?: string
}

const renderCode = cache(async (code: string, language: CodeLanguage, theme: string) => {
  return codeToHtml(code, {
    lang: language,
    theme,
  })
})

export async function CodeBlock({ code, language, title, className }: CodeBlockProps) {
  const [lightHtml, darkHtml] = await Promise.all([
    renderCode(code, language, 'github-light'),
    renderCode(code, language, 'github-dark'),
  ])

  return (
    <div className={cn('overflow-hidden rounded-2xl border border-border bg-card', className)}>
      {title ? (
        <div className="border-b border-border bg-secondary/50 px-4 py-3 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {title}
        </div>
      ) : null}
      <div className="dark:hidden [&_code]:font-mono [&_pre]:!m-0 [&_pre]:overflow-x-auto [&_pre]:bg-transparent [&_pre]:p-4 [&_pre]:text-sm [&_pre]:leading-7">
        <div dangerouslySetInnerHTML={{ __html: lightHtml }} />
      </div>
      <div className="hidden dark:block [&_code]:font-mono [&_pre]:!m-0 [&_pre]:overflow-x-auto [&_pre]:bg-transparent [&_pre]:p-4 [&_pre]:text-sm [&_pre]:leading-7">
        <div dangerouslySetInnerHTML={{ __html: darkHtml }} />
      </div>
    </div>
  )
}