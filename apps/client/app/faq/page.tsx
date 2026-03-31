import Link from 'next/link'
import { ArrowLeft, HelpCircle, Shield, FileText, Hash, Blocks, Lock, Clock, Globe, Scale } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Header, Footer, MobileNav } from '@/components/layout'
import { ProofProcess } from '@/components/proof'

const faqs = [
  {
    category: 'General',
    icon: HelpCircle,
    questions: [
      {
        q: '¿Qué es Proof of Existence?',
        a: 'Proof of Existence (PoE) es un método que permite demostrar que un documento específico existía en un momento determinado. Utiliza funciones hash criptográficas y la blockchain de Bitcoin para crear una prueba inmutable y verificable públicamente del timestamp de cualquier archivo.',
      },
      {
        q: '¿Para qué sirve registrar un documento?',
        a: 'Registrar un documento te permite demostrar que existía en una fecha específica. Esto es útil para proteger propiedad intelectual, contratos, investigaciones científicas, código fuente, y cualquier contenido donde necesites probar prioridad temporal o existencia en un momento dado.',
      },
      {
        q: '¿Es esto legalmente válido?',
        a: 'La prueba de existencia proporciona evidencia criptográfica verificable de que un documento existía en una fecha específica. Aunque no reemplaza los mecanismos legales tradicionales como notarios, puede servir como evidencia complementaria. La validez legal puede variar según la jurisdicción.',
      },
    ],
  },
  {
    category: 'Privacidad y seguridad',
    icon: Lock,
    questions: [
      {
        q: '¿Se guarda mi archivo en algún servidor?',
        a: 'No. Tu archivo nunca sale de tu dispositivo. Solo se calcula el hash SHA-256 de forma local en tu navegador y únicamente ese hash (una cadena de 64 caracteres) se envía al servidor para ser registrado en la blockchain.',
      },
      {
        q: '¿Alguien puede ver el contenido de mi documento?',
        a: 'No. Solo se registra el hash del documento, no su contenido. El hash es una huella digital única que no puede ser revertida para obtener el documento original. Nadie puede saber qué contiene tu archivo a partir del hash.',
      },
      {
        q: '¿Qué es un hash SHA-256?',
        a: 'SHA-256 es una función criptográfica que genera una "huella digital" única de 256 bits (64 caracteres hexadecimales) para cualquier archivo. Cualquier cambio mínimo en el archivo produce un hash completamente diferente, lo que garantiza la integridad del documento.',
      },
    ],
  },
  {
    category: 'Blockchain y Bitcoin',
    icon: Blocks,
    questions: [
      {
        q: '¿Por qué se usa Bitcoin?',
        a: 'Bitcoin es la blockchain más segura y descentralizada del mundo. Al anclar el hash en Bitcoin, obtienes una prueba que está respaldada por la red más robusta, con miles de nodos independientes y un historial impecable de seguridad desde 2009.',
      },
      {
        q: '¿Qué es una confirmación?',
        a: 'Una confirmación ocurre cada vez que se mina un nuevo bloque después del bloque que contiene tu transacción. Más confirmaciones significan mayor seguridad. Generalmente, 6 confirmaciones (aproximadamente 1 hora) se consideran irreversibles.',
      },
      {
        q: '¿Puede alguien modificar o eliminar mi registro?',
        a: 'No. Una vez que una transacción está confirmada en la blockchain de Bitcoin, es prácticamente imposible modificarla o eliminarla. La blockchain es inmutable por diseño, y cada bloque está vinculado criptográficamente al anterior.',
      },
    ],
  },
  {
    category: 'Verificación',
    icon: Shield,
    questions: [
      {
        q: '¿Cómo verifico un documento?',
        a: 'Puedes verificar un documento de dos formas: subiendo el archivo original (se calculará su hash automáticamente) o ingresando directamente el hash SHA-256. El sistema buscará en la blockchain si existe un registro con ese hash.',
      },
      {
        q: '¿Qué pasa si el documento fue modificado?',
        a: 'Cualquier modificación, por mínima que sea, generará un hash completamente diferente. Si el archivo fue alterado, el hash no coincidirá con el registrado y la verificación mostrará que no hay registro para ese documento específico.',
      },
      {
        q: '¿Necesito cuenta para verificar?',
        a: 'No. La verificación es pública y gratuita. Cualquier persona puede verificar la existencia de un documento sin necesidad de crear una cuenta o iniciar sesión.',
      },
    ],
  },
]

export default function FAQPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 pb-24 md:pb-0">
        <div className="container mx-auto px-4 py-8 md:py-12">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>

          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Preguntas frecuentes
              </h1>
              <p className="mt-2 text-muted-foreground">
                Todo lo que necesitas saber sobre Proof of Existence
              </p>
            </div>

            {/* How it works visual */}
            <Card className="mb-12">
              <CardHeader>
                <CardTitle className="text-lg">¿Cómo funciona?</CardTitle>
              </CardHeader>
              <CardContent>
                <ProofProcess />
                
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">1. Documento</span>
                    </div>
                    <p className="text-muted-foreground">
                      Seleccionas tu archivo en el navegador. El archivo nunca se sube a ningún servidor.
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Hash className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">2. Hash</span>
                    </div>
                    <p className="text-muted-foreground">
                      Se calcula el hash SHA-256 localmente. Esta huella digital es única para tu archivo.
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Blocks className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">3. Blockchain</span>
                    </div>
                    <p className="text-muted-foreground">
                      El hash se ancla en la blockchain de Bitcoin mediante una transacción especial.
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">4. Timestamp</span>
                    </div>
                    <p className="text-muted-foreground">
                      El bloque de Bitcoin proporciona un timestamp inmutable y verificable públicamente.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FAQ sections */}
            <div className="space-y-8">
              {faqs.map((section) => {
                const Icon = section.icon
                return (
                  <Card key={section.category}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                        {section.category}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible className="w-full">
                        {section.questions.map((faq, index) => (
                          <AccordionItem key={index} value={`item-${index}`}>
                            <AccordionTrigger className="text-left text-foreground">
                              {faq.q}
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground leading-relaxed">
                              {faq.a}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Legal notice */}
            <Card className="mt-12 border-border bg-card/50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Scale className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      Nota legal
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      OpenProof proporciona una herramienta tecnológica para crear pruebas de existencia 
                      basadas en criptografía y blockchain. Este servicio no constituye asesoramiento legal 
                      y no reemplaza los mecanismos legales tradicionales. La validez legal de estas pruebas 
                      puede variar según la jurisdicción. Consulta con un profesional legal para casos específicos.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
      <MobileNav />
    </div>
  )
}
