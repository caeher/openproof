import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, CheckCircle2, Shield } from "lucide-react";

import { BrandLogo } from "@/components/layout/brand-logo";
import { cn } from "@/lib/utils";

interface AuthSplitLayoutProps {
  badge: string;
  title: string;
  description: string;
  backHref: string;
  backLabel: string;
  sideTitle: string;
  sideDescription: string;
  sideStats?: string[];
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
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
          <div className={cn("w-full max-w-xl", className)}>
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              {backLabel}
            </Link>

            <div className="mt-6 space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                {title}
              </h1>
              <p className="max-w-xl text-base leading-7 text-muted-foreground">
                {description}
              </p>
            </div>

            <div className="mt-10">{children}</div>

            {footer ? (
              <div className="mt-8 text-sm text-muted-foreground">{footer}</div>
            ) : null}
          </div>
        </section>

        <aside className="relative hidden overflow-hidden border-l border-border/70 bg-secondary/30 dark:bg-secondary/10 lg:flex lg:min-h-screen lg:flex-col lg:justify-between lg:p-10 xl:p-14">
          {/* Soft grid pattern matching theme */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--foreground))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground))_1px,transparent_1px)] bg-[size:28px_28px] opacity-[0.03] dark:opacity-[0.02]" />

          <div className="relative z-10">
            <Link
              href="/"
              className="inline-flex items-center font-medium transition-opacity hover:opacity-80"
            >
              {/* Centramos explícitamente el icono inside the mark to ensure correct proportions */}
              <BrandLogo
                markClassName="flex text-2xl items-center justify-center w-10 h-10 rounded-xl"
                labelClassName="text-2xl text-foreground"
              />
            </Link>
          </div>

          <div className="relative z-10 mt-auto max-w-lg space-y-6">
            <blockquote className="space-y-6">
              <div className="font-serif text-6xl leading-none text-muted-foreground/40">
                "
              </div>
              <p className="text-2xl font-medium leading-[1.4] text-foreground/90">
                {sideTitle}
              </p>

              <footer className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
                <div className="h-px w-10 bg-border" />
                Caeher
              </footer>
            </blockquote>
          </div>
        </aside>
      </div>
    </div>
  );
}
