import Link from 'next/link'
import { ArrowLeft, Shield, Lock, Globe, Zap, Target, Users, Code, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Header, Footer, MobileNav } from '@/components/layout'

const values = [
  {
    icon: Lock,
    title: 'Privacidad primero',
    description: 'Tu archivo nunca abandona tu dispositivo. Solo procesamos hashes criptográficos.',
  },
  {
    icon: Globe,
    title: 'Descentralizado',
    description: 'Utilizamos la blockchain más segura del mundo para garantizar la inmutabilidad.',
  },
  {
    icon: Zap,
    title: 'Simple de usar',
    description: 'Tecnología compleja, experiencia simple. Cualquiera puede certificar documentos.',
  },
  {
    icon: Code,
    title: 'Open source',
    description: 'Código abierto y auditable. Transparencia total en cómo funcionamos.',
  },
]

const team = [
  { name: 'Ana García', role: 'Fundadora & CEO', initial: 'AG' },
  { name: 'Carlos Ruiz', role: 'CTO', initial: 'CR' },
  { name: 'María López', role: 'Head of Product', initial: 'ML' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 pb-24 md:pb-0">
        {/* Hero section */}
        <section className="py-16 md:py-24 border-b border-border">
          <div className="container mx-auto px-4">
            {/* Back link */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio
            </Link>

            <div className="max-w-3xl">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Democratizando la prueba de existencia
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                OpenProof nace de una idea simple pero poderosa: todos deberían poder 
                demostrar que sus ideas, creaciones y documentos existían en un momento 
                específico, sin depender de intermediarios costosos o burocráticos.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Utilizamos la tecnología blockchain de Bitcoin para crear pruebas 
                inmutables, verificables públicamente, y accesibles para cualquiera 
                con conexión a internet.
              </p>
            </div>
          </div>
        </section>

        {/* Mission section */}
        <section className="py-16 md:py-24 bg-card/50 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-sm font-medium text-foreground mb-6">
                <Target className="w-4 h-4" />
                Nuestra misión
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                Proteger la propiedad intelectual mediante tecnología accesible
              </h2>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
                Creemos que la innovación y la creatividad deben ser protegidas. 
                Ya sea un inventor independiente, un artista, un investigador o una empresa, 
                todos merecen herramientas para demostrar la originalidad y antigüedad de su trabajo.
              </p>
            </div>
          </div>
        </section>

        {/* Values section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Nuestros valores
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Los principios que guían cada decisión que tomamos
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {values.map((value) => {
                const Icon = value.icon
                return (
                  <Card key={value.title} className="text-center">
                    <CardContent className="pt-6">
                      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                        <Icon className="w-6 h-6 text-foreground" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">
                        {value.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {value.description}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Team section */}
        <section className="py-16 md:py-24 bg-card/50 border-y border-border">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-sm font-medium text-foreground mb-6">
                <Users className="w-4 h-4" />
                Equipo
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Las personas detrás de OpenProof
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Un equipo apasionado por la criptografía, blockchain y la experiencia de usuario
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {team.map((member) => (
                <Card key={member.name} className="text-center">
                  <CardContent className="pt-6">
                    <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                      <span className="text-lg font-bold text-foreground">
                        {member.initial}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground">
                      {member.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {member.role}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Technology section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                La tecnología detrás
              </h2>
              
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p className="text-muted-foreground leading-relaxed mb-6">
                  OpenProof utiliza la función hash SHA-256, la misma que asegura la blockchain 
                  de Bitcoin. Cuando subes un archivo, calculamos su hash de forma local en tu 
                  navegador, garantizando que el contenido nunca abandona tu dispositivo.
                </p>
                
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Este hash se ancla en la blockchain de Bitcoin utilizando una transacción 
                  OP_RETURN, que permite almacenar pequeñas cantidades de datos de forma 
                  permanente e inmutable. El timestamp del bloque proporciona una prueba 
                  criptográfica de cuándo existía el documento.
                </p>
                
                <p className="text-muted-foreground leading-relaxed">
                  La verificación es simple: cualquiera puede calcular el hash de un archivo 
                  y comprobar si existe en la blockchain, sin necesidad de confiar en nosotros 
                  o en ningún intermediario.
                </p>
              </div>
              
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button asChild variant="outline">
                  <Link href="/faq">
                    Leer FAQ
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/api-docs">
                    Documentación API
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA section */}
        <section className="py-16 md:py-24 bg-foreground">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-background mb-4">
                Únete a la revolución
              </h2>
              <p className="text-background/70 mb-8">
                Comienza a proteger tus documentos hoy con la tecnología más segura disponible.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" variant="secondary">
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
