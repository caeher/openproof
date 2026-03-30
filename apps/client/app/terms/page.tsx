import { Footer, Header, MobileNav } from '@/components/layout'

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pb-24 md:pb-0">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert">
            <h1>Términos del servicio</h1>
            <p>
              OpenProof ofrece una plataforma de prueba de existencia y registro de hashes sobre Bitcoin. El uso del servicio implica aceptar el modelo de créditos prepago, el uso responsable de las rutas privadas y el cumplimiento de la legislación aplicable.
            </p>
            <h2>Cuenta y seguridad</h2>
            <p>
              Debes custodiar tus credenciales, sesiones y API keys. Eres responsable por la actividad realizada con tu cuenta salvo prueba clara de compromiso atribuible a la plataforma.
            </p>
            <h2>Pagos y créditos</h2>
            <p>
              Los créditos se acreditan una vez confirmado el pago Lightning por Blink. Cada registro consume créditos según la configuración operativa vigente. No existen suscripciones ni cargos recurrentes automáticos.
            </p>
            <h2>Disponibilidad</h2>
            <p>
              El servicio se presta sobre una base best-effort. Podemos introducir rate limiting, mantenimiento y medidas de hardening para proteger la plataforma.
            </p>
          </div>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  )
}