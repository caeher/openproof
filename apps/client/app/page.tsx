'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  ArrowRight,
  Blocks,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  CreditCard,
  FileSearch,
  Fingerprint,
  GraduationCap,
  KeyRound,
  Landmark,
  Network,
  ShieldCheck,
  Sparkles,
  Upload,
} from 'lucide-react'

import { useAuth } from '@/components/auth/auth-provider'
import { SiteShell } from '@/components/layout'
import { IconCardGrid, PageIntro, SectionHeading, StatGrid } from '@/components/marketing'
import { ProofProcess } from '@/components/proof'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { buildVerifyEmailPath } from '@/lib/auth-routing'

const operatingSignals = [
  {
    value: 'SHA-256 local',
    label: 'Hash antes del registro',
    description: 'La verificación parte de una huella criptográfica calculada en el navegador o enviada desde tu integración.',
  },
  {
    value: 'Ruta pública',
    label: 'Constancia compartible',
    description: 'Cada transacción confirmada puede abrir una vista pública para terceros sin acceso a tu panel privado.',
  },
  {
    value: 'Créditos prepago',
    label: 'Consumo operativo simple',
    description: 'Compras saldo cuando lo necesitas y cada registro descuenta el costo configurado del servicio.',
  },
  {
    value: 'API keys',
    label: 'Integración bajo tu cuenta',
    description: 'Las claves bearer permiten registrar y consultar documentos desde sistemas internos con el mismo control de la cuenta.',
  },
]

const capabilities = [
  {
    icon: Upload,
    title: 'Registro por archivo o por hash',
    description: 'Puedes cargar el documento para que OpenProof calcule el hash y conserve el archivo, o trabajar en modo hash-only desde la web o la API.',
  },
  {
    icon: Blocks,
    title: 'Anclaje sobre Bitcoin',
    description: 'La prueba se consolida cuando la transacción queda confirmada en Bitcoin y puede consultarse por bloque, timestamp y confirmaciones.',
  },
  {
    icon: FileSearch,
    title: 'Verificación pública',
    description: 'Cualquier tercero puede verificar un hash o revisar una constancia pública por transacción sin crear una cuenta.',
  },
  {
    icon: CreditCard,
    title: 'Cuenta, billing y saldo',
    description: 'El producto combina historial documental, compra de créditos Lightning y seguimiento de operaciones desde un mismo panel.',
  },
  {
    icon: KeyRound,
    title: 'Developer portal',
    description: 'Las API keys se crean, rotan y revocan desde la cuenta para conectar ERP, backoffice, portales internos o automatizaciones.',
  },
  {
    icon: ShieldCheck,
    title: 'Evidencia técnica complementaria',
    description: 'OpenProof acredita existencia e integridad del hash en blockchain, pero no reemplaza firma electrónica, notaría ni análisis legal.',
  },
]

const entityUseCases = [
  {
    icon: Landmark,
    title: 'Despachos legales y notarías digitales',
    description: 'Registrar versiones de contratos, anexos, minutas o constancias previas a su formalización para sostener trazabilidad temporal.',
  },
  {
    icon: GraduationCap,
    title: 'Universidades y centros de investigación',
    description: 'Anclar datasets, borradores, resultados o entregables de proyectos para demostrar fecha de existencia antes de circularlos.',
  },
  {
    icon: Building2,
    title: 'Áreas de cumplimiento y auditoría',
    description: 'Asegurar evidencia documental de políticas, reportes, actas y respaldos internos con referencia pública verificable.',
  },
  {
    icon: BriefcaseBusiness,
    title: 'Compras, licitaciones y proveedores',
    description: 'Fijar evidencia de propuestas, términos, entregables o documentación intercambiada en procesos de procurement.',
  },
  {
    icon: Fingerprint,
    title: 'Propiedad intelectual y producto',
    description: 'Probar existencia de especificaciones, manuales, diseños, código fuente o contenido original antes de compartirlos.',
  },
  {
    icon: Network,
    title: 'Operación digital con integraciones',
    description: 'Incorporar el registro documental a portales internos, flujos de onboarding, expedientes o sistemas externos mediante API keys.',
  },
]

const integrationHighlights = [
  'Autenticación por sesión o API key bajo la misma cuenta.',
  'Registro privado, verificación pública y portal de desarrolladores en el mismo producto.',
  'Billing por créditos con pago Lightning y reconciliación operativa.',
]

