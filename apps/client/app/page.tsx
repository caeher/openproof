'use client'

import Link from 'next/link'
import { ArrowRight, Shield, Lock, Clock, CheckCircle2, FileText, Hash, Blocks, Zap, Globe, Code, Sparkles } from 'lucide-react'

import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Header, Footer, MobileNav } from '@/components/layout'
import { buildVerifyEmailPath } from '@/lib/auth-routing'

const features = [
  {
    icon: Shield,
    title: 'Prueba inmutable',
    description: 'Una vez registrado en Bitcoin, el hash de tu documento no puede ser alterado ni eliminado.',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: Lock,
    title: 'Privacidad total',
    description: 'Tu archivo nunca sale de tu dispositivo. Solo se registra el hash criptográfico.',
    color: 'bg-accent/10 text-accent',
  },
  {
    icon: Clock,
    title: 'Timestamp verificable',
    description: 'Demuestra que tu documento existía en una fecha específica con certeza matemática.',
    color: 'bg-chart-4/15 text-chart-4',
  },
  {
    icon: Globe,
    title: 'Verificación pública',
    description: 'Cualquiera puede verificar la existencia de tu documento sin necesidad de cuenta.',
    color: 'bg-chart-1/10 text-chart-1',
  },
]

const useCases = [
  {
    title: 'Propiedad intelectual',
    description: 'Protege tus creaciones, diseños y obras originales con timestamp verificable.',
  },
  {
    title: 'Contratos y acuerdos',
    description: 'Demuestra la existencia de documentos legales en una fecha específica.',
  },
  {
    title: 'Investigación y datos',
    description: 'Registra datasets y resultados de investigación para prioridad científica.',
  },
  {
    title: 'Código y software',
    description: 'Prueba la existencia de código fuente y versiones de software.',
  },
]

const steps = [
  {
    number: '01',
    icon: FileText,
    title: 'Sube tu documento',
    description: 'Selecciona cualquier archivo desde tu dispositivo.',
  },
  {
    number: '02',
    icon: Hash,
    title: 'Se genera el hash',
    description: 'Calculamos el SHA-256 localmente en tu navegador.',
  },
  {
    number: '03',
    icon: Blocks,
    title: 'Registro en Bitcoin',
    description: 'El hash se ancla permanentemente en la blockchain.',
  },
  {
    number: '04',
    icon: CheckCircle2,
    title: 'Prueba verificable',
    description: 'Recibe tu comprobante con timestamp inmutable.',
  },
]

export default function LandingPage() {
  const { authState, isAuthenticated } = useAuth()
  const registerHref = !isAuthenticated
    ? '/login?next=%2Fregister'
    : authState === 'authenticated_unverified'
      ? buildVerifyEmailPath('/register')
      : '/register'

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Soft dot pattern */}
          <div className="absolute inset-0 -z-10" style={{
            backgroundImage: 'radial-gradient(circle, var(--border) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }} />

          <div className="container mx-auto px-4 pt-20 pb-24 md:pt-32 md:pb-40">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary mb-8">
                <Sparkles className="h-3.5 w-3.5" />
                Blockchain de Bitcoin
              </div>

              <h1 className="text-4xl md:text-6xl font-bold text-foreground tracking-tight text-balance leading-[1.1]">
                Prueba de existencia
                <span className="block text-primary mt-2">en Bitcoin</span>
              </h1>

              <p className="mt-8 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
                Demuestra que tu documento existía en una fecha específica.
                Registra el hash criptográfico en la blockchain de Bitcoin
                y obtén una prueba inmutable y verificable públicamente.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href={registerHref}>
                    Registrar documento
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                  <Link href="/verify">
                    Verificar documento
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Por qué usar OpenProof
              </h2>
              <p className="mt-4 text-muted-foreground max-w-lg mx-auto leading-relaxed">
                La forma más segura y transparente de certificar la existencia de tus documentos.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {features.map((feature) => {
                const Icon = feature.icon
                return (
                  <Card key={feature.title} className="bg-card border-border hover:border-primary/30 transition-colors duration-300">
                    <CardContent className="p-6">
                      <div className={`w-11 h-11 rounded-xl ${feature.color} flex items-center justify-center mb-5`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* How it works Section */}
        <section className="py-20 md:py-28 bg-secondary/40">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Cómo funciona
              </h2>
              <p className="mt-4 text-muted-foreground max-w-lg mx-auto leading-relaxed">
                Un proceso simple y transparente para certificar tus documentos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {steps.map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={step.title} className="relative">
                    {/* Connector line for desktop */}
                    {index < steps.length - 1 && (
                      <div className="hidden lg:block absolute top-10 left-[calc(50%+28px)] w-[calc(100%-56px)] h-px border-t border-dashed border-border" />
                    )}

                    <div className="relative bg-card p-6 rounded-2xl border border-border">
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Icon className="w-6 h-6 text-primary" />
                          </div>
                          <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-lg bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                            {index + 1}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          <h3 className="font-semibold text-foreground mb-1.5">
                            {step.title}
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  Casos de uso
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Proof of Existence tiene múltiples aplicaciones en diversos campos
                  donde se necesita demostrar la existencia de información en un momento específico.
                </p>

                <div className="mt-10 space-y-5">
                  {useCases.map((useCase) => (
                    <div key={useCase.title} className="flex gap-4 items-start">
                      <div className="mt-0.5 w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground mb-0.5">
                          {useCase.title}
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {useCase.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <Card className="bg-card border-border">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-secondary/60 border border-border">
                      <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          mi_documento.pdf
                        </p>
                        <p className="text-xs text-muted-foreground">
                          245 KB
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/15">
                      <p className="text-xs font-medium text-foreground mb-1.5">
                        SHA-256 Hash
                      </p>
                      <code className="text-xs font-mono text-muted-foreground break-all leading-relaxed">
                        a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a
                      </code>
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-secondary/60 border border-border">
                      <span className="text-sm text-muted-foreground">Estado</span>
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                        <CheckCircle2 className="w-4 h-4" />
                        Confirmado
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* API Section */}
        <section className="py-20 md:py-28 bg-secondary/40">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-sm font-medium text-accent mb-8">
                <Code className="w-3.5 h-3.5" />
                API REST
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Integra OpenProof en tu aplicación
              </h2>
              <p className="mt-4 text-muted-foreground max-w-lg mx-auto leading-relaxed">
                Nuestra API REST permite registrar y verificar documentos
                programáticamente desde cualquier plataforma.
              </p>

              <div className="mt-10 p-5 rounded-2xl bg-card border border-border text-left overflow-x-auto">
                <pre className="text-sm font-mono text-muted-foreground leading-relaxed">
                  <code>{`POST /api/v1/documents/register
{
  "file_hash": "a7ffc6f8bf1ed...",
  "filename": "contract.pdf",
  "user_id": "user_123"
}`}</code>
                </pre>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button asChild variant="outline">
                  <Link href="/api-docs">
                    Ver documentación
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <div className="p-10 md:p-14 rounded-3xl bg-primary/8 border border-primary/15">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  Comienza a certificar tus documentos
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Registra tu primer documento en la blockchain de Bitcoin
                  y obtén una prueba de existencia inmutable.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button asChild size="lg" className="w-full sm:w-auto">
                    <Link href="/register">
                      Registrar documento
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <MobileNav />
    </div>
  )
}
