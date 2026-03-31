import { LegalDocument } from '@/components/legal/legal-document'

export default function PrivacyPage() {
  return (
    <LegalDocument
      badge="Privacidad"
      title="Política de privacidad de OpenProof"
      summary="Esta política explica qué datos tratamos, con qué finalidad operativa los utilizamos y bajo qué criterios conservamos la información vinculada a cuentas, registros, pagos y constancias públicas dentro de OpenProof."
      updatedAt="30 de marzo de 2026"
      highlights={[
        'OpenProof trabaja con hashes y metadatos declarados; no necesita subir tu archivo original para anclar la prueba.',
        'Tratamos datos de cuenta, seguridad, facturación y auditoría para operar el servicio.',
        'Conservamos información mientras exista una necesidad operativa, legal o antifraude legítima.',
      ]}
      sections={[
        {
          title: 'Qué información tratamos',
          body: [
            'OpenProof trata datos de cuenta como nombre, correo, credenciales derivadas, sesiones, estado de verificación y eventos asociados al acceso. También procesa hashes de documentos, metadatos suministrados por el usuario, movimientos de crédito, API keys, registros de auditoría y estados de cobro necesarios para prestar el servicio.',
            'El archivo original no necesita ser transferido al backend para emitir una prueba de existencia. El procesamiento principal se basa en el hash criptográfico del documento y en la información contextual que el usuario decida asociar al registro.',
          ],
          highlights: [
            'Los hashes y metadatos asociados pueden formar parte de constancias públicas si existe una transacción publicada.',
            'La información de autenticación y sesiones se utiliza para proteger el acceso y prevenir uso indebido.',
          ],
        },
        {
          title: 'Finalidades del tratamiento',
          body: [
            'Utilizamos la información para crear y gestionar cuentas, autenticar usuarios, emitir pruebas, exponer viewers públicos, controlar permisos, registrar auditoría operativa, procesar pagos, administrar créditos y responder a incidencias de soporte o fraude.',
            'El tratamiento también puede servir para observabilidad técnica, seguridad de plataforma, prevención de abuso, cumplimiento de obligaciones legales y mejora prudente de confiabilidad del servicio.',
          ],
          highlights: [
            'No usamos el contenido del archivo para minería documental ni para entrenamiento de modelos.',
            'Las métricas técnicas se orientan a continuidad operativa, hardening y capacidad.',
          ],
        },
        {
          title: 'Terceros e infraestructura',
          body: [
            'Determinadas operaciones pueden involucrar proveedores de infraestructura, correo transaccional, servicios de pago Lightning y componentes de hosting. Dichos terceros actúan como encargados o proveedores tecnológicos en la medida necesaria para operar autenticación, mensajería, cobro y publicación de pruebas.',
            'Cuando una constancia pública se comparte mediante el viewer, la información expuesta dependerá del diseño funcional del servicio y del estado del registro en blockchain. Por ello, el usuario debe revisar qué datos decide adjuntar como metadatos antes de emitir registros con fines de divulgación externa.',
          ],
          highlights: [
            'El proveedor de pagos Lightning puede recibir información transaccional necesaria para confirmar cobros.',
            'Los enlaces de verificación o recuperación pueden ser enviados por un proveedor de correo transaccional.',
          ],
        },
        {
          title: 'Conservación y derechos',
          body: [
            'Conservamos la información mientras exista una base operativa, contractual, legal o antifraude que justifique su mantenimiento. Los datos vinculados a contabilidad, auditoría, seguridad o trazabilidad pueden persistir incluso si la cuenta deja de estar activa.',
            'El usuario puede solicitar revisión, actualización o aclaración sobre la información de cuenta y sobre el tratamiento aplicable según el entorno de despliegue y la normativa correspondiente. Las constancias ya ancladas en blockchain o divulgadas públicamente no siempre pueden eliminarse de forma retroactiva debido a la naturaleza inmutable del registro distribuido.',
          ],
          highlights: [
            'La supresión técnica no equivale necesariamente a borrar huellas públicas ya publicadas en blockchain.',
            'Las solicitudes deben evaluarse junto con requisitos legales, de seguridad y de preservación de evidencia.',
          ],
        },
      ]}
      footerNote={
        <p>
          Si necesitas una evaluación específica de privacidad para un caso de uso regulado, alto
          volumen o exposición pública intensiva, conviene revisar previamente el flujo de metadatos,
          viewers públicos y retención junto con tu equipo legal y de cumplimiento.
        </p>
      }
    />
  )
}