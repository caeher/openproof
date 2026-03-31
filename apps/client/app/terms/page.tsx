import { LegalDocument } from '@/components/legal/legal-document'

export default function TermsPage() {
  return (
    <LegalDocument
      badge="Términos del servicio"
      title="Condiciones de uso de OpenProof"
      summary="Estas condiciones regulan el acceso y uso de la plataforma OpenProof, incluyendo cuentas, créditos, rutas privadas, API keys y constancias públicas generadas a partir de registros anclados en la blockchain de Bitcoin."
      updatedAt="30 de marzo de 2026"
      highlights={[
        'El servicio opera con créditos prepago y no genera cargos recurrentes automáticos.',
        'El titular de la cuenta es responsable por el uso de sus sesiones y API keys.',
        'OpenProof puede aplicar controles de seguridad y disponibilidad para proteger la plataforma.',
      ]}
      sections={[
        {
          title: 'Alcance del servicio',
          body: [
            'OpenProof proporciona una infraestructura para registrar hashes documentales, consultar estados de procesamiento y compartir constancias públicas asociadas a transacciones Bitcoin. La plataforma no sustituye asesoría legal, notarial o regulatoria y debe usarse como evidencia tecnológica complementaria.',
            'El usuario es responsable de verificar que el contenido, los metadatos y el contexto jurídico del documento sean adecuados para el fin previsto antes de emitir o compartir una constancia pública.',
          ],
          highlights: [
            'La prueba emitida acredita la existencia de un hash en una fecha y estado de blockchain determinados.',
            'La validez jurídica final depende del marco normativo aplicable y del proceso donde se presente la evidencia.',
          ],
        },
        {
          title: 'Cuenta, acceso y seguridad operativa',
          body: [
            'Para operar rutas privadas, el usuario debe mantener una cuenta válida, custodiar credenciales, sesiones activas y API keys, y notificar cualquier indicio de uso indebido. OpenProof puede suspender sesiones, exigir verificación adicional o rotación de credenciales cuando detecte actividad anómala o riesgo razonable.',
            'La segregación entre sesión, verificación de correo y permisos es parte del modelo de seguridad. El acceso a funciones sensibles puede limitarse hasta que el estado de la cuenta cumpla los requisitos operativos vigentes.',
          ],
          highlights: [
            'La compartición insegura de credenciales o tokens queda bajo responsabilidad del titular de la cuenta.',
            'Las acciones ejecutadas mediante API key se atribuyen a la cuenta emisora salvo evidencia técnica en contrario.',
          ],
        },
        {
          title: 'Créditos, pagos y consumo',
          body: [
            'Los paquetes de créditos se habilitan una vez confirmado el pago correspondiente a través de la infraestructura de cobro integrada. Cada registro consume el saldo configurado en backend al momento de la operación, y dicho costo puede variar por ajustes de producto, riesgo o capacidad operativa.',
            'Salvo disposición legal aplicable, los créditos consumidos por operaciones ejecutadas correctamente no son reembolsables. OpenProof podrá anular, revertir o revisar acreditaciones en caso de fraude, duplicidad, error material o incumplimiento de estas condiciones.',
          ],
          highlights: [
            'No existen suscripciones automáticas ni renovaciones recurrentes implícitas.',
            'El saldo disponible y los movimientos relevantes quedan reflejados en la cuenta del usuario.',
          ],
        },
        {
          title: 'Disponibilidad, límites y uso aceptable',
          body: [
            'El servicio se ofrece sobre una base best-effort con medidas de hardening, observabilidad, rate limiting, mantenimiento programado y mitigación de abuso. OpenProof puede restringir tráfico, degradar temporalmente funciones o bloquear cuentas y claves cuando sea necesario para preservar estabilidad, seguridad o cumplimiento.',
            'Está prohibido utilizar la plataforma para actividades ilícitas, automatización abusiva, evasión de controles, falsificación de procedencia, scraping no autorizado o cualquier uso que comprometa terceros, la red Bitcoin o la integridad operativa del servicio.',
          ],
          highlights: [
            'Los límites de uso pueden variar por entorno, tipo de ruta o perfil de riesgo.',
            'Las constancias públicas no deben presentarse como certificaciones de contenido ni como validación de identidad de firmantes.',
          ],
        },
      ]}
      footerNote={
        <p>
          Si tienes preguntas contractuales, operativas o de seguridad sobre estas condiciones,
          utiliza los canales de soporte vigentes antes de desplegar integraciones críticas o
          flujos de alto volumen.
        </p>
      }
    />
  )
}