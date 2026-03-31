import Link from 'next/link'
import {
  ArrowRight,
  Blocks,
  CreditCard,
  FileSearch,
  Fingerprint,
  Network,
  Scale,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

import { SiteShell } from '@/components/layout'
import { IconCardGrid, PageIntro, SectionHeading, StatGrid } from '@/components/marketing'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const productPrinciples = [
  {
    icon: Fingerprint,
    title: 'Privacidad por diseño operativo',
    description: 'La plataforma puede trabajar con hash-only o con archivo cargado, para que cada flujo decida cuánto material necesita transferir o conservar.',
  },
  {
    icon: Blocks,
    title: 'Bitcoin como capa de evidencia',
    description: 'La propuesta central es un anclaje verificable en la blockchain más observada del mercado, con bloque, timestamp y confirmaciones consultables.',
  },
  {
    icon: CreditCard,
    title: 'Operación simple',
    description: 'Cuentas, saldo, billing y consumo por créditos convierten la notarización técnica en un flujo operativo concreto.',
  },
  {
    icon: Network,
    title: 'Pensado para integrarse',
    description: 'API keys, rutas privadas y viewers públicos permiten conectar la evidencia con portales, expedientes y sistemas internos.',
  },
]

const platformSignals = [
  {
    value: 'Cuenta + API',
    label: 'Dos modos de operar',
    description: 'Puedes registrar desde el panel web o desde integraciones autenticadas con bearer keys.',
  },
  {
    value: 'Público / privado',
    label: 'Separación de vistas',
    description: 'El historial privado vive en tu cuenta y la evidencia compartible se publica por transacción cuando corresponde.',
  },
  {
    value: 'Bitcoin + billing',
    label: 'Tecnología y operación',
    description: 'OpenProof une el anclaje en blockchain con compra de créditos y trazabilidad del uso del servicio.',
  },
]

const entityUseCases = [
  {
    icon: Scale,
    title: 'Evidencia previa a formalización legal',
    description: 'Bufetes, estudios y equipos legales pueden fijar una referencia temporal de documentos antes de firma, protocolización o circulación externa.',
  },
  {
    icon: ShieldCheck,
    title: 'Cumplimiento, control y auditoría',
    description: 'Áreas de compliance pueden respaldar reportes, políticas, evidencias internas o actas con una huella verificable en blockchain.',
  },
  {
    icon: FileSearch,
    title: 'Gestión documental y procurement',
    description: 'Procesos de compras, entregables, expedientes o documentación sensible ganan trazabilidad cuando necesitan una referencia externa verificable.',
  },
  {
    icon: Sparkles,
    title: 'Producto, IP e innovación',
    description: 'Equipos de producto, investigación o propiedad intelectual pueden demostrar existencia de especificaciones, diseños o material original en una fecha determinada.',
  },
]

export default function AboutPage() {
  return (
    <SiteShell>
      <div className="container py-8 md:py-12">
        <PageIntro
          backHref="/"
          backLabel="Volver al inicio"
          badge="Sobre OpenProof"
          badgeIcon={Sparkles}
          title="OpenProof toma evidencia documental y la vuelve verificable fuera de la organización"
          description="La plataforma existe para equipos y entidades que necesitan probar que un documento o una versión concreta ya existía en una fecha determinada, con una referencia técnica pública basada en Bitcoin y sin convertir eso en una promesa jurídica exagerada."
        />

        <section className="mt-12 md:mt-14">
          <StatGrid items={platformSignals} className="xl:grid-cols-3" />
        </section>

        <section className="mt-14 grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-start md:mt-16">
          <div className="space-y-5">
            <SectionHeading
              eyebrow="Qué resuelve"
              title="Una capa de trazabilidad documental para procesos que necesitan fecha, integridad y evidencia compartible"
              description="OpenProof no pretende custodiar todo el ciclo documental de una entidad. Su papel es más preciso: vincular una huella criptográfica con un registro verificable y permitir que terceros revisen la evidencia sin entrar al sistema privado."
            />
            <div className="space-y-4 text-base leading-8 text-muted-foreground">
              <p>
                En la práctica, la plataforma conecta el registro del documento con una cuenta operativa, historial privado, compra de créditos y una ruta pública por transacción. Eso la vuelve útil para organizaciones que necesitan algo más que una captura de pantalla o un correo con fecha.
              </p>
              <p>
                También delimita claramente su alcance: no reemplaza firma electrónica, identidad de firmantes, custodia legal ni gobernanza documental de nivel corporativo. Su valor está en la evidencia técnica y en la facilidad para integrarla a un proceso existente.
              </p>
            </div>
          </div>

          <Card className="border-border/70 bg-card/88 shadow-none">
            <CardContent className="space-y-4 p-6">
              <p className="text-sm font-medium text-foreground">Lo que realmente ofrece hoy</p>
              <ul className="space-y-3 text-sm leading-7 text-muted-foreground">
                <li>Registro documental por archivo o hash, con estado y trazabilidad en la cuenta.</li>
                <li>Verificación pública por hash o por transacción Bitcoin.</li>
                <li>Créditos prepago y billing integrado para operar el consumo.</li>
                <li>API keys para integraciones bajo la misma identidad de usuario.</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <section className="mt-14 md:mt-16">
          <SectionHeading
            eyebrow="Principios"
            title="Cómo está pensada la plataforma"
            description="Estos principios ordenan el producto y explican por qué el mensaje público debe ser preciso: OpenProof sirve mejor cuando se presenta como infraestructura documental, no como sustituto universal de procesos legales."
            align="center"
          />
          <IconCardGrid items={productPrinciples} columns="4" className="mt-8" />
        </section>

        <section className="mt-14 md:mt-16">
          <SectionHeading
            eyebrow="Entidades"
            title="Casos de uso institucionales donde encaja mejor"
            description="La tecnología aporta valor cuando la entidad necesita fijar evidencia externa de existencia e integridad de documentos o versiones críticas."
            align="center"
          />
          <IconCardGrid items={entityUseCases} columns="4" className="mt-8" />
        </section>

        <section className="mt-14 md:mt-16">
          <Card className="border-border/70 bg-secondary/35 shadow-none">
            <CardContent className="grid gap-8 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
              <div className="space-y-3">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Siguiente paso natural</h2>
                <p className="text-sm leading-7 text-muted-foreground md:text-base">
                  Si quieres revisar el alcance operativo o preparar una integración, la mejor combinación es FAQ para límites del producto y API docs para rutas y payloads.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild variant="outline">
                  <Link href="/faq">Leer FAQ</Link>
                </Button>
                <Button asChild>
                  <Link href="/api-docs">
                    Ver API docs
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </SiteShell>
  )
}