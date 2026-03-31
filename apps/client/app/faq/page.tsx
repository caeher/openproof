import {
  Blocks,
  Building2,
  FileSearch,
  HelpCircle,
  KeyRound,
  Landmark,
  Lock,
  Scale,
  Shield,
} from 'lucide-react'

import { SiteShell } from '@/components/layout'
import { IconCardGrid, PageIntro, SectionHeading } from '@/components/marketing'
import { ProofProcess } from '@/components/proof'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const faqs = [
  {
    category: 'Producto y alcance',
    icon: HelpCircle,
    questions: [
      {
        q: '¿Qué certifica exactamente OpenProof?',
        a: 'OpenProof acredita que un hash documental fue registrado y posteriormente confirmado en la blockchain de Bitcoin. La evidencia se apoya en la transacción, el bloque, el timestamp y las confirmaciones asociadas.',
      },
      {
        q: '¿Sustituye una firma electrónica, una notaría o asesoría legal?',
        a: 'No. OpenProof aporta evidencia técnica complementaria sobre existencia e integridad del hash. No reemplaza validaciones de identidad, firma, custodia legal ni análisis jurídico de cada jurisdicción.',
      },
      {
        q: '¿Qué diferencia a OpenProof de una demo simple de “proof of existence”?',
        a: 'Además del registro, la plataforma incorpora cuentas, historial, compra de créditos, constancias públicas compartibles, gestión de API keys y verificación sin autenticación para terceros.',
      },
    ],
  },
  {
    category: 'Privacidad y archivo',
    icon: Lock,
    questions: [
      {
        q: '¿Siempre tengo que subir el archivo?',
        a: 'No. El producto puede operar en modo hash-only o con upload. Si eliges hash-only, solo se procesa la huella y los metadatos declarados. Si eliges upload, el backend conserva una copia del archivo asociada al registro.',
      },
      {
        q: '¿Qué información puede hacerse pública?',
        a: 'La transacción Bitcoin, la huella del documento y la constancia pública por transacción pueden ser consultadas por terceros. Si el flujo habilitado incluye archivo público o metadatos visibles, esos elementos también podrían quedar expuestos en el viewer.',
      },
      {
        q: '¿El hash revela el contenido del documento?',
        a: 'No permite reconstruir el archivo, pero sí fija que existía una huella específica en un momento determinado. Si el documento es altamente sensible, conviene evaluar con cuidado cuándo registrar y qué metadatos asociar.',
      },
    ],
  },
  {
    category: 'Blockchain, cuenta e integración',
    icon: Blocks,
    questions: [
      {
        q: '¿Cómo funciona el consumo del servicio?',
        a: 'OpenProof opera con créditos prepago. Compras paquetes, se acredita saldo en la cuenta y cada registro descuenta el costo configurado por operación.',
      },
      {
        q: '¿Puedo integrarlo con sistemas internos?',
        a: 'Sí. La cuenta dispone de API keys bearer para conectar ERP, portales, backoffice o automatizaciones con las rutas privadas del backend.',
      },
      {
        q: '¿Qué limitaciones importantes tiene hoy?',
        a: 'La plataforma está orientada a operación por cuenta, no a colaboración empresarial compleja. No sustituye un DMS corporativo, no ofrece flujos avanzados de firma y no promete automatizaciones regulatorias por sí sola.',
      },
    ],
  },
  {
    category: 'Evidencia y cumplimiento',
    icon: Shield,
    questions: [
      {
        q: '¿Quién puede verificar un documento?',
        a: 'Cualquier tercero puede verificar un hash o abrir la constancia pública de una transacción, sin necesidad de iniciar sesión.',
      },
      {
        q: '¿Qué pasa si el archivo cambió después del registro?',
        a: 'Cualquier cambio altera el hash. Si la huella recalculada ya no coincide con la registrada, la verificación dejará de corresponder a la evidencia anclada en Bitcoin.',
      },
      {
        q: '¿Sirve para entidades reguladas?',
        a: 'Puede ser útil como capa tecnológica de trazabilidad, pero la adopción en entornos regulados exige evaluar retención, visibilidad pública, flujos de archivo, cumplimiento sectorial y encaje jurídico antes de operar en producción.',
      },
    ],
  },
]

