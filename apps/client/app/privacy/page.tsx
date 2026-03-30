import { Footer, Header, MobileNav } from '@/components/layout'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pb-24 md:pb-0">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert">
            <h1>Política de privacidad</h1>
            <p>
              OpenProof procesa el mínimo necesario para operar la cuenta SaaS: correo, credenciales derivadas de hash, sesiones, documentos registrados y movimientos de crédito. Nunca enviamos tu archivo al backend para anclarlo en Bitcoin; trabajamos con el hash y los metadatos que nos entregas.
            </p>
            <h2>Datos que almacenamos</h2>
            <p>
              Guardamos usuarios, sesiones, API keys, intents de pago, ledger de créditos, auditoría operativa y eventos de webhook. Esto permite seguridad, facturación, soporte y trazabilidad administrativa.
            </p>
            <h2>Uso de terceros</h2>
            <p>
              Los pagos Lightning se procesan a través de Blink desde el backend. El proveedor de correo y la infraestructura de hosting pueden participar en el envío de enlaces de verificación y recuperación.
            </p>
            <h2>Retención</h2>
            <p>
              Conservamos la información mientras exista una necesidad operativa, legal o antifraude. Los registros de auditoría y facturación pueden mantenerse incluso después del cierre de una cuenta.
            </p>
          </div>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  )
}