export default function LandingPage() {
  const { authState, isAuthenticated } = useAuth()
  const [isScrolled, setIsScrolled] = useState(false)
  const registerHref = !isAuthenticated
    ? '/login?next=%2Fregister'
    : authState === 'authenticated_unverified'
      ? buildVerifyEmailPath('/register')
      : '/register'

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }
    
    // Check initial scroll position
    handleScroll()
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <SiteShell 
      mainClassName=""
      navbarTransparent={!isScrolled}
    >
      <section className="relative overflow-hidden border-b border-border/70 -mt-16 pt-24">
        {/* Background Elements */}
        <div className="absolute inset-0 -top-16 z-0 pointer-events-none bg-background">
          {/* Dynamic Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--foreground))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground))_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_70%_at_50%_0%,#000_15%,transparent_100%)] opacity-[0.03]" />
          
          {/* Subtle Floating Dots Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle,hsl(var(--foreground))_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_80%_40%_at_50%_0%,#000_60%,transparent_100%)] opacity-[0.06]" />

          {/* Primary Glow Areas */}
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[20%] w-[800px] h-[500px] rounded-full bg-primary/20 blur-[100px]" />
          <div className="absolute left-[-10%] top-[10%] w-[400px] h-[400px] rounded-full bg-primary/10 blur-[100px]" />
          <div className="absolute right-[-5%] bottom-[-10%] w-[400px] h-[400px] rounded-full bg-primary/10 blur-[100px]" />

          {/* Abstract Cryptographic SVG Shapes */}
          <div 
            className="absolute top-[15%] left-[2%] md:left-[8%] opacity-[0.05] dark:opacity-[0.03] text-foreground"
            style={{ animation: 'spin 60s linear infinite' }}
          >
            <svg width="240" height="240" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="120" cy="120" r="80" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6"/>
              <circle cx="120" cy="120" r="110" stroke="currentColor" strokeWidth="0.5" />
              <path d="M120 10 L120 230 M10 120 L230 120" stroke="currentColor" strokeWidth="0.5"/>
              <circle cx="120" cy="120" r="12" fill="currentColor" fillOpacity="0.2"/>
            </svg>
          </div>

          <div 
            className="absolute bottom-[15%] right-[2%] md:right-[6%] opacity-[0.05] dark:opacity-[0.03] text-foreground"
            style={{ animation: 'spin 40s linear infinite reverse' }}
          >
            <svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
               <polygon points="90,10 160,50 160,130 90,170 20,130 20,50" stroke="currentColor" strokeWidth="1" />
               <polygon points="90,30 140,60 140,120 90,150 40,120 40,60" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 4"/>
               <circle cx="90" cy="90" r="6" fill="currentColor"/>
            </svg>
          </div>
          
          <div className="absolute top-[60%] left-[80%] opacity-[0.04] dark:opacity-[0.03] text-foreground">
            <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-pulse">
              <rect x="25" y="25" width="50" height="50" stroke="currentColor" strokeWidth="1" transform="rotate(45 50 50)"/>
              <rect x="35" y="35" width="30" height="30" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" transform="rotate(45 50 50)"/>
            </svg>
          </div>
        </div>

        <div className="container relative z-10 py-16 md:py-24">
          <div className="mx-auto max-w-4xl">
            <PageIntro
              align="center"
              badge="Infraestructura documental sobre Bitcoin"
              badgeIcon={Sparkles}
              title="Registra, verifica y comparte evidencia documental con trazabilidad pública"
              description="OpenProof convierte hashes documentales en pruebas verificables sobre Bitcoin. La plataforma combina registro por archivo o hash, verificación pública, historial privado, créditos prepago y API keys para integraciones bajo una misma cuenta."
              actions={(
                <>
                  <Button asChild size="lg">
                    <Link href={registerHref}>
                      Registrar documento
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/verify">Verificar documento</Link>
                  </Button>
                  <Button asChild variant="ghost" size="lg">
                    <Link href="/api-docs">Ver API</Link>
                  </Button>
                </>
              )}
            />
          </div>

        </div>
      </section>

      <section className="container py-12 md:py-16">
        <StatGrid items={operatingSignals} />
      </section>

      <section className="container py-16 md:py-20">
        <SectionHeading
          eyebrow="Capacidades"
          title="Más cerca de una operación documental que de una simple demo de blockchain"
          description="OpenProof no solo registra un hash. También incorpora autenticación, historial, créditos, viewers públicos y portal de desarrolladores para integrarlo en flujos reales."
          align="center"
        />
        <IconCardGrid items={capabilities} columns="3" className="mt-10" />
      </section>

      <section className="border-y border-border/70 bg-secondary/35">
        <div className="container py-16 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="space-y-6">
              <SectionHeading
                eyebrow="Flujo"
                title="Cómo aterriza la evidencia en el producto"
                description="El recorrido operativo combina huella criptográfica, consumo de créditos, anclaje en Bitcoin y una constancia verificable para terceros."
              />

              <Card className="border-border/70 bg-card/80 shadow-none">
                <CardContent className="space-y-4 p-6">
                  <p className="text-sm font-medium text-foreground">Dos formas de trabajar</p>
                  <div className="space-y-3 text-sm leading-7 text-muted-foreground">
                    <p>
                      <span className="font-medium text-foreground">Modo hash-only:</span> calculas o envías la huella y operas sin transferir el archivo al backend.
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Modo upload:</span> OpenProof calcula el hash, conserva el archivo asociado y puede servirlo en flujos públicos según la constancia emitida.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Card className="border-border/70 bg-card/80 shadow-none md:col-span-2">
                <CardContent className="p-6">
                  <ProofProcess currentStep={3} />
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/80 shadow-none">
                <CardContent className="space-y-3 p-6">
                  <p className="text-sm font-medium text-foreground">Cuenta y trazabilidad</p>
                  <p className="text-sm leading-7 text-muted-foreground">
                    La cuenta concentra historial, saldo, compras de créditos, sesión y creación de API keys para operar bajo una misma identidad.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/80 shadow-none">
                <CardContent className="space-y-3 p-6">
                  <p className="text-sm font-medium text-foreground">Evidencia pública</p>
                  <p className="text-sm leading-7 text-muted-foreground">
                    Terceros pueden revisar la transacción, bloque, confirmaciones y huella asociada sin depender del acceso a tu panel privado.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-16 md:py-20">
        <SectionHeading
          eyebrow="Casos de uso"
          title="Dónde encaja esta tecnología dentro de entidades y equipos"
          description="La propuesta tiene sentido cuando una organización necesita fijar fecha de existencia, integridad y referencia pública de un documento, sin prometer firma ni validez jurídica automática."
          align="center"
        />
        <IconCardGrid items={entityUseCases} columns="3" className="mt-10" />
      </section>

      <section className="border-y border-border/70 bg-secondary/35">
        <div className="container py-16 md:py-20">
          <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <div className="space-y-5">
              <SectionHeading
                eyebrow="Integración"
                title="Conecta OpenProof con tus sistemas internos"
                description="El cliente ya expone un developer portal para administrar claves bearer y un backend con rutas para registrar, consultar y verificar documentos."
              />
              <ul className="space-y-3 text-sm leading-7 text-muted-foreground">
                {integrationHighlights.map((item) => (
                  <li key={item} className="rounded-2xl border border-border/70 bg-card/80 px-4 py-3">
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild variant="outline">
                  <Link href="/developers">Portal de desarrolladores</Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/pricing">Ver créditos</Link>
                </Button>
              </div>
            </div>

            <Card className="border-border/70 bg-card/92 shadow-none">
              <CardContent className="space-y-5 p-6">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Ejemplo de registro autenticado</p>
                  <pre className="mt-4 overflow-x-auto rounded-2xl border border-border/70 bg-background px-4 py-5 text-sm leading-7 text-muted-foreground">
                    <code>{`POST /api/v1/documents/upload
Authorization: Bearer opk_live_***
Content-Type: multipart/form-data

file: acta-comite.pdf
metadata: {"area":"cumplimiento"}`}</code>
                  </pre>
                </div>

                <p className="text-sm leading-7 text-muted-foreground">
                  El producto también expone vistas públicas por transacción para compartir evidencia con terceros sin entregar acceso a la cuenta operativa.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="container py-16 md:py-20">
        <Card className="border-primary/15 bg-primary/6 shadow-none">
          <CardContent className="space-y-5 px-6 py-10 text-center md:px-10 md:py-14">
            <SectionHeading
              title="Empieza con un flujo simple y escálalo cuando haga falta"
              description="Registra desde la interfaz web, comparte la constancia pública y, cuando el proceso madure, muévelo a una integración con API keys y billing por créditos."
              align="center"
            />
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href={registerHref}>
                  Registrar documento
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/faq">Revisar preguntas frecuentes</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </SiteShell>
  )
}
