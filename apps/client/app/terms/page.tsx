import { LegalDocument } from '@/components/legal/legal-document'

export default function TermsPage() {
  return (
    <LegalDocument
      badge="Términos del servicio"
      title="Condiciones de uso de OpenProof"
      summary="Estas condiciones regulan el uso de OpenProof como plataforma de evidencia documental sobre Bitcoin, incluyendo cuentas, créditos, API keys, uploads, verificación pública y constancias asociadas a transacciones blockchain."
      updatedAt="30 de marzo de 2026"
      highlights={[
        'OpenProof opera con créditos prepago y no implica suscripciones automáticas por defecto.',
        'La cuenta, las sesiones y las API keys quedan bajo responsabilidad del titular que las opera.',
        'La plataforma ofrece evidencia técnica y trazabilidad documental, no certificación legal automática.',
      ]}
      sections={[
        {
          title: 'Alcance y naturaleza del servicio',
          body: [
            'OpenProof proporciona infraestructura para registrar documentos o hashes, consultar estados, comprar créditos, emitir constancias públicas y verificar evidencia asociada a transacciones Bitcoin. El servicio debe entenderse como una capa tecnológica de trazabilidad documental, no como sustituto de asesoría legal, custodia notarial, firma electrónica avanzada o certificación regulatoria.',
            'El usuario es responsable de evaluar si el documento, los metadatos, el nivel de exposición pública y el contexto jurídico del registro son adecuados para el fin previsto antes de emitir o compartir una constancia.',
          ],
          highlights: [
            'La plataforma acredita la existencia e integridad de una huella documental en un estado de blockchain determinado.',
            'La validez jurídica final depende de la jurisdicción, del caso concreto y de la forma en que se presente la evidencia.',
          ],
        },
        {
          title: 'Cuenta, acceso y API keys',
          body: [
            'Para usar rutas privadas, registrar documentos, gestionar billing o crear API keys, debes mantener una cuenta válida y custodiar con diligencia tus credenciales, sesiones, dispositivos y claves de integración. OpenProof puede suspender sesiones, exigir verificación adicional o forzar rotación cuando detecte actividad anómala, abuso o riesgo razonable.',
            'Las acciones ejecutadas mediante la interfaz o mediante API key se atribuyen a la cuenta emisora salvo evidencia técnica en contrario. El acceso a funciones sensibles puede limitarse si la cuenta no cumple requisitos operativos como verificación de correo o controles de seguridad vigentes.',
          ],
          highlights: [
            'Compartir credenciales, cookies o API keys de forma insegura es responsabilidad del titular de la cuenta.',
            'Rotar o revocar API keys comprometidas forma parte de tu deber operativo básico.',
          ],
        },
        {
          title: 'Créditos, pagos y registros documentales',
          body: [
            'Los paquetes de créditos se habilitan una vez confirmado el pago correspondiente a través de la infraestructura de cobro integrada. Cada registro consume el saldo configurado para esa operación al momento de ejecutarse, independientemente de que hayas enviado solo el hash o un archivo completo.',
            'Salvo disposición legal aplicable, los créditos consumidos por operaciones ejecutadas correctamente no son reembolsables. OpenProof podrá revisar, anular o revertir acreditaciones en caso de fraude, duplicidad, error material, abuso del sistema o incumplimiento de estas condiciones.',
          ],
          highlights: [
            'No existen renovaciones automáticas implícitas salvo que una condición específica lo indique expresamente.',
            'El saldo y los movimientos relevantes se reflejan en la cuenta, pero la confirmación final depende del estado operativo del pago y del backend.',
          ],
        },
        {
          title: 'Disponibilidad, exposición pública y uso aceptable',
          body: [
            'El servicio se ofrece sobre una base best-effort con medidas de seguridad, observabilidad, rate limiting, mantenimiento y mitigación de abuso. OpenProof puede restringir tráfico, degradar temporalmente funciones, deshabilitar viewers, bloquear cuentas o revocar claves cuando sea necesario para preservar estabilidad, seguridad, cumplimiento o continuidad operativa.',
            'Está prohibido utilizar la plataforma para actividades ilícitas, automatización abusiva, evasión de controles, falsificación de procedencia, scraping no autorizado, publicación irresponsable de material sensible o cualquier uso que comprometa terceros, la red Bitcoin o la integridad operativa del servicio.',
          ],
          highlights: [
            'Los límites de uso pueden variar por entorno, tipo de ruta, volumen o perfil de riesgo.',
            'Las constancias públicas no deben presentarse como certificación de contenido, autoría material ni identidad de firmantes.',
          ],
        },
      ]}
      footerNote={
        <p>
          Si vas a desplegar integraciones críticas, viewers públicos a gran escala o procesos
          institucionales sensibles, revisa estas condiciones junto con tus áreas legal, técnica
          y de seguridad antes de mover el flujo a producción.
        </p>
      }
    />
  )
}