const entityUseCases = [
  {
    icon: Landmark,
    title: 'Sector legal',
    description: 'Actas, borradores contractuales, anexos y evidencia de intercambio documental con referencia temporal verificable.',
  },
  {
    icon: Building2,
    title: 'Cumplimiento interno',
    description: 'Respaldo de reportes, políticas, expedientes y documentos de auditoría sin depender de una validación manual posterior.',
  },
  {
    icon: FileSearch,
    title: 'Procurement y gestión documental',
    description: 'Ofertas, pliegos, entregables y documentación de proveedores con evidencia pública de existencia.',
  },
  {
    icon: KeyRound,
    title: 'Operación con API',
    description: 'Portales o sistemas internos que requieren registrar documentos desde sus propios flujos, bajo la misma cuenta operativa.',
  },
]

export default function FAQPage() {
  return (
    <SiteShell>
      <div className="container py-8 md:py-12">
        <PageIntro
          backHref="/"
          backLabel="Volver al inicio"
          badge="Preguntas frecuentes"
          badgeIcon={HelpCircle}
          title="Lo importante para entender qué hace OpenProof y qué no hace"
          description="Estas respuestas aterrizan la plataforma sobre sus capacidades actuales: registro documental, constancias públicas, créditos, cuenta e integraciones por API key."
          align="center"
        />

        <Card className="mt-10 border-border/70 bg-card/90 shadow-none">
          <CardHeader>
            <CardTitle className="text-lg">Cómo se construye la evidencia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <ProofProcess />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-secondary/55 p-4 text-sm leading-7 text-muted-foreground">
                Puedes registrar desde archivo o desde hash, y el producto mantiene el estado del documento dentro de la cuenta.
              </div>
              <div className="rounded-2xl bg-secondary/55 p-4 text-sm leading-7 text-muted-foreground">
                La evidencia pública vive fuera del panel privado y puede compartirse por transacción cuando el registro ya fue emitido.
              </div>
              <div className="rounded-2xl bg-secondary/55 p-4 text-sm leading-7 text-muted-foreground">
                La parte fuerte del sistema es la trazabilidad técnica, no la sustitución de procesos jurídicos o de firma.
              </div>
              <div className="rounded-2xl bg-secondary/55 p-4 text-sm leading-7 text-muted-foreground">
                Los créditos, la autenticación y las API keys convierten el registro en un flujo operativo, no solo en una página pública.
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="mt-14 md:mt-16">
          <SectionHeading
            eyebrow="Entidades"
            title="Casos de uso institucionales realistas"
            description="La plataforma encaja mejor cuando la entidad necesita una referencia pública verificable del documento, sin venderlo como certificación legal automática."
            align="center"
          />
          <IconCardGrid items={entityUseCases} columns="4" className="mt-8" />
        </section>

        <section className="mt-14 space-y-8 md:mt-16">
          {faqs.map((section) => {
            const Icon = section.icon
            return (
              <Card key={section.category} className="border-border/70 bg-card/92 shadow-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    {section.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {section.questions.map((faq, index) => (
                      <AccordionItem key={faq.q} value={`${section.category}-${index}`}>
                        <AccordionTrigger className="text-left text-foreground">
                          {faq.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm leading-7 text-muted-foreground">
                          {faq.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            )
          })}
        </section>

        <Card className="mt-14 border-border/70 bg-card/75 shadow-none">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Scale className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">Nota de alcance</h3>
                <p className="text-sm leading-7 text-muted-foreground">
                  OpenProof es una capa tecnológica para evidencia documental basada en criptografía y Bitcoin. Antes de adoptarlo en procesos sensibles o regulados, conviene revisar retención, visibilidad pública, flujo de archivos y encaje jurídico con el área correspondiente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SiteShell>
  )
}