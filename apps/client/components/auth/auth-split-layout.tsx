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

        <aside
          className="relative hidden overflow-hidden border-l border-border/70 lg:flex lg:min-h-screen lg:flex-col lg:justify-between lg:p-10 lg:text-white xl:p-14"
          style={{
            background: "linear-gradient(180deg, #4a8cf6 0%, #2d79e8 100%)",
          }}
        >
          {/* Soft grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:28px_28px]" />

          <div className="relative z-10">
            <Link
              href="/"
              className="inline-flex items-center font-medium text-white/95 transition-opacity hover:opacity-90"
            >
              <BrandLogo
                markClassName="size-11 rounded-2xl border border-white/20 bg-white/10 p-1.5 backdrop-blur-sm"
                labelClassName="text-2xl text-white"
              />
            </Link>
          </div>

          <div className="relative z-10 mt-auto max-w-lg space-y-6">
            <blockquote className="space-y-6">
              <div className="font-serif text-6xl leading-none text-white/25">
                "
              </div>
              <p className="text-2xl font-medium leading-[1.4] text-white/95">
                {sideTitle}
              </p>

              <footer className="flex items-center gap-4 text-sm font-medium text-white/70">
                <div className="h-px w-10 bg-white/30" />
                Caeher
              </footer>
            </blockquote>
          </div>
        </aside>
      </div>
    </div>
  );
}
