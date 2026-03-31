 'use client'

import Link from 'next/link'
import { ArrowRight, Shield, Lock, Clock, CheckCircle2, FileText, Hash, Blocks, Zap, Globe, Code } from 'lucide-react'

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
  },
  {
    icon: Lock,
    title: 'Privacidad total',
    description: 'Tu archivo nunca sale de tu dispositivo. Solo se registra el hash criptográfico.',
  },
  {
    icon: Clock,
    title: 'Timestamp verificable',
    description: 'Demuestra que tu documento existía en una fecha específica con certeza matemática.',
  },
  {
    icon: Globe,
    title: 'Verificación pública',
    description: 'Cualquiera puede verificar la existencia de tu documento sin necesidad de cuenta.',
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
          {/* Background pattern */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,transparent_49%,var(--border)_50%,transparent_51%,transparent_100%)] bg-[length:80px_100%] opacity-30" />
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,transparent_49%,var(--border)_50%,transparent_51%,transparent_100%)] bg-[length:100%_80px] opacity-30" />
          </div>
          
          <div className="container mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-32">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-sm font-medium text-foreground mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                </span>
                Blockchain de Bitcoin
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold text-foreground tracking-tight text-balance leading-tight">
                Prueba de existencia
                <span className="block text-muted-foreground">en Bitcoin</span>
              </h1>
              
              <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
                Demuestra que tu documento existía en una fecha específica. 
                Registra el hash criptográfico en la blockchain de Bitcoin 
                y obtén una prueba inmutable y verificable públicamente.
              </p>
              
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
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
        <section className="py-16 md:py-24 bg-card/50 border-y border-border">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Por qué usar OpenProof
              </h2>
              <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
                La forma más segura y transparente de certificar la existencia de tus documentos.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => {
                const Icon = feature.icon
                return (
                  <Card key={feature.title} className="bg-background border-border">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mb-4">
                        <Icon className="w-6 h-6 text-foreground" />
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
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Cómo funciona
              </h2>
              <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
                Un proceso simple y transparente para certificar tus documentos.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-4">
              {steps.map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={step.title} className="relative">
                    {/* Connector line for desktop */}
                    {index < steps.length - 1 && (
                      <div className="hidden lg:block absolute top-8 left-1/2 w-full h-px bg-border" />
                    )}
                    
                    <div className="relative bg-background p-6 rounded-lg border border-border">
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
                            <Icon className="w-6 h-6 text-foreground" />
                          </div>
                          <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-foreground text-background text-xs font-bold flex items-center justify-center">
                            {index + 1}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground mb-1">
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
        <section className="py-16 md:py-24 bg-card/50 border-y border-border">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  Casos de uso
                </h2>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  Proof of Existence tiene múltiples aplicaciones en diversos campos 
                  donde se necesita demostrar la existencia de información en un momento específico.
                </p>
                
                <div className="mt-8 space-y-4">
                  {useCases.map((useCase) => (
                    <div key={useCase.title} className="flex gap-3">
                      <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-foreground">
                          {useCase.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {useCase.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="relative">
                <Card className="bg-background border-border">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            mi_documento.pdf
                          </p>
                          <p className="text-xs text-muted-foreground">
                            245 KB
                          </p>
                        </div>
                      </div>
                      
                      <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                        <p className="text-xs font-medium text-foreground mb-1">
                          SHA-256 Hash
                        </p>
                        <code className="text-xs font-mono text-muted-foreground break-all">
                          a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a
                        </code>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                        <span className="text-sm text-muted-foreground">Estado</span>
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-accent">
                          <CheckCircle2 className="w-4 h-4" />
                          Confirmado
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* API Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-sm font-medium text-foreground mb-6">
                <Code className="w-4 h-4" />
                API REST
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Integra OpenProof en tu aplicación
              </h2>
              <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
                Nuestra API REST permite registrar y verificar documentos 
                programáticamente desde cualquier plataforma.
              </p>
              
              <div className="mt-8 p-4 rounded-lg bg-card border border-border text-left overflow-x-auto">
                <pre className="text-sm font-mono text-muted-foreground">
                  <code>{`POST /api/v1/documents/register
{
  "file_hash": "a7ffc6f8bf1ed...",
  "filename": "contract.pdf",
  "user_id": "user_123"
}`}</code>
                </pre>
              </div>
              
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
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
        <section className="py-16 md:py-24 bg-foreground">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-background">
                Comienza a certificar tus documentos
              </h2>
              <p className="mt-3 text-background/70">
                Registra tu primer documento en la blockchain de Bitcoin 
                y obtén una prueba de existencia inmutable.
              </p>
              
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
                  <Link href="/register">
                    Registrar documento
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
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
