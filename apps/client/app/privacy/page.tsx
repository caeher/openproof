import { LegalDocument } from '@/components/legal/legal-document'

export default function PrivacyPage() {
  return (
    <LegalDocument
      badge="Privacidad"
      title="Política de privacidad de OpenProof"
      summary="Esta política describe cómo OpenProof trata información de cuenta, documentos, hashes, archivos cargados, pagos, API keys y constancias públicas para operar una plataforma de evidencia documental sobre Bitcoin."
      updatedAt="30 de marzo de 2026"
      highlights={[
        'Puedes usar OpenProof en modo hash-only o subir el archivo; ambos flujos implican tratamientos diferentes.',
        'Tratamos datos de cuenta, seguridad, billing, API keys, operaciones y trazabilidad para operar el servicio.',
        'Las constancias públicas y registros ya anclados en blockchain no siempre pueden retirarse de forma retroactiva.',
      ]}
      sections={[
        {
          title: 'Qué datos tratamos según el flujo que utilices',
          body: [
            'OpenProof trata datos de cuenta como nombre, correo, credenciales derivadas, sesiones, estado de verificación, rol, avatar, eventos de acceso y API keys. También procesa hashes documentales, nombres de archivo, metadatos declarados, estados del documento, movimientos de créditos, intenciones de pago, eventos de webhook y registros de auditoría asociados a la operación del servicio.',
            'Si usas un flujo hash-only, el backend procesa principalmente la huella criptográfica y la información contextual que decidas enviar. Si usas upload, OpenProof también almacena el archivo cargado y datos técnicos derivados como tamaño, tipo de contenido o rutas de descarga asociadas al registro.',
          ],
          highlights: [
            'Los hashes, identificadores de transacción y determinados metadatos pueden aparecer en viewers públicos cuando exista una constancia compartible.',
            'La información de autenticación, sesión y API keys se usa para proteger acceso, trazabilidad y prevención de abuso.',
          ],
        },
        {
          title: 'Para qué usamos la información',
          body: [
            'Usamos la información para crear y proteger cuentas, autenticar sesiones, registrar documentos, conservar estados del procesamiento, emitir constancias públicas, permitir verificaciones, exponer archivos cuando el flujo elegido lo habilite, controlar permisos, operar el portal de desarrolladores, procesar pagos Lightning y administrar créditos.',
            'El tratamiento también cubre observabilidad técnica, hardening, prevención de fraude o abuso, cumplimiento normativo razonable, soporte, resolución de incidentes y mejora controlada de confiabilidad del servicio.',
          ],
          highlights: [
            'No tratamos el contenido del archivo con fines de minería documental ni entrenamiento de modelos.',
            'Las métricas y logs técnicos se orientan a continuidad operativa, seguridad y capacidad.',
          ],
        },
        {
          title: 'Infraestructura, terceros y exposición pública',
          body: [
            'Para prestar el servicio, OpenProof puede apoyarse en hosting, almacenamiento, correo transaccional, infraestructura de pagos Lightning, software de nodo Bitcoin y componentes de observabilidad o seguridad. Cada proveedor solo participa en la medida necesaria para autenticar, cobrar, notificar, almacenar, registrar o servir la evidencia documental.',
            'Cuando una constancia pública se comparte por transacción, terceros pueden consultar información derivada del registro y del estado on-chain. Si el flujo incluye archivo público o metadatos visibles, esos elementos también pueden quedar accesibles desde la vista pública correspondiente.',
          ],
          highlights: [
            'El proveedor de pagos Lightning recibe la información mínima necesaria para emitir y reconciliar el cobro.',
            'Los enlaces de verificación, recuperación o avisos operativos pueden enviarse mediante un proveedor de correo transaccional.',
          ],
        },
        {
          title: 'Retención, derechos y límites de supresión',
          body: [
            'Conservamos la información mientras exista una base operativa, contractual, legal, de seguridad o antifraude que lo justifique. Los datos vinculados a contabilidad, auditoría, trazabilidad, pagos, sesiones, API keys, soporte o seguridad pueden persistir incluso cuando la cuenta deja de operar activamente.',
            'Puedes solicitar revisión o actualización de la información de cuenta conforme al entorno de despliegue y a la normativa aplicable. Sin embargo, los registros ya anclados en blockchain, las constancias públicas ya compartidas o la evidencia necesaria para auditoría y defensa frente a fraude no siempre pueden borrarse de forma retroactiva.',
          ],
          highlights: [
            'Eliminar una copia interna no implica remover la huella pública ya publicada on-chain o en viewers compartidos.',
            'Las solicitudes deben balancearse con obligaciones legales, seguridad operativa y preservación de evidencia.',
          ],
        },
      ]}
      footerNote={
        <p>
          Si tu implementación involucra expedientes sensibles, alto volumen, viewers públicos o
          integraciones institucionales, conviene revisar de antemano el flujo de hashes, archivos,
          metadatos, descargas públicas y retención con tu equipo legal, de seguridad y de cumplimiento.
        </p>
      }
    />
  )